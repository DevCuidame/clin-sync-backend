// Exportar servicios
export { DatabaseCleanupService } from './database-cleanup.service';
export type { CleanupResult, CleanupOptions } from './database-cleanup.service';

// Exportar controlador
export { DatabaseCleanupController } from './database-cleanup.controller';

// Exportar scheduler
export { DatabaseCleanupScheduler } from './database-cleanup.scheduler';

// Exportar configuración
export { 
  defaultCleanupConfig, 
  getCleanupConfig, 
  validateCleanupConfig 
} from './database-cleanup.config';
export type { DatabaseCleanupConfig } from './database-cleanup.config';

// Exportar rutas
export { default as databaseCleanupRoutes } from './database-cleanup.routes';

// Instancia singleton del scheduler para uso global
import { DatabaseCleanupScheduler } from './database-cleanup.scheduler';
import { getCleanupConfig } from './database-cleanup.config';
import logger  from '../../utils/logger';

let schedulerInstance: DatabaseCleanupScheduler | null = null;

/**
 * Obtiene la instancia singleton del scheduler
 */
export function getCleanupScheduler(): DatabaseCleanupScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new DatabaseCleanupScheduler();
  }
  return schedulerInstance;
}

/**
 * Inicializa el módulo de limpieza de base de datos
 * Debe ser llamado al iniciar la aplicación
 */
export function initializeDatabaseCleanup(): void {
  try {
    const config = getCleanupConfig();
    
    if (config.scheduler.enabled) {
      const scheduler = getCleanupScheduler();
      scheduler.start(config.scheduler.cronExpression);
      
      logger.info('Módulo de limpieza de base de datos inicializado exitosamente', {
        schedulerEnabled: config.scheduler.enabled,
        cronExpression: config.scheduler.cronExpression,
        timezone: config.scheduler.timezone
      });
    } else {
      logger.info('Scheduler de limpieza de base de datos deshabilitado por configuración');
    }
  } catch (error) {
    logger.error('Error inicializando el módulo de limpieza de base de datos:', error);
    throw error;
  }
}

/**
 * Detiene el módulo de limpieza de base de datos
 * Debe ser llamado al cerrar la aplicación
 */
export function shutdownDatabaseCleanup(): void {
  if (schedulerInstance) {
    schedulerInstance.stop();
    schedulerInstance = null;
    logger.info('Módulo de limpieza de base de datos detenido');
  }
}