"use strict";
/**
 * Ejemplos de uso del sistema de correos de Wompi
 * Este archivo muestra cómo integrar el servicio de correos en diferentes escenarios
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WompiPaymentEmailIntegration = void 0;
exports.handleWompiWebhook = handleWompiWebhook;
exports.sendPaymentConfirmationManual = sendPaymentConfirmationManual;
exports.sendRefundNotificationExample = sendRefundNotificationExample;
exports.paymentControllerExample = paymentControllerExample;
exports.sendEmailWithRetry = sendEmailWithRetry;
const wompi_email_service_1 = require("../services/wompi-email.service");
const payment_interface_1 = require("../payment.interface");
const logger_1 = __importDefault(require("../../../utils/logger"));
/**
 * Ejemplo 1: Enviar correo después de procesar un webhook de Wompi
 */
async function handleWompiWebhook(webhookData) {
    try {
        const emailService = wompi_email_service_1.WompiEmailService.getInstance();
        // Extraer datos del webhook
        const transaction = webhookData.data.transaction;
        const emailData = {
            customerName: transaction.customer_data?.full_name || 'Cliente',
            customerEmail: transaction.customer_email,
            transactionId: transaction.id,
            reference: transaction.reference,
            amount: transaction.amount_in_cents,
            currency: transaction.currency,
            status: transaction.status,
            paymentMethod: transaction.payment_method?.type,
            transactionDate: new Date(transaction.created_at),
            packageName: 'Consulta Médica Premium', // Obtener del contexto
            companyName: 'Cuidame Health',
            supportEmail: 'soporte@cuidamehealth.com',
            supportPhone: '+57 300 123 4567'
        };
        // Enviar correo automático basado en el estado
        const result = await emailService.sendTransactionStatusEmail(emailData);
        if (result.success) {
            logger_1.default.info(`Correo de transacción enviado exitosamente`, {
                transactionId: emailData.transactionId,
                status: emailData.status,
                email: emailData.customerEmail
            });
        }
        else {
            logger_1.default.error(`Error al enviar correo de transacción`, {
                transactionId: emailData.transactionId,
                error: result.error
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error al procesar webhook de Wompi:', error);
    }
}
/**
 * Ejemplo 2: Enviar correo de confirmación manual
 */
async function sendPaymentConfirmationManual(transactionId, customerEmail, customerName, amount, reference) {
    try {
        const emailService = wompi_email_service_1.WompiEmailService.getInstance();
        const emailData = {
            customerName,
            customerEmail,
            transactionId,
            reference,
            amount,
            currency: 'COP',
            status: payment_interface_1.WompiTransactionStatus.APPROVED,
            transactionDate: new Date(),
            packageName: 'Consulta Médica',
            companyName: 'Cuidame Health'
        };
        const result = await emailService.sendPaymentConfirmation(emailData);
        return result;
    }
    catch (error) {
        logger_1.default.error('Error al enviar confirmación manual:', error);
        return { success: false, error };
    }
}
/**
 * Ejemplo 3: Enviar correo de reembolso
 */
async function sendRefundNotificationExample(originalTransactionId, customerEmail, customerName, originalAmount, refundAmount, refundReason) {
    try {
        const emailService = wompi_email_service_1.WompiEmailService.getInstance();
        const emailData = {
            customerName,
            customerEmail,
            transactionId: originalTransactionId,
            reference: `REF-${originalTransactionId}`,
            amount: originalAmount,
            currency: 'COP',
            status: payment_interface_1.WompiTransactionStatus.VOIDED,
            transactionDate: new Date(),
            refundAmount,
            refundReason,
            companyName: 'Cuidame Health'
        };
        const result = await emailService.sendRefundNotification(emailData);
        return result;
    }
    catch (error) {
        logger_1.default.error('Error al enviar notificación de reembolso:', error);
        return { success: false, error };
    }
}
/**
 * Ejemplo 4: Integración con el servicio de pagos existente
 */
class WompiPaymentEmailIntegration {
    emailService;
    constructor() {
        this.emailService = wompi_email_service_1.WompiEmailService.getInstance();
    }
    /**
     * Enviar correo después de crear una transacción
     */
    async notifyTransactionCreated(transactionData) {
        const emailData = {
            customerName: transactionData.customerName,
            customerEmail: transactionData.customerEmail,
            transactionId: transactionData.id,
            reference: transactionData.reference,
            amount: transactionData.amount,
            currency: transactionData.currency,
            status: payment_interface_1.WompiTransactionStatus.PENDING,
            transactionDate: new Date(),
            packageName: transactionData.packageName
        };
        return await this.emailService.sendPaymentPending(emailData);
    }
    /**
     * Enviar correo cuando una transacción es aprobada
     */
    async notifyTransactionApproved(transactionData) {
        const emailData = {
            customerName: transactionData.customerName,
            customerEmail: transactionData.customerEmail,
            transactionId: transactionData.id,
            reference: transactionData.reference,
            amount: transactionData.amount,
            currency: transactionData.currency,
            status: payment_interface_1.WompiTransactionStatus.APPROVED,
            paymentMethod: transactionData.paymentMethod,
            transactionDate: new Date(),
            packageName: transactionData.packageName
        };
        return await this.emailService.sendPaymentConfirmation(emailData);
    }
    /**
     * Enviar correo cuando una transacción es rechazada
     */
    async notifyTransactionDeclined(transactionData) {
        const emailData = {
            customerName: transactionData.customerName,
            customerEmail: transactionData.customerEmail,
            transactionId: transactionData.id,
            reference: transactionData.reference,
            amount: transactionData.amount,
            currency: transactionData.currency,
            status: payment_interface_1.WompiTransactionStatus.DECLINED,
            paymentMethod: transactionData.paymentMethod,
            transactionDate: new Date(),
            packageName: transactionData.packageName
        };
        return await this.emailService.sendPaymentFailure(emailData);
    }
}
exports.WompiPaymentEmailIntegration = WompiPaymentEmailIntegration;
/**
 * Ejemplo 5: Uso en un controlador de pagos
 */
async function paymentControllerExample() {
    const emailIntegration = new WompiPaymentEmailIntegration();
    // Simular datos de una transacción
    const transactionData = {
        id: 'txn_12345',
        reference: 'REF-2024-001',
        amount: 50000, // $500 COP en centavos
        currency: 'COP',
        customerEmail: 'cliente@ejemplo.com',
        customerName: 'Juan Pérez',
        paymentMethod: 'CARD',
        packageName: 'Consulta Médica General'
    };
    // Enviar correo de transacción pendiente
    await emailIntegration.notifyTransactionCreated(transactionData);
    // Simular aprobación después de un tiempo
    setTimeout(async () => {
        await emailIntegration.notifyTransactionApproved(transactionData);
    }, 5000);
}
/**
 * Ejemplo 6: Manejo de errores y reintentos
 */
async function sendEmailWithRetry(emailData, maxRetries = 3) {
    const emailService = wompi_email_service_1.WompiEmailService.getInstance();
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await emailService.sendTransactionStatusEmail(emailData);
            if (result.success) {
                logger_1.default.info(`Correo enviado exitosamente en intento ${attempt}`);
                return result;
            }
            lastError = result.error;
            logger_1.default.warn(`Intento ${attempt} fallido, reintentando...`, result.error);
            // Esperar antes del siguiente intento
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
        catch (error) {
            lastError = error;
            logger_1.default.error(`Error en intento ${attempt}:`, error);
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }
    logger_1.default.error(`Falló el envío de correo después de ${maxRetries} intentos`, lastError);
    return { success: false, error: lastError };
}
