"use strict";
/**
 * Configuración para el sistema de correos de Wompi
 * Centraliza todas las configuraciones relacionadas con emails
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEV_CONFIG = exports.WompiEmailConfigUtils = exports.LOGGING_CONFIG = exports.VALIDATION_CONFIG = exports.REFUND_TIMEFRAMES = exports.STATUS_COLORS = exports.STATUS_TO_SUBJECT = exports.STATUS_TO_TEMPLATE = exports.TRANSACTION_STATUS_TEXT = exports.WOMPI_EMAIL_CONFIG = void 0;
const payment_interface_1 = require("../payment.interface");
/**
 * Configuración por defecto para correos de Wompi
 */
exports.WOMPI_EMAIL_CONFIG = {
    // Información de la empresa por defecto
    DEFAULT_COMPANY: {
        name: 'Cuidame Health',
        supportEmail: 'soporte@cuidamehealth.com',
        supportPhone: '+57 300 123 4567',
        website: 'https://cuidamehealth.com'
    },
    // Configuración de reintentos
    RETRY_CONFIG: {
        maxRetries: 3,
        retryDelay: 1000, // ms
        exponentialBackoff: true
    },
    // Timeouts
    TIMEOUTS: {
        emailSend: 30000, // 30 segundos
        templateRender: 5000 // 5 segundos
    },
    // Configuración de plantillas
    TEMPLATES: {
        confirmation: 'wompi-payment-confirmation',
        failure: 'wompi-payment-failure',
        pending: 'wompi-payment-pending',
        refund: 'wompi-refund-notification'
    },
    // Asuntos de correo
    subjects: {
        confirmation: 'Confirmación de pago - Transacción {reference}',
        failure: 'Pago no procesado - Transacción {reference}',
        pending: 'Pago en proceso - Transacción {reference}',
        refund: 'Reembolso procesado - Transacción {reference}'
    },
    // Configuración de formato
    FORMAT: {
        currency: {
            locale: 'es-CO',
            options: {
                style: 'currency',
                minimumFractionDigits: 0
            }
        },
        date: {
            locale: 'es-CO',
            options: {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }
        }
    }
};
/**
 * Mapeo de estados de transacción a texto descriptivo
 */
exports.TRANSACTION_STATUS_TEXT = {
    [payment_interface_1.WompiTransactionStatus.APPROVED]: 'Aprobado',
    [payment_interface_1.WompiTransactionStatus.DECLINED]: 'Rechazado',
    [payment_interface_1.WompiTransactionStatus.PENDING]: 'Pendiente',
    [payment_interface_1.WompiTransactionStatus.VOIDED]: 'Anulado',
    [payment_interface_1.WompiTransactionStatus.ERROR]: 'Error'
};
/**
 * Mapeo de estados a plantillas de correo
 */
exports.STATUS_TO_TEMPLATE = {
    [payment_interface_1.WompiTransactionStatus.APPROVED]: exports.WOMPI_EMAIL_CONFIG.TEMPLATES.confirmation,
    [payment_interface_1.WompiTransactionStatus.DECLINED]: exports.WOMPI_EMAIL_CONFIG.TEMPLATES.failure,
    [payment_interface_1.WompiTransactionStatus.ERROR]: exports.WOMPI_EMAIL_CONFIG.TEMPLATES.failure,
    [payment_interface_1.WompiTransactionStatus.PENDING]: exports.WOMPI_EMAIL_CONFIG.TEMPLATES.pending,
    [payment_interface_1.WompiTransactionStatus.VOIDED]: exports.WOMPI_EMAIL_CONFIG.TEMPLATES.refund
};
/**
 * Mapeo de estados a asuntos de correo
 */
exports.STATUS_TO_SUBJECT = {
    [payment_interface_1.WompiTransactionStatus.APPROVED]: (ref) => `Confirmación de pago - Transacción ${ref}`,
    [payment_interface_1.WompiTransactionStatus.DECLINED]: (ref) => `Pago no procesado - Transacción ${ref}`,
    [payment_interface_1.WompiTransactionStatus.ERROR]: (ref) => `Pago no procesado - Transacción ${ref}`,
    [payment_interface_1.WompiTransactionStatus.PENDING]: (ref) => `Pago en proceso - Transacción ${ref}`,
    [payment_interface_1.WompiTransactionStatus.VOIDED]: (ref) => `Reembolso procesado - Transacción ${ref}`
};
/**
 * Configuración de colores para diferentes estados
 */
exports.STATUS_COLORS = {
    [payment_interface_1.WompiTransactionStatus.APPROVED]: {
        primary: '#28a745',
        secondary: '#20c997',
        background: '#e8f5e8',
        border: '#c3e6c3',
        text: '#155724'
    },
    [payment_interface_1.WompiTransactionStatus.DECLINED]: {
        primary: '#dc3545',
        secondary: '#c82333',
        background: '#f8d7da',
        border: '#f5c6cb',
        text: '#721c24'
    },
    [payment_interface_1.WompiTransactionStatus.ERROR]: {
        primary: '#dc3545',
        secondary: '#c82333',
        background: '#f8d7da',
        border: '#f5c6cb',
        text: '#721c24'
    },
    [payment_interface_1.WompiTransactionStatus.PENDING]: {
        primary: '#ffc107',
        secondary: '#e0a800',
        background: '#fff3cd',
        border: '#ffeaa7',
        text: '#856404'
    },
    [payment_interface_1.WompiTransactionStatus.VOIDED]: {
        primary: '#17a2b8',
        secondary: '#138496',
        background: '#d1ecf1',
        border: '#bee5eb',
        text: '#0c5460'
    }
};
/**
 * Tiempos estimados de acreditación por método de pago
 */
exports.REFUND_TIMEFRAMES = {
    CARD: {
        credit: '1-2 ciclos de facturación (30-60 días hábiles)',
        debit: '3-5 días hábiles'
    },
    NEQUI: '1-3 días hábiles',
    PSE: '1-2 días hábiles',
    BANCOLOMBIA_TRANSFER: '1-2 días hábiles',
    BANCOLOMBIA_COLLECT: '1-2 días hábiles',
    DEFAULT: '3-5 días hábiles'
};
/**
 * Configuración de validación
 */
exports.VALIDATION_CONFIG = {
    email: {
        maxLength: 254,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    customerName: {
        maxLength: 100,
        minLength: 2
    },
    reference: {
        maxLength: 50,
        minLength: 3
    },
    amount: {
        min: 100, // $1 COP en centavos
        max: 100000000 // $1,000,000 COP en centavos
    }
};
/**
 * Configuración de logging
 */
exports.LOGGING_CONFIG = {
    levels: {
        success: 'info',
        error: 'error',
        warning: 'warn',
        debug: 'debug'
    },
    includeFields: [
        'transactionId',
        'customerEmail',
        'status',
        'amount',
        'currency',
        'reference',
        'timestamp'
    ]
};
/**
 * Utilidades de configuración
 */
class WompiEmailConfigUtils {
    /**
     * Obtener configuración de empresa con valores por defecto
     */
    static getCompanyConfig(overrides) {
        return {
            ...exports.WOMPI_EMAIL_CONFIG.DEFAULT_COMPANY,
            ...overrides
        };
    }
    /**
     * Obtener texto de estado
     */
    static getStatusText(status) {
        return exports.TRANSACTION_STATUS_TEXT[status] || 'Desconocido';
    }
    /**
     * Obtener plantilla para estado
     */
    static getTemplateForStatus(status) {
        return exports.STATUS_TO_TEMPLATE[status] || exports.WOMPI_EMAIL_CONFIG.TEMPLATES.failure;
    }
    /**
     * Obtener asunto para estado
     */
    static getSubjectForStatus(status, reference) {
        const subjectFn = exports.STATUS_TO_SUBJECT[status];
        return subjectFn ? subjectFn(reference) : `Notificación de pago - ${reference}`;
    }
    /**
     * Validar datos de correo
     */
    static validateEmailData(data) {
        const errors = [];
        // Validar email
        if (!exports.VALIDATION_CONFIG.email.pattern.test(data.customerEmail)) {
            errors.push('Email inválido');
        }
        if (data.customerEmail.length > exports.VALIDATION_CONFIG.email.maxLength) {
            errors.push('Email demasiado largo');
        }
        // Validar nombre
        if (data.customerName.length < exports.VALIDATION_CONFIG.customerName.minLength) {
            errors.push('Nombre demasiado corto');
        }
        if (data.customerName.length > exports.VALIDATION_CONFIG.customerName.maxLength) {
            errors.push('Nombre demasiado largo');
        }
        // Validar referencia
        if (data.reference.length < exports.VALIDATION_CONFIG.reference.minLength) {
            errors.push('Referencia demasiado corta');
        }
        if (data.reference.length > exports.VALIDATION_CONFIG.reference.maxLength) {
            errors.push('Referencia demasiado larga');
        }
        // Validar monto
        if (data.amount < exports.VALIDATION_CONFIG.amount.min) {
            errors.push('Monto demasiado pequeño');
        }
        if (data.amount > exports.VALIDATION_CONFIG.amount.max) {
            errors.push('Monto demasiado grande');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Formatear monto con configuración
     */
    static formatAmount(amount, currency) {
        const formatter = new Intl.NumberFormat(exports.WOMPI_EMAIL_CONFIG.FORMAT.currency.locale, {
            ...exports.WOMPI_EMAIL_CONFIG.FORMAT.currency.options,
            currency
        });
        return formatter.format(amount / 100); // Convertir de centavos
    }
    /**
     * Formatear fecha con configuración
     */
    static formatDate(date) {
        return new Intl.DateTimeFormat(exports.WOMPI_EMAIL_CONFIG.FORMAT.date.locale, exports.WOMPI_EMAIL_CONFIG.FORMAT.date.options).format(date);
    }
    /**
     * Obtener tiempo de reembolso estimado
     */
    static getRefundTimeframe(paymentMethod) {
        if (!paymentMethod) {
            return exports.REFUND_TIMEFRAMES.DEFAULT;
        }
        const method = paymentMethod.toUpperCase();
        if (method === 'CARD') {
            return exports.REFUND_TIMEFRAMES.CARD.debit; // Por defecto débito
        }
        const timeframe = exports.REFUND_TIMEFRAMES[method];
        // Si el timeframe es un objeto (como CARD), retornar el valor por defecto
        if (typeof timeframe === 'object') {
            return exports.REFUND_TIMEFRAMES.DEFAULT;
        }
        return timeframe || exports.REFUND_TIMEFRAMES.DEFAULT;
    }
}
exports.WompiEmailConfigUtils = WompiEmailConfigUtils;
/**
 * Configuración de desarrollo/testing
 */
exports.DEV_CONFIG = {
    // Emails de prueba
    testEmails: [
        'test@ejemplo.com',
        'desarrollo@cuidamehealth.com'
    ],
    // Datos de prueba
    sampleData: {
        customerName: 'Juan Pérez',
        customerEmail: 'juan.perez@ejemplo.com',
        transactionId: 'txn_test_12345',
        reference: 'REF-TEST-001',
        amount: 50000, // $500 COP
        currency: 'COP',
        packageName: 'Consulta Médica General'
    },
    // Configuración de preview
    preview: {
        enabled: true,
        saveToFile: false,
        openInBrowser: false
    }
};
