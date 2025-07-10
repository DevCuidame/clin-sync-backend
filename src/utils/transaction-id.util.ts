import { randomBytes } from 'crypto';

/**
 * Opciones para la generación de transaction_id
 */
export interface TransactionIdOptions {
  /** Prefijo para el transaction_id (por defecto: 'CS') */
  prefix?: string;
  /** Incluir fecha en formato YYYYMMDD (por defecto: true) */
  includeDate?: boolean;
  /** Incluir timestamp en milisegundos (por defecto: false) */
  includeTimestamp?: boolean;
  /** Longitud del componente aleatorio (por defecto: 8) */
  randomLength?: number;
  /** Separador entre componentes (por defecto: '-') */
  separator?: string;
}

/**
 * Genera un transaction_id único con estructura específica
 * 
 * Estructura por defecto: CS-YYYYMMDD-XXXXXXXX
 * Donde:
 * - CS: Prefijo de ClinSync
 * - YYYYMMDD: Fecha actual
 * - XXXXXXXX: Componente aleatorio alfanumérico
 * 
 * @param options Opciones de configuración
 * @returns Transaction ID único
 * 
 * @example
 * ```typescript
 * // Estructura por defecto: CS-20241201-A1B2C3D4
 * const transactionId = generateTransactionId();
 * 
 * // Con prefijo personalizado: PURCHASE-20241201-A1B2C3D4
 * const customId = generateTransactionId({ prefix: 'PURCHASE' });
 * 
 * // Solo con timestamp: CS-1701432000000-A1B2C3D4
 * const timestampId = generateTransactionId({ 
 *   includeDate: false, 
 *   includeTimestamp: true 
 * });
 * 
 * // Estructura personalizada: PAY_20241201_A1B2C3D4E5F6
 * const customStructure = generateTransactionId({
 *   prefix: 'PAY',
 *   separator: '_',
 *   randomLength: 12
 * });
 * ```
 */
export function generateTransactionId(options: TransactionIdOptions = {}): string {
  const {
    prefix = 'CS',
    includeDate = true,
    includeTimestamp = false,
    randomLength = 8,
    separator = '-'
  } = options;

  const components: string[] = [];

  // Agregar prefijo
  if (prefix) {
    components.push(prefix);
  }

  // Agregar fecha o timestamp
  if (includeDate) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    components.push(`${year}${month}${day}`);
  } else if (includeTimestamp) {
    components.push(Date.now().toString());
  }

  // Agregar componente aleatorio
  const randomComponent = generateSecureRandomString(randomLength);
  components.push(randomComponent);

  return components.join(separator);
}

/**
 * Genera un string aleatorio seguro usando caracteres alfanuméricos
 * 
 * @param length Longitud del string aleatorio
 * @returns String aleatorio alfanumérico en mayúsculas
 */
function generateSecureRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(length);
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  
  return result;
}

/**
 * Genera un transaction_id específico para compras de paquetes
 * 
 * @param packageId ID del paquete (opcional)
 * @returns Transaction ID con formato: CS-PKG-YYYYMMDD-XXXXXXXX
 */
export function generatePackagePurchaseTransactionId(packageId?: number): string {
  const baseId = generateTransactionId({ prefix: 'CS-PKG' });
  return packageId ? `${baseId}-P${packageId}` : baseId;
}

/**
 * Genera un transaction_id específico para compras de servicios
 * 
 * @param serviceId ID del servicio (opcional)
 * @returns Transaction ID con formato: CS-SRV-YYYYMMDD-XXXXXXXX
 */
export function generateServicePurchaseTransactionId(serviceId?: number): string {
  const baseId = generateTransactionId({ prefix: 'CS-SRV' });
  return serviceId ? `${baseId}-S${serviceId}` : baseId;
}

/**
 * Genera un transaction_id para pagos en efectivo
 * 
 * @returns Transaction ID con formato: CS-CASH-YYYYMMDD-XXXXXXXX
 */
export function generateCashPaymentTransactionId(): string {
  return generateTransactionId({ prefix: 'CS-CASH' });
}

/**
 * Genera un transaction_id para reembolsos
 * 
 * @param originalTransactionId ID de la transacción original (opcional)
 * @returns Transaction ID con formato: CS-REFUND-YYYYMMDD-XXXXXXXX
 */
export function generateRefundTransactionId(originalTransactionId?: string): string {
  const baseId = generateTransactionId({ prefix: 'CS-REFUND' });
  return originalTransactionId ? `${baseId}-REF-${originalTransactionId.slice(-8)}` : baseId;
}

/**
 * Valida el formato de un transaction_id generado por estas utilidades
 * 
 * @param transactionId Transaction ID a validar
 * @returns true si el formato es válido
 */
export function validateTransactionIdFormat(transactionId: string): boolean {
  // Patrón básico: PREFIJO-FECHA/TIMESTAMP-ALEATORIO
  const pattern = /^[A-Z]+([-_][A-Z]+)*[-_]\d{8,13}[-_][A-Z0-9]{6,}([-_][A-Z0-9]+)*$/;
  return pattern.test(transactionId);
}

/**
 * Extrae información de un transaction_id
 * 
 * @param transactionId Transaction ID a analizar
 * @returns Información extraída del transaction_id
 */
export function parseTransactionId(transactionId: string): {
  prefix: string;
  dateComponent: string;
  randomComponent: string;
  isValid: boolean;
} {
  const parts = transactionId.split(/[-_]/);
  
  if (parts.length < 3) {
    return {
      prefix: '',
      dateComponent: '',
      randomComponent: '',
      isValid: false
    };
  }

  return {
    prefix: parts[0],
    dateComponent: parts[1],
    randomComponent: parts[2],
    isValid: validateTransactionIdFormat(transactionId)
  };
}

/**
 * Configuración por defecto para diferentes tipos de transacciones
 */
export const TRANSACTION_ID_CONFIGS = {
  PACKAGE_PURCHASE: {
    prefix: 'CS-PKG',
    includeDate: true,
    randomLength: 8,
    separator: '-'
  },
  SERVICE_PURCHASE: {
    prefix: 'CS-SRV',
    includeDate: true,
    randomLength: 8,
    separator: '-'
  },
  CASH_PAYMENT: {
    prefix: 'CS-CASH',
    includeDate: true,
    randomLength: 10,
    separator: '-'
  },
  REFUND: {
    prefix: 'CS-REFUND',
    includeDate: true,
    randomLength: 6,
    separator: '-'
  },
  ADMIN_PURCHASE: {
    prefix: 'CS-ADMIN',
    includeDate: true,
    randomLength: 8,
    separator: '-'
  }
} as const;

/**
 * Genera un transaction_id usando una configuración predefinida
 * 
 * @param configKey Clave de configuración predefinida
 * @returns Transaction ID generado
 */
export function generateTransactionIdByType(
  configKey: keyof typeof TRANSACTION_ID_CONFIGS
): string {
  const config = TRANSACTION_ID_CONFIGS[configKey];
  return generateTransactionId(config);
}