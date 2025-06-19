"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSessionRoutes = void 0;
const express_1 = require("express");
const user_session_controller_1 = require("./user-session.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
exports.userSessionRoutes = router;
const userSessionController = new user_session_controller_1.UserSessionController();
// Rutas principales
/**
 * @route POST /api/user-sessions
 * @desc Crear una nueva sesión de usuario
 * @access Private
 */
router.post('/', auth_middleware_1.authMiddleware, userSessionController.createUserSession.bind(userSessionController));
/**
 * @route GET /api/user-sessions/search
 * @desc Buscar sesiones con filtros
 * @access Private
 */
router.get('/search', auth_middleware_1.authMiddleware, userSessionController.searchUserSessions.bind(userSessionController));
/**
 * @route GET /api/user-sessions/purchase/:purchaseId
 * @desc Obtener sesiones por compra
 * @access Private
 */
router.get('/purchase/:purchaseId', auth_middleware_1.authMiddleware, userSessionController.getUserSessionsByPurchase.bind(userSessionController));
/**
 * @route GET /api/user-sessions/service/:serviceId
 * @desc Obtener sesiones por servicio
 * @access Private
 */
router.get('/service/:serviceId', auth_middleware_1.authMiddleware, userSessionController.getUserSessionsByService.bind(userSessionController));
/**
 * @route GET /api/user-sessions/stats/:userId
 * @desc Obtener estadísticas de sesiones por usuario
 * @access Private
 */
router.get('/stats/:userId', auth_middleware_1.authMiddleware, userSessionController.getUserSessionStats.bind(userSessionController));
/**
 * @route GET /api/user-sessions/:id
 * @desc Obtener una sesión por ID
 * @access Private
 */
router.get('/:id', auth_middleware_1.authMiddleware, userSessionController.getUserSessionById.bind(userSessionController));
/**
 * @route PUT /api/user-sessions/:id
 * @desc Actualizar una sesión
 * @access Private
 */
router.put('/:id', auth_middleware_1.authMiddleware, userSessionController.updateUserSession.bind(userSessionController));
/**
 * @route POST /api/user-sessions/:id/use
 * @desc Usar sesiones (reducir contador)
 * @access Private
 */
router.post('/:id/use', auth_middleware_1.authMiddleware, userSessionController.useSessions.bind(userSessionController));
/**
 * @route POST /api/user-sessions/:id/cancel
 * @desc Cancelar una sesión
 * @access Private
 */
router.post('/:id/cancel', auth_middleware_1.authMiddleware, userSessionController.cancelUserSession.bind(userSessionController));
/**
 * @route POST /api/user-sessions/:id/reactivate
 * @desc Reactivar una sesión cancelada
 * @access Private
 */
router.post('/:id/reactivate', auth_middleware_1.authMiddleware, userSessionController.reactivateUserSession.bind(userSessionController));
/**
 * @route DELETE /api/user-sessions/:id
 * @desc Eliminar una sesión
 * @access Private
 */
router.delete('/:id', auth_middleware_1.authMiddleware, userSessionController.deleteUserSession.bind(userSessionController));
// Rutas administrativas
/**
 * @route POST /api/user-sessions/admin/process-expired
 * @desc Procesar sesiones expiradas (marcar como expiradas)
 * @access Private (Admin)
 */
router.post('/admin/process-expired', auth_middleware_1.authMiddleware, 
// TODO: Agregar middleware de autorización para admin
userSessionController.processExpiredSessions.bind(userSessionController));
/**
 * @route POST /api/user-sessions/admin/process-exhausted
 * @desc Procesar sesiones agotadas (marcar como agotadas)
 * @access Private (Admin)
 */
router.post('/admin/process-exhausted', auth_middleware_1.authMiddleware, 
// TODO: Agregar middleware de autorización para admin
userSessionController.processExhaustedSessions.bind(userSessionController));
