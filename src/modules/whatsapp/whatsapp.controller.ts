import { Request, Response, NextFunction } from 'express';
import { WhatsAppService } from './whatsapp.service';
import { BadRequestError } from '../../utils/error-handler';
import { ApiResponse } from '../../core/interfaces/response.interface';
import  logger  from '../../utils/logger';
import config from '../../core/config/environment';

export class WhatsAppController {
  private whatsAppService: WhatsAppService;

  constructor() {
    this.whatsAppService = new WhatsAppService();
  }

  /**
   * Envía notificación de WhatsApp para escaneo de QR
   * @route POST /api/whatsapp/qr-scan-notification
   */
  sendQRScanNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        phoneNumber,
        userName,
        patientName,
        latitude,
        longitude
      } = req.body;

      // Validaciones
      if (!phoneNumber || !userName || !patientName || !latitude || !longitude) {
        throw new BadRequestError('Todos los campos son requeridos: phoneNumber, userName, patientName, latitude, longitude');
      }

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new BadRequestError('Latitude y longitude deben ser números');
      }

      logger.info('Sending QR scan notification:', {
        phoneNumber,
        userName,
        patientName,
        latitude,
        longitude
      });

      const success = await this.whatsAppService.sendQRScanNotification(
        phoneNumber,
        userName,
        patientName,
        latitude,
        longitude
      );

      const response: ApiResponse = {
        success: true,
        message: 'Notificación de WhatsApp enviada correctamente',
        data: {
          sent: success,
          phoneNumber,
          templateUsed: 'noti_check_persona_qr'
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error sending WhatsApp notification:', error);
      next(error);
    }
  };

  /**
   * Envía notificación de WhatsApp usando plantilla personalizada
   * @route POST /api/whatsapp/send-template
   */
  sendTemplateMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        phoneNumber,
        templateName,
        templateParams
      } = req.body;

      // Validaciones
      if (!phoneNumber || !templateName || !templateParams) {
        throw new BadRequestError('phoneNumber, templateName y templateParams son requeridos');
      }

      logger.info('Sending template message:', {
        phoneNumber,
        templateName,
        templateParams
      });

      const success = await this.whatsAppService.sendTemplateMessage({
        phoneNumber,
        templateName,
        templateParams
      });

      const response: ApiResponse = {
        success: true,
        message: 'Mensaje de WhatsApp enviado correctamente',
        data: {
          sent: success,
          phoneNumber,
          templateUsed: templateName
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error sending WhatsApp template message:', error);
      next(error);
    }
  };

  /**
   * Verifica el estado del servicio de WhatsApp
   * @route GET /api/whatsapp/health
   */
  healthCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isConfigured = !!(config.whatsapp.accessToken && config.whatsapp.phoneNumberId);

      const response: ApiResponse = {
        success: true,
        message: 'Estado del servicio de WhatsApp',
        data: {
          configured: isConfigured,
          phoneNumberId: config.whatsapp.phoneNumberId ? '***' + config.whatsapp.phoneNumberId.slice(-4) : null,
          accessToken: config.whatsapp.accessToken ? 'Configurado' : 'No configurado'
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error checking WhatsApp service health:', error);
      next(error);
    }
  };
}