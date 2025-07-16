/**
 * Controlador para pruebas del sistema de correos electrónicos
 * Proporciona endpoints para verificar el funcionamiento del sistema de email
 */

import { Request, Response, NextFunction } from 'express';
import { EmailService } from '../services/email.service';
import { sendTestEmail, sendMultipleTestEmails } from '../../../scripts/test-email-system';
import logger from '../../../utils/logger';
import { ApiResponse } from 'src/core/interfaces/response.interface';

export class EmailTestController {
  private emailService: EmailService;

  constructor() {
    this.emailService = EmailService.getInstance();
  }

  /**
   * Verificar estado del sistema de correos
   * @route GET /api/email-test/status
   */
  checkEmailSystemStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('🔍 Verificando estado del sistema de correos...');
      
      const connectionOk = await this.emailService.verifyConnection();
      
      const response: ApiResponse = {
        success: connectionOk,
        message: connectionOk 
          ? 'Sistema de correos operativo' 
          : 'Sistema de correos no disponible',
        data: {
          emailSystemStatus: connectionOk ? 'operational' : 'error',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development'
        },
        timestamp: new Date().toISOString()
      };
      
      res.status(connectionOk ? 200 : 503).json(response);
    } catch (error) {
      logger.error('Error al verificar estado del sistema de correos:', error);
      next(error);
    }
  };

  /**
   * Enviar correo de prueba simple
   * @route POST /api/email-test/send-test
   */
  sendTestEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { to, subject, message } = req.body;
      
      logger.info(`📧 Enviando correo de prueba a: ${to || 'dirección por defecto'}`);
      
      const result = await sendTestEmail({
        to: to || undefined,
        subject: subject || undefined,
        message: message || undefined
      });
      
      const response: ApiResponse = {
        success: result.success,
        message: result.success 
          ? 'Correo de prueba enviado exitosamente' 
          : 'Error al enviar correo de prueba',
        data: {
          messageId: result.messageId,
          previewUrl: result.previewUrl,
          error: result.error
        },
        timestamp: new Date().toISOString()
      };
      
      res.status(result.success ? 200 : 500).json(response);
    } catch (error) {
      logger.error('Error al enviar correo de prueba:', error);
      next(error);
    }
  };

  /**
   * Enviar correo de verificación del sistema
   * @route POST /api/email-test/system-verification
   */
  sendSystemVerificationEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { to } = req.body;
      
      if (!to) {
        const response: ApiResponse = {
          success: false,
          message: 'El campo "to" es requerido',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      logger.info(`🔧 Enviando correo de verificación del sistema a: ${to}`);
      
      const systemInfo = {
        timestamp: new Date().toLocaleString('es-CO'),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version
      };
      
      const verificationMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h1 style="color: #2c3e50; text-align: center;">🏥 ClinSync - Verificación del Sistema</h1>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h2 style="color: #155724; margin-top: 0;">✅ Sistema de Correos Operativo</h2>
            <p style="color: #155724; margin-bottom: 0;">El sistema de envío de correos electrónicos está funcionando correctamente.</p>
          </div>
          
          <h3 style="color: #2c3e50;">📊 Información del Sistema:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Fecha y Hora:</td>
              <td style="padding: 10px; border: 1px solid #dee2e6;">${systemInfo.timestamp}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Entorno:</td>
              <td style="padding: 10px; border: 1px solid #dee2e6;">${systemInfo.environment}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Versión:</td>
              <td style="padding: 10px; border: 1px solid #dee2e6;">${systemInfo.version}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Node.js:</td>
              <td style="padding: 10px; border: 1px solid #dee2e6;">${systemInfo.nodeVersion}</td>
            </tr>
          </table>
          
          <h3 style="color: #2c3e50;">🔧 Funcionalidades Verificadas:</h3>
          <ul style="color: #495057;">
            <li>✅ Configuración de SMTP</li>
            <li>✅ Conexión al servidor de correo</li>
            <li>✅ Envío de correos HTML</li>
            <li>✅ Plantillas de correo</li>
            <li>✅ Logging del sistema</li>
          </ul>
          
          <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #495057;"><strong>Nota:</strong> Este correo fue generado automáticamente por el sistema ClinSync para verificar el correcto funcionamiento del módulo de notificaciones por correo electrónico.</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          <p style="text-align: center; color: #6c757d; font-size: 12px;">ClinSync Backend System | Powered by Node.js</p>
        </div>
      `;
      
      const result = await this.emailService.sendEmail({
        to,
        subject: '🔧 ClinSync - Verificación del Sistema de Correos',
        html: verificationMessage,
        text: `ClinSync - Verificación del Sistema\n\nEl sistema de correos está funcionando correctamente.\nFecha: ${systemInfo.timestamp}\nEntorno: ${systemInfo.environment}`
      });
      
      const response: ApiResponse = {
        success: result.success,
        message: result.success 
          ? 'Correo de verificación del sistema enviado exitosamente' 
          : 'Error al enviar correo de verificación',
        data: {
          messageId: result.messageId,
          previewUrl: result.previewUrl,
          systemInfo,
          error: result.error
        },
        timestamp: new Date().toISOString()
      };
      
      res.status(result.success ? 200 : 500).json(response);
    } catch (error) {
      logger.error('Error al enviar correo de verificación del sistema:', error);
      next(error);
    }
  };

  /**
   * Enviar múltiples correos de prueba
   * @route POST /api/email-test/send-multiple
   */
  sendMultipleTestEmails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { emails } = req.body;
      
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'El campo "emails" debe ser un array con al menos una dirección de correo',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      logger.info(`📧 Enviando correos de prueba a ${emails.length} direcciones`);
      
      const result = await sendMultipleTestEmails(emails);
      
      const response: ApiResponse = {
        success: result.successful > 0,
        message: `Enviados ${result.successful} de ${result.totalSent} correos exitosamente`,
        data: {
          totalSent: result.totalSent,
          successful: result.successful,
          failed: result.failed,
          results: result.results
        },
        timestamp: new Date().toISOString()
      };
      
      res.status(result.successful > 0 ? 200 : 500).json(response);
    } catch (error) {
      logger.error('Error al enviar múltiples correos de prueba:', error);
      next(error);
    }
  };

  /**
   * Obtener información del sistema de correos
   * @route GET /api/email-test/info
   */
  getEmailSystemInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const connectionStatus = await this.emailService.verifyConnection();
      
      const systemInfo = {
        emailSystem: {
          status: connectionStatus ? 'operational' : 'error',
          service: 'NodeMailer',
          environment: process.env.NODE_ENV || 'development'
        },
        server: {
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '1.0.0',
          nodeVersion: process.version,
          platform: process.platform
        },
        features: {
          htmlEmails: true,
          templates: true,
          attachments: true,
          multipleRecipients: true,
          testMode: process.env.NODE_ENV !== 'production'
        }
      };
      
      const response: ApiResponse = {
        success: true,
        message: 'Información del sistema de correos obtenida exitosamente',
        data: systemInfo,
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error al obtener información del sistema de correos:', error);
      next(error);
    }
  };
}