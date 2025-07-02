import { BadRequestError } from '../../utils/error-handler';
import  logger  from '../../utils/logger';
import config from '../../core/config/environment';

export interface WhatsAppTemplateParams {
  userName: string;
  patientName: string;
  time: string;
  latitude: string;
  longitude: string;
}

export interface WhatsAppNotificationData {
  phoneNumber: string;
  templateName: string;
  templateParams: WhatsAppTemplateParams;
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
   * Valida formato de número de teléfono
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Formato internacional sin + (ej: 521234567890)
    const phoneRegex = /^\d{10,15}$/;
    return phoneRegex.test(phoneNumber.replace(/\D/g, ''));
  }

  /**
   * Formatea número de teléfono para WhatsApp
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remover todos los caracteres no numéricos
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Si el número empieza con 52 (México), mantenerlo
    // Si no, agregar 52 al inicio
    if (cleanNumber.startsWith('52')) {
      return cleanNumber;
    }
    
    return `52${cleanNumber}`;
  }
}