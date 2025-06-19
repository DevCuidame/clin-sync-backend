"use strict";
/**
 * Configuración de Wompi
 * Manejo de configuración, validaciones y utilidades para Wompi
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WOMPI_DEFAULT_CONFIG = void 0;
exports.getWompiConfig = getWompiConfig;
exports.getWompiEnvironmentConfig = getWompiEnvironmentConfig;
exports.validateWompiAmount = validateWompiAmount;
exports.convertToWompiCurrency = convertToWompiCurrency;
exports.validateWompiPaymentMethod = validateWompiPaymentMethod;
exports.validateWompiCurrency = validateWompiCurrency;
exports.generateTransactionReference = generateTransactionReference;
exports.formatWompiAmount = formatWompiAmount;
exports.getPaymentMethodLimits = getPaymentMethodLimits;
exports.isPaymentMethodAvailable = isPaymentMethodAvailable;
exports.getAvailablePaymentMethods = getAvailablePaymentMethods;
exports.getDefaultConfig = getDefaultConfig;
const payment_interface_1 = require("../modules/payment/payment.interface");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Obtiene la configuración de Wompi desde variables de entorno
 */
function getWompiConfig() {
    const environment = process.env.WOMPI_ENVIRONMENT || 'sandbox';
    const config = {
        publicKey: getRequiredEnvVar('WOMPI_PUBLIC_KEY'),
        privateKey: getRequiredEnvVar('WOMPI_PRIVATE_KEY'),
        environment,
        baseUrl: environment === 'production'
            ? payment_interface_1.WOMPI_CONSTANTS.PRODUCTION_URL
            : payment_interface_1.WOMPI_CONSTANTS.SANDBOX_URL,
        webhookSecret: process.env.WOMPI_WEBHOOK_SECRET
    };
    validateWompiConfig(config);
    logger_1.default.info('Wompi configuration loaded', {
        environment: config.environment,
        baseUrl: config.baseUrl,
        hasWebhookSecret: !!config.webhookSecret
    });
    return config;
}
/**
 * Obtiene la configuración completa de entorno para Wompi
 */
function getWompiEnvironmentConfig() {
    return {
        publicKey: getRequiredEnvVar('WOMPI_PUBLIC_KEY'),
        privateKey: getRequiredEnvVar('WOMPI_PRIVATE_KEY'),
        webhookSecret: getRequiredEnvVar('WOMPI_WEBHOOK_SECRET'),
        environment: process.env.WOMPI_ENVIRONMENT || 'sandbox',
        baseUrl: process.env.WOMPI_ENVIRONMENT === 'production'
            ? payment_interface_1.WOMPI_CONSTANTS.PRODUCTION_URL
            : payment_interface_1.WOMPI_CONSTANTS.SANDBOX_URL,
        acceptanceToken: getRequiredEnvVar('WOMPI_ACCEPTANCE_TOKEN')
    };
}
/**
 * Valida la configuración de Wompi
 */
function validateWompiConfig(config) {
    const errors = [];
    if (!config.publicKey) {
        errors.push('WOMPI_PUBLIC_KEY es requerida');
    }
    if (!config.privateKey) {
        errors.push('WOMPI_PRIVATE_KEY es requerida');
    }
    if (!['sandbox', 'production'].includes(config.environment)) {
        errors.push('WOMPI_ENVIRONMENT debe ser "sandbox" o "production"');
    }
    if (!config.baseUrl) {
        errors.push('Base URL de Wompi no configurada');
    }
    // Validar formato de las claves
    if (config.publicKey && !config.publicKey.startsWith('pub_')) {
        errors.push('WOMPI_PUBLIC_KEY debe comenzar con "pub_"');
    }
    if (config.privateKey && !config.privateKey.startsWith('prv_')) {
        errors.push('WOMPI_PRIVATE_KEY debe comenzar con "prv_"');
    }
    // Advertencias para producción
    if (config.environment === 'production') {
        if (!config.webhookSecret) {
            logger_1.default.warn('WOMPI_WEBHOOK_SECRET no configurado para producción');
        }
        if (config.publicKey && config.publicKey.includes('sandbox')) {
            errors.push('No se pueden usar claves de prueba en producción');
        }
    }
    if (errors.length > 0) {
        throw new Error(`Errores en configuración de Wompi: ${errors.join(', ')}`);
    }
}
/**
 * Obtiene una variable de entorno requerida
 */
function getRequiredEnvVar(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Variable de entorno requerida no encontrada: ${name}`);
    }
    return value;
}
/**
 * Valida un monto para Wompi
 */
function validateWompiAmount(amountInCents, currency) {
    const minAmount = currency === payment_interface_1.WompiCurrency.COP
        ? payment_interface_1.WOMPI_CONSTANTS.MIN_AMOUNT_COP
        : payment_interface_1.WOMPI_CONSTANTS.MIN_AMOUNT_USD;
    const maxAmount = currency === payment_interface_1.WompiCurrency.COP
        ? payment_interface_1.WOMPI_CONSTANTS.MAX_AMOUNT_COP
        : payment_interface_1.WOMPI_CONSTANTS.MAX_AMOUNT_USD;
    if (amountInCents < minAmount) {
        return {
            isValid: false,
            minAmount,
            maxAmount,
            error: `El monto mínimo para ${currency} es ${minAmount} centavos`
        };
    }
    if (amountInCents > maxAmount) {
        return {
            isValid: false,
            minAmount,
            maxAmount,
            error: `El monto máximo para ${currency} es ${maxAmount} centavos`
        };
    }
    return {
        isValid: true,
        minAmount,
        maxAmount
    };
}
/**
 * Convierte un monto a la moneda de Wompi
 */
function convertToWompiCurrency(amount, fromCurrency, toCurrency) {
    // Implementación básica - en producción se debería usar un servicio de conversión real
    if (fromCurrency === toCurrency) {
        return amount;
    }
    // Tasas de ejemplo (en producción usar API de tasas de cambio)
    const exchangeRates = {
        'USD': {
            'COP': 4000 // 1 USD = 4000 COP (aproximado)
        },
        'COP': {
            'USD': 0.00025 // 1 COP = 0.00025 USD (aproximado)
        }
    };
    const rate = exchangeRates[fromCurrency]?.[toCurrency];
    if (!rate) {
        throw new Error(`Conversión no soportada: ${fromCurrency} a ${toCurrency}`);
    }
    return Math.round(amount * rate);
}
/**
 * Valida un método de pago para Wompi
 */
function validateWompiPaymentMethod(paymentMethod) {
    const validMethods = Object.values(payment_interface_1.WompiPaymentMethod);
    if (!validMethods.includes(paymentMethod)) {
        return {
            isValid: false,
            errors: [`Método de pago no válido. Métodos soportados: ${validMethods.join(', ')}`]
        };
    }
    return {
        isValid: true,
        errors: []
    };
}
/**
 * Valida una moneda para Wompi
 */
function validateWompiCurrency(currency) {
    if (!payment_interface_1.WOMPI_CONSTANTS.SUPPORTED_CURRENCIES.includes(currency)) {
        return {
            isValid: false,
            errors: [`Moneda no soportada. Monedas soportadas: ${payment_interface_1.WOMPI_CONSTANTS.SUPPORTED_CURRENCIES.join(', ')}`]
        };
    }
    return {
        isValid: true,
        errors: []
    };
}
/**
 * Genera una referencia única para transacciones
 */
function generateTransactionReference(prefix = 'TXN') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
}
/**
 * Formatea un monto para mostrar
 */
function formatWompiAmount(amountInCents, currency) {
    const amount = amountInCents / 100;
    const formatters = {
        [payment_interface_1.WompiCurrency.COP]: new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }),
        [payment_interface_1.WompiCurrency.USD]: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })
    };
    return formatters[currency].format(amount);
}
/**
 * Obtiene la configuración de límites por método de pago
 */
function getPaymentMethodLimits(paymentMethod, currency) {
    const baseLimits = {
        minAmount: currency === payment_interface_1.WompiCurrency.COP
            ? payment_interface_1.WOMPI_CONSTANTS.MIN_AMOUNT_COP
            : payment_interface_1.WOMPI_CONSTANTS.MIN_AMOUNT_USD,
        maxAmount: currency === payment_interface_1.WompiCurrency.COP
            ? payment_interface_1.WOMPI_CONSTANTS.MAX_AMOUNT_COP
            : payment_interface_1.WOMPI_CONSTANTS.MAX_AMOUNT_USD
    };
    // Límites específicos por método de pago
    const methodLimits = {
        [payment_interface_1.WompiPaymentMethod.CARD]: {
            dailyLimit: currency === payment_interface_1.WompiCurrency.COP ? 10000000 : 3000 // $100,000 COP o $30 USD
        },
        [payment_interface_1.WompiPaymentMethod.NEQUI]: {
            maxAmount: currency === payment_interface_1.WompiCurrency.COP ? 200000000 : 15000, // $20,000 COP o $6 USD
            dailyLimit: currency === payment_interface_1.WompiCurrency.COP ? 5000000 : 1500 // $50,000 COP o $15 USD
        },
        [payment_interface_1.WompiPaymentMethod.PSE]: {
            minAmount: currency === payment_interface_1.WompiCurrency.COP ? 100 : 1, // $10 COP o $0.01 USD
            dailyLimit: currency === payment_interface_1.WompiCurrency.COP ? 20000000 : 6000 // $200,000 COP o $60 USD
        },
        [payment_interface_1.WompiPaymentMethod.BANCOLOMBIA_TRANSFER]: {
            minAmount: currency === payment_interface_1.WompiCurrency.COP ? 100 : 1,
            dailyLimit: currency === payment_interface_1.WompiCurrency.COP ? 15000000 : 4500
        },
        [payment_interface_1.WompiPaymentMethod.BANCOLOMBIA_COLLECT]: {
            minAmount: currency === payment_interface_1.WompiCurrency.COP ? 100 : 1,
            dailyLimit: currency === payment_interface_1.WompiCurrency.COP ? 10000000 : 3000
        }
    };
    return {
        ...baseLimits,
        ...methodLimits[paymentMethod]
    };
}
/**
 * Valida si un método de pago está disponible para una moneda
 */
function isPaymentMethodAvailable(paymentMethod, currency) {
    // PSE y métodos de Bancolombia solo están disponibles para COP
    const copOnlyMethods = [
        payment_interface_1.WompiPaymentMethod.PSE,
        payment_interface_1.WompiPaymentMethod.NEQUI,
        payment_interface_1.WompiPaymentMethod.BANCOLOMBIA_TRANSFER,
        payment_interface_1.WompiPaymentMethod.BANCOLOMBIA_COLLECT
    ];
    if (copOnlyMethods.includes(paymentMethod) && currency !== payment_interface_1.WompiCurrency.COP) {
        return false;
    }
    return true;
}
/**
 * Obtiene los métodos de pago disponibles para una moneda
 */
function getAvailablePaymentMethods(currency) {
    const allMethods = Object.values(payment_interface_1.WompiPaymentMethod);
    return allMethods.filter(method => isPaymentMethodAvailable(method, currency));
}
/**
 * Configuración por defecto para diferentes entornos
 */
exports.WOMPI_DEFAULT_CONFIG = {
    sandbox: {
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        webhookTolerance: 300, // 5 minutos
        defaultCurrency: payment_interface_1.WompiCurrency.COP,
        enableLogging: true
    },
    production: {
        timeout: 45000,
        retryAttempts: 5,
        retryDelay: 2000,
        webhookTolerance: 180, // 3 minutos
        defaultCurrency: payment_interface_1.WompiCurrency.COP,
        enableLogging: false
    }
};
/**
 * Obtiene la configuración por defecto según el entorno
 */
function getDefaultConfig(environment = 'sandbox') {
    return exports.WOMPI_DEFAULT_CONFIG[environment];
}
