import { Router } from 'express';
import { PurchaseController } from './purchase.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/role.middleware';

const router = Router();
const purchaseController = new PurchaseController();

// All purchase routes require authentication
router.use(authMiddleware);

// Purchase management routes
router.post('/', purchaseController.createPurchase);
router.post('/cash', purchaseController.createCashPurchase);
router.get('/', purchaseController.getPurchases);
router.get('/:id', purchaseController.getPurchaseById);
router.put('/:id', purchaseController.updatePurchase);

// User-specific purchase routes
// IMPORTANT: More specific routes must come before parameterized routes
router.get('/user/services', purchaseController.getUserServicePurchases);
router.get('/user/purchase/:id/details', purchaseController.getUserPurchaseDetails);
router.get('/user/:userId', purchaseController.getUserPurchases);
router.get('/user/:userId/active', purchaseController.getActivePurchases);

// Rutas para manejo de sesiones
router.post('/:purchaseId/sessions', purchaseController.createSessionsForPurchase);
router.get('/:purchaseId/sessions/status', purchaseController.checkSessionsStatus);

// Ruta para obtener datos completos de sesiones por paquete
router.get('/package/:packageId/sessions/complete', purchaseController.getCompleteSessionsByPackage);

// Detectar y crear sesiones faltantes para compras completadas
router.post('/sessions/detect-and-create-missing', purchaseController.detectAndCreateMissingSessions);

// Payment status update route
router.patch('/:id/payment-status', purchaseController.updatePaymentStatus);

// Cash payment management routes (admin only)
router.post('/:id/confirm-cash', purchaseController.confirmCashPayment);
router.post('/:id/reject-cash', purchaseController.rejectCashPayment);
router.get('/cash/pending', purchaseController.getPendingCashPayments);

// Agregar nueva ruta para compra de servicios
router.post('/service', purchaseController.createServicePurchase);
router.post('/services/cash', purchaseController.createServiceCashPurchase);

// Ruta para administradores - crear compra para cliente temporal
router.post('/admin/service', restrictTo(['admin']), purchaseController.createAdminServicePurchase);

// Ruta para buscar cliente temporal por identificación
router.get('/temp-customer/search', restrictTo(['admin']), purchaseController.findTemporaryCustomer);

export default router;