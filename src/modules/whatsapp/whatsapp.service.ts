import { BadRequestError } from '../../utils/error-handler';
import  logger  from '../../utils/logger';
import config from '../../core/config/environment';
import { Appointment } from '../../models/appointment.model';

export interface WhatsAppTemplateParams {
  userName: string;
  patientName: string;
  time: string;
  latitude?: string;
  longitude?: string;
}

export interface WhatsAppNotificationData {
  phoneNumber: string;
  templateName: string;
  templateParams: WhatsAppTemplateParams;
}

export interface AppointmentWhatsAppData {
  appointment: Appointment;
  recipientPhone: string;
  recipientName: string;
  professionalName?: string;
  serviceName?: string;
  reason?: string;
  newDateTime?: Date;
}

export class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private apiVersion: string = 'v22.0';
  private baseUrl: string;

  constructor() {
    this.accessToken = config.whatsapp.accessToken;
    this.phoneNumberId = config.whatsapp.phoneNumberId;
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

    if (!this.accessToken || !this.phoneNumberId) {
      logger.error('WhatsApp credentials not configured properly');
      throw new BadRequestError('WhatsApp service not configured');
    }
  }

  /**
   * Envía una notificación de WhatsApp usando una plantilla
   */
  async sendTemplateMessage(data: WhatsAppNotificationData): Promise<boolean> {
    try {
      const { phoneNumber, templateName, templateParams } = data;

      // Validar número de teléfono
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new BadRequestError('Número de teléfono inválido');
      }

      const messageData = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'es' // Español
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: templateParams.userName
                },
                {
                  type: 'text',
                  text: templateParams.patientName
                },
                {
                  type: 'text',
                  text: templateParams.time
                }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [
                {
                  type: 'text',
                  text: `https://www.google.com/maps/search/?api=1&query=${templateParams.latitude},${templateParams.longitude}`
                }
              ]
            }
          ]
        }
      };

      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error('Error sending WhatsApp message:', result);
        throw new BadRequestError(`Error enviando mensaje de WhatsApp: ${result.error?.message || 'Error desconocido'}`);
      }

      logger.info('WhatsApp message sent successfully:', {
        messageId: result.messages?.[0]?.id,
        phoneNumber,
        templateName
      });

      return true;
    } catch (error) {
      logger.error('Error in sendTemplateMessage:', error);
      throw error;
    }
  }

  /**
   * Envía notificación específica para escaneo de QR
   */
  async sendQRScanNotification(
    phoneNumber: string,
    userName: string,
    patientName: string,
    latitude: number,
    longitude: number
  ): Promise<boolean> {
    try {
      const currentTime = new Date().toLocaleString('es-ES', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      const notificationData: WhatsAppNotificationData = {
        phoneNumber,
        templateName: 'noti_check_persona_qr',
        templateParams: {
          userName,
          patientName,
          time: currentTime,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }
      };

      return await this.sendTemplateMessage(notificationData);
    } catch (error) {
      logger.error('Error sending QR scan notification:', error);
      throw error;
    }
  }

  /**
   * Envía template de WhatsApp específico para citas
   * Método simplificado para enviar cualquier template de cita
   */
  async sendAppointmentTemplateMessage(
    phoneNumber: string,
    templateName: string,
    userName: string,
    serviceName: string,
    appointmentDateTime: Date,
    additionalInfo?: string
  ): Promise<boolean> {
    try {
      // Validar número de teléfono
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new BadRequestError('Número de teléfono inválido');
      }

      const formattedDate = this.formatDate(appointmentDateTime);
      const formattedTime = this.formatTime(appointmentDateTime);
      const timeInfo = additionalInfo ? `${formattedDate} a las ${formattedTime} (${additionalInfo})` : `${formattedDate} a las ${formattedTime}`;

      const messageData = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(phoneNumber),
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'es' // Español
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: userName
                },
                {
                  type: 'text',
                  text: serviceName
                },
                {
                  type: 'text',
                  text: timeInfo
                }
              ]
            }
          ]
        }
      };

      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error('Error sending WhatsApp appointment template message:', result);
        throw new BadRequestError(`Error enviando template de cita de WhatsApp: ${result.error?.message || 'Error desconocido'}`);
      }

      logger.info('WhatsApp appointment template message sent successfully:', {
        messageId: result.messages?.[0]?.id,
        phoneNumber: this.formatPhoneNumber(phoneNumber),
        templateName,
        userName,
        serviceName
      });

      return true;
    } catch (error) {
      logger.error('Error in sendAppointmentTemplateMessage:', error);
      throw error;
    }
  }

  /**
   * Valida formato de número de teléfono colombiano
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Formato para números colombianos: 57 + 10 dígitos (ej: 573001234567)
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Verificar si es un número colombiano válido
    if (cleanNumber.startsWith('57')) {
      // Debe tener 12 dígitos en total (57 + 10 dígitos)
      return cleanNumber.length === 12;
    } else {
      // Si no tiene código de país, debe tener 10 dígitos
      return cleanNumber.length === 10;
    }
  }

  /**
   * Formatea número de teléfono colombiano para WhatsApp
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remover todos los caracteres no numéricos
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Si el número ya empieza con 57 (Colombia), mantenerlo
    if (cleanNumber.startsWith('57')) {
      return cleanNumber;
    }
    
    // Si no, agregar 57 al inicio (código de país de Colombia)
    return `57${cleanNumber}`;
  }

  // ==================== MÉTODOS PARA NOTIFICACIONES DE CITAS ====================

  /**
   * Envía notificación de WhatsApp para cita cancelada
   */
  async sendCancellationWhatsApp(data: AppointmentWhatsAppData): Promise<boolean> {
    try {
      const formattedDate = this.formatDate(data.appointment.scheduled_at);
      const formattedTime = this.formatTime(data.appointment.scheduled_at);
      
      const notificationData: WhatsAppNotificationData = {
         phoneNumber: this.formatPhoneNumber(data.recipientPhone),
         templateName: 'appointment_cancelled',
        templateParams: {
          userName: data.recipientName,
          patientName: data.serviceName || 'Servicio',
          time: `${formattedDate} a las ${formattedTime}`,
        }
      };

      const result = await this.sendTemplateMessage(notificationData);
      logger.info(`WhatsApp cancellation notification sent for appointment ${data.appointment.appointment_id}`);
      return result;
    } catch (error) {
      logger.error('Error sending WhatsApp cancellation notification:', error);
      throw error;
    }
  }

  /**
   * Envía notificación de WhatsApp para cita reprogramada
   */
  async sendRescheduleWhatsApp(data: AppointmentWhatsAppData): Promise<boolean> {
    try {
      const oldDate = this.formatDate(data.appointment.scheduled_at);
      const oldTime = this.formatTime(data.appointment.scheduled_at);
      const newDate = data.newDateTime ? this.formatDate(data.newDateTime) : '';
      const newTime = data.newDateTime ? this.formatTime(data.newDateTime) : '';
      
      const notificationData: WhatsAppNotificationData = {
         phoneNumber: this.formatPhoneNumber(data.recipientPhone),
         templateName: 'appointment_rescheduled',
        templateParams: {
          userName: data.recipientName,
          patientName: data.serviceName || 'Servicio',
          time: `De: ${oldDate} ${oldTime} → A: ${newDate} ${newTime}`,
        }
      };

      const result = await this.sendTemplateMessage(notificationData);
      logger.info(`WhatsApp reschedule notification sent for appointment ${data.appointment.appointment_id}`);
      return result;
    } catch (error) {
      logger.error('Error sending WhatsApp reschedule notification:', error);
      throw error;
    }
  }

  /**
   * Envía notificación de WhatsApp para cita confirmada
   */
  async sendConfirmationWhatsApp(data: AppointmentWhatsAppData): Promise<boolean> {
    try {
      const formattedDate = this.formatDate(data.appointment.scheduled_at);
      const formattedTime = this.formatTime(data.appointment.scheduled_at);
      
      const notificationData: WhatsAppNotificationData = {
         phoneNumber: this.formatPhoneNumber(data.recipientPhone),
         templateName: 'appointment_confirmed',
        templateParams: {
          userName: data.recipientName,
          patientName: data.serviceName || 'Servicio',
          time: `${formattedDate} a las ${formattedTime}`,
        }
      };

      const result = await this.sendTemplateMessage(notificationData);
      logger.info(`WhatsApp confirmation notification sent for appointment ${data.appointment.appointment_id}`);
      return result;
    } catch (error) {
      logger.error('Error sending WhatsApp confirmation notification:', error);
      throw error;
    }
  }

  /**
   * Envía notificación de WhatsApp para cita completada
   */
  async sendCompletionWhatsApp(data: AppointmentWhatsAppData): Promise<boolean> {
    try {
      const formattedDate = this.formatDate(data.appointment.scheduled_at);
      const formattedTime = this.formatTime(data.appointment.scheduled_at);
      
      const notificationData: WhatsAppNotificationData = {
         phoneNumber: this.formatPhoneNumber(data.recipientPhone),
         templateName: 'appointment_completed',
        templateParams: {
          userName: data.recipientName,
          patientName: data.serviceName || 'Servicio',
          time: `${formattedDate} a las ${formattedTime}`,
        }
      };

      const result = await this.sendTemplateMessage(notificationData);
      logger.info(`WhatsApp completion notification sent for appointment ${data.appointment.appointment_id}`);
      return result;
    } catch (error) {
      logger.error('Error sending WhatsApp completion notification:', error);
      throw error;
    }
  }

  /**
   * Envía recordatorio de WhatsApp para cita
   */
  async sendReminderWhatsApp(data: AppointmentWhatsAppData, reminderType: '24h' | '2h' = '24h'): Promise<boolean> {
    try {
      const formattedDate = this.formatDate(data.appointment.scheduled_at);
      const formattedTime = this.formatTime(data.appointment.scheduled_at);
      const reminderText = reminderType === '24h' ? '24 horas' : '2 horas';
      
      const templateName = reminderType === '24h' ? 'appointment_reminder_24h' : 'appointment_reminder_2h';
      
      const notificationData: WhatsAppNotificationData = {
        phoneNumber: this.formatPhoneNumber(data.recipientPhone),
        templateName,
        templateParams: {
          userName: data.recipientName,
          patientName: data.serviceName || 'Servicio',
          time: `${formattedDate} a las ${formattedTime} (${reminderText})`,
        }
      };

      const result = await this.sendTemplateMessage(notificationData);
      logger.info(`WhatsApp ${reminderType} reminder sent for appointment ${data.appointment.appointment_id}`);
      return result;
    } catch (error) {
      logger.error(`Error sending WhatsApp ${reminderType} reminder:`, error);
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
}