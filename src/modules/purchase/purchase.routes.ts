import { Router } from 'express';
import { PurchaseController } from './purchase.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

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

export default router;