"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSessionController = void 0;
const user_session_service_1 = require("./user-session.service");
const error_handler_1 = require("../../utils/error-handler");
class UserSessionController {
    userSessionService;
    constructor() {
        this.userSessionService = new user_session_service_1.UserSessionService();
    }
    /**
     * Crear una nueva sesión de usuario
     * @route POST /api/user-sessions
     */
    async createUserSession(req, res, next) {
        try {
            const data = req.body;
            // Validaciones básicas
            if (!data.purchase_id || !data.service_id || !data.sessions_remaining || !data.expires_at) {
                throw new error_handler_1.BadRequestError('Faltan campos requeridos: purchase_id, service_id, sessions_remaining, expires_at');
            }
            // Convertir expires_at a Date si es string
            if (typeof data.expires_at === 'string') {
                data.expires_at = new Date(data.expires_at);
            }
            const userSession = await this.userSessionService.createUserSession(data);
            const response = {
                success: true,
                message: 'Sesión de usuario creada exitosamente',
                data: userSession
            };
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Obtener una sesión por ID
     * @route GET /api/user-sessions/:id
     */
    async getUserSessionById(req, res, next) {
        try {
            const userSessionId = parseInt(req.params.id);
            if (isNaN(userSessionId)) {
                throw new error_handler_1.BadRequestError('ID de sesión inválido');
            }
            const userSession = await this.userSessionService.getUserSessionById(userSessionId);
            const response = {
                success: true,
                message: 'Sesión de usuario obtenida exitosamente',
                data: userSession
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Obtener sesiones por compra
     * @route GET /api/user-sessions/purchase/:purchaseId
     */
    async getUserSessionsByPurchase(req, res, next) {
        try {
            const purchaseId = parseInt(req.params.purchaseId);
            if (isNaN(purchaseId)) {
                throw new error_handler_1.BadRequestError('ID de compra inválido');
            }
            const activeOnly = req.query.active_only === 'true';
            const userSessions = activeOnly
                ? await this.userSessionService.getActiveUserSessionsByPurchase(purchaseId)
                : await this.userSessionService.getUserSessionsByPurchase(purchaseId);
            const response = {
                success: true,
                message: 'Sesiones de usuario obtenidas exitosamente',
                data: userSessions
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Obtener sesiones por servicio
     * @route GET /api/user-sessions/service/:serviceId
     */
    async getUserSessionsByService(req, res, next) {
        try {
            const serviceId = parseInt(req.params.serviceId);
            if (isNaN(serviceId)) {
                throw new error_handler_1.BadRequestError('ID de servicio inválido');
            }
            const userSessions = await this.userSessionService.getUserSessionsByService(serviceId);
            const response = {
                success: true,
                message: 'Sesiones de usuario obtenidas exitosamente',
                data: userSessions
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Buscar sesiones con filtros
     * @route GET /api/user-sessions/search
     */
    async searchUserSessions(req, res, next) {
        try {
            const filters = {};
            // Construir filtros desde query parameters
            if (req.query.purchase_id) {
                filters.purchase_id = parseInt(req.query.purchase_id);
            }
            if (req.query.service_id) {
                filters.service_id = parseInt(req.query.service_id);
            }
            if (req.query.status) {
                filters.status = req.query.status;
            }
            if (req.query.expires_before) {
                filters.expires_before = new Date(req.query.expires_before);
            }
            if (req.query.expires_after) {
                filters.expires_after = new Date(req.query.expires_after);
            }
            if (req.query.has_remaining_sessions !== undefined) {
                filters.has_remaining_sessions = req.query.has_remaining_sessions === 'true';
            }
            const withDetails = req.query.with_details === 'true';
            const userSessions = withDetails
                ? await this.userSessionService.getUserSessionsWithDetails(filters)
                : await this.userSessionService.searchUserSessions(filters);
            const response = {
                success: true,
                message: 'Búsqueda de sesiones completada exitosamente',
                data: userSessions
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Usar sesiones (reducir contador)
     * @route POST /api/user-sessions/:id/use
     */
    async useSessions(req, res, next) {
        try {
            const userSessionId = parseInt(req.params.id);
            if (isNaN(userSessionId)) {
                throw new error_handler_1.BadRequestError('ID de sesión inválido');
            }
            const data = {
                user_session_id: userSessionId,
                sessions_to_use: req.body.sessions_to_use || 1
            };
            const userSession = await this.userSessionService.useSessions(data);
            const response = {
                success: true,
                message: `${data.sessions_to_use} sesión(es) utilizada(s) exitosamente`,
                data: userSession
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Actualizar una sesión
     * @route PUT /api/user-sessions/:id
     */
    async updateUserSession(req, res, next) {
        try {
            const userSessionId = parseInt(req.params.id);
            if (isNaN(userSessionId)) {
                throw new error_handler_1.BadRequestError('ID de sesión inválido');
            }
            const data = req.body;
            // Convertir expires_at a Date si es string
            if (data.expires_at && typeof data.expires_at === 'string') {
                data.expires_at = new Date(data.expires_at);
            }
            const userSession = await this.userSessionService.updateUserSession(userSessionId, data);
            const response = {
                success: true,
                message: 'Sesión de usuario actualizada exitosamente',
                data: userSession
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Cancelar una sesión
     * @route POST /api/user-sessions/:id/cancel
     */
    async cancelUserSession(req, res, next) {
        try {
            const userSessionId = parseInt(req.params.id);
            if (isNaN(userSessionId)) {
                throw new error_handler_1.BadRequestError('ID de sesión inválido');
            }
            const userSession = await this.userSessionService.cancelUserSession(userSessionId);
            const response = {
                success: true,
                message: 'Sesión de usuario cancelada exitosamente',
                data: userSession
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Reactivar una sesión cancelada
     * @route POST /api/user-sessions/:id/reactivate
     */
    async reactivateUserSession(req, res, next) {
        try {
            const userSessionId = parseInt(req.params.id);
            if (isNaN(userSessionId)) {
                throw new error_handler_1.BadRequestError('ID de sesión inválido');
            }
            const userSession = await this.userSessionService.reactivateUserSession(userSessionId);
            const response = {
                success: true,
                message: 'Sesión de usuario reactivada exitosamente',
                data: userSession
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Obtener estadísticas de sesiones por usuario
     * @route GET /api/user-sessions/stats/:userId
     */
    async getUserSessionStats(req, res, next) {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                throw new error_handler_1.BadRequestError('ID de usuario inválido');
            }
            const stats = await this.userSessionService.getUserSessionStats(userId);
            const response = {
                success: true,
                message: 'Estadísticas de sesiones obtenidas exitosamente',
                data: stats
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Procesar sesiones expiradas (endpoint administrativo)
     * @route POST /api/user-sessions/admin/process-expired
     */
    async processExpiredSessions(req, res, next) {
        try {
            const updatedCount = await this.userSessionService.processExpiredSessions();
            const response = {
                success: true,
                message: `${updatedCount} sesiones marcadas como expiradas`,
                data: { updated_count: updatedCount }
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Procesar sesiones agotadas (endpoint administrativo)
     * @route POST /api/user-sessions/admin/process-exhausted
     */
    async processExhaustedSessions(req, res, next) {
        try {
            const updatedCount = await this.userSessionService.processExhaustedSessions();
            const response = {
                success: true,
                message: `${updatedCount} sesiones marcadas como agotadas`,
                data: { updated_count: updatedCount }
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Eliminar una sesión
     * @route DELETE /api/user-sessions/:id
     */
    async deleteUserSession(req, res, next) {
        try {
            const userSessionId = parseInt(req.params.id);
            if (isNaN(userSessionId)) {
                throw new error_handler_1.BadRequestError('ID de sesión inválido');
            }
            await this.userSessionService.deleteUserSession(userSessionId);
            const response = {
                success: true,
                message: 'Sesión de usuario eliminada exitosamente'
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserSessionController = UserSessionController;
