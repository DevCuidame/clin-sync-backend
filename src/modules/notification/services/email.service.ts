// src/modules/notification/services/email.service.ts
import nodemailer from 'nodemailer';
import { EmailConfig, EmailAttachment } from '../notification.interface';
import config from '../../../core/config/environment';
import logger from '../../../utils/logger';

/**
 * Servicio para el envío de emails
 * Implementa el patrón Singleton para garantizar una única instancia
 */
export class EmailService {
  private transporter!: nodemailer.Transporter;
  private defaultFromEmail: string;
  private initializationPromise: Promise<void> | null = null;
  
  // Instancia única de EmailService
  private static instance: EmailService | null = null;

  /**
   * Constructor privado para evitar crear instancias directamente
   * Use EmailService.getInstance() en su lugar
   */
  private constructor() {
    this.defaultFromEmail = config.env === 'production' 
      ? config.email.from 
      : 'contacto@esmart-tek.com';
    
    // Inicializar el transporter pero sin esperar
    this.initializeTransporter();
    
    logger.debug('📧 EmailService constructor llamado');
  }

  /**
   * Método para obtener la instancia única del servicio
   */
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      logger.debug('📧 Creando nueva instancia de EmailService');
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Inicializa el transportador de email según el entorno
   */
  private initializeTransporter(): Promise<void> {
    // Si ya hay una inicialización en curso, devolver esa promesa
    if (this.initializationPromise) {
      logger.debug('📧 Reutilizando inicialización existente del transporter');
      return this.initializationPromise;
    }

    logger.debug('📧 Iniciando configuración del transporter de email');
    
    // Crear una nueva promesa de inicialización
    this.initializationPromise = (async () => {
      if (config.env === 'development') {
        // Configuración para producción usando SMTP real
        logger.debug('📧 Configurando transporter para producción');
        this.transporter = nodemailer.createTransport({
          host: config.email.host,
          port: config.email.port,
          secure: config.email.secure,
          auth: {
            user: config.email.user,
            pass: config.email.password,
          },
        });
        logger.info('📧 Servicio de email configurado para producción');
      } else {
        // Para desarrollo, usar un servicio de prueba
        logger.debug('📧 Configurando transporter para desarrollo');
        await this.setupDevTransporter();
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Configura un transporter para entorno de desarrollo
   */
  private async setupDevTransporter() {
    try {
      // Crear cuenta de prueba en Ethereal
      logger.debug('📧 Creando cuenta de prueba en Ethereal');
      const testAccount = await nodemailer.createTestAccount();
      
      // Crear transporter usando la cuenta de prueba
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      logger.info(`📧 Servicio de email configurado para desarrollo con cuenta: ${testAccount.user}`);
    } catch (error) {
      logger.error('📧 Error al configurar servicio de email para desarrollo:', error);
      
      // Configuración fallback para desarrollo
      logger.debug('📧 Usando configuración fallback con localhost:1025');
      this.transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        secure: false,
        ignoreTLS: true,
      });
    }
  }

  /**
   * Envía un email
   * @param emailConfig Configuración del email
   * @returns Información del envío
   */
  async sendEmail(emailConfig: EmailConfig): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: any }> {
    try {
      // Asegurarse de que el transporter esté inicializado completamente
      await this.initializeTransporter();
      
      // Validar datos mínimos
      if (!emailConfig.to || !emailConfig.subject) {
        throw new Error('Destinatario y asunto son obligatorios');
      }
      
      // Si no se proporciona contenido, añadir un mensaje por defecto
      if (!emailConfig.text && !emailConfig.html) {
        emailConfig.text = 'Este es un mensaje sin contenido.';
      }
      
      // Configuración del email
      const mailOptions = {
        from: this.defaultFromEmail,
        to: emailConfig.to,
        cc: emailConfig.cc,
        subject: emailConfig.subject,
        text: emailConfig.text,
        html: emailConfig.html,
        attachments: emailConfig.attachments,
      };
      
      // Enviar email
      logger.debug(`📧 Enviando email a: ${emailConfig.to}`);
      const info = await this.transporter.sendMail(mailOptions);
      
      // En desarrollo, mostrar URL de vista previa
      let previewUrl;
      if (config.env !== 'production') {
        previewUrl = nodemailer.getTestMessageUrl(info);
        logger.info(`📧 Vista previa del email: ${previewUrl}`);
      }
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || undefined,
      };
    } catch (error) {
      logger.error('📧 Error al enviar email:', error);
      return {
        success: false,
        error
      };
    }
  }

  /**
   * Genera y envía un email a partir de una plantilla HTML y datos
   * @param to Destinatario
   * @param subject Asunto
   * @param template Plantilla HTML
   * @param data Datos para la plantilla
   * @param cc Destinatarios en copia
   * @param attachments Archivos adjuntos
   * @returns Información del envío
   */
  async sendTemplatedEmail(
    to: string, 
    subject: string, 
    template: string, 
    data: Record<string, any>,
    cc?: string[],
    attachments?: EmailAttachment[]
  ): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: any }> {
    try {
      // Renderizar la plantilla con los datos
      const html = this.renderTemplate(template, data);
      
      // Enviar email con la plantilla renderizada
      return await this.sendEmail({
        to,
        cc,
        subject,
        html,
        attachments
      });
    } catch (error) {
      logger.error('📧 Error al enviar email con plantilla:', error);
      return {
        success: false,
        error
      };
    }
  }

  /**
   * Renderiza una plantilla HTML simple
   * @param template Plantilla HTML con placeholders {{variable}}
   * @param data Datos para reemplazar en la plantilla
   * @returns HTML renderizado
   */
  private renderTemplate(template: string, data: Record<string, any>): string {
    // Reemplazar placeholders en la plantilla
    let rendered = template;
    
    // Buscar todas las variables en la plantilla (formato {{variable}})
    const variableMatches = template.match(/{{([^}]+)}}/g);
    
    if (variableMatches) {
      // Eliminar duplicados
      const uniqueVariables = [...new Set(variableMatches)];
      
      // Reemplazar cada variable por su valor
      uniqueVariables.forEach(match => {
        const variableName = match.replace(/{{|}}/g, '');
        const value = data[variableName] !== undefined ? data[variableName] : '';
        rendered = rendered.replace(new RegExp(match, 'g'), value);
      });
    }
    
    return rendered;
  }

  /**
   * Verifica la conexión al servidor de email
   * @returns true si la conexión es exitosa
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.initializeTransporter();
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('📧 Error al verificar conexión SMTP:', error);
      return false;
    }
  }
}