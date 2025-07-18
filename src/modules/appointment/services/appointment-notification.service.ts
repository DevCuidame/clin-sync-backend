/**
 * Servicio de notificaciones para citas
 * Maneja el envío de correos electrónicos para las diferentes acciones de las citas
 */

import { EmailService } from '../../notification/services/email.service';
import { TemplateFileService } from '../../notification/services/template-file.service';
import { WhatsAppService, AppointmentWhatsAppData } from '../../whatsapp/whatsapp.service';
import { Appointment } from '../../../models/appointment.model';
import logger from '../../../utils/logger';

const WEBSITE_URL = process.env.WEBSITE_URL || 'https://esenciaycuerpo.com';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'soporte@esenciaycuerpo.com';

export interface AppointmentEmailData {
  appointment: Appointment;
  recipientEmail: string;
  recipientName: string;
  recipientPhone?: string;
  professionalName?: string;
  serviceName?: string;
  reason?: string;
  newDateTime?: Date;
  locationLatitude?: number;
  locationLongitude?: number;
}

export class AppointmentNotificationService {
  private emailService: EmailService;
  private templateService: TemplateFileService;
  private whatsappService: WhatsAppService;

  constructor() {
    this.emailService = EmailService.getInstance();
    this.templateService = new TemplateFileService();
    this.whatsappService = new WhatsAppService();
  }

  /**
   * Envía notificación de cita cancelada
   */
  async sendCancellationNotification(data: AppointmentEmailData): Promise<void> {
    try {
      const template = await this.templateService.getTemplateContent('appointment-cancellation');
      
      const emailData = {
        userName: data.recipientName,
        appointmentId: data.appointment.appointment_id,
        serviceName: data.serviceName || 'Servicio',
        professionalName: data.professionalName || 'Profesional',
        scheduledDate: this.formatDate(data.appointment.scheduled_at),
        scheduledTime: this.formatTime(data.appointment.scheduled_at),
        cancellationReason: data.reason || 'No especificada',
        supportEmail: SUPPORT_EMAIL,
        websiteUrl: WEBSITE_URL
      };

      await this.emailService.sendTemplatedEmail(
        data.recipientEmail,
        'Cita Cancelada - Esencia y Cuerpo',
        template,
        emailData
      );

      logger.info(`Cancellation notification sent for appointment ${data.appointment.appointment_id}`);
    } catch (error) {
      logger.error('Error sending cancellation notification:', error);
      throw error;
    }
  }

  /**
   * Envía notificación de cita reprogramada
   */
  async sendRescheduleNotification(data: AppointmentEmailData): Promise<void> {
    try {
      const template = await this.templateService.getTemplateContent('appointment-reschedule');
      
      const emailData = {
        userName: data.recipientName,
        appointmentId: data.appointment.appointment_id,
        serviceName: data.serviceName || 'Servicio',
        professionalName: data.professionalName || 'Profesional',
        oldDate: this.formatDate(data.appointment.scheduled_at),
        oldTime: this.formatTime(data.appointment.scheduled_at),
        newDate: data.newDateTime ? this.formatDate(data.newDateTime) : '',
        newTime: data.newDateTime ? this.formatTime(data.newDateTime) : '',
        reason: data.reason || 'No especificada',
        supportEmail: SUPPORT_EMAIL,
        websiteUrl: WEBSITE_URL
      };

      await this.emailService.sendTemplatedEmail(
        data.recipientEmail,
        'Cita Reprogramada - Esencia y Cuerpo',
        template,
        emailData
      );

      logger.info(`Reschedule notification sent for appointment ${data.appointment.appointment_id}`);
    } catch (error) {
      logger.error('Error sending reschedule notification:', error);
      throw error;
    }
  }

  /**
   * Envía notificación de cita confirmada
   */
  async sendConfirmationNotification(data: AppointmentEmailData): Promise<void> {
    try {
      const template = await this.templateService.getTemplateContent('appointment-confirmation');
      
      const emailData = {
        userName: data.recipientName,
        appointmentId: data.appointment.appointment_id,
        serviceName: data.serviceName || 'Servicio',
        professionalName: data.professionalName || 'Profesional',
        scheduledDate: this.formatDate(data.appointment.scheduled_at),
        scheduledTime: this.formatTime(data.appointment.scheduled_at),
        duration: data.appointment.duration_minutes,
        amount: data.appointment.amount,
        supportEmail: SUPPORT_EMAIL,
        websiteUrl: WEBSITE_URL
      };

      await this.emailService.sendTemplatedEmail(
        data.recipientEmail,
        'Cita Confirmada - Esencia y Cuerpo',
        template,
        emailData
      );

      logger.info(`Confirmation notification sent for appointment ${data.appointment.appointment_id}`);
    } catch (error) {
      logger.error('Error sending confirmation notification:', error);
      throw error;
    }
  }

  /**
   * Envía notificación de cita completada
   */
  async sendCompletionNotification(data: AppointmentEmailData): Promise<void> {
    try {
      const template = await this.templateService.getTemplateContent('appointment-completion');
      
      const emailData = {
        userName: data.recipientName,
        appointmentId: data.appointment.appointment_id,
        serviceName: data.serviceName || 'Servicio',
        professionalName: data.professionalName || 'Profesional',
        scheduledDate: this.formatDate(data.appointment.scheduled_at),
        scheduledTime: this.formatTime(data.appointment.scheduled_at),
        amount: data.appointment.amount,
        supportEmail: SUPPORT_EMAIL,
        websiteUrl: WEBSITE_URL,
        reviewUrl: `${WEBSITE_URL}/reviews`
      };

      await this.emailService.sendTemplatedEmail(
        data.recipientEmail,
        'Cita Completada - Esencia y Cuerpo',
        template,
        emailData
      );

      logger.info(`Completion notification sent for appointment ${data.appointment.appointment_id}`);
    } catch (error) {
      logger.error('Error sending completion notification:', error);
      throw error;
    }
  }

  /**
   * Envía recordatorio de cita
   */
  async sendReminderNotification(data: AppointmentEmailData, reminderType: '24h' | '2h' = '24h'): Promise<void> {
    try {
      const template = await this.templateService.getTemplateContent('appointment-reminder');
      
      const reminderText = reminderType === '24h' ? '24 horas' : '2 horas';
      
      const emailData = {
        userName: data.recipientName,
        appointmentId: data.appointment.appointment_id,
        serviceName: data.serviceName || 'Servicio',
        professionalName: data.professionalName || 'Profesional',
        scheduledDate: this.formatDate(data.appointment.scheduled_at),
        scheduledTime: this.formatTime(data.appointment.scheduled_at),
        duration: data.appointment.duration_minutes,
        amount: data.appointment.amount,
        reminderType: reminderText,
        supportEmail: SUPPORT_EMAIL,
        websiteUrl: WEBSITE_URL
      };

      await this.emailService.sendTemplatedEmail(
        data.recipientEmail,
        `Recordatorio de Cita (${reminderText}) - Esencia y Cuerpo`,
        template,
        emailData
      );

      logger.info(`${reminderType} reminder sent for appointment ${data.appointment.appointment_id}`);
    } catch (error) {
      logger.error(`Error sending ${reminderType} reminder:`, error);
      throw error;
    }
  }

  /**
   * Formatea una fecha para mostrar en español
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  }

  /**
   * Formatea una hora para mostrar en formato 12 horas
   */
  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date));
  }

  // ==================== MÉTODOS COMBINADOS (EMAIL + WHATSAPP) ====================

  /**
   * Envía notificación de cita cancelada por email y WhatsApp
   */
  async sendCancellationNotificationComplete(data: AppointmentEmailData): Promise<void> {
    const promises = [];

    // Enviar email
    promises.push(this.sendCancellationNotification(data));

    // Enviar WhatsApp si hay teléfono
    if (data.recipientPhone) {
      const whatsappData: AppointmentWhatsAppData = {
        appointment: data.appointment,
        recipientPhone: data.recipientPhone,
        recipientName: data.recipientName,
        professionalName: data.professionalName,
        serviceName: data.serviceName,
        reason: data.reason
      };
      promises.push(this.whatsappService.sendCancellationWhatsApp(whatsappData));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Envía notificación de cita reprogramada por email y WhatsApp
   */
  async sendRescheduleNotificationComplete(data: AppointmentEmailData): Promise<void> {
    const promises = [];

    // Enviar email
    promises.push(this.sendRescheduleNotification(data));

    // Enviar WhatsApp si hay teléfono
    if (data.recipientPhone) {
      const whatsappData: AppointmentWhatsAppData = {
        appointment: data.appointment,
        recipientPhone: data.recipientPhone,
        recipientName: data.recipientName,
        professionalName: data.professionalName,
        serviceName: data.serviceName,
        reason: data.reason,
        newDateTime: data.newDateTime
      };
      promises.push(this.whatsappService.sendRescheduleWhatsApp(whatsappData));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Envía notificación de cita confirmada por email y WhatsApp
   */
  async sendConfirmationNotificationComplete(data: AppointmentEmailData): Promise<void> {
    const promises = [];

    // Enviar email
    promises.push(this.sendConfirmationNotification(data));

    // Enviar WhatsApp si hay teléfono
    if (data.recipientPhone) {
      const whatsappData: AppointmentWhatsAppData = {
        appointment: data.appointment,
        recipientPhone: data.recipientPhone,
        recipientName: data.recipientName,
        professionalName: data.professionalName,
        serviceName: data.serviceName
      };
      promises.push(this.whatsappService.sendConfirmationWhatsApp(whatsappData));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Envía notificación de cita completada por email y WhatsApp
   */
  async sendCompletionNotificationComplete(data: AppointmentEmailData): Promise<void> {
    const promises = [];

    // Enviar email
    promises.push(this.sendCompletionNotification(data));

    // Enviar WhatsApp si hay teléfono
    if (data.recipientPhone) {
      const whatsappData: AppointmentWhatsAppData = {
        appointment: data.appointment,
        recipientPhone: data.recipientPhone,
        recipientName: data.recipientName,
        professionalName: data.professionalName,
        serviceName: data.serviceName
      };
      promises.push(this.whatsappService.sendCompletionWhatsApp(whatsappData));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Envía recordatorio de cita por email y WhatsApp
   */
  async sendReminderNotificationComplete(data: AppointmentEmailData, reminderType: '24h' | '2h' = '24h'): Promise<void> {
    const promises = [];

    // Enviar email
    promises.push(this.sendReminderNotification(data, reminderType));

    // Enviar WhatsApp si hay teléfono
    if (data.recipientPhone) {
      const whatsappData: AppointmentWhatsAppData = {
        appointment: data.appointment,
        recipientPhone: data.recipientPhone,
        recipientName: data.recipientName,
        professionalName: data.professionalName,
        serviceName: data.serviceName
      };
      promises.push(this.whatsappService.sendReminderWhatsApp(whatsappData, reminderType));
    }

    await Promise.allSettled(promises);
  }
}