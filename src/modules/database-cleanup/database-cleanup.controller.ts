import { Request, Response } from 'express';
import { DatabaseCleanupService, CleanupOptions } from './database-cleanup.service';
import logger from '../../utils/logger';

export class DatabaseCleanupController {
  private cleanupService: DatabaseCleanupService;

  constructor() {
    this.cleanupService = new DatabaseCleanupService();
  }

  /**
   * Ejecuta la limpieza de base de datos
   * POST /api/database-cleanup/execute
   */
  async executeCleanup(req: Request, res: Response): Promise<void> {
    try {
      const options: CleanupOptions = {
        daysBack: req.body.daysBack || 0,
        dryRun: req.body.dryRun || false,
        batchSize: req.body.batchSize || 100
      };

      // Validaciones
      if ((options.daysBack ?? 0) < 0) {
        res.status(400).json({
          success: false,
          message: 'daysBack debe ser un número mayor o igual a 0'
        });
        return;
      }

      if (options.batchSize && (options.batchSize < 1 || options.batchSize > 1000)) {
        res.status(400).json({
          success: false,
          message: 'batchSize debe estar entre 1 y 1000'
        });
        return;
      }

      logger.info(`Iniciando limpieza de base de datos con opciones:`, options);

      const result = await this.cleanupService.performCleanup(options);

      const statusCode = result.errors.length > 0 ? 207 : 200; // 207 Multi-Status si hay errores parciales

      res.status(statusCode).json({
        success: result.errors.length === 0,
        message: result.errors.length === 0 
          ? 'Limpieza completada exitosamente'
          : 'Limpieza completada con algunos errores',
        data: {
          deletedTimeSlots: result.deletedTimeSlots,
          deletedAppointments: result.deletedAppointments,
          totalDeleted: result.deletedTimeSlots + result.deletedAppointments,
          errors: result.errors,
          options
        }
      });

    } catch (error: any) {
      logger.error('Error en executeCleanup:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor durante la limpieza',
        error: error.message
      });
    }
  }

  /**
   * Obtiene estadísticas de lo que sería eliminado
   * GET /api/database-cleanup/stats?daysBack=0
   */
  async getCleanupStats(req: Request, res: Response): Promise<void> {
    try {
      const daysBack = parseInt(req.query.daysBack as string) || 0;

      if (daysBack < 0) {
        res.status(400).json({
          success: false,
          message: 'daysBack debe ser un número mayor o igual a 0'
        });
        return;
      }

      const stats = await this.cleanupService.getCleanupStats(daysBack);

      res.status(200).json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: {
          ...stats,
          totalToDelete: stats.timeSlotsToDelete + stats.appointmentsToDelete,
          daysBack,
          cutoffDate: this.calculateCutoffDate(daysBack).toISOString()
        }
      });

    } catch (error: any) {
      logger.error('Error en getCleanupStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas de limpieza',
        error: error.message
      });
    }
  }

  /**
   * Ejecuta una limpieza de prueba (dry run)
   * POST /api/database-cleanup/dry-run
   */
  async dryRunCleanup(req: Request, res: Response): Promise<void> {
    try {
      const options: CleanupOptions = {
        daysBack: req.body.daysBack || 0,
        dryRun: true, // Forzar dry run
        batchSize: req.body.batchSize || 100
      };

      if ((options.daysBack ?? 0) < 0) {
        res.status(400).json({
          success: false,
          message: 'daysBack debe ser un número mayor o igual a 0'
        });
        return;
      }

      logger.info(`Ejecutando dry run de limpieza con opciones:`, options);

      const result = await this.cleanupService.performCleanup(options);

      res.status(200).json({
        success: true,
        message: 'Simulación de limpieza completada',
        data: {
          wouldDeleteTimeSlots: result.deletedTimeSlots,
          wouldDeleteAppointments: result.deletedAppointments,
          totalWouldDelete: result.deletedTimeSlots + result.deletedAppointments,
          errors: result.errors,
          options
        }
      });

    } catch (error: any) {
      logger.error('Error en dryRunCleanup:', error);
      res.status(500).json({
        success: false,
        message: 'Error durante la simulación de limpieza',
        error: error.message
      });
    }
  }

  /**
   * Método auxiliar para calcular fecha de corte
   */
  private calculateCutoffDate(daysBack: number): Date {
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(now.getDate() - daysBack);
    cutoffDate.setHours(23, 59, 59, 999);
    return cutoffDate;
  }
}