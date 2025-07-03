export interface DatabaseCleanupConfig {
  // Configuración del scheduler
  scheduler: {
    enabled: boolean;
    cronExpression: string;
    timezone: string;
  };
  
  // Configuración por defecto de limpieza
  defaultOptions: {
    daysBack: number;
    batchSize: number;
    maxRetries: number;
  };
  
  // Configuración de seguridad
  safety: {
    maxDeletionPerBatch: number;
    requireConfirmationForLargeDeletions: boolean;
    largeDeletionThreshold: number;
  };
  
  // Configuración de logging
  logging: {
    logLevel: 'info' | 'warn' | 'error';
    logToFile: boolean;
    retainLogDays: number;
  };
}

export const defaultCleanupConfig: DatabaseCleanupConfig = {
  scheduler: {
    enabled: process.env.CLEANUP_SCHEDULER_ENABLED === 'true' || true,
    cronExpression: process.env.CLEANUP_CRON_EXPRESSION || '0 2 * * *', // 2:00 AM todos los días
    timezone: process.env.CLEANUP_TIMEZONE || 'America/Bogota'
  },
  
  defaultOptions: {
    daysBack: parseInt(process.env.CLEANUP_DAYS_BACK || '0'),
    batchSize: parseInt(process.env.CLEANUP_BATCH_SIZE || '200'),
    maxRetries: parseInt(process.env.CLEANUP_MAX_RETRIES || '3')
  },
  
  safety: {
    maxDeletionPerBatch: parseInt(process.env.CLEANUP_MAX_DELETION_PER_BATCH || '1000'),
    requireConfirmationForLargeDeletions: process.env.CLEANUP_REQUIRE_CONFIRMATION === 'true' || true,
    largeDeletionThreshold: parseInt(process.env.CLEANUP_LARGE_DELETION_THRESHOLD || '500')
  },
  
  logging: {
    logLevel: (process.env.CLEANUP_LOG_LEVEL as 'info' | 'warn' | 'error') || 'info',
    logToFile: process.env.CLEANUP_LOG_TO_FILE === 'true' || true,
    retainLogDays: parseInt(process.env.CLEANUP_RETAIN_LOG_DAYS || '30')
  }
};

/**
 * Valida la configuración de limpieza
 */
export function validateCleanupConfig(config: DatabaseCleanupConfig): string[] {
  const errors: string[] = [];
  
  // Validar expresión cron
  if (!config.scheduler.cronExpression || config.scheduler.cronExpression.trim() === '') {
    errors.push('La expresión cron no puede estar vacía');
  }
  
  // Validar batch size
  if (config.defaultOptions.batchSize < 1 || config.defaultOptions.batchSize > 10000) {
    errors.push('El tamaño del lote debe estar entre 1 y 10000');
  }
  
  // Validar days back
  if (config.defaultOptions.daysBack < 0) {
    errors.push('Los días hacia atrás no pueden ser negativos');
  }
  
  // Validar configuración de seguridad
  if (config.safety.maxDeletionPerBatch < 1) {
    errors.push('La eliminación máxima por lote debe ser mayor a 0');
  }
  
  if (config.safety.largeDeletionThreshold < 1) {
    errors.push('El umbral de eliminación grande debe ser mayor a 0');
  }
  
  // Validar retención de logs
  if (config.logging.retainLogDays < 1) {
    errors.push('Los días de retención de logs deben ser mayor a 0');
  }
  
  return errors;
}

/**
 * Obtiene la configuración de limpieza con valores por defecto
 */
export function getCleanupConfig(): DatabaseCleanupConfig {
  const config = { ...defaultCleanupConfig };
  
  // Validar configuración
  const errors = validateCleanupConfig(config);
  if (errors.length > 0) {
    throw new Error(`Configuración de limpieza inválida: ${errors.join(', ')}`);
  }
  
  return config;
}