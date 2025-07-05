import { Repository } from 'typeorm';
import { TimeSlot, SlotStatus } from '../../models/time-slot.model';
import { Appointment, AppointmentStatus } from '../../models/appointment.model';
import logger  from '../../utils/logger';
import { AppDataSource } from '../../core/config/database';

export interface CleanupResult {
  deletedTimeSlots: number;
  errors: string[];
}

export interface CleanupOptions {
  daysBack?: number; // Días hacia atrás para considerar como "pasado"
  dryRun?: boolean; // Solo simular, no eliminar realmente
  batchSize?: number; // Tamaño del lote para procesamiento
}

export class DatabaseCleanupService {
  private timeSlotRepository: Repository<TimeSlot>;
  private appointmentRepository: Repository<Appointment>;

  constructor() {
    this.timeSlotRepository = AppDataSource.getRepository(TimeSlot);
    this.appointmentRepository = AppDataSource.getRepository(Appointment);
  }

  /**
   * Ejecuta la limpieza de time slots de la base de datos
   */
  async performCleanup(options: CleanupOptions = {}): Promise<CleanupResult> {
    const {
      daysBack = 0, // Por defecto, solo eliminar del día actual hacia atrás
      dryRun = false,
      batchSize = 100
    } = options;

    logger.info(`Iniciando limpieza de time slots - DryRun: ${dryRun}, DaysBack: ${daysBack}`);

    const result: CleanupResult = {
      deletedTimeSlots: 0,
      errors: []
    };

    try {
      // Limpiar solo time slots pasados
      const timeSlotsResult = await this.cleanupPastTimeSlots(daysBack, dryRun, batchSize);
      result.deletedTimeSlots = timeSlotsResult.deleted;
      result.errors.push(...timeSlotsResult.errors);

      logger.info(`Limpieza completada - TimeSlots eliminados: ${result.deletedTimeSlots}`);
    } catch (error) {
      const errorMessage = `Error durante la limpieza: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      logger.error(errorMessage);
      result.errors.push(errorMessage);
    }

    return result;
  }

  /**
   * Limpia time slots pasados
   */
  private async cleanupPastTimeSlots(
    daysBack: number,
    dryRun: boolean,
    batchSize: number
  ): Promise<{ deleted: number; errors: string[] }> {
    const errors: string[] = [];
    let totalDeleted = 0;

    try {
      const cutoffDate = this.calculateCutoffDate(daysBack);
      logger.info(`Limpiando time slots anteriores a: ${cutoffDate.toISOString()}`);

      // Buscar time slots pasados que no estén reservados
      const query = this.timeSlotRepository
        .createQueryBuilder('ts')
        .where('ts.slot_date < :cutoffDate', { cutoffDate })
        .andWhere('ts.status IN (:...statuses)', { 
          statuses: [SlotStatus.AVAILABLE, SlotStatus.BLOCKED, SlotStatus.CANCELLED] 
        });

      if (dryRun) {
        const count = await query.getCount();
        logger.info(`[DRY RUN] Se eliminarían ${count} time slots`);
        return { deleted: count, errors };
      }

      // Eliminar en lotes
      let hasMore = true;
      while (hasMore) {
        const batch = await query.limit(batchSize).getMany();
        
        if (batch.length === 0) {
          hasMore = false;
          break;
        }

        const ids = batch.map(slot => slot.slot_id);
        const deleteResult = await this.timeSlotRepository.delete(ids);
        
        const deletedCount = deleteResult.affected || 0;
        totalDeleted += deletedCount;
        
        logger.info(`Eliminados ${deletedCount} time slots en este lote`);
        
        if (batch.length < batchSize) {
          hasMore = false;
        }
      }

    } catch (error) {
      const errorMessage = `Error limpiando time slots: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      errors.push(errorMessage);
      logger.error(errorMessage);
    }

    return { deleted: totalDeleted, errors };
  }

  /**
   * Limpia appointments pasadas
   */
  private async cleanupPastAppointments(
    daysBack: number,
    dryRun: boolean,
    batchSize: number
  ): Promise<{ deleted: number; errors: string[] }> {
    const errors: string[] = [];
    let totalDeleted = 0;

    try {
      const cutoffDate = this.calculateCutoffDate(daysBack);
      logger.info(`Limpiando appointments anteriores a: ${cutoffDate.toISOString()}`);

      // Buscar appointments pasadas que estén completadas, canceladas o no-show
      const query = this.appointmentRepository
        .createQueryBuilder('app')
        .where('app.scheduled_at < :cutoffDate', { cutoffDate })
        .andWhere('app.status IN (:...statuses)', { 
          statuses: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] 
        });

      if (dryRun) {
        const count = await query.getCount();
        logger.info(`[DRY RUN] Se eliminarían ${count} appointments`);
        return { deleted: count, errors };
      }

      // Eliminar en lotes
      let hasMore = true;
      while (hasMore) {
        const batch = await query.limit(batchSize).getMany();
        
        if (batch.length === 0) {
          hasMore = false;
          break;
        }

        const ids = batch.map(appointment => appointment.appointment_id);
        const deleteResult = await this.appointmentRepository.delete(ids);
        
        const deletedCount = deleteResult.affected || 0;
        totalDeleted += deletedCount;
        
        logger.info(`Eliminadas ${deletedCount} appointments en este lote`);
        
        if (batch.length < batchSize) {
          hasMore = false;
        }
      }

    } catch (error) {
      const errorMessage = `Error limpiando appointments: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      errors.push(errorMessage);
      logger.error(errorMessage);
    }

    return { deleted: totalDeleted, errors };
  }

  /**
   * Calcula la fecha de corte basada en los días hacia atrás
   */
  private calculateCutoffDate(daysBack: number): Date {
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(now.getDate() - daysBack);
    cutoffDate.setHours(23, 59, 59, 999); // Final del día
    return cutoffDate;
  }

  /**
   * Obtiene estadísticas de time slots que serían eliminados
   */
  async getCleanupStats(daysBack: number = 0): Promise<{
    timeSlotsToDelete: number;
  }> {
    const cutoffDate = this.calculateCutoffDate(daysBack);

    const timeSlotsToDelete = await this.timeSlotRepository
      .createQueryBuilder('ts')
      .where('ts.slot_date < :cutoffDate', { cutoffDate })
      .andWhere('ts.status IN (:...statuses)', { 
        statuses: [SlotStatus.AVAILABLE, SlotStatus.BLOCKED, SlotStatus.CANCELLED] 
      })
      .getCount();

    return {
      timeSlotsToDelete
    };
  }
}