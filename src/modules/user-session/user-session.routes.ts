import { Router } from 'express';
import { UserSessionController } from './user-session.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const userSessionController = new UserSessionController();

// Rutas principales

/**
 * @route POST /api/user-sessions
 * @desc Crear una nueva sesión de usuario
 * @access Private
 */
router.post(
  '/',
  authMiddleware,
  userSessionController.createUserSession.bind(userSessionController)
);

/**
 * @route GET /api/user-sessions/search
 * @desc Buscar sesiones con filtros
 * @access Private
 */
router.get(
  '/search',
  authMiddleware,
  userSessionController.searchUserSessions.bind(userSessionController)
);

/**
 * @route GET /api/user-sessions/purchase/:purchaseId
 * @desc Obtener sesiones por compra
 * @access Private
 */
router.get(
  '/purchase/:purchaseId',
  authMiddleware,
  userSessionController.getUserSessionsByPurchase.bind(userSessionController)
);

/**
 * @route GET /api/user-sessions/service/:serviceId
 * @desc Obtener sesiones por servicio
 * @access Private
 */
router.get(
  '/service/:serviceId',
  authMiddleware,
  userSessionController.getUserSessionsByService.bind(userSessionController)
);

/**
 * @route GET /api/user-sessions/stats/:userId
 * @desc Obtener estadísticas de sesiones por usuario
 * @access Private
 */
router.get(
  '/stats/:userId',
  authMiddleware,
  userSessionController.getUserSessionStats.bind(userSessionController)
);

/**
 * @route GET /api/user-sessions/:id
 * @desc Obtener una sesión por ID
 * @access Private
 */
router.get(
  '/:id',
  authMiddleware,
  userSessionController.getUserSessionById.bind(userSessionController)
);

/**
 * @route PUT /api/user-sessions/:id
 * @desc Actualizar una sesión
 * @access Private
 */
router.put(
  '/:id',
  authMiddleware,
  userSessionController.updateUserSession.bind(userSessionController)
);

/**
 * @route POST /api/user-sessions/:id/use
 * @desc Usar sesiones (reducir contador)
 * @access Private
 */
router.post(
  '/:id/use',
  authMiddleware,
  userSessionController.useSessions.bind(userSessionController)
);

/**
 * @route POST /api/user-sessions/:id/cancel
 * @desc Cancelar una sesión
 * @access Private
 */
router.post(
  '/:id/cancel',
  authMiddleware,
  userSessionController.cancelUserSession.bind(userSessionController)
);

/**
 * @route POST /api/user-sessions/:id/reactivate
 * @desc Reactivar una sesión cancelada
 * @access Private
 */
router.post(
  '/:id/reactivate',
  authMiddleware,
  userSessionController.reactivateUserSession.bind(userSessionController)
);

/**
 * @route DELETE /api/user-sessions/:id
 * @desc Eliminar una sesión
 * @access Private
 */
router.delete(
  '/:id',
  authMiddleware,
  userSessionController.deleteUserSession.bind(userSessionController)
);

// Rutas administrativas

/**
 * @route POST /api/user-sessions/admin/process-expired
 * @desc Procesar sesiones expiradas (marcar como expiradas)
 * @access Private (Admin)
 */
router.post(
  '/admin/process-expired',
  authMiddleware,
  // TODO: Agregar middleware de autorización para admin
  userSessionController.processExpiredSessions.bind(userSessionController)
);

/**
 * @route POST /api/user-sessions/admin/process-exhausted
 * @desc Procesar sesiones agotadas (marcar como agotadas)
 * @access Private (Admin)
 */
router.post(
  '/admin/process-exhausted',
  authMiddleware,
  // TODO: Agregar middleware de autorización para admin
  userSessionController.processExhaustedSessions.bind(userSessionController)
);

export { router as userSessionRoutes };
