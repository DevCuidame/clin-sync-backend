"use strict";
/**
 * Servicio de Wompi - Implementación modular y escalable
 * Maneja todas las operaciones de pago con Wompi API
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WompiService = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const payment_interface_1 = require("./payment.interface");
const wompi_config_1 = require("../../config/wompi.config");
const logger_1 = __importDefault(require("../../utils/logger"));
const database_1 = require("../../core/config/database");
const purchase_model_1 = require("../../models/purchase.model");
const payment_transaction_model_1 = require("../../models/payment-transaction.model");
const payment_webhook_model_1 = require("../../models/payment-webhook.model");
const package_model_1 = require("../../models/package.model");
const user_model_1 = require("../../models/user.model");
class WompiService {
    axiosInstance;
    config;
    constructor() {
        this.config = (0, wompi_config_1.getWompiConfig)();
        this.initializeAxiosInstance();
    }
    /**
     * Inicializa la instancia de Axios con configuración base
     */
    initializeAxiosInstance() {
        this.axiosInstance = axios_1.default.create({
            baseURL: this.config.baseUrl,
            timeout: 30000,
            headers: {
                'Authorization': `Bearer ${this.config.privateKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        // Interceptor para logging de requests
        this.axiosInstance.interceptors.request.use((config) => {
            logger_1.default.info('Wompi API Request', {
                method: config.method,
                url: config.url,
                data: config.data ? JSON.stringify(config.data) : undefined
            });
            return config;
        }, (error) => {
            logger_1.default.error('Wompi API Request Error', error);
            return Promise.reject(error);
        });
        // Interceptor para logging de responses
        this.axiosInstance.interceptors.response.use((response) => {
            logger_1.default.info('Wompi API Response', {
                url: response.config.url,
                status: response.status,
                data: response.data
            });
            return response;
        }, (error) => {
            const errorDetails = {
                url: error.config?.url,
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            };
            // Log específico para errores 422 de validación
            if (error.response?.status === 422) {
                logger_1.default.warn('Wompi API Validation Error (422)', {
                    ...errorDetails,
                    validationErrors: error.response?.data?.error?.messages,
                    errorType: error.response?.data?.error?.type
                });
            }
            else {
                logger_1.default.error('Wompi API Error', errorDetails);
            }
            return Promise.reject(error);
        });
    }
    /**
     * Crea una transacción de pago en Wompi
     */
    async createTransaction(dto, isRetry = false) {
        // Validar monto
        const amountValidation = (0, wompi_config_1.validateWompiAmount)(dto.amountInCents, dto.currency);
        if (!amountValidation.isValid) {
            throw new Error(amountValidation.error);
        }
        // Preparar datos para Wompi
        const transactionData = {
            amount_in_cents: dto.amountInCents,
            currency: dto.currency,
            customer_email: dto.customerInfo.email,
            payment_method: {
                type: dto.paymentMethod
            },
            reference: dto.reference,
            customer_data: {
                phone_number: dto.customerInfo.phoneNumber,
                full_name: dto.customerInfo.fullName,
                legal_id: dto.customerInfo.legalId,
                legal_id_type: dto.customerInfo.legalIdType
            },
            redirect_url: dto.redirectUrl,
            payment_description: dto.paymentDescription,
            shipping_address: dto.shippingAddress,
            acceptance_token: dto.acceptanceToken,
            accept_personal_auth: dto.acceptPersonalAuth
        };
        // Crear purchase en la base de datos
        const purchase = await this.createPurchaseRecord(dto);
        try {
            const response = await this.axiosInstance.post('/transactions', transactionData);
            // Crear registro de transacción
            await this.createTransactionRecord(response.data, purchase.purchase_id);
            return {
                success: true,
                transactionId: response.data.id,
                status: response.data.status,
                amountInCents: response.data.amountInCents,
                amount: response.data.amountInCents / 100,
                currency: response.data.currency,
                reference: response.data.reference,
                redirectUrl: response.data.redirectUrl,
                purchaseId: purchase.purchase_id
            };
        }
        catch (error) {
            logger_1.default.error('Error creating Wompi transaction', {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            // Si es error 422 (validación), intentar una vez más con nueva referencia
            if (error.response?.status === 422 && !isRetry) {
                logger_1.default.warn('Retrying transaction with new reference due to 422 error', {
                    originalReference: transactionData.reference
                });
                // Generar nueva referencia única
                const newReference = `TXN-${Date.now()}-${dto.userId}-${Math.random().toString(36).substr(2, 9)}`;
                const retryTransactionData = {
                    ...transactionData,
                    reference: newReference,
                    acceptance_token: dto.acceptanceToken,
                    accept_personal_auth: dto.acceptPersonalAuth
                };
                try {
                    const retryResponse = await this.axiosInstance.post('/transactions', retryTransactionData);
                    // Crear registro de transacción con la nueva referencia
                    await this.createTransactionRecord(retryResponse.data.data, purchase.purchase_id);
                    return {
                        success: true,
                        transactionId: retryResponse.data.data.id,
                        status: retryResponse.data.data.status,
                        amountInCents: retryResponse.data.data.amount_in_cents,
                        amount: retryResponse.data.data.amount_in_cents / 100,
                        currency: retryResponse.data.data.currency,
                        reference: newReference,
                        redirectUrl: retryResponse.data.data.payment_link?.permalink,
                        purchaseId: purchase.purchase_id,
                        message: 'Transacción creada exitosamente (reintento)'
                    };
                }
                catch (retryError) {
                    logger_1.default.error('Retry also failed', {
                        error: retryError.message,
                        response: retryError.response?.data
                    });
                    return this.handleWompiError(retryError);
                }
            }
            return this.handleWompiError(error);
        }
    }
    /**
     * Crea un link de pago en Wompi
     */
    async createPaymentLink(dto) {
        try {
            // Validar monto
            const amountValidation = (0, wompi_config_1.validateWompiAmount)(dto.amountInCents, dto.currency);
            if (!amountValidation.isValid) {
                throw new Error(amountValidation.error);
            }
            // Crear purchase en la base de datos
            const purchase = await this.createPurchaseRecord({
                ...dto,
                paymentMethod: payment_interface_1.WompiPaymentMethod.CARD, // Default para payment links
                reference: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                acceptanceToken: dto.acceptanceToken,
                acceptPersonalAuth: dto.acceptPersonalAuth
            });
            const paymentLinkData = {
                name: `Pago - ${dto.description}`,
                description: dto.description,
                single_use: true,
                collect_shipping: dto.collectShipping || false,
                currency: dto.currency,
                amount_in_cents: dto.amountInCents,
                expires_at: dto.expiresAt?.toISOString(),
                redirect_url: dto.redirectUrl,
                customer_data: {
                    email: dto.customerInfo.email,
                    phone_number: dto.customerInfo.phoneNumber,
                    full_name: dto.customerInfo.fullName,
                    legal_id: dto.customerInfo.legalId,
                    legal_id_type: dto.customerInfo.legalIdType
                },
                acceptance_token: dto.acceptanceToken,
                accept_personal_auth: dto.acceptPersonalAuth
            };
            const response = await this.axiosInstance.post('/payment_links', paymentLinkData);
            return {
                success: true,
                paymentLinkId: response.data.id,
                status: payment_interface_1.WompiTransactionStatus.PENDING,
                amountInCents: response.data.amountInCents,
                currency: response.data.currency,
                reference: `payment_link_${response.data.id}`,
                permalink: response.data.permalink,
                purchaseId: purchase.purchase_id
            };
        }
        catch (error) {
            logger_1.default.error('Error creating Wompi payment link', error);
            return this.handleWompiError(error);
        }
    }
    /**
     * Confirma una transacción de pago
     */
    async confirmTransaction(dto) {
        try {
            const response = await this.axiosInstance.post(`/transactions/${dto.transactionId}/confirm`, {
                payment_source_id: dto.paymentSourceId,
                customer_email: dto.customerEmail,
                acceptance_token: dto.acceptanceToken
            });
            // Actualizar registro de transacción
            await this.updateTransactionStatus(dto.transactionId, response.data.status);
            return {
                success: true,
                transactionId: response.data.id,
                status: response.data.status,
                amountInCents: response.data.amountInCents,
                currency: response.data.currency,
                reference: response.data.reference,
                purchaseId: 0 // Se actualizará desde la base de datos
            };
        }
        catch (error) {
            logger_1.default.error('Error confirming Wompi transaction', error);
            return this.handleWompiError(error);
        }
    }
    /**
     * Obtiene el estado de una transacción
     */
    async getTransactionStatus(transactionId) {
        try {
            const response = await this.axiosInstance.get(`/transactions/${transactionId}`);
            return response.data;
        }
        catch (error) {
            logger_1.default.error('Error getting Wompi transaction status', error);
            throw error;
        }
    }
    /**
     * Procesa un webhook de Wompi
     */
    async processWebhook(payload, signature) {
        try {
            // Verificar firma del webhook
            if (!this.verifyWebhookSignature(payload, signature)) {
                throw new Error('Invalid webhook signature');
            }
            const webhookEvent = payload;
            // Guardar webhook en la base de datos
            await this.saveWebhookEvent(webhookEvent);
            // Procesar evento según el tipo
            switch (webhookEvent.event) {
                case payment_interface_1.WompiEventType.TRANSACTION_UPDATED:
                    await this.handleTransactionUpdated(webhookEvent.data.transaction);
                    break;
                case payment_interface_1.WompiEventType.PAYMENT_LINK_PAID:
                    await this.handlePaymentLinkPaid(webhookEvent.data.transaction);
                    break;
                default:
                    logger_1.default.warn('Unknown webhook event type', { event: webhookEvent.event });
            }
        }
        catch (error) {
            logger_1.default.error('Error processing Wompi webhook', error);
            throw error;
        }
    }
    /**
     * Crea un reembolso
     */
    async createRefund(dto) {
        try {
            const refundData = {
                amount_in_cents: dto.amountInCents,
                reason: dto.reason || 'Solicitud del cliente'
            };
            const response = await this.axiosInstance.post(`/transactions/${dto.transactionId}/void`, refundData);
            return {
                success: true,
                refundId: response.data.id,
                transactionId: dto.transactionId,
                amountInCents: dto.amountInCents || 0,
                status: 'VOIDED'
            };
        }
        catch (error) {
            logger_1.default.error('Error creating Wompi refund', error);
            return {
                success: false,
                transactionId: dto.transactionId,
                amountInCents: dto.amountInCents || 0,
                status: 'ERROR',
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * Obtiene la configuración pública de Wompi
     */
    getPublicConfig() {
        return {
            publicKey: this.config.publicKey,
            environment: this.config.environment,
            supportedCurrencies: payment_interface_1.WOMPI_CONSTANTS.SUPPORTED_CURRENCIES,
            supportedPaymentMethods: Object.values(payment_interface_1.WompiPaymentMethod),
            minAmounts: {
                COP: payment_interface_1.WOMPI_CONSTANTS.MIN_AMOUNT_COP,
                USD: payment_interface_1.WOMPI_CONSTANTS.MIN_AMOUNT_USD
            },
            maxAmounts: {
                COP: payment_interface_1.WOMPI_CONSTANTS.MAX_AMOUNT_COP,
                USD: payment_interface_1.WOMPI_CONSTANTS.MAX_AMOUNT_USD
            }
        };
    }
    // Métodos privados
    async createPurchaseRecord(dto) {
        const purchaseRepository = database_1.AppDataSource.getRepository(purchase_model_1.Purchase);
        const packageRepository = database_1.AppDataSource.getRepository(package_model_1.Package);
        const userRepository = database_1.AppDataSource.getRepository(user_model_1.User);
        const user = await userRepository.findOne({ where: { id: dto.userId } });
        const packageEntity = await packageRepository.findOne({ where: { package_id: dto.packageId } });
        if (!user || !packageEntity) {
            throw new Error('Usuario o paquete no encontrado');
        }
        const purchase = purchaseRepository.create({
            user,
            package: packageEntity,
            amount_paid: dto.amountInCents / 100,
            payment_status: purchase_model_1.PaymentStatus.PENDING,
            payment_method: dto.paymentMethod,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        });
        return await purchaseRepository.save(purchase);
    }
    async createTransactionRecord(transaction, purchaseId) {
        const transactionRepository = database_1.AppDataSource.getRepository(payment_transaction_model_1.PaymentTransaction);
        const purchaseRepository = database_1.AppDataSource.getRepository(purchase_model_1.Purchase);
        const purchase = await purchaseRepository.findOne({ where: { purchase_id: purchaseId } });
        if (!purchase) {
            throw new Error('Purchase not found');
        }
        const paymentTransaction = transactionRepository.create({
            purchase_id: purchase.purchase_id,
            gateway_transaction_id: transaction.id,
            amount: transaction.amountInCents / 100,
            currency: transaction.currency,
            status: this.mapWompiStatusToTransactionStatus(transaction.status),
            gateway_provider: 'wompi',
            gateway_response: JSON.stringify(transaction)
        });
        await transactionRepository.save(paymentTransaction);
    }
    async updateTransactionStatus(transactionId, status) {
        const transactionRepository = database_1.AppDataSource.getRepository(payment_transaction_model_1.PaymentTransaction);
        const purchaseRepository = database_1.AppDataSource.getRepository(purchase_model_1.Purchase);
        const transaction = await transactionRepository.findOne({
            where: { gateway_transaction_id: transactionId },
            relations: ['purchase']
        });
        if (transaction) {
            transaction.status = this.mapWompiStatusToTransactionStatus(status);
            transaction.updated_at = new Date();
            await transactionRepository.save(transaction);
            // Actualizar estado de la compra
            if (transaction.purchase) {
                const purchaseStatus = this.mapWompiStatusToPurchaseStatus(status);
                transaction.purchase.payment_status = purchaseStatus;
                await purchaseRepository.save(transaction.purchase);
            }
        }
    }
    async handleTransactionUpdated(transaction) {
        await this.updateTransactionStatus(transaction.id, transaction.status);
        logger_1.default.info('Transaction updated via webhook', {
            transactionId: transaction.id,
            status: transaction.status
        });
    }
    async handlePaymentLinkPaid(transaction) {
        await this.updateTransactionStatus(transaction.id, transaction.status);
        logger_1.default.info('Payment link paid via webhook', {
            transactionId: transaction.id,
            paymentLinkId: transaction.paymentLinkId
        });
    }
    async saveWebhookEvent(event) {
        const webhookRepository = database_1.AppDataSource.getRepository(payment_webhook_model_1.PaymentWebhook);
        const webhook = webhookRepository.create({
            event_type: event.event,
            payload: JSON.stringify(event),
            processed_at: new Date(),
            signature: event.signature.checksum
        });
        await webhookRepository.save(webhook);
    }
    verifyWebhookSignature(payload, signature) {
        if (!this.config.webhookSecret) {
            logger_1.default.warn('Webhook secret not configured, skipping signature verification');
            return true;
        }
        try {
            const expectedSignature = crypto_1.default
                .createHmac('sha256', this.config.webhookSecret)
                .update(JSON.stringify(payload))
                .digest('hex');
            return crypto_1.default.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
        }
        catch (error) {
            logger_1.default.error('Error verifying webhook signature', error);
            return false;
        }
    }
    mapWompiStatusToPurchaseStatus(wompiStatus) {
        switch (wompiStatus) {
            case payment_interface_1.WompiTransactionStatus.APPROVED:
                return purchase_model_1.PaymentStatus.COMPLETED;
            case payment_interface_1.WompiTransactionStatus.DECLINED:
            case payment_interface_1.WompiTransactionStatus.ERROR:
                return purchase_model_1.PaymentStatus.FAILED;
            case payment_interface_1.WompiTransactionStatus.VOIDED:
                return purchase_model_1.PaymentStatus.REFUNDED;
            case payment_interface_1.WompiTransactionStatus.PENDING:
            default:
                return purchase_model_1.PaymentStatus.PENDING;
        }
    }
    mapWompiStatusToTransactionStatus(wompiStatus) {
        switch (wompiStatus) {
            case payment_interface_1.WompiTransactionStatus.APPROVED:
                return payment_transaction_model_1.TransactionStatus.COMPLETED;
            case payment_interface_1.WompiTransactionStatus.DECLINED:
            case payment_interface_1.WompiTransactionStatus.ERROR:
                return payment_transaction_model_1.TransactionStatus.FAILED;
            case payment_interface_1.WompiTransactionStatus.VOIDED:
                return payment_transaction_model_1.TransactionStatus.REFUNDED;
            case payment_interface_1.WompiTransactionStatus.PENDING:
            default:
                return payment_transaction_model_1.TransactionStatus.PENDING;
        }
    }
    handleWompiError(error) {
        let message = 'Error procesando el pago';
        let validationErrors = {};
        if (error.response?.data?.error) {
            const errorResponse = error.response.data;
            message = errorResponse.error?.message || message;
            // Include specific validation errors
            if (errorResponse.error.type === 'INPUT_VALIDATION_ERROR') {
                validationErrors = errorResponse.error.messages || {};
            }
        }
        return {
            success: false,
            transactionId: undefined,
            status: payment_interface_1.WompiTransactionStatus.ERROR,
            amountInCents: 0,
            amount: 0,
            currency: payment_interface_1.WompiCurrency.COP,
            reference: '',
            purchaseId: 0,
            message,
            validationErrors // Add this field
        };
    }
}
exports.WompiService = WompiService;
