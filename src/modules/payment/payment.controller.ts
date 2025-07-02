/**
 * Controlador de Pagos - Manejo de endpoints para Wompi
 * Implementación con validaciones, manejo de errores y logging
 */

import { Request, Response, NextFunction } from 'express';
import { WompiService } from './wompi.service';
import { PaymentTransactionService } from './payment-transaction.service';
import { AcceptanceTokensService } from './acceptance-tokens.service';
import  logger  from '../../utils/logger';
import { BadRequestError, NotFoundError, InternalServerError } from '../../utils/error-handler';
import {
  CreateTransactionDto,
  CreatePaymentLinkDto,
  ConfirmTransactionDto,
  CreateRefundDto,
  PaymentHistoryFiltersDto,
} from './dto/payment.dto';
import { WompiTransactionStatus, WompiCurrency, CreateWompiTransactionDto, CreatePaymentLinkDto as WompiPaymentLinkDto } from './payment.interface';
import { AppDataSource } from '../../core/config/database';
import { Purchase, PaymentStatus } from '../../models/purchase.model';

// Utility function to handle async errors
const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export class PaymentController {
  constructor(
    private wompiService: WompiService,
    private paymentTransactionService: PaymentTransactionService,
    private acceptanceTokensService: AcceptanceTokensService
  ) {
    // Bind methods to preserve 'this' context
    this.createTransaction = this.createTransaction.bind(this);
    this.createPaymentLink = this.createPaymentLink.bind(this);
    this.confirmTransaction = this.confirmTransaction.bind(this);
    this.getTransactionStatus = this.getTransactionStatus.bind(this);
    this.handleWebhook = this.handleWebhook.bind(this);
    this.getPaymentHistory = this.getPaymentHistory.bind(this);
    this.getPaymentStats = this.getPaymentStats.bind(this);
    this.getAcceptanceTokens = this.getAcceptanceTokens.bind(this);
  }



  /**
   * Obtiene el estado de una transacción de efectivo desde la base de datos local
   */
  private async getCashTransactionStatus(transactionId: string) {
    try {
      // Buscar la compra por transaction_id
      const purchase = await AppDataSource.getRepository(Purchase)
        .createQueryBuilder('purchase')
        .leftJoinAndSelect('purchase.user', 'user')
        .leftJoinAndSelect('purchase.package', 'package')
        .where('purchase.transaction_id = :transactionId', { transactionId })
        .getOne();

      if (!purchase) {
        return null;
      }

      // Mapear el estado de la compra al formato de respuesta de transacción
      return {
        id: transactionId,
        status: this.mapPaymentStatusToTransactionStatus(purchase.payment_status),
        amount_in_cents: Math.round(purchase.amount_paid * 100),
        currency: 'COP', // Asumiendo COP para efectivo
        payment_method: {
          type: 'CASH',
          extra: {
            name: 'Efectivo'
          }
        },
        reference: transactionId,
        customer_email: purchase.payment_details?.customer_info?.email || 'N/A',
        created_at: purchase.purchase_date,
        finalized_at: purchase.payment_status === PaymentStatus.COMPLETED ? purchase.updated_at : null,
        purchase_details: {
          purchase_id: purchase.purchase_id,
          package_name: purchase.package?.package_name,
          user_email: purchase.user?.email,
          expires_at: purchase.expires_at
        }
      };
    } catch (error) {
      logger.error('Error getting cash transaction status', { transactionId, error });
      throw error;
    }
  }

  /**
   * Mapea el estado de pago de la compra al estado de transacción
   */
  private mapPaymentStatusToTransactionStatus(paymentStatus: PaymentStatus): string {
    switch (paymentStatus) {
      case PaymentStatus.PENDING:
        return 'PENDING';
      case PaymentStatus.COMPLETED:
        return 'APPROVED';
      case PaymentStatus.FAILED:
        return 'DECLINED';
      case PaymentStatus.CANCELLED:
        return 'CANCELLED';
      case PaymentStatus.REFUNDED:
        return 'REFUNDED';
      default:
        return 'PENDING';
    }
  }

  async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    const transactionData: CreateTransactionDto = req.body;
    const userId = (req as any).user?.id;

    try {
      if (!userId) {
        throw new BadRequestError('Usuario no autenticado');
      }

      logger.info('Creating transaction', {
        userId,
        purchaseId: transactionData.purchaseId,
        amount: transactionData.amount,
        currency: transactionData.currency,
        paymentMethod: transactionData.paymentMethod
      });

      // Transform DTO to match service interface
      const wompiTransactionData = {
        userId,
        packageId: transactionData.purchaseId,
        amountInCents: Math.round(transactionData.amount * 100),
        currency: transactionData.currency,
        customerInfo: transactionData.customerInfo,
        paymentMethod: transactionData.paymentMethod,
        reference: `TXN-${Date.now()}-${userId}-${Math.random().toString(36).substr(2, 9)}`,
        paymentDescription: transactionData.description,
        shippingAddress: transactionData.shippingAddress ? {
          addressLine1: transactionData.shippingAddress.addressLine,
          addressLine2: undefined,
          country: transactionData.shippingAddress.country,
          region: transactionData.shippingAddress.state || transactionData.shippingAddress.city,
          city: transactionData.shippingAddress.city,
          name: transactionData.customerInfo.fullName,
          phoneNumber: transactionData.customerInfo.phoneNumber || ''
        } : undefined,
        acceptanceToken: transactionData.acceptanceToken,
        acceptPersonalAuth: transactionData.acceptPersonalAuth
      };

      const result = await this.wompiService.createTransaction(wompiTransactionData);

      logger.info('Transaction created successfully', {
        transactionId: result.transactionId,
        userId,
        purchaseId: transactionData.purchaseId
      });

      res.status(201).json({
        success: true,
        message: 'Transacción creada exitosamente',
        data: result
      });
    } catch (error: any) {
      logger.error('Error creating transaction', {
        error: error.message,
        userId,
        purchaseId: transactionData.purchaseId
      });
      
      // Si el servicio retorna un error de validación, enviarlo con status 422
      if (error.response?.status === 422 || (error.message && error.message.includes('validación'))) {
        res.status(422).json({
          success: false,
          message: error.message || 'Error de validación en los datos de la transacción',
          validationErrors: error.validationErrors || {},
          error: 'VALIDATION_ERROR'
        });
        return;
      }
      
      next(error);
    }
  }

  async createPaymentLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const linkData: CreatePaymentLinkDto = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new BadRequestError('Usuario no autenticado');
      }

      logger.info('Creating payment link', {
        userId,
        purchaseId: linkData.purchaseId,
        amount: linkData.amount,
        currency: linkData.currency
      });

      // Transform DTO to match service interface
      const wompiLinkData = {
        userId,
        packageId: linkData.purchaseId,
        amountInCents: Math.round(linkData.amount * 100),
        currency: linkData.currency,
        customerInfo: linkData.customerInfo,
        description: linkData.description,
        redirectUrl: linkData.redirectUrls?.success,
        expiresAt: linkData.expiresAt ? new Date(linkData.expiresAt) : undefined,
        collectShipping: !!linkData.shippingAddress,
        acceptanceToken: linkData.acceptanceToken,
        acceptPersonalAuth: linkData.acceptPersonalAuth
      };

      const result = await this.wompiService.createPaymentLink(wompiLinkData);

      logger.info('Payment link created successfully', {
        transactionId: result.transactionId,
        userId,
        purchaseId: linkData.purchaseId
      });

      res.status(201).json({
        success: true,
        message: 'Enlace de pago creado exitosamente',
        data: result
      });
    } catch (error) {
      logger.error('Error creating payment link', error);
      next(error);
    }
  }

  async confirmTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const confirmationData: ConfirmTransactionDto = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new BadRequestError('Usuario no autenticado');
      }

      logger.info('Confirming transaction', {
        transactionId: id,
        userId
      });

      // Transform DTO to match service interface
      const wompiConfirmData = {
        transactionId: id,
        paymentSourceId: confirmationData.paymentSourceToken,
        customerEmail: (req as any).user?.email,
        acceptanceToken: confirmationData.verificationCode
      };

      const result = await this.wompiService.confirmTransaction(wompiConfirmData);

      logger.info('Transaction confirmed successfully', {
        transactionId: id,
        userId,
        status: result.status
      });

      res.status(200).json({
        success: true,
        message: 'Transacción confirmada exitosamente',
        data: result
      });
    } catch (error) {
      logger.error('Error confirming transaction', error);
      next(error);
    }
  }

  /**
   * Obtiene el estado de una transacción
   */
  getTransactionStatus = catchAsync(async (req: Request, res: Response) => {
    const { transactionId } = req.params;
    
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'ID de transacción es requerido'
      });
    }

    logger.info('Getting transaction status', { transactionId });

    // Verificar si es una transacción de efectivo
    if (transactionId.startsWith('CASH-')) {
      // Para transacciones de efectivo, consultar la base de datos local
      const cashTransaction = await this.getCashTransactionStatus(transactionId);
      
      if (!cashTransaction) {
        return res.status(404).json({
          success: false,
          message: 'Transacción de efectivo no encontrada'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Estado de transacción de efectivo obtenido exitosamente',
        data: cashTransaction
      });
    }

    // Para transacciones de Wompi, usar el servicio normal
    const transaction = await this.wompiService.getTransactionStatus(transactionId);

    res.status(200).json({
      success: true,
      message: 'Estado de transacción obtenido exitosamente',
      data: transaction
    });
  });

  async createRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refundData: CreateRefundDto = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new BadRequestError('Usuario no autenticado');
      }

      logger.info('Creating refund', {
        transactionId: refundData.transactionId,
        amount: refundData.amount,
        userId
      });

      const result = await this.wompiService.createRefund(refundData);

      logger.info('Refund created successfully', {
        refundId: result.refundId,
        transactionId: refundData.transactionId,
        userId
      });

      res.status(201).json({
        success: true,
        message: 'Reembolso creado exitosamente',
        data: result
      });
    } catch (error) {
      logger.error('Error creating refund', error);
      next(error);
    }
  }

  /**
   * Maneja webhooks de Wompi
   */
  handleWebhook = catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers['x-signature'] as string;
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Firma del webhook requerida'
      });
    }

    logger.info('Processing Wompi webhook', {
      event: req.body.event,
      signature: signature.substring(0, 10) + '...'
    });

    await this.wompiService.processWebhook(req.body, signature);

    res.status(200).json({
      success: true,
      message: 'Webhook procesado exitosamente'
    });
  });

  /**
   * Obtiene la configuración pública de Wompi
   */
  getPublicConfig = catchAsync(async (req: Request, res: Response) => {
    const config = this.wompiService.getPublicConfig();

    res.status(200).json({
      success: true,
      message: 'Configuración obtenida exitosamente',
      data: config
    });
  });

  async getPaymentHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: PaymentHistoryFiltersDto = req.query as any;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new BadRequestError('Usuario no autenticado');
      }

      logger.info('Getting payment history', {
        userId,
        filters
      });

      // Transform DTO to match service interface
      const transformedFilters = {
        ...filters,
        userId,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined
      };

      const result = await this.paymentTransactionService.getPaymentHistory(transformedFilters);

      res.status(200).json({
        success: true,
        message: 'Historial de pagos obtenido exitosamente',
        data: result.transactions,
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 10,
          total: result.total,
          totalPages: Math.ceil(result.total / (filters.limit || 10))
        }
      });
    } catch (error) {
      logger.error('Error getting payment history', error);
      next(error);
    }
  }

  /**
   * Obtiene estadísticas de pagos
   */
  getPaymentStats = catchAsync(async (req: Request, res: Response) => {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const currency = req.query.currency as WompiCurrency || WompiCurrency.COP;

    logger.info('Getting payment statistics', { startDate, endDate, currency });

    const stats = await this.paymentTransactionService.getPaymentStats({
      startDate,
      endDate,
      currency
    });

    res.status(200).json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: stats
    });
  });

  /**
   * Obtiene información del cliente en Wompi
   */
  getCustomerInfo = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email del cliente es requerido'
      });
    }

    logger.info('Getting customer info', { email });

    // Aquí se implementaría la lógica para obtener información del cliente
    // Por ahora retornamos un placeholder
    res.status(200).json({
      success: true,
      message: 'Información del cliente obtenida exitosamente',
      data: {
        email,
        hasPaymentMethods: false,
        totalTransactions: 0
      }
    });
  });

  /**
   * Obtiene los tokens de aceptación de Wompi
   */
  getAcceptanceTokens = catchAsync(async (req: Request, res: Response) => {
    const result = await this.acceptanceTokensService.getAcceptanceTokens();
    
    if (!result.success) {
      throw new InternalServerError(result.error || 'Error obteniendo tokens de aceptación');
    }

    res.status(200).json({
      success: true,
      message: 'Tokens de aceptación obtenidos exitosamente',
      data: result.data
    });
  });
}