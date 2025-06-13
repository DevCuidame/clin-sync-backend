/**
 * Configuración para el sistema de correos de Wompi
 * Centraliza todas las configuraciones relacionadas con emails
 */

import { WompiTransactionStatus } from '../payment.interface';

/**
 * Configuración por defecto para correos de Wompi
 */
export const WOMPI_EMAIL_CONFIG = {
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
        style: 'currency' as const,
        minimumFractionDigits: 0
      }
    },
    date: {
      locale: 'es-CO',
      options: {
        year: 'numeric' as const,
        month: 'long' as const,
        day: 'numeric' as const,
        hour: '2-digit' as const,
        minute: '2-digit' as const
      }
    }
  }
};

/**
 * Mapeo de estados de transacción a texto descriptivo
 */
export const TRANSACTION_STATUS_TEXT: Record<WompiTransactionStatus, string> = {
  [WompiTransactionStatus.APPROVED]: 'Aprobado',
  [WompiTransactionStatus.DECLINED]: 'Rechazado',
  [WompiTransactionStatus.PENDING]: 'Pendiente',
  [WompiTransactionStatus.VOIDED]: 'Anulado',
  [WompiTransactionStatus.ERROR]: 'Error'
};

/**
 * Mapeo de estados a plantillas de correo
 */
export const STATUS_TO_TEMPLATE: Record<WompiTransactionStatus, string> = {
  [WompiTransactionStatus.APPROVED]: WOMPI_EMAIL_CONFIG.TEMPLATES.confirmation,
  [WompiTransactionStatus.DECLINED]: WOMPI_EMAIL_CONFIG.TEMPLATES.failure,
  [WompiTransactionStatus.ERROR]: WOMPI_EMAIL_CONFIG.TEMPLATES.failure,
  [WompiTransactionStatus.PENDING]: WOMPI_EMAIL_CONFIG.TEMPLATES.pending,
  [WompiTransactionStatus.VOIDED]: WOMPI_EMAIL_CONFIG.TEMPLATES.refund
};

/**
 * Mapeo de estados a asuntos de correo
 */
export const STATUS_TO_SUBJECT: Record<WompiTransactionStatus, (reference: string) => string> = {
  [WompiTransactionStatus.APPROVED]: (ref) => `Confirmación de pago - Transacción ${ref}`,
  [WompiTransactionStatus.DECLINED]: (ref) => `Pago no procesado - Transacción ${ref}`,
  [WompiTransactionStatus.ERROR]: (ref) => `Pago no procesado - Transacción ${ref}`,
  [WompiTransactionStatus.PENDING]: (ref) => `Pago en proceso - Transacción ${ref}`,
  [WompiTransactionStatus.VOIDED]: (ref) => `Reembolso procesado - Transacción ${ref}`
};

/**
 * Configuración de colores para diferentes estados
 */
export const STATUS_COLORS = {
  [WompiTransactionStatus.APPROVED]: {
    primary: '#28a745',
    secondary: '#20c997',
    background: '#e8f5e8',
    border: '#c3e6c3',
    text: '#155724'
  },
  [WompiTransactionStatus.DECLINED]: {
    primary: '#dc3545',
    secondary: '#c82333',
    background: '#f8d7da',
    border: '#f5c6cb',
    text: '#721c24'
  },
  [WompiTransactionStatus.ERROR]: {
    primary: '#dc3545',
    secondary: '#c82333',
    background: '#f8d7da',
    border: '#f5c6cb',
    text: '#721c24'
  },
  [WompiTransactionStatus.PENDING]: {
    primary: '#ffc107',
    secondary: '#e0a800',
    background: '#fff3cd',
    border: '#ffeaa7',
    text: '#856404'
  },
  [WompiTransactionStatus.VOIDED]: {
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
export const REFUND_TIMEFRAMES = {
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
export const VALIDATION_CONFIG = {
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
export const LOGGING_CONFIG = {
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
export class WompiEmailConfigUtils {
  /**
   * Obtener configuración de empresa con valores por defecto
   */
  static getCompanyConfig(overrides?: Partial<typeof WOMPI_EMAIL_CONFIG.DEFAULT_COMPANY>) {
    return {
      ...WOMPI_EMAIL_CONFIG.DEFAULT_COMPANY,
      ...overrides
    };
  }
  
  /**
   * Obtener texto de estado
   */
  static getStatusText(status: WompiTransactionStatus): string {
    return TRANSACTION_STATUS_TEXT[status] || 'Desconocido';
  }
  
  /**
   * Obtener plantilla para estado
   */
  static getTemplateForStatus(status: WompiTransactionStatus): string {
    return STATUS_TO_TEMPLATE[status] || WOMPI_EMAIL_CONFIG.TEMPLATES.failure;
  }
  
  /**
   * Obtener asunto para estado
   */
  static getSubjectForStatus(status: WompiTransactionStatus, reference: string): string {
    const subjectFn = STATUS_TO_SUBJECT[status];
    return subjectFn ? subjectFn(reference) : `Notificación de pago - ${reference}`;
  }
  
  /**
   * Validar datos de correo
   */
  static validateEmailData(data: {
    customerEmail: string;
    customerName: string;
    reference: string;
    amount: number;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar email
    if (!VALIDATION_CONFIG.email.pattern.test(data.customerEmail)) {
      errors.push('Email inválido');
    }
    
    if (data.customerEmail.length > VALIDATION_CONFIG.email.maxLength) {
      errors.push('Email demasiado largo');
    }
    
    // Validar nombre
    if (data.customerName.length < VALIDATION_CONFIG.customerName.minLength) {
      errors.push('Nombre demasiado corto');
    }
    
    if (data.customerName.length > VALIDATION_CONFIG.customerName.maxLength) {
      errors.push('Nombre demasiado largo');
    }
    
    // Validar referencia
    if (data.reference.length < VALIDATION_CONFIG.reference.minLength) {
      errors.push('Referencia demasiado corta');
    }
    
    if (data.reference.length > VALIDATION_CONFIG.reference.maxLength) {
      errors.push('Referencia demasiado larga');
    }
    
    // Validar monto
    if (data.amount < VALIDATION_CONFIG.amount.min) {
      errors.push('Monto demasiado pequeño');
    }
    
    if (data.amount > VALIDATION_CONFIG.amount.max) {
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
  static formatAmount(amount: number, currency: string): string {
    const formatter = new Intl.NumberFormat(
      WOMPI_EMAIL_CONFIG.FORMAT.currency.locale,
      {
        ...WOMPI_EMAIL_CONFIG.FORMAT.currency.options,
        currency
      }
    );
    return formatter.format(amount / 100); // Convertir de centavos
  }
  
  /**
   * Formatear fecha con configuración
   */
  static formatDate(date: Date): string {
    return new Intl.DateTimeFormat(
      WOMPI_EMAIL_CONFIG.FORMAT.date.locale,
      WOMPI_EMAIL_CONFIG.FORMAT.date.options
    ).format(date);
  }
  
  /**
   * Obtener tiempo de reembolso estimado
   */
  static getRefundTimeframe(paymentMethod?: string): string {
    if (!paymentMethod) {
      return REFUND_TIMEFRAMES.DEFAULT;
    }
    
    const method = paymentMethod.toUpperCase();
    
    if (method === 'CARD') {
      return REFUND_TIMEFRAMES.CARD.debit; // Por defecto débito
    }
    
    const timeframe = REFUND_TIMEFRAMES[method as keyof typeof REFUND_TIMEFRAMES];
    
    // Si el timeframe es un objeto (como CARD), retornar el valor por defecto
    if (typeof timeframe === 'object') {
      return REFUND_TIMEFRAMES.DEFAULT;
    }
    
    return timeframe || REFUND_TIMEFRAMES.DEFAULT;
  }
}

/**
 * Configuración de desarrollo/testing
 */
export const DEV_CONFIG = {
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