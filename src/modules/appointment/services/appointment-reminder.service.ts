/**
 * Servicio de recordatorios para citas
 * Maneja la programación y envío de recordatorios automáticos
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../core/config/database';
import { Appointment, AppointmentStatus } from '../../../models/appointment.model';
import { AppointmentNotificationService } from './appointment-notification.service';
import logger from '../../../utils/logger';
import * as cron from 'node-cron';

export class AppointmentReminderService {
  private appointmentRepository: Repository<Appointment>;
  private notificationService: AppointmentNotificationService;
  private reminderJobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.appointmentRepository = AppDataSource.getRepository(Appointment);
    this.notificationService = new AppointmentNotificationService();
    this.initializeReminderCron();
  }

  /**
   * Inicializa los trabajos cron para enviar recordatorios
   */
  private initializeReminderCron(): void {
    // Ejecutar cada hora para verificar recordatorios pendientes
    cron.schedule('0 * * * *', async () => {
      await this.processReminders();
    });

    logger.info('Appointment reminder service initialized');
  }

  /**
   * Procesa y envía recordatorios pendientes
   */
  async processReminders(): Promise<void> {
    try {
      const now = new Date();
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      // Buscar citas para recordatorio de 24 horas
      await this.send24HourReminders(now, twentyFourHoursFromNow);

      // Buscar citas para recordatorio de 2 horas
      await this.send2HourReminders(now, twoHoursFromNow);

    } catch (error) {
      logger.error('Error processing appointment reminders:', error);
    }
  }

  /**
   * Envía recordatorios de 24 horas
   */
  private async send24HourReminders(now: Date, twentyFourHoursFromNow: Date): Promise<void> {
    try {
      const appointments = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.user', 'user')
        .leftJoinAndSelect('appointment.professional', 'professional')
        .leftJoinAndSelect('professional.user', 'professionalUser')
        .leftJoinAndSelect('appointment.service', 'service')
        .where('appointment.scheduled_at BETWEEN :now AND :twentyFourHours', {
          now: now.toISOString(),
          twentyFourHours: twentyFourHoursFromNow.toISOString()
        })
        .andWhere('appointment.status IN (:...statuses)', {
          statuses: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
        })
        .andWhere('appointment.reminder_24h_sent = :sent', { sent: false })
        .getMany();

      for (const appointment of appointments) {
        try {
          await this.notificationService.sendReminderNotification({
            appointment,
            recipientEmail: appointment.user.email,
            recipientName: `${appointment.user.first_name} ${appointment.user.last_name}`,
            professionalName: `${appointment.professional?.user?.first_name || ''} ${appointment.professional?.user?.last_name || ''}`.trim(),
            serviceName: appointment.service?.service_name
          }, '24h');

          // Marcar como enviado
          await this.appointmentRepository.update(appointment.appointment_id, {
            reminder_24h_sent: true
          });

          logger.info(`24h reminder sent for appointment ${appointment.appointment_id}`);
        } catch (error) {
          logger.error(`Error sending 24h reminder for appointment ${appointment.appointment_id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error processing 24h reminders:', error);
    }
  }

  /**
   * Envía recordatorios de 2 horas
   */
  private async send2HourReminders(now: Date, twoHoursFromNow: Date): Promise<void> {
    try {
      const appointments = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.user', 'user')
        .leftJoinAndSelect('appointment.professional', 'professional')
        .leftJoinAndSelect('professional.user', 'professionalUser')
        .leftJoinAndSelect('appointment.service', 'service')
        .where('appointment.scheduled_at BETWEEN :now AND :twoHours', {
          now: now.toISOString(),
          twoHours: twoHoursFromNow.toISOString()
        })
        .andWhere('appointment.status IN (:...statuses)', {
          statuses: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
        })
        .andWhere('appointment.reminder_2h_sent = :sent', { sent: false })
        .getMany();

      for (const appointment of appointments) {
        try {
          await this.notificationService.sendReminderNotification({
            appointment,
            recipientEmail: appointment.user.email,
            recipientName: `${appointment.user.first_name} ${appointment.user.last_name}`,
            professionalName: `${appointment.professional?.user?.first_name || ''} ${appointment.professional?.user?.last_name || ''}`.trim(),
            serviceName: appointment.service?.service_name
          }, '2h');

          // Marcar como enviado
          await this.appointmentRepository.update(appointment.appointment_id, {
            reminder_2h_sent: true
          });

          logger.info(`2h reminder sent for appointment ${appointment.appointment_id}`);
        } catch (error) {
          logger.error(`Error sending 2h reminder for appointment ${appointment.appointment_id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error processing 2h reminders:', error);
    }
  }

  /**
   * Programa un recordatorio específico para una cita
   */
  async scheduleReminder(appointmentId: number, reminderType: '24h' | '2h'): Promise<void> {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: { appointment_id: appointmentId },
        relations: ['user', 'professional', 'professional.user', 'service']
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const scheduledAt = new Date(appointment.scheduled_at);
      const reminderTime = reminderType === '24h' 
        ? new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000)
        : new Date(scheduledAt.getTime() - 2 * 60 * 60 * 1000);

      const jobKey = `${appointmentId}-${reminderType}`;

      // Cancelar trabajo existente si existe
      if (this.reminderJobs.has(jobKey)) {
        this.reminderJobs.get(jobKey)?.destroy();
        this.reminderJobs.delete(jobKey);
      }

      // Solo programar si el recordatorio es en el futuro
      if (reminderTime > new Date()) {
        const cronExpression = this.getCronExpression(reminderTime);
        
        const task = cron.schedule(cronExpression, async () => {
          try {
            await this.notificationService.sendReminderNotification({
              appointment,
              recipientEmail: appointment.user.email,
              recipientName: `${appointment.user.first_name} ${appointment.user.last_name}`,
              professionalName: `${appointment.professional?.user?.first_name || ''} ${appointment.professional?.user?.last_name || ''}`.trim(),
              serviceName: appointment.service?.service_name
            }, reminderType);

            // Marcar como enviado
            const updateField = reminderType === '24h' ? 'reminder_24h_sent' : 'reminder_2h_sent';
            await this.appointmentRepository.update(appointmentId, {
              [updateField]: true
            });

            // Limpiar el trabajo después de ejecutarlo
            this.reminderJobs.delete(jobKey);
            task.destroy();

            logger.info(`${reminderType} reminder sent for appointment ${appointmentId}`);
          } catch (error) {
            logger.error(`Error sending ${reminderType} reminder for appointment ${appointmentId}:`, error);
          }
        });

        this.reminderJobs.set(jobKey, task);
        task.start();

        logger.info(`${reminderType} reminder scheduled for appointment ${appointmentId} at ${reminderTime}`);
      }
    } catch (error) {
      logger.error(`Error scheduling ${reminderType} reminder for appointment ${appointmentId}:`, error);
    }
  }

  /**
   * Cancela los recordatorios programados para una cita
   */
  async cancelReminders(appointmentId: number): Promise<void> {
    const jobKeys = [`${appointmentId}-24h`, `${appointmentId}-2h`];
    
    for (const jobKey of jobKeys) {
      if (this.reminderJobs.has(jobKey)) {
        this.reminderJobs.get(jobKey)?.destroy();
        this.reminderJobs.delete(jobKey);
        logger.info(`Reminder cancelled for ${jobKey}`);
      }
    }
  }

  /**
   * Genera una expresión cron para una fecha específica
   */
  private getCronExpression(date: Date): string {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    
    return `${minute} ${hour} ${day} ${month} *`;
  }

  /**
   * Obtiene estadísticas de recordatorios
   */
  async getReminderStats(): Promise<{
    pending24h: number;
    pending2h: number;
    scheduledJobs: number;
  }> {
    try {
      const now = new Date();
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const pending24h = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.scheduled_at BETWEEN :now AND :twentyFourHours', {
          now: now.toISOString(),
          twentyFourHours: twentyFourHoursFromNow.toISOString()
        })
        .andWhere('appointment.status IN (:...statuses)', {
          statuses: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
        })
        .andWhere('appointment.reminder_24h_sent = :sent', { sent: false })
        .getCount();

      const pending2h = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.scheduled_at BETWEEN :now AND :twoHours', {
          now: now.toISOString(),
          twoHours: twoHoursFromNow.toISOString()
        })
        .andWhere('appointment.status IN (:...statuses)', {
          statuses: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
        })
        .andWhere('appointment.reminder_2h_sent = :sent', { sent: false })
        .getCount();

      return {
        pending24h,
        pending2h,
        scheduledJobs: this.reminderJobs.size
      };
    } catch (error) {
      logger.error('Error getting reminder stats:', error);
      return {
        pending24h: 0,
        pending2h: 0,
        scheduledJobs: this.reminderJobs.size
      };
    }
  }
}

// Instancia singleton del servicio de recordatorios
export const appointmentReminderService = new AppointmentReminderService();