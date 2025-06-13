/**
 * Configuración de Wompi
 * Manejo de configuración, validaciones y utilidades para Wompi
 */

import {
  WompiConfig,
  WompiEnvironmentConfig,
  WompiCurrency,
  WompiPaymentMethod,
  WompiAmountValidation,
  WompiValidationResult,
  WOMPI_CONSTANTS
} from '../modules/payment/payment.interface';
import logger from '../utils/logger';

/**
 * Obtiene la configuración de Wompi desde variables de entorno
 */
export function getWompiConfig(): WompiConfig {
  const environment = process.env.WOMPI_ENVIRONMENT as 'sandbox' | 'production' || 'sandbox';
  
  const config: WompiConfig = {
    publicKey: getRequiredEnvVar('WOMPI_PUBLIC_KEY'),
    privateKey: getRequiredEnvVar('WOMPI_PRIVATE_KEY'),
    environment,
    baseUrl: environment === 'production' 
      ? WOMPI_CONSTANTS.PRODUCTION_URL 
      : WOMPI_CONSTANTS.SANDBOX_URL,
    webhookSecret: process.env.WOMPI_WEBHOOK_SECRET
  };

  validateWompiConfig(config);
  
  logger.info('Wompi configuration loaded', {
    environment: config.environment,
    baseUrl: config.baseUrl,
    hasWebhookSecret: !!config.webhookSecret
  });

  return config;
}

/**
 * Obtiene la configuración completa de entorno para Wompi
 */
export function getWompiEnvironmentConfig(): WompiEnvironmentConfig {
  return {
    publicKey: getRequiredEnvVar('WOMPI_PUBLIC_KEY'),
    privateKey: getRequiredEnvVar('WOMPI_PRIVATE_KEY'),
    webhookSecret: getRequiredEnvVar('WOMPI_WEBHOOK_SECRET'),
    environment: process.env.WOMPI_ENVIRONMENT as 'sandbox' | 'production' || 'sandbox',
    baseUrl: process.env.WOMPI_ENVIRONMENT === 'production' 
      ? WOMPI_CONSTANTS.PRODUCTION_URL 
      : WOMPI_CONSTANTS.SANDBOX_URL,
    acceptanceToken: getRequiredEnvVar('WOMPI_ACCEPTANCE_TOKEN')
  };
}

/**
 * Valida la configuración de Wompi
 */
function validateWompiConfig(config: WompiConfig): void {
  const errors: string[] = [];

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
      logger.warn('WOMPI_WEBHOOK_SECRET no configurado para producción');
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
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable de entorno requerida no encontrada: ${name}`);
  }
  return value;
}

/**
 * Valida un monto para Wompi
 */
export function validateWompiAmount(amountInCents: number, currency: WompiCurrency): WompiAmountValidation {
  const minAmount = currency === WompiCurrency.COP 
    ? WOMPI_CONSTANTS.MIN_AMOUNT_COP 
    : WOMPI_CONSTANTS.MIN_AMOUNT_USD;
    
  const maxAmount = currency === WompiCurrency.COP 
    ? WOMPI_CONSTANTS.MAX_AMOUNT_COP 
    : WOMPI_CONSTANTS.MAX_AMOUNT_USD;

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
export function convertToWompiCurrency(amount: number, fromCurrency: string, toCurrency: WompiCurrency): number {
  // Implementación básica - en producción se debería usar un servicio de conversión real
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Tasas de ejemplo (en producción usar API de tasas de cambio)
  const exchangeRates: Record<string, Record<string, number>> = {
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
export function validateWompiPaymentMethod(paymentMethod: string): WompiValidationResult {
  const validMethods = Object.values(WompiPaymentMethod);
  
  if (!validMethods.includes(paymentMethod as WompiPaymentMethod)) {
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
export function validateWompiCurrency(currency: string): WompiValidationResult {
  if (!WOMPI_CONSTANTS.SUPPORTED_CURRENCIES.includes(currency as WompiCurrency)) {
    return {
      isValid: false,
      errors: [`Moneda no soportada. Monedas soportadas: ${WOMPI_CONSTANTS.SUPPORTED_CURRENCIES.join(', ')}`]
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
export function generateTransactionReference(prefix: string = 'TXN'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Formatea un monto para mostrar
 */
export function formatWompiAmount(amountInCents: number, currency: WompiCurrency): string {
  const amount = amountInCents / 100;
  
  const formatters: Record<WompiCurrency, Intl.NumberFormat> = {
    [WompiCurrency.COP]: new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }),
    [WompiCurrency.USD]: new Intl.NumberFormat('en-US', {
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
export function getPaymentMethodLimits(paymentMethod: WompiPaymentMethod, currency: WompiCurrency): {
  minAmount: number;
  maxAmount: number;
  dailyLimit?: number;
} {
  const baseLimits = {
    minAmount: currency === WompiCurrency.COP 
      ? WOMPI_CONSTANTS.MIN_AMOUNT_COP 
      : WOMPI_CONSTANTS.MIN_AMOUNT_USD,
    maxAmount: currency === WompiCurrency.COP 
      ? WOMPI_CONSTANTS.MAX_AMOUNT_COP 
      : WOMPI_CONSTANTS.MAX_AMOUNT_USD
  };

  // Límites específicos por método de pago
  const methodLimits: Record<WompiPaymentMethod, Partial<typeof baseLimits & { dailyLimit: number }>> = {
    [WompiPaymentMethod.CARD]: {
      dailyLimit: currency === WompiCurrency.COP ? 10000000 : 3000 // $100,000 COP o $30 USD
    },
    [WompiPaymentMethod.NEQUI]: {
      maxAmount: currency === WompiCurrency.COP ? 200000000 : 15000, // $20,000 COP o $6 USD
      dailyLimit: currency === WompiCurrency.COP ? 5000000 : 1500 // $50,000 COP o $15 USD
    },
    [WompiPaymentMethod.PSE]: {
      minAmount: currency === WompiCurrency.COP ? 100 : 1, // $10 COP o $0.01 USD
      dailyLimit: currency === WompiCurrency.COP ? 20000000 : 6000 // $200,000 COP o $60 USD
    },
    [WompiPaymentMethod.BANCOLOMBIA_TRANSFER]: {
      minAmount: currency === WompiCurrency.COP ? 100 : 1,
      dailyLimit: currency === WompiCurrency.COP ? 15000000 : 4500
    },
    [WompiPaymentMethod.BANCOLOMBIA_COLLECT]: {
      minAmount: currency === WompiCurrency.COP ? 100 : 1,
      dailyLimit: currency === WompiCurrency.COP ? 10000000 : 3000
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
export function isPaymentMethodAvailable(paymentMethod: WompiPaymentMethod, currency: WompiCurrency): boolean {
  // PSE y métodos de Bancolombia solo están disponibles para COP
  const copOnlyMethods = [
    WompiPaymentMethod.PSE,
    WompiPaymentMethod.NEQUI,
    WompiPaymentMethod.BANCOLOMBIA_TRANSFER,
    WompiPaymentMethod.BANCOLOMBIA_COLLECT
  ];

  if (copOnlyMethods.includes(paymentMethod) && currency !== WompiCurrency.COP) {
    return false;
  }

  return true;
}

/**
 * Obtiene los métodos de pago disponibles para una moneda
 */
export function getAvailablePaymentMethods(currency: WompiCurrency): WompiPaymentMethod[] {
  const allMethods = Object.values(WompiPaymentMethod);
  
  return allMethods.filter(method => isPaymentMethodAvailable(method, currency));
}

/**
 * Configuración por defecto para diferentes entornos
 */
export const WOMPI_DEFAULT_CONFIG = {
  sandbox: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    webhookTolerance: 300, // 5 minutos
    defaultCurrency: WompiCurrency.COP,
    enableLogging: true
  },
  production: {
    timeout: 45000,
    retryAttempts: 5,
    retryDelay: 2000,
    webhookTolerance: 180, // 3 minutos
    defaultCurrency: WompiCurrency.COP,
    enableLogging: false
  }
} as const;

/**
 * Obtiene la configuración por defecto según el entorno
 */
export function getDefaultConfig(environment: 'sandbox' | 'production' = 'sandbox') {
  return WOMPI_DEFAULT_CONFIG[environment];
}