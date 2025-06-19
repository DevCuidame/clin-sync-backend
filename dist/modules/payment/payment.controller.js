"use strict";
/**
 * Controlador de Pagos - Manejo de endpoints para Wompi
 * Implementación con validaciones, manejo de errores y logging
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const logger_1 = __importDefault(require("../../utils/logger"));
const error_handler_1 = require("../../utils/error-handler");
const payment_interface_1 = require("./payment.interface");
// Utility function to handle async errors
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
class PaymentController {
    wompiService;
    paymentTransactionService;
    acceptanceTokensService;
    constructor(wompiService, paymentTransactionService, acceptanceTokensService) {
        this.wompiService = wompiService;
        this.paymentTransactionService = paymentTransactionService;
        this.acceptanceTokensService = acceptanceTokensService;
        // Bind methods to preserve 'this' context
        this.createTransaction = this.createTransaction.bind(this);
        this.createPaymentLink = this.createPaymentLink.bind(this);
        this.confirmTransaction = this.confirmTransaction.bind(this);
        this.getTransactionStatus = this.getTransactionStatus.bind(this);
        this.handleWebhook = this.handleWebhook.bind(this);
        this.getPaymentHistory = this.getPaymentHistory.bind(this);
        this.getPaymentStats = this.getPaymentStats.bind(this);
        this.getAcceptanceTokens = this.getAcceptanceTokens.bind(this);
    }
    async createTransaction(req, res, next) {
        const transactionData = req.body;
        const userId = req.user?.id;
        try {
            if (!userId) {
                throw new error_handler_1.BadRequestError('Usuario no autenticado');
            }
            logger_1.default.info('Creating transaction', {
                userId,
                purchaseId: transactionData.purchaseId,
                amount: transactionData.amount,
                currency: transactionData.currency,
                paymentMethod: transactionData.paymentMethod
            });
            // Transform DTO to match service interface
            const wompiTransactionData = {
                userId,
                packageId: transactionData.purchaseId,
                amountInCents: Math.round(transactionData.amount * 100),
                currency: transactionData.currency,
                customerInfo: transactionData.customerInfo,
                paymentMethod: transactionData.paymentMethod,
                reference: `TXN-${Date.now()}-${userId}-${Math.random().toString(36).substr(2, 9)}`,
                paymentDescription: transactionData.description,
                shippingAddress: transactionData.shippingAddress ? {
                    addressLine1: transactionData.shippingAddress.addressLine,
                    addressLine2: undefined,
                    country: transactionData.shippingAddress.country,
                    region: transactionData.shippingAddress.state || transactionData.shippingAddress.city,
                    city: transactionData.shippingAddress.city,
                    name: transactionData.customerInfo.fullName,
                    phoneNumber: transactionData.customerInfo.phoneNumber || ''
                } : undefined,
                acceptanceToken: transactionData.acceptanceToken,
                acceptPersonalAuth: transactionData.acceptPersonalAuth
            };
            const result = await this.wompiService.createTransaction(wompiTransactionData);
            logger_1.default.info('Transaction created successfully', {
                transactionId: result.transactionId,
                userId,
                purchaseId: transactionData.purchaseId
            });
            res.status(201).json({
                success: true,
                message: 'Transacción creada exitosamente',
                data: result
            });
        }
        catch (error) {
            logger_1.default.error('Error creating transaction', {
                error: error.message,
                userId,
                purchaseId: transactionData.purchaseId
            });
            // Si el servicio retorna un error de validación, enviarlo con status 422
            if (error.response?.status === 422 || (error.message && error.message.includes('validación'))) {
                res.status(422).json({
                    success: false,
                    message: error.message || 'Error de validación en los datos de la transacción',
                    validationErrors: error.validationErrors || {},
                    error: 'VALIDATION_ERROR'
                });
                return;
            }
            next(error);
        }
    }
    async createPaymentLink(req, res, next) {
        try {
            const linkData = req.body;
            const userId = req.user?.id;
            if (!userId) {
                throw new error_handler_1.BadRequestError('Usuario no autenticado');
            }
            logger_1.default.info('Creating payment link', {
                userId,
                purchaseId: linkData.purchaseId,
                amount: linkData.amount,
                currency: linkData.currency
            });
            // Transform DTO to match service interface
            const wompiLinkData = {
                userId,
                packageId: linkData.purchaseId,
                amountInCents: Math.round(linkData.amount * 100),
                currency: linkData.currency,
                customerInfo: linkData.customerInfo,
                description: linkData.description,
                redirectUrl: linkData.redirectUrls?.success,
                expiresAt: linkData.expiresAt ? new Date(linkData.expiresAt) : undefined,
                collectShipping: !!linkData.shippingAddress,
                acceptanceToken: linkData.acceptanceToken,
                acceptPersonalAuth: linkData.acceptPersonalAuth
            };
            const result = await this.wompiService.createPaymentLink(wompiLinkData);
            logger_1.default.info('Payment link created successfully', {
                transactionId: result.transactionId,
                userId,
                purchaseId: linkData.purchaseId
            });
            res.status(201).json({
                success: true,
                message: 'Enlace de pago creado exitosamente',
                data: result
            });
        }
        catch (error) {
            logger_1.default.error('Error creating payment link', error);
            next(error);
        }
    }
    async confirmTransaction(req, res, next) {
        try {
            const { id } = req.params;
            const confirmationData = req.body;
            const userId = req.user?.id;
            if (!userId) {
                throw new error_handler_1.BadRequestError('Usuario no autenticado');
            }
            logger_1.default.info('Confirming transaction', {
                transactionId: id,
                userId
            });
            // Transform DTO to match service interface
            const wompiConfirmData = {
                transactionId: id,
                paymentSourceId: confirmationData.paymentSourceToken,
                customerEmail: req.user?.email,
                acceptanceToken: confirmationData.verificationCode
            };
            const result = await this.wompiService.confirmTransaction(wompiConfirmData);
            logger_1.default.info('Transaction confirmed successfully', {
                transactionId: id,
                userId,
                status: result.status
            });
            res.status(200).json({
                success: true,
                message: 'Transacción confirmada exitosamente',
                data: result
            });
        }
        catch (error) {
            logger_1.default.error('Error confirming transaction', error);
            next(error);
        }
    }
    /**
     * Obtiene el estado de una transacción
     */
    getTransactionStatus = catchAsync(async (req, res) => {
        const { transactionId } = req.params;
        if (!transactionId) {
            return res.status(400).json({
                success: false,
                message: 'ID de transacción es requerido'
            });
        }
        logger_1.default.info('Getting transaction status', { transactionId });
        const transaction = await this.wompiService.getTransactionStatus(transactionId);
        res.status(200).json({
            success: true,
            message: 'Estado de transacción obtenido exitosamente',
            data: transaction
        });
    });
    async createRefund(req, res, next) {
        try {
            const refundData = req.body;
            const userId = req.user?.id;
            if (!userId) {
                throw new error_handler_1.BadRequestError('Usuario no autenticado');
            }
            logger_1.default.info('Creating refund', {
                transactionId: refundData.transactionId,
                amount: refundData.amount,
                userId
            });
            const result = await this.wompiService.createRefund(refundData);
            logger_1.default.info('Refund created successfully', {
                refundId: result.refundId,
                transactionId: refundData.transactionId,
                userId
            });
            res.status(201).json({
                success: true,
                message: 'Reembolso creado exitosamente',
                data: result
            });
        }
        catch (error) {
            logger_1.default.error('Error creating refund', error);
            next(error);
        }
    }
    /**
     * Maneja webhooks de Wompi
     */
    handleWebhook = catchAsync(async (req, res) => {
        const signature = req.headers['x-signature'];
        if (!signature) {
            return res.status(400).json({
                success: false,
                message: 'Firma del webhook requerida'
            });
        }
        logger_1.default.info('Processing Wompi webhook', {
            event: req.body.event,
            signature: signature.substring(0, 10) + '...'
        });
        await this.wompiService.processWebhook(req.body, signature);
        res.status(200).json({
            success: true,
            message: 'Webhook procesado exitosamente'
        });
    });
    /**
     * Obtiene la configuración pública de Wompi
     */
    getPublicConfig = catchAsync(async (req, res) => {
        const config = this.wompiService.getPublicConfig();
        res.status(200).json({
            success: true,
            message: 'Configuración obtenida exitosamente',
            data: config
        });
    });
    async getPaymentHistory(req, res, next) {
        try {
            const filters = req.query;
            const userId = req.user?.id;
            if (!userId) {
                throw new error_handler_1.BadRequestError('Usuario no autenticado');
            }
            logger_1.default.info('Getting payment history', {
                userId,
                filters
            });
            // Transform DTO to match service interface
            const transformedFilters = {
                ...filters,
                userId,
                startDate: filters.startDate ? new Date(filters.startDate) : undefined,
                endDate: filters.endDate ? new Date(filters.endDate) : undefined
            };
            const result = await this.paymentTransactionService.getPaymentHistory(transformedFilters);
            res.status(200).json({
                success: true,
                message: 'Historial de pagos obtenido exitosamente',
                data: result.transactions,
                pagination: {
                    page: filters.page || 1,
                    limit: filters.limit || 10,
                    total: result.total,
                    totalPages: Math.ceil(result.total / (filters.limit || 10))
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error getting payment history', error);
            next(error);
        }
    }
    /**
     * Obtiene estadísticas de pagos
     */
    getPaymentStats = catchAsync(async (req, res) => {
        const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
        const currency = req.query.currency || payment_interface_1.WompiCurrency.COP;
        logger_1.default.info('Getting payment statistics', { startDate, endDate, currency });
        const stats = await this.paymentTransactionService.getPaymentStats({
            startDate,
            endDate,
            currency
        });
        res.status(200).json({
            success: true,
            message: 'Estadísticas obtenidas exitosamente',
            data: stats
        });
    });
    /**
     * Obtiene información del cliente en Wompi
     */
    getCustomerInfo = catchAsync(async (req, res) => {
        const { email } = req.params;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email del cliente es requerido'
            });
        }
        logger_1.default.info('Getting customer info', { email });
        // Aquí se implementaría la lógica para obtener información del cliente
        // Por ahora retornamos un placeholder
        res.status(200).json({
            success: true,
            message: 'Información del cliente obtenida exitosamente',
            data: {
                email,
                hasPaymentMethods: false,
                totalTransactions: 0
            }
        });
    });
    /**
     * Obtiene los tokens de aceptación de Wompi
     */
    getAcceptanceTokens = catchAsync(async (req, res) => {
        const result = await this.acceptanceTokensService.getAcceptanceTokens();
        if (!result.success) {
            throw new error_handler_1.InternalServerError(result.error || 'Error obteniendo tokens de aceptación');
        }
        res.status(200).json({
            success: true,
            message: 'Tokens de aceptación obtenidos exitosamente',
            data: result.data
        });
    });
}
exports.PaymentController = PaymentController;
