import { Router } from 'express';
import { PurchaseController } from './purchase.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const purchaseController = new PurchaseController();

// All purchase routes require authentication
router.use(authMiddleware);

// Purchase management routes
router.post('/', purchaseController.createPurchase);
router.get('/', purchaseController.getPurchases);
router.get('/:id', purchaseController.getPurchaseById);
router.put('/:id', purchaseController.updatePurchase);

// User-specific purchase routes
router.get('/user/:userId', purchaseController.getUserPurchases);

// Payment status update route
router.patch('/:id/payment-status', purchaseController.updatePaymentStatus);

export default router;