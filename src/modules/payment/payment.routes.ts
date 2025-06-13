/**
 * Rutas del módulo de pagos con Wompi
 * Implementación con middlewares de autenticación y validación
 */

import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/role.middleware';
import { rateLimitMiddleware } from '../../middlewares/rateLimit.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { validateDto } from '../../middlewares/validator.middleware';
import { validateContentType, validateBodySize } from '../../middlewares/validation.middleware';
import { SystemRoles } from '../../middlewares/role.middleware';
import {
  CreateTransactionDto,
  CreatePaymentLinkDto,
  ConfirmTransactionDto,
  CreateRefundDto,
  PaymentHistoryFiltersDto,
  TransactionIdParamDto,
  WompiWebhookDto,
} from './dto/payment.dto';

const router = Router();
import { WompiService } from './wompi.service';
import { PaymentTransactionService } from './payment-transaction.service';
import { AcceptanceTokensService } from './acceptance-tokens.service';

const wompiService = new WompiService();
const paymentTransactionService = new PaymentTransactionService();
const acceptanceTokensService = new AcceptanceTokensService();
const paymentController = new PaymentController(wompiService, paymentTransactionService, acceptanceTokensService);

// Middleware de rate limiting específico para pagos
const paymentRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas solicitudes de pago. Intenta nuevamente en 15 minutos.'
  }
});

// Middleware de rate limiting para webhooks
const webhookRateLimit = rateLimitMiddleware({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // máximo 100 webhooks por minuto
  message: {
    success: false,
    message: 'Demasiados webhooks recibidos'
  }
});

/**
 * @route POST /api/payments/transactions
 * @desc Crear una nueva transacción de pago
 * @access Private (Usuario autenticado)
 */
router.post(
  '/transactions',
  authMiddleware,
  paymentRateLimit,
  validateContentType(['application/json']),
  validateBodySize(10 * 1024),
  validateDto(CreateTransactionDto),
  paymentController.createTransaction
);

/**
 * @route POST /api/payments/payment-links
 * @desc Crear un link de pago
 * @access Private (Usuario autenticado)
 */
router.post(
  '/payment-links',
  authMiddleware,
  paymentRateLimit,
  validateContentType(['application/json']),
  validateBodySize(10 * 1024),
  validateDto(CreatePaymentLinkDto),
  paymentController.createPaymentLink
);

/**
 * @route POST /api/payments/transactions/:transactionId/confirm
 * @desc Confirmar una transacción de pago
 * @access Private (Usuario autenticado)
 */
router.post(
  '/transactions/:transactionId/confirm',
  authMiddleware,
  paymentRateLimit,
  validateContentType(['application/json']),
  validateBodySize(5 * 1024),
  validateDto(TransactionIdParamDto, 'params'),
  validateDto(ConfirmTransactionDto),
  paymentController.confirmTransaction
);

/**
 * @route GET /api/payments/transactions/:transactionId/status
 * @desc Obtener el estado de una transacción
 * @access Private (Usuario autenticado)
 */
router.get(
  '/transactions/:transactionId/status',
  authMiddleware,
  paymentController.getTransactionStatus
);

/**
 * @route POST /api/payments/transactions/:transactionId/refund
 * @desc Crear un reembolso
 * @access Private (Admin o Professional)
 */
router.post(
  '/transactions/:transactionId/refund',
  authMiddleware,
  restrictTo([SystemRoles.ADMIN, SystemRoles.PROFESSIONAL]),
  validateDto(CreateRefundDto),
  validateRequest,
  paymentController.createRefund
);

/**
 * @route POST /api/payments/webhooks
 * @desc Manejar webhooks de Wompi
 * @access Public (sin autenticación, pero con verificación de firma)
 */
router.post(
  '/webhooks',
  webhookRateLimit,
  validateContentType(['application/json']),
  validateBodySize(1024 * 1024),
  validateDto(WompiWebhookDto),
  paymentController.handleWebhook
);

/**
 * @route GET /api/payments/config
 * @desc Obtener configuración pública de Wompi
 * @access Public
 */
router.get(
  '/config',
  paymentController.getPublicConfig
);

/**
 * @route GET /api/payments/history
 * @desc Obtener historial de pagos
 * @access Private (Usuario autenticado)
 */
router.get(
  '/history',
  authMiddleware,
  validateDto(PaymentHistoryFiltersDto, 'query'),
  validateRequest,
  paymentController.getPaymentHistory
);

/**
 * @route GET /api/payments/stats
 * @desc Obtener estadísticas de pagos
 * @access Private (Admin o Professional)
 */
router.get(
  '/stats',
  authMiddleware,
  restrictTo([SystemRoles.ADMIN, SystemRoles.PROFESSIONAL]),
  paymentController.getPaymentStats
);

/**
 * @route GET /api/payments/acceptance-tokens
 * @desc Obtener tokens de aceptación
 * @access Private (Usuario autenticado)
 */
router.get(
  '/acceptance-tokens',
  authMiddleware,
  paymentController.getAcceptanceTokens
);

/**
 * @route GET /api/payments/customers/:email
 * @desc Obtener información del cliente
 * @access Private (Admin o Professional)
 */
router.get(
  '/customers/:email',
  authMiddleware,
  restrictTo([SystemRoles.ADMIN, SystemRoles.PROFESSIONAL]),
  paymentController.getCustomerInfo
);

// Rutas adicionales para administración

/**
 * @route GET /api/payments/admin/transactions/pending
 * @desc Obtener transacciones pendientes (para seguimiento)
 * @access Private (Admin)
 */
router.get(
  '/admin/transactions/pending',
  authMiddleware,
  restrictTo([SystemRoles.ADMIN]),
  async (req, res) => {
    try {
      const { PaymentTransactionService } = await import('./payment-transaction.service');
      const transactionService = new PaymentTransactionService();
      
      const olderThanMinutes = req.query.olderThan ? 
        parseInt(req.query.olderThan as string) : 30;
      
      const pendingTransactions = await transactionService.getPendingTransactions(olderThanMinutes);
      
      res.status(200).json({
        success: true,
        message: 'Transacciones pendientes obtenidas exitosamente',
        data: {
          transactions: pendingTransactions,
          count: pendingTransactions.length,
          olderThanMinutes
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo transacciones pendientes',
        error: (error as Error).message
      });
    }
  }
);

/**
 * @route GET /api/payments/admin/stats/payment-methods
 * @desc Obtener estadísticas por método de pago
 * @access Private (Admin)
 */
router.get(
  '/admin/stats/payment-methods',
  authMiddleware,
  restrictTo([SystemRoles.ADMIN]),
  async (req, res) => {
    try {
      const { PaymentTransactionService } = await import('./payment-transaction.service');
      const transactionService = new PaymentTransactionService();
      
      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        currency: req.query.currency as any || 'COP'
      };
      
      const summary = await transactionService.getPaymentMethodSummary(filters);
      
      res.status(200).json({
        success: true,
        message: 'Estadísticas por método de pago obtenidas exitosamente',
        data: summary
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas por método de pago',
        error: (error as Error).message
      });
    }
  }
);

/**
 * @route GET /api/payments/admin/stats/daily
 * @desc Obtener estadísticas diarias
 * @access Private (Admin)
 */
router.get(
  '/admin/stats/daily',
  authMiddleware,
  restrictTo([SystemRoles.ADMIN]),
  async (req, res) => {
    try {
      const { PaymentTransactionService } = await import('./payment-transaction.service');
      const transactionService = new PaymentTransactionService();
      
      const startDate = req.query.startDate ? 
        new Date(req.query.startDate as string) : 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 días atrás
      
      const endDate = req.query.endDate ? 
        new Date(req.query.endDate as string) : 
        new Date();
      
      const currency = req.query.currency as any || 'COP';
      
      const dailyStats = await transactionService.getDailyStats(startDate, endDate, currency);
      
      res.status(200).json({
        success: true,
        message: 'Estadísticas diarias obtenidas exitosamente',
        data: {
          stats: dailyStats,
          period: { startDate, endDate },
          currency
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas diarias',
        error: (error as Error).message
      });
    }
  }
);

/**
 * @route GET /api/payments/admin/transactions/status/:status
 * @desc Obtener transacciones por estado
 * @access Private (Admin)
 */
router.get(
  '/admin/transactions/status/:status',
  authMiddleware,
  restrictTo([SystemRoles.ADMIN]),
  async (req, res) => {
    try {
      const { PaymentTransactionService } = await import('./payment-transaction.service');
      const transactionService = new PaymentTransactionService();
      
      const { status } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const transactions = await transactionService.getTransactionsByStatus(status as any, limit);
      
      res.status(200).json({
        success: true,
        message: `Transacciones con estado ${status} obtenidas exitosamente`,
        data: {
          transactions,
          count: transactions.length,
          status,
          limit
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo transacciones por estado',
        error: (error as Error).message
      });
    }
  }
);

/**
 * @route PUT /api/payments/admin/transactions/:externalId/status
 * @desc Actualizar manualmente el estado de una transacción
 * @access Private (Admin)
 */
router.put(
  '/admin/transactions/:externalId/status',
  authMiddleware,
  restrictTo([SystemRoles.ADMIN]),
  async (req, res) => {
    try {
      const { PaymentTransactionService } = await import('./payment-transaction.service');
      const transactionService = new PaymentTransactionService();
      
      const { externalId } = req.params;
      const { status, reason } = req.body;
      
      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Estado es requerido'
        });
      }
      
      const gatewayResponse = {
        manualUpdate: true,
        reason: reason || 'Actualización manual por administrador',
        updatedBy: req.user?.id,
        updatedAt: new Date().toISOString()
      };
      
      const updatedTransaction = await transactionService.updateTransactionStatus(
        externalId,
        status,
        gatewayResponse
      );
      
      if (!updatedTransaction) {
        return res.status(404).json({
          success: false,
          message: 'Transacción no encontrada'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Estado de transacción actualizado exitosamente',
        data: updatedTransaction
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error actualizando estado de transacción',
        error: (error as Error).message
      });
    }
  }
);

export { router as paymentRoutes };