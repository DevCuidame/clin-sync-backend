/**
 * Servicio de correos para Wompi
 * Maneja el envío de correos relacionados con transacciones de pago
 */

import { EmailService } from '../../notification/services/email.service';
import { TemplateFileService } from '../../notification/services/template-file.service';
import { WompiTransactionStatus, WompiCustomerInfo } from '../payment.interface';
import { 
  WompiEmailConfigUtils, 
  WOMPI_EMAIL_CONFIG, 
  VALIDATION_CONFIG 
} from '../config/wompi-email.config';
import logger from '../../../utils/logger';

export interface WompiEmailData {
  customerName: string;
  customerEmail: string;
  transactionId: string;
  reference: string;
  amount: number;
  currency: string;
  status: WompiTransactionStatus;
  paymentMethod?: string;
  transactionDate: Date;
  packageName?: string;
  companyName?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export interface WompiEmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: any;
}

export class WompiEmailService {
  private emailService: EmailService;
  private templateService: TemplateFileService;
  private static instance: WompiEmailService | null = null;

  private constructor() {
    this.emailService = EmailService.getInstance();
    this.templateService = new TemplateFileService();
  }

  /**
   * Obtener instancia única del servicio
   */
  public static getInstance(): WompiEmailService {
    if (!WompiEmailService.instance) {
      WompiEmailService.instance = new WompiEmailService();
    }
    return WompiEmailService.instance;
  }

  /**
   * Enviar correo de confirmación de pago exitoso
   */
  async sendPaymentConfirmation(data: WompiEmailData): Promise<WompiEmailResult> {
    try {
      // Validar datos antes del envío
      const validation = this.validateEmailData(data);
      if (!validation.isValid) {
        logger.error('Datos de correo inválidos:', validation.errors);
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      const companyConfig = WompiEmailConfigUtils.getCompanyConfig({
        name: data.companyName,
        supportEmail: data.supportEmail,
        supportPhone: data.supportPhone
      });

      const templateData = {
        ...data,
        formattedAmount: this.formatAmount(data.amount, data.currency),
        formattedDate: this.formatDate(data.transactionDate),
        statusText: this.getStatusText(data.status),
        companyName: companyConfig.name,
        supportEmail: companyConfig.supportEmail,
        supportPhone: companyConfig.supportPhone
      };

      const html = await this.templateService.renderTemplate('wompi-payment-confirmation', templateData);
      
      const subject = WompiEmailConfigUtils.getSubjectForStatus(data.status, data.reference);
      
      const result = await this.emailService.sendEmail({
        to: data.customerEmail,
        subject,
        html
      });

      logger.info(`Correo de confirmación de pago enviado a ${data.customerEmail}`, {
        transactionId: data.transactionId,
        reference: data.reference
      });

      return result;
    } catch (error) {
      logger.error('Error al enviar correo de confirmación de pago:', error);
      return {
        success: false,
        error
      };
    }
  }

  /**
   * Enviar correo de pago fallido
   */
  async sendPaymentFailure(data: WompiEmailData): Promise<WompiEmailResult> {
    try {
      // Validar datos antes del envío
      const validation = this.validateEmailData(data);
      if (!validation.isValid) {
        logger.error('Datos de correo inválidos:', validation.errors);
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      const companyConfig = WompiEmailConfigUtils.getCompanyConfig({
        name: data.companyName,
        supportEmail: data.supportEmail,
        supportPhone: data.supportPhone
      });

      const templateData = {
        ...data,
        formattedAmount: this.formatAmount(data.amount, data.currency),
        formattedDate: this.formatDate(data.transactionDate),
        statusText: this.getStatusText(data.status),
        companyName: companyConfig.name,
        supportEmail: companyConfig.supportEmail,
        supportPhone: companyConfig.supportPhone
      };

      const html = await this.templateService.renderTemplate('wompi-payment-failure', templateData);
      
      const subject = WompiEmailConfigUtils.getSubjectForStatus(data.status, data.reference);
      
      const result = await this.emailService.sendEmail({
        to: data.customerEmail,
        subject,
        html
      });

      logger.info(`Correo de pago fallido enviado a ${data.customerEmail}`, {
        transactionId: data.transactionId,
        reference: data.reference
      });

      return result;
    } catch (error) {
      logger.error('Error al enviar correo de pago fallido:', error);
      return {
        success: false,
        error
      };
    }
  }

  /**
   * Enviar correo de pago pendiente
   */
  async sendPaymentPending(data: WompiEmailData): Promise<WompiEmailResult> {
    try {
      // Validar datos antes del envío
      const validation = this.validateEmailData(data);
      if (!validation.isValid) {
        logger.error('Datos de correo inválidos:', validation.errors);
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      const companyConfig = WompiEmailConfigUtils.getCompanyConfig({
        name: data.companyName,
        supportEmail: data.supportEmail,
        supportPhone: data.supportPhone
      });

      const templateData = {
        ...data,
        formattedAmount: this.formatAmount(data.amount, data.currency),
        formattedDate: this.formatDate(data.transactionDate),
        statusText: this.getStatusText(data.status),
        companyName: companyConfig.name,
        supportEmail: companyConfig.supportEmail,
        supportPhone: companyConfig.supportPhone
      };

      const html = await this.templateService.renderTemplate('wompi-payment-pending', templateData);
      
      const subject = WompiEmailConfigUtils.getSubjectForStatus(data.status, data.reference);
      
      const result = await this.emailService.sendEmail({
        to: data.customerEmail,
        subject,
        html
      });

      logger.info(`Correo de pago pendiente enviado a ${data.customerEmail}`, {
        transactionId: data.transactionId,
        reference: data.reference
      });

      return result;
    } catch (error) {
      logger.error('Error al enviar correo de pago pendiente:', error);
      return {
        success: false,
        error
      };
    }
  }

  /**
   * Enviar correo de reembolso
   */
  async sendRefundNotification(data: WompiEmailData & { refundAmount?: number; refundReason?: string }): Promise<WompiEmailResult> {
    try {
      // Validar datos antes del envío
      const validation = this.validateEmailData(data);
      if (!validation.isValid) {
        logger.error('Datos de correo inválidos:', validation.errors);
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      const companyConfig = WompiEmailConfigUtils.getCompanyConfig({
        name: data.companyName,
        supportEmail: data.supportEmail,
        supportPhone: data.supportPhone
      });

      const templateData = {
        ...data,
        formattedAmount: this.formatAmount(data.amount, data.currency),
        formattedRefundAmount: this.formatAmount(data.refundAmount || data.amount, data.currency),
        formattedDate: this.formatDate(data.transactionDate),
        refundDate: this.formatDate(new Date()),
        statusText: 'Reembolsado',
        companyName: companyConfig.name,
        supportEmail: companyConfig.supportEmail,
        supportPhone: companyConfig.supportPhone,
        refundReason: data.refundReason || 'Solicitud del cliente'
      };

      const html = await this.templateService.renderTemplate('wompi-refund-notification', templateData);
      
      const subject = WOMPI_EMAIL_CONFIG.subjects.refund.replace('{reference}', data.reference);
      
      const result = await this.emailService.sendEmail({
        to: data.customerEmail,
        subject,
        html
      });

      logger.info(`Correo de reembolso enviado a ${data.customerEmail}`, {
        transactionId: data.transactionId,
        reference: data.reference
      });

      return result;
    } catch (error) {
      logger.error('Error al enviar correo de reembolso:', error);
      return {
        success: false,
        error
      };
    }
  }

  /**
   * Enviar correo basado en el estado de la transacción
   */
  async sendTransactionStatusEmail(data: WompiEmailData): Promise<WompiEmailResult> {
    // Validar datos antes del envío
    const validation = this.validateEmailData(data);
    if (!validation.isValid) {
      logger.error('Datos de correo inválidos:', validation.errors);
      return {
        success: false,
        error: `Datos inválidos: ${validation.errors.join(', ')}`
      };
    }

    // Verificar si el template existe para este estado
    const templateName = WompiEmailConfigUtils.getTemplateForStatus(data.status);
    if (!templateName) {
      logger.warn(`Estado de transacción no manejado: ${data.status}`);
      return {
        success: false,
        error: `Estado de transacción no soportado: ${data.status}`
      };
    }

    switch (data.status) {
      case WompiTransactionStatus.APPROVED:
        return this.sendPaymentConfirmation(data);
      
      case WompiTransactionStatus.DECLINED:
      case WompiTransactionStatus.ERROR:
        return this.sendPaymentFailure(data);
      
      case WompiTransactionStatus.PENDING:
        return this.sendPaymentPending(data);
      
      default:
        logger.warn(`Estado de transacción no manejado: ${data.status}`);
        return {
          success: false,
          error: `Estado de transacción no soportado: ${data.status}`
        };
    }
  }

  /**
   * Validar datos de correo antes del envío
   */
  private validateEmailData(data: WompiEmailData): { isValid: boolean; errors: string[] } {
    return WompiEmailConfigUtils.validateEmailData({
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      reference: data.reference,
      amount: data.amount
    });
  }

  /**
   * Formatear monto con moneda usando configuración centralizada
   */
  private formatAmount(amount: number, currency: string): string {
    return WompiEmailConfigUtils.formatAmount(amount, currency);
  }

  /**
   * Formatear fecha usando configuración centralizada
   */
  private formatDate(date: Date): string {
    return WompiEmailConfigUtils.formatDate(date);
  }

  /**
   * Obtener texto descriptivo del estado usando configuración centralizada
   */
  private getStatusText(status: WompiTransactionStatus): string {
    return WompiEmailConfigUtils.getStatusText(status);
  }
}