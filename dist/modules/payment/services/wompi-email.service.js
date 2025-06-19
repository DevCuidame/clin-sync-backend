"use strict";
/**
 * Servicio de correos para Wompi
 * Maneja el envío de correos relacionados con transacciones de pago
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WompiEmailService = void 0;
const email_service_1 = require("../../notification/services/email.service");
const template_file_service_1 = require("../../notification/services/template-file.service");
const payment_interface_1 = require("../payment.interface");
const wompi_email_config_1 = require("../config/wompi-email.config");
const logger_1 = __importDefault(require("../../../utils/logger"));
class WompiEmailService {
    emailService;
    templateService;
    static instance = null;
    constructor() {
        this.emailService = email_service_1.EmailService.getInstance();
        this.templateService = new template_file_service_1.TemplateFileService();
    }
    /**
     * Obtener instancia única del servicio
     */
    static getInstance() {
        if (!WompiEmailService.instance) {
            WompiEmailService.instance = new WompiEmailService();
        }
        return WompiEmailService.instance;
    }
    /**
     * Enviar correo de confirmación de pago exitoso
     */
    async sendPaymentConfirmation(data) {
        try {
            // Validar datos antes del envío
            const validation = this.validateEmailData(data);
            if (!validation.isValid) {
                logger_1.default.error('Datos de correo inválidos:', validation.errors);
                return {
                    success: false,
                    error: `Datos inválidos: ${validation.errors.join(', ')}`
                };
            }
            const companyConfig = wompi_email_config_1.WompiEmailConfigUtils.getCompanyConfig({
                name: data.companyName,
                supportEmail: data.supportEmail,
                supportPhone: data.supportPhone
            });
            const templateData = {
                ...data,
                formattedAmount: this.formatAmount(data.amount, data.currency),
                formattedDate: this.formatDate(data.transactionDate),
                statusText: this.getStatusText(data.status),
                companyName: companyConfig.name,
                supportEmail: companyConfig.supportEmail,
                supportPhone: companyConfig.supportPhone
            };
            const html = await this.templateService.renderTemplate('wompi-payment-confirmation', templateData);
            const subject = wompi_email_config_1.WompiEmailConfigUtils.getSubjectForStatus(data.status, data.reference);
            const result = await this.emailService.sendEmail({
                to: data.customerEmail,
                subject,
                html
            });
            logger_1.default.info(`Correo de confirmación de pago enviado a ${data.customerEmail}`, {
                transactionId: data.transactionId,
                reference: data.reference
            });
            return result;
        }
        catch (error) {
            logger_1.default.error('Error al enviar correo de confirmación de pago:', error);
            return {
                success: false,
                error
            };
        }
    }
    /**
     * Enviar correo de pago fallido
     */
    async sendPaymentFailure(data) {
        try {
            // Validar datos antes del envío
            const validation = this.validateEmailData(data);
            if (!validation.isValid) {
                logger_1.default.error('Datos de correo inválidos:', validation.errors);
                return {
                    success: false,
                    error: `Datos inválidos: ${validation.errors.join(', ')}`
                };
            }
            const companyConfig = wompi_email_config_1.WompiEmailConfigUtils.getCompanyConfig({
                name: data.companyName,
                supportEmail: data.supportEmail,
                supportPhone: data.supportPhone
            });
            const templateData = {
                ...data,
                formattedAmount: this.formatAmount(data.amount, data.currency),
                formattedDate: this.formatDate(data.transactionDate),
                statusText: this.getStatusText(data.status),
                companyName: companyConfig.name,
                supportEmail: companyConfig.supportEmail,
                supportPhone: companyConfig.supportPhone
            };
            const html = await this.templateService.renderTemplate('wompi-payment-failure', templateData);
            const subject = wompi_email_config_1.WompiEmailConfigUtils.getSubjectForStatus(data.status, data.reference);
            const result = await this.emailService.sendEmail({
                to: data.customerEmail,
                subject,
                html
            });
            logger_1.default.info(`Correo de pago fallido enviado a ${data.customerEmail}`, {
                transactionId: data.transactionId,
                reference: data.reference
            });
            return result;
        }
        catch (error) {
            logger_1.default.error('Error al enviar correo de pago fallido:', error);
            return {
                success: false,
                error
            };
        }
    }
    /**
     * Enviar correo de pago pendiente
     */
    async sendPaymentPending(data) {
        try {
            // Validar datos antes del envío
            const validation = this.validateEmailData(data);
            if (!validation.isValid) {
                logger_1.default.error('Datos de correo inválidos:', validation.errors);
                return {
                    success: false,
                    error: `Datos inválidos: ${validation.errors.join(', ')}`
                };
            }
            const companyConfig = wompi_email_config_1.WompiEmailConfigUtils.getCompanyConfig({
                name: data.companyName,
                supportEmail: data.supportEmail,
                supportPhone: data.supportPhone
            });
            const templateData = {
                ...data,
                formattedAmount: this.formatAmount(data.amount, data.currency),
                formattedDate: this.formatDate(data.transactionDate),
                statusText: this.getStatusText(data.status),
                companyName: companyConfig.name,
                supportEmail: companyConfig.supportEmail,
                supportPhone: companyConfig.supportPhone
            };
            const html = await this.templateService.renderTemplate('wompi-payment-pending', templateData);
            const subject = wompi_email_config_1.WompiEmailConfigUtils.getSubjectForStatus(data.status, data.reference);
            const result = await this.emailService.sendEmail({
                to: data.customerEmail,
                subject,
                html
            });
            logger_1.default.info(`Correo de pago pendiente enviado a ${data.customerEmail}`, {
                transactionId: data.transactionId,
                reference: data.reference
            });
            return result;
        }
        catch (error) {
            logger_1.default.error('Error al enviar correo de pago pendiente:', error);
            return {
                success: false,
                error
            };
        }
    }
    /**
     * Enviar correo de reembolso
     */
    async sendRefundNotification(data) {
        try {
            // Validar datos antes del envío
            const validation = this.validateEmailData(data);
            if (!validation.isValid) {
                logger_1.default.error('Datos de correo inválidos:', validation.errors);
                return {
                    success: false,
                    error: `Datos inválidos: ${validation.errors.join(', ')}`
                };
            }
            const companyConfig = wompi_email_config_1.WompiEmailConfigUtils.getCompanyConfig({
                name: data.companyName,
                supportEmail: data.supportEmail,
                supportPhone: data.supportPhone
            });
            const templateData = {
                ...data,
                formattedAmount: this.formatAmount(data.amount, data.currency),
                formattedRefundAmount: this.formatAmount(data.refundAmount || data.amount, data.currency),
                formattedDate: this.formatDate(data.transactionDate),
                refundDate: this.formatDate(new Date()),
                statusText: 'Reembolsado',
                companyName: companyConfig.name,
                supportEmail: companyConfig.supportEmail,
                supportPhone: companyConfig.supportPhone,
                refundReason: data.refundReason || 'Solicitud del cliente'
            };
            const html = await this.templateService.renderTemplate('wompi-refund-notification', templateData);
            const subject = wompi_email_config_1.WOMPI_EMAIL_CONFIG.subjects.refund.replace('{reference}', data.reference);
            const result = await this.emailService.sendEmail({
                to: data.customerEmail,
                subject,
                html
            });
            logger_1.default.info(`Correo de reembolso enviado a ${data.customerEmail}`, {
                transactionId: data.transactionId,
                reference: data.reference
            });
            return result;
        }
        catch (error) {
            logger_1.default.error('Error al enviar correo de reembolso:', error);
            return {
                success: false,
                error
            };
        }
    }
    /**
     * Enviar correo basado en el estado de la transacción
     */
    async sendTransactionStatusEmail(data) {
        // Validar datos antes del envío
        const validation = this.validateEmailData(data);
        if (!validation.isValid) {
            logger_1.default.error('Datos de correo inválidos:', validation.errors);
            return {
                success: false,
                error: `Datos inválidos: ${validation.errors.join(', ')}`
            };
        }
        // Verificar si el template existe para este estado
        const templateName = wompi_email_config_1.WompiEmailConfigUtils.getTemplateForStatus(data.status);
        if (!templateName) {
            logger_1.default.warn(`Estado de transacción no manejado: ${data.status}`);
            return {
                success: false,
                error: `Estado de transacción no soportado: ${data.status}`
            };
        }
        switch (data.status) {
            case payment_interface_1.WompiTransactionStatus.APPROVED:
                return this.sendPaymentConfirmation(data);
            case payment_interface_1.WompiTransactionStatus.DECLINED:
            case payment_interface_1.WompiTransactionStatus.ERROR:
                return this.sendPaymentFailure(data);
            case payment_interface_1.WompiTransactionStatus.PENDING:
                return this.sendPaymentPending(data);
            default:
                logger_1.default.warn(`Estado de transacción no manejado: ${data.status}`);
                return {
                    success: false,
                    error: `Estado de transacción no soportado: ${data.status}`
                };
        }
    }
    /**
     * Validar datos de correo antes del envío
     */
    validateEmailData(data) {
        return wompi_email_config_1.WompiEmailConfigUtils.validateEmailData({
            customerEmail: data.customerEmail,
            customerName: data.customerName,
            reference: data.reference,
            amount: data.amount
        });
    }
    /**
     * Formatear monto con moneda usando configuración centralizada
     */
    formatAmount(amount, currency) {
        return wompi_email_config_1.WompiEmailConfigUtils.formatAmount(amount, currency);
    }
    /**
     * Formatear fecha usando configuración centralizada
     */
    formatDate(date) {
        return wompi_email_config_1.WompiEmailConfigUtils.formatDate(date);
    }
    /**
     * Obtener texto descriptivo del estado usando configuración centralizada
     */
    getStatusText(status) {
        return wompi_email_config_1.WompiEmailConfigUtils.getStatusText(status);
    }
}
exports.WompiEmailService = WompiEmailService;
