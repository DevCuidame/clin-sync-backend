"use strict";
/**
 * Rutas del módulo de pagos con Wompi
 * Implementación con middlewares de autenticación y validación
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const express_1 = require("express");
const payment_controller_1 = require("./payment.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const rateLimit_middleware_1 = require("../../middlewares/rateLimit.middleware");
const validation_middleware_1 = require("../../middlewares/validation.middleware");
const validator_middleware_1 = require("../../middlewares/validator.middleware");
const validation_middleware_2 = require("../../middlewares/validation.middleware");
const role_middleware_2 = require("../../middlewares/role.middleware");
const payment_dto_1 = require("./dto/payment.dto");
const router = (0, express_1.Router)();
exports.paymentRoutes = router;
const wompi_service_1 = require("./wompi.service");
const payment_transaction_service_1 = require("./payment-transaction.service");
const acceptance_tokens_service_1 = require("./acceptance-tokens.service");
const wompiService = new wompi_service_1.WompiService();
const paymentTransactionService = new payment_transaction_service_1.PaymentTransactionService();
const acceptanceTokensService = new acceptance_tokens_service_1.AcceptanceTokensService();
const paymentController = new payment_controller_1.PaymentController(wompiService, paymentTransactionService, acceptanceTokensService);
// Middleware de rate limiting específico para pagos
const paymentRateLimit = (0, rateLimit_middleware_1.rateLimitMiddleware)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // máximo 10 requests por ventana
    message: {
        success: false,
        message: 'Demasiadas solicitudes de pago. Intenta nuevamente en 15 minutos.'
    }
});
// Middleware de rate limiting para webhooks
const webhookRateLimit = (0, rateLimit_middleware_1.rateLimitMiddleware)({
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
router.post('/transactions', auth_middleware_1.authMiddleware, paymentRateLimit, (0, validation_middleware_2.validateContentType)(['application/json']), (0, validation_middleware_2.validateBodySize)(10 * 1024), (0, validator_middleware_1.validateDto)(payment_dto_1.CreateTransactionDto), paymentController.createTransaction);
/**
 * @route POST /api/payments/payment-links
 * @desc Crear un link de pago
 * @access Private (Usuario autenticado)
 */
router.post('/payment-links', auth_middleware_1.authMiddleware, paymentRateLimit, (0, validation_middleware_2.validateContentType)(['application/json']), (0, validation_middleware_2.validateBodySize)(10 * 1024), (0, validator_middleware_1.validateDto)(payment_dto_1.CreatePaymentLinkDto), paymentController.createPaymentLink);
/**
 * @route POST /api/payments/transactions/:transactionId/confirm
 * @desc Confirmar una transacción de pago
 * @access Private (Usuario autenticado)
 */
router.post('/transactions/:transactionId/confirm', auth_middleware_1.authMiddleware, paymentRateLimit, (0, validation_middleware_2.validateContentType)(['application/json']), (0, validation_middleware_2.validateBodySize)(5 * 1024), (0, validator_middleware_1.validateDto)(payment_dto_1.TransactionIdParamDto, 'params'), (0, validator_middleware_1.validateDto)(payment_dto_1.ConfirmTransactionDto), paymentController.confirmTransaction);
/**
 * @route GET /api/payments/transactions/:transactionId/status
 * @desc Obtener el estado de una transacción
 * @access Private (Usuario autenticado)
 */
router.get('/transactions/:transactionId/status', auth_middleware_1.authMiddleware, paymentController.getTransactionStatus);
/**
 * @route POST /api/payments/transactions/:transactionId/refund
 * @desc Crear un reembolso
 * @access Private (Admin o Professional)
 */
router.post('/transactions/:transactionId/refund', auth_middleware_1.authMiddleware, (0, role_middleware_1.restrictTo)([role_middleware_2.SystemRoles.ADMIN, role_middleware_2.SystemRoles.PROFESSIONAL]), (0, validator_middleware_1.validateDto)(payment_dto_1.CreateRefundDto), validation_middleware_1.validateRequest, paymentController.createRefund);
/**
 * @route POST /api/payments/webhooks
 * @desc Manejar webhooks de Wompi
 * @access Public (sin autenticación, pero con verificación de firma)
 */
router.post('/webhooks', webhookRateLimit, (0, validation_middleware_2.validateContentType)(['application/json']), (0, validation_middleware_2.validateBodySize)(1024 * 1024), (0, validator_middleware_1.validateDto)(payment_dto_1.WompiWebhookDto), paymentController.handleWebhook);
/**
 * @route GET /api/payments/config
 * @desc Obtener configuración pública de Wompi
 * @access Public
 */
router.get('/config', paymentController.getPublicConfig);
/**
 * @route GET /api/payments/history
 * @desc Obtener historial de pagos
 * @access Private (Usuario autenticado)
 */
router.get('/history', auth_middleware_1.authMiddleware, (0, validator_middleware_1.validateDto)(payment_dto_1.PaymentHistoryFiltersDto, 'query'), validation_middleware_1.validateRequest, paymentController.getPaymentHistory);
/**
 * @route GET /api/payments/stats
 * @desc Obtener estadísticas de pagos
 * @access Private (Admin o Professional)
 */
router.get('/stats', auth_middleware_1.authMiddleware, (0, role_middleware_1.restrictTo)([role_middleware_2.SystemRoles.ADMIN, role_middleware_2.SystemRoles.PROFESSIONAL]), paymentController.getPaymentStats);
/**
 * @route GET /api/payments/acceptance-tokens
 * @desc Obtener tokens de aceptación
 * @access Private (Usuario autenticado)
 */
router.get('/acceptance-tokens', auth_middleware_1.authMiddleware, paymentController.getAcceptanceTokens);
/**
 * @route GET /api/payments/customers/:email
 * @desc Obtener información del cliente
 * @access Private (Admin o Professional)
 */
router.get('/customers/:email', auth_middleware_1.authMiddleware, (0, role_middleware_1.restrictTo)([role_middleware_2.SystemRoles.ADMIN, role_middleware_2.SystemRoles.PROFESSIONAL]), paymentController.getCustomerInfo);
// Rutas adicionales para administración
/**
 * @route GET /api/payments/admin/transactions/pending
 * @desc Obtener transacciones pendientes (para seguimiento)
 * @access Private (Admin)
 */
router.get('/admin/transactions/pending', auth_middleware_1.authMiddleware, (0, role_middleware_1.restrictTo)([role_middleware_2.SystemRoles.ADMIN]), async (req, res) => {
    try {
        const { PaymentTransactionService } = await Promise.resolve().then(() => __importStar(require('./payment-transaction.service')));
        const transactionService = new PaymentTransactionService();
        const olderThanMinutes = req.query.olderThan ?
            parseInt(req.query.olderThan) : 30;
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error obteniendo transacciones pendientes',
            error: error.message
        });
    }
});
/**
 * @route GET /api/payments/admin/stats/payment-methods
 * @desc Obtener estadísticas por método de pago
 * @access Private (Admin)
 */
router.get('/admin/stats/payment-methods', auth_middleware_1.authMiddleware, (0, role_middleware_1.restrictTo)([role_middleware_2.SystemRoles.ADMIN]), async (req, res) => {
    try {
        const { PaymentTransactionService } = await Promise.resolve().then(() => __importStar(require('./payment-transaction.service')));
        const transactionService = new PaymentTransactionService();
        const filters = {
            startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
            currency: req.query.currency || 'COP'
        };
        const summary = await transactionService.getPaymentMethodSummary(filters);
        res.status(200).json({
            success: true,
            message: 'Estadísticas por método de pago obtenidas exitosamente',
            data: summary
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas por método de pago',
            error: error.message
        });
    }
});
/**
 * @route GET /api/payments/admin/stats/daily
 * @desc Obtener estadísticas diarias
 * @access Private (Admin)
 */
router.get('/admin/stats/daily', auth_middleware_1.authMiddleware, (0, role_middleware_1.restrictTo)([role_middleware_2.SystemRoles.ADMIN]), async (req, res) => {
    try {
        const { PaymentTransactionService } = await Promise.resolve().then(() => __importStar(require('./payment-transaction.service')));
        const transactionService = new PaymentTransactionService();
        const startDate = req.query.startDate ?
            new Date(req.query.startDate) :
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 días atrás
        const endDate = req.query.endDate ?
            new Date(req.query.endDate) :
            new Date();
        const currency = req.query.currency || 'COP';
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas diarias',
            error: error.message
        });
    }
});
/**
 * @route GET /api/payments/admin/transactions/status/:status
 * @desc Obtener transacciones por estado
 * @access Private (Admin)
 */
router.get('/admin/transactions/status/:status', auth_middleware_1.authMiddleware, (0, role_middleware_1.restrictTo)([role_middleware_2.SystemRoles.ADMIN]), async (req, res) => {
    try {
        const { PaymentTransactionService } = await Promise.resolve().then(() => __importStar(require('./payment-transaction.service')));
        const transactionService = new PaymentTransactionService();
        const { status } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const transactions = await transactionService.getTransactionsByStatus(status, limit);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error obteniendo transacciones por estado',
            error: error.message
        });
    }
});
/**
 * @route PUT /api/payments/admin/transactions/:externalId/status
 * @desc Actualizar manualmente el estado de una transacción
 * @access Private (Admin)
 */
router.put('/admin/transactions/:externalId/status', auth_middleware_1.authMiddleware, (0, role_middleware_1.restrictTo)([role_middleware_2.SystemRoles.ADMIN]), async (req, res) => {
    try {
        const { PaymentTransactionService } = await Promise.resolve().then(() => __importStar(require('./payment-transaction.service')));
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
        const updatedTransaction = await transactionService.updateTransactionStatus(externalId, status, gatewayResponse);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error actualizando estado de transacción',
            error: error.message
        });
    }
});
