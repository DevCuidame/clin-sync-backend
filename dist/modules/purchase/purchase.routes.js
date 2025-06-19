"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const purchase_controller_1 = require("./purchase.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const purchaseController = new purchase_controller_1.PurchaseController();
// All purchase routes require authentication
router.use(auth_middleware_1.authMiddleware);
// Purchase management routes
router.post('/', purchaseController.createPurchase);
router.get('/', purchaseController.getPurchases);
router.get('/:id', purchaseController.getPurchaseById);
router.put('/:id', purchaseController.updatePurchase);
// User-specific purchase routes
router.get('/user/:userId', purchaseController.getUserPurchases);
router.get('/user/:userId/active', purchaseController.getActivePurchases);
// Payment status update route
router.patch('/:id/payment-status', purchaseController.updatePaymentStatus);
exports.default = router;
