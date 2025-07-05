import * as cron from 'node-cron';
import { DatabaseCleanupService } from './database-cleanup.service';
import logger  from '../../utils/logger';

export class DatabaseCleanupScheduler {
  private cleanupService: DatabaseCleanupService;
  private isRunning: boolean = false;
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    this.cleanupService = new DatabaseCleanupService();
  }

  /**
   * Inicia el scheduler para ejecutar limpieza automática
   * Por defecto se ejecuta todos los días a las 2:00 AM
   */
  start(cronExpression: string = '0 2 * * *'): void {
    if (this.cronJob) {
      logger.warn('El scheduler de limpieza ya está ejecutándose');
      return;
    }

    logger.info(`Iniciando scheduler de limpieza de time slots con expresión cron: ${cronExpression}`);

    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.executeScheduledCleanup();
    }, {
      timezone: 'America/Bogota' // Ajustar según la zona horaria del proyecto
    });

    logger.info('Scheduler de limpieza de time slots iniciado exitosamente');
  }

  /**
   * Detiene el scheduler
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Scheduler de limpieza de time slots detenido');
    }
  }

  /**
   * Ejecuta la limpieza programada
   */
  private async executeScheduledCleanup(): Promise<void> {
    if (this.isRunning) {
      logger.warn('La limpieza programada ya está en ejecución, saltando esta iteración');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      logger.info('Iniciando limpieza programada de time slots');

      // Configuración por defecto para limpieza nocturna
      const cleanupOptions = {
        daysBack: 0, // Solo eliminar del día actual hacia atrás
        dryRun: false,
        batchSize: 200 // Lotes más grandes para procesamiento nocturno
      };

      const result = await this.cleanupService.performCleanup(cleanupOptions);

      const duration = Date.now() - startTime.getTime();
      
      logger.info(`Limpieza programada completada en ${duration}ms`, {
        deletedTimeSlots: result.deletedTimeSlots,
        errors: result.errors.length,
        duration
      });

      // Log de errores si los hay
      if (result.errors.length > 0) {
        logger.error('Errores durante la limpieza programada:', result.errors);
      }

    } catch (error) {
      const duration = Date.now() - startTime.getTime();
      logger.error(`Error durante la limpieza programada (${duration}ms):`, error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Verifica si el scheduler está ejecutándose
   */
  isSchedulerRunning(): boolean {
    return this.cronJob !== null;
  }

  /**
   * Verifica si hay una limpieza en progreso
   */
  isCleanupInProgress(): boolean {
    return this.isRunning;
  }

  /**
   * Obtiene información del estado del scheduler
   */
  getStatus(): {
    isSchedulerRunning: boolean;
    isCleanupInProgress: boolean;
  } {
    return {
      isSchedulerRunning: this.isSchedulerRunning(),
      isCleanupInProgress: this.isCleanupInProgress()
    };
  }

  /**
   * Ejecuta una limpieza manual (fuera del horario programado)
   */
  async executeManualCleanup(options?: {
    daysBack?: number;
    dryRun?: boolean;
    batchSize?: number;
  }): Promise<any> {
    if (this.isRunning) {
      throw new Error('Ya hay una limpieza en progreso');
    }

    logger.info('Ejecutando limpieza manual de time slots');
    
    const cleanupOptions = {
      daysBack: options?.daysBack || 0,
      dryRun: options?.dryRun || false,
      batchSize: options?.batchSize || 100
    };

    return await this.cleanupService.performCleanup(cleanupOptions);
  }
}