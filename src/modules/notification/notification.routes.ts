import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const notificationController = new NotificationController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas para notificaciones
router.post('/', notificationController.createNotification.bind(notificationController));
router.get('/', notificationController.getNotifications.bind(notificationController));
router.get('/unread-count/:userId', notificationController.getUnreadCount.bind(notificationController));
router.get('/:id', notificationController.getNotificationById.bind(notificationController));
router.put('/:id', notificationController.updateNotification.bind(notificationController));
router.patch('/:id/read', notificationController.markAsRead.bind(notificationController));
router.delete('/:id', notificationController.deleteNotification.bind(notificationController));

export { router as notificationRoutes };