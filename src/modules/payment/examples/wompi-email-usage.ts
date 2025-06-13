/**
 * Ejemplos de uso del sistema de correos de Wompi
 * Este archivo muestra cómo integrar el servicio de correos en diferentes escenarios
 */

import { WompiEmailService, WompiEmailData } from '../services/wompi-email.service';
import { WompiTransactionStatus } from '../payment.interface';
import logger from '../../../utils/logger';

/**
 * Ejemplo 1: Enviar correo después de procesar un webhook de Wompi
 */
export async function handleWompiWebhook(webhookData: any) {
  try {
    const emailService = WompiEmailService.getInstance();
    
    // Extraer datos del webhook
    const transaction = webhookData.data.transaction;
    
    const emailData: WompiEmailData = {
      customerName: transaction.customer_data?.full_name || 'Cliente',
      customerEmail: transaction.customer_email,
      transactionId: transaction.id,
      reference: transaction.reference,
      amount: transaction.amount_in_cents,
      currency: transaction.currency,
      status: transaction.status as WompiTransactionStatus,
      paymentMethod: transaction.payment_method?.type,
      transactionDate: new Date(transaction.created_at),
      packageName: 'Consulta Médica Premium', // Obtener del contexto
      companyName: 'Cuidame Health',
      supportEmail: 'soporte@cuidamehealth.com',
      supportPhone: '+57 300 123 4567'
    };
    
    // Enviar correo automático basado en el estado
    const result = await emailService.sendTransactionStatusEmail(emailData);
    
    if (result.success) {
      logger.info(`Correo de transacción enviado exitosamente`, {
        transactionId: emailData.transactionId,
        status: emailData.status,
        email: emailData.customerEmail
      });
    } else {
      logger.error(`Error al enviar correo de transacción`, {
        transactionId: emailData.transactionId,
        error: result.error
      });
    }
    
  } catch (error) {
    logger.error('Error al procesar webhook de Wompi:', error);
  }
}

/**
 * Ejemplo 2: Enviar correo de confirmación manual
 */
export async function sendPaymentConfirmationManual(
  transactionId: string,
  customerEmail: string,
  customerName: string,
  amount: number,
  reference: string
) {
  try {
    const emailService = WompiEmailService.getInstance();
    
    const emailData: WompiEmailData = {
      customerName,
      customerEmail,
      transactionId,
      reference,
      amount,
      currency: 'COP',
      status: WompiTransactionStatus.APPROVED,
      transactionDate: new Date(),
      packageName: 'Consulta Médica',
      companyName: 'Cuidame Health'
    };
    
    const result = await emailService.sendPaymentConfirmation(emailData);
    
    return result;
  } catch (error) {
    logger.error('Error al enviar confirmación manual:', error);
    return { success: false, error };
  }
}

/**
 * Ejemplo 3: Enviar correo de reembolso
 */
export async function sendRefundNotificationExample(
  originalTransactionId: string,
  customerEmail: string,
  customerName: string,
  originalAmount: number,
  refundAmount: number,
  refundReason: string
) {
  try {
    const emailService = WompiEmailService.getInstance();
    
    const emailData: WompiEmailData & { refundAmount: number; refundReason: string } = {
      customerName,
      customerEmail,
      transactionId: originalTransactionId,
      reference: `REF-${originalTransactionId}`,
      amount: originalAmount,
      currency: 'COP',
      status: WompiTransactionStatus.VOIDED,
      transactionDate: new Date(),
      refundAmount,
      refundReason,
      companyName: 'Cuidame Health'
    };
    
    const result = await emailService.sendRefundNotification(emailData);
    
    return result;
  } catch (error) {
    logger.error('Error al enviar notificación de reembolso:', error);
    return { success: false, error };
  }
}

/**
 * Ejemplo 4: Integración con el servicio de pagos existente
 */
export class WompiPaymentEmailIntegration {
  private emailService: WompiEmailService;
  
  constructor() {
    this.emailService = WompiEmailService.getInstance();
  }
  
  /**
   * Enviar correo después de crear una transacción
   */
  async notifyTransactionCreated(
    transactionData: {
      id: string;
      reference: string;
      amount: number;
      currency: string;
      customerEmail: string;
      customerName: string;
      packageName?: string;
    }
  ) {
    const emailData: WompiEmailData = {
      customerName: transactionData.customerName,
      customerEmail: transactionData.customerEmail,
      transactionId: transactionData.id,
      reference: transactionData.reference,
      amount: transactionData.amount,
      currency: transactionData.currency,
      status: WompiTransactionStatus.PENDING,
      transactionDate: new Date(),
      packageName: transactionData.packageName
    };
    
    return await this.emailService.sendPaymentPending(emailData);
  }
  
  /**
   * Enviar correo cuando una transacción es aprobada
   */
  async notifyTransactionApproved(
    transactionData: {
      id: string;
      reference: string;
      amount: number;
      currency: string;
      customerEmail: string;
      customerName: string;
      paymentMethod?: string;
      packageName?: string;
    }
  ) {
    const emailData: WompiEmailData = {
      customerName: transactionData.customerName,
      customerEmail: transactionData.customerEmail,
      transactionId: transactionData.id,
      reference: transactionData.reference,
      amount: transactionData.amount,
      currency: transactionData.currency,
      status: WompiTransactionStatus.APPROVED,
      paymentMethod: transactionData.paymentMethod,
      transactionDate: new Date(),
      packageName: transactionData.packageName
    };
    
    return await this.emailService.sendPaymentConfirmation(emailData);
  }
  
  /**
   * Enviar correo cuando una transacción es rechazada
   */
  async notifyTransactionDeclined(
    transactionData: {
      id: string;
      reference: string;
      amount: number;
      currency: string;
      customerEmail: string;
      customerName: string;
      paymentMethod?: string;
      packageName?: string;
    }
  ) {
    const emailData: WompiEmailData = {
      customerName: transactionData.customerName,
      customerEmail: transactionData.customerEmail,
      transactionId: transactionData.id,
      reference: transactionData.reference,
      amount: transactionData.amount,
      currency: transactionData.currency,
      status: WompiTransactionStatus.DECLINED,
      paymentMethod: transactionData.paymentMethod,
      transactionDate: new Date(),
      packageName: transactionData.packageName
    };
    
    return await this.emailService.sendPaymentFailure(emailData);
  }
}

/**
 * Ejemplo 5: Uso en un controlador de pagos
 */
export async function paymentControllerExample() {
  const emailIntegration = new WompiPaymentEmailIntegration();
  
  // Simular datos de una transacción
  const transactionData = {
    id: 'txn_12345',
    reference: 'REF-2024-001',
    amount: 50000, // $500 COP en centavos
    currency: 'COP',
    customerEmail: 'cliente@ejemplo.com',
    customerName: 'Juan Pérez',
    paymentMethod: 'CARD',
    packageName: 'Consulta Médica General'
  };
  
  // Enviar correo de transacción pendiente
  await emailIntegration.notifyTransactionCreated(transactionData);
  
  // Simular aprobación después de un tiempo
  setTimeout(async () => {
    await emailIntegration.notifyTransactionApproved(transactionData);
  }, 5000);
}

/**
 * Ejemplo 6: Manejo de errores y reintentos
 */
export async function sendEmailWithRetry(
  emailData: WompiEmailData,
  maxRetries: number = 3
) {
  const emailService = WompiEmailService.getInstance();
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await emailService.sendTransactionStatusEmail(emailData);
      
      if (result.success) {
        logger.info(`Correo enviado exitosamente en intento ${attempt}`);
        return result;
      }
      
      lastError = result.error;
      logger.warn(`Intento ${attempt} fallido, reintentando...`, result.error);
      
      // Esperar antes del siguiente intento
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
    } catch (error) {
      lastError = error;
      logger.error(`Error en intento ${attempt}:`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  logger.error(`Falló el envío de correo después de ${maxRetries} intentos`, lastError);
  return { success: false, error: lastError };
}