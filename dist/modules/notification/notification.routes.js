"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoutes = void 0;
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
exports.notificationRoutes = router;
const notificationController = new notification_controller_1.NotificationController();
// Aplicar middleware de autenticación a todas las rutas
router.use(auth_middleware_1.authMiddleware);
// Rutas para notificaciones
router.post('/', notificationController.createNotification.bind(notificationController));
router.get('/', notificationController.getNotifications.bind(notificationController));
router.get('/unread-count/:userId', notificationController.getUnreadCount.bind(notificationController));
router.get('/:id', notificationController.getNotificationById.bind(notificationController));
router.put('/:id', notificationController.updateNotification.bind(notificationController));
router.patch('/:id/read', notificationController.markAsRead.bind(notificationController));
router.delete('/:id', notificationController.deleteNotification.bind(notificationController));
