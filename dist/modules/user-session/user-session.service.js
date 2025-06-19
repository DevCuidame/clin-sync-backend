"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSessionService = void 0;
const user_session_repository_1 = require("./user-session.repository");
const user_session_model_1 = require("../../models/user-session.model");
const error_handler_1 = require("../../utils/error-handler");
const database_1 = require("../../core/config/database");
const purchase_model_1 = require("../../models/purchase.model");
const service_model_1 = require("../../models/service.model");
class UserSessionService {
    userSessionRepository;
    purchaseRepository;
    serviceRepository;
    constructor() {
        this.userSessionRepository = new user_session_repository_1.UserSessionRepository();
        this.purchaseRepository = database_1.AppDataSource.getRepository(purchase_model_1.Purchase);
        this.serviceRepository = database_1.AppDataSource.getRepository(service_model_1.Service);
    }
    /**
     * Crear una nueva sesión de usuario
     * @param data Datos para crear la sesión
     * @returns Sesión creada
     */
    async createUserSession(data) {
        // Validar que la compra existe
        const purchase = await this.purchaseRepository.findOne({
            where: { purchase_id: data.purchase_id }
        });
        if (!purchase) {
            throw new error_handler_1.NotFoundError(`Compra con ID ${data.purchase_id} no encontrada`);
        }
        // Validar que el servicio existe
        const service = await this.serviceRepository.findOne({
            where: { service_id: data.service_id }
        });
        if (!service) {
            throw new error_handler_1.NotFoundError(`Servicio con ID ${data.service_id} no encontrado`);
        }
        // Validar que la fecha de expiración sea futura
        if (data.expires_at <= new Date()) {
            throw new error_handler_1.BadRequestError('La fecha de expiración debe ser futura');
        }
        // Validar que el número de sesiones sea positivo
        if (data.sessions_remaining <= 0) {
            throw new error_handler_1.BadRequestError('El número de sesiones debe ser mayor a 0');
        }
        const userSession = await this.userSessionRepository.create({
            purchase_id: data.purchase_id,
            service_id: data.service_id,
            sessions_remaining: data.sessions_remaining,
            expires_at: data.expires_at,
            status: data.status || user_session_model_1.UserSessionStatus.ACTIVE
        });
        return userSession;
    }
    /**
     * Obtener una sesión por ID
     * @param userSessionId ID de la sesión
     * @returns Sesión encontrada
     */
    async getUserSessionById(userSessionId) {
        const userSession = await this.userSessionRepository.findById(userSessionId);
        if (!userSession) {
            throw new error_handler_1.NotFoundError(`Sesión de usuario con ID ${userSessionId} no encontrada`);
        }
        return userSession;
    }
    /**
     * Obtener sesiones por compra
     * @param purchaseId ID de la compra
     * @returns Lista de sesiones
     */
    async getUserSessionsByPurchase(purchaseId) {
        return await this.userSessionRepository.findByPurchaseId(purchaseId);
    }
    /**
     * Obtener sesiones activas por compra
     * @param purchaseId ID de la compra
     * @returns Lista de sesiones activas
     */
    async getActiveUserSessionsByPurchase(purchaseId) {
        return await this.userSessionRepository.findActiveByPurchaseId(purchaseId);
    }
    /**
     * Obtener sesiones por servicio
     * @param serviceId ID del servicio
     * @returns Lista de sesiones
     */
    async getUserSessionsByService(serviceId) {
        return await this.userSessionRepository.findByServiceId(serviceId);
    }
    /**
     * Usar sesiones (reducir el contador)
     * @param data Datos para usar sesiones
     * @returns Sesión actualizada
     */
    async useSessions(data) {
        const userSession = await this.getUserSessionById(data.user_session_id);
        // Validar que la sesión esté activa
        if (userSession.status !== user_session_model_1.UserSessionStatus.ACTIVE) {
            throw new error_handler_1.BadRequestError(`La sesión no está activa. Estado actual: ${userSession.status}`);
        }
        // Validar que no esté expirada
        if (userSession.expires_at <= new Date()) {
            throw new error_handler_1.BadRequestError('La sesión ha expirado');
        }
        // Validar que tenga sesiones disponibles
        const sessionsToUse = data.sessions_to_use || 1;
        if (userSession.sessions_remaining < sessionsToUse) {
            throw new error_handler_1.BadRequestError(`No hay suficientes sesiones disponibles. Disponibles: ${userSession.sessions_remaining}, Solicitadas: ${sessionsToUse}`);
        }
        return await this.userSessionRepository.useSessions(data.user_session_id, sessionsToUse);
    }
    /**
     * Actualizar una sesión
     * @param userSessionId ID de la sesión
     * @param data Datos a actualizar
     * @returns Sesión actualizada
     */
    async updateUserSession(userSessionId, data) {
        const userSession = await this.getUserSessionById(userSessionId);
        // Validaciones
        if (data.expires_at && data.expires_at <= new Date()) {
            throw new error_handler_1.BadRequestError('La fecha de expiración debe ser futura');
        }
        if (data.sessions_remaining !== undefined && data.sessions_remaining < 0) {
            throw new error_handler_1.BadRequestError('El número de sesiones no puede ser negativo');
        }
        const updatedUserSession = await this.userSessionRepository.update(userSessionId, data, 'userSession');
        return updatedUserSession;
    }
    /**
     * Cancelar una sesión
     * @param userSessionId ID de la sesión
     * @returns Sesión cancelada
     */
    async cancelUserSession(userSessionId) {
        return await this.userSessionRepository.updateStatus(userSessionId, user_session_model_1.UserSessionStatus.CANCELLED);
    }
    /**
     * Reactivar una sesión cancelada
     * @param userSessionId ID de la sesión
     * @returns Sesión reactivada
     */
    async reactivateUserSession(userSessionId) {
        const userSession = await this.getUserSessionById(userSessionId);
        if (userSession.status !== user_session_model_1.UserSessionStatus.CANCELLED) {
            throw new error_handler_1.BadRequestError('Solo se pueden reactivar sesiones canceladas');
        }
        // Verificar que no esté expirada
        if (userSession.expires_at <= new Date()) {
            throw new error_handler_1.BadRequestError('No se puede reactivar una sesión expirada');
        }
        // Verificar que tenga sesiones restantes
        if (userSession.sessions_remaining <= 0) {
            throw new error_handler_1.BadRequestError('No se puede reactivar una sesión sin sesiones restantes');
        }
        return await this.userSessionRepository.updateStatus(userSessionId, user_session_model_1.UserSessionStatus.ACTIVE);
    }
    /**
     * Buscar sesiones con filtros
     * @param filters Filtros de búsqueda
     * @returns Lista de sesiones filtradas
     */
    async searchUserSessions(filters) {
        return await this.userSessionRepository.findWithFilters(filters);
    }
    /**
     * Obtener sesiones con detalles adicionales
     * @param filters Filtros de búsqueda
     * @returns Lista de sesiones con detalles
     */
    async getUserSessionsWithDetails(filters) {
        const sessions = await this.userSessionRepository.findWithFilters(filters);
        return sessions.map(session => ({
            ...session,
            user_id: session.purchase?.user_id,
            user_name: session.purchase?.user ?
                `${session.purchase.user.first_name} ${session.purchase.user.last_name}` : undefined,
            service_name: session.service?.service_name,
            package_name: session.purchase?.package?.package_name,
            is_expired: session.expires_at <= new Date(),
            is_exhausted: session.sessions_remaining <= 0
        }));
    }
    /**
     * Proceso automático para marcar sesiones expiradas
     * @returns Número de sesiones marcadas como expiradas
     */
    async processExpiredSessions() {
        return await this.userSessionRepository.markExpiredSessions();
    }
    /**
     * Proceso automático para marcar sesiones agotadas
     * @returns Número de sesiones marcadas como agotadas
     */
    async processExhaustedSessions() {
        return await this.userSessionRepository.markExhaustedSessions();
    }
    /**
     * Obtener estadísticas de sesiones por usuario
     * @param userId ID del usuario
     * @returns Estadísticas de sesiones
     */
    async getUserSessionStats(userId) {
        // Esta función requeriría una consulta más compleja que involucre joins
        // Por ahora, implementamos una versión básica
        const purchases = await this.purchaseRepository.find({
            where: { user_id: userId }
        });
        const purchaseIds = purchases.map(p => p.purchase_id);
        let totalSessions = 0;
        let activeSessions = 0;
        let expiredSessions = 0;
        let exhaustedSessions = 0;
        let cancelledSessions = 0;
        let remainingSessions = 0;
        for (const purchaseId of purchaseIds) {
            const sessions = await this.getUserSessionsByPurchase(purchaseId);
            totalSessions += sessions.length;
            sessions.forEach(session => {
                switch (session.status) {
                    case user_session_model_1.UserSessionStatus.ACTIVE:
                        activeSessions++;
                        remainingSessions += session.sessions_remaining;
                        break;
                    case user_session_model_1.UserSessionStatus.EXPIRED:
                        expiredSessions++;
                        break;
                    case user_session_model_1.UserSessionStatus.EXHAUSTED:
                        exhaustedSessions++;
                        break;
                    case user_session_model_1.UserSessionStatus.CANCELLED:
                        cancelledSessions++;
                        break;
                }
            });
        }
        return {
            total_sessions: totalSessions,
            active_sessions: activeSessions,
            expired_sessions: expiredSessions,
            exhausted_sessions: exhaustedSessions,
            cancelled_sessions: cancelledSessions,
            remaining_sessions: remainingSessions
        };
    }
    /**
     * Eliminar una sesión
     * @param userSessionId ID de la sesión
     * @returns Resultado de la eliminación
     */
    async deleteUserSession(userSessionId) {
        const userSession = await this.getUserSessionById(userSessionId);
        return await this.userSessionRepository.delete(userSessionId, 'userSession');
    }
}
exports.UserSessionService = UserSessionService;
