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
// Rutas para manejo de sesiones
router.post('/:purchaseId/sessions', purchaseController.createSessionsForPurchase);
router.get('/:purchaseId/sessions/status', purchaseController.checkSessionsStatus);
// Ruta para obtener datos completos de sesiones por paquete
router.get('/package/:packageId/sessions/complete', purchaseController.getCompleteSessionsByPackage);
// Detectar y crear sesiones faltantes para compras completadas
router.post('/sessions/detect-and-create-missing', purchaseController.detectAndCreateMissingSessions);
// Payment status update route
router.patch('/:id/payment-status', purchaseController.updatePaymentStatus);
exports.default = router;
