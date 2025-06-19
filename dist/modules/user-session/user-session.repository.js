"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSessionRepository = void 0;
const typeorm_1 = require("typeorm");
const base_repository_1 = require("../../core/repositories/base.repository");
const user_session_model_1 = require("../../models/user-session.model");
const error_handler_1 = require("../../utils/error-handler");
class UserSessionRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(user_session_model_1.UserSession);
    }
    /**
     * Encuentra sesiones por purchase_id
     * @param purchaseId ID de la compra
     * @returns Lista de sesiones
     */
    async findByPurchaseId(purchaseId) {
        return await this.repository.find({
            where: { purchase_id: purchaseId },
            relations: ['purchase', 'service'],
            order: { created_at: 'DESC' }
        });
    }
    /**
     * Encuentra sesiones activas por purchase_id
     * @param purchaseId ID de la compra
     * @returns Lista de sesiones activas
     */
    async findActiveByPurchaseId(purchaseId) {
        return await this.repository.find({
            where: {
                purchase_id: purchaseId,
                status: user_session_model_1.UserSessionStatus.ACTIVE,
                sessions_remaining: (0, typeorm_1.MoreThan)(0),
                expires_at: (0, typeorm_1.MoreThan)(new Date())
            },
            relations: ['purchase', 'service'],
            order: { expires_at: 'ASC' }
        });
    }
    /**
     * Encuentra sesiones por service_id
     * @param serviceId ID del servicio
     * @returns Lista de sesiones
     */
    async findByServiceId(serviceId) {
        return await this.repository.find({
            where: { service_id: serviceId },
            relations: ['purchase', 'service'],
            order: { created_at: 'DESC' }
        });
    }
    /**
     * Encuentra sesiones expiradas
     * @returns Lista de sesiones expiradas
     */
    async findExpiredSessions() {
        return await this.repository.find({
            where: {
                expires_at: (0, typeorm_1.LessThan)(new Date()),
                status: (0, typeorm_1.Not)(user_session_model_1.UserSessionStatus.EXPIRED)
            },
            relations: ['purchase', 'service']
        });
    }
    /**
     * Encuentra sesiones agotadas (sin sesiones restantes)
     * @returns Lista de sesiones agotadas
     */
    async findExhaustedSessions() {
        return await this.repository.find({
            where: {
                sessions_remaining: 0,
                status: (0, typeorm_1.Not)(user_session_model_1.UserSessionStatus.EXHAUSTED)
            },
            relations: ['purchase', 'service']
        });
    }
    /**
     * Busca sesiones con filtros
     * @param filters Filtros de búsqueda
     * @returns Lista de sesiones filtradas
     */
    async findWithFilters(filters) {
        const where = {};
        if (filters.purchase_id) {
            where.purchase_id = filters.purchase_id;
        }
        if (filters.service_id) {
            where.service_id = filters.service_id;
        }
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.expires_before) {
            where.expires_at = (0, typeorm_1.LessThan)(filters.expires_before);
        }
        if (filters.expires_after) {
            where.expires_at = (0, typeorm_1.MoreThan)(filters.expires_after);
        }
        if (filters.has_remaining_sessions !== undefined) {
            if (filters.has_remaining_sessions) {
                where.sessions_remaining = (0, typeorm_1.MoreThan)(0);
            }
            else {
                where.sessions_remaining = 0;
            }
        }
        return await this.repository.find({
            where,
            relations: ['purchase', 'service'],
            order: { created_at: 'DESC' }
        });
    }
    /**
     * Actualiza el estado de una sesión
     * @param userSessionId ID de la sesión
     * @param status Nuevo estado
     * @returns Sesión actualizada
     */
    async updateStatus(userSessionId, status) {
        await this.repository.update(userSessionId, { status });
        const userSession = await this.findById(userSessionId);
        if (!userSession) {
            throw new error_handler_1.NotFoundError(`Sesión de usuario con ID ${userSessionId} no encontrada`);
        }
        return userSession;
    }
    /**
     * Reduce las sesiones restantes
     * @param userSessionId ID de la sesión
     * @param sessionsToUse Número de sesiones a usar
     * @returns Sesión actualizada
     */
    async useSessions(userSessionId, sessionsToUse = 1) {
        const userSession = await this.findById(userSessionId);
        if (!userSession) {
            throw new error_handler_1.NotFoundError(`Sesión de usuario con ID ${userSessionId} no encontrada`);
        }
        const newSessionsRemaining = Math.max(0, userSession.sessions_remaining - sessionsToUse);
        const newStatus = newSessionsRemaining === 0 ? user_session_model_1.UserSessionStatus.EXHAUSTED : userSession.status;
        await this.repository.update(userSessionId, {
            sessions_remaining: newSessionsRemaining,
            status: newStatus
        });
        return await this.findById(userSessionId);
    }
    /**
     * Marca sesiones expiradas como expiradas
     * @returns Número de sesiones actualizadas
     */
    async markExpiredSessions() {
        const result = await this.repository.update({
            expires_at: (0, typeorm_1.LessThan)(new Date()),
            status: (0, typeorm_1.Not)(user_session_model_1.UserSessionStatus.EXPIRED)
        }, { status: user_session_model_1.UserSessionStatus.EXPIRED });
        return result.affected || 0;
    }
    /**
     * Marca sesiones agotadas como agotadas
     * @returns Número de sesiones actualizadas
     */
    async markExhaustedSessions() {
        const result = await this.repository.update({
            sessions_remaining: 0,
            status: (0, typeorm_1.Not)(user_session_model_1.UserSessionStatus.EXHAUSTED)
        }, { status: user_session_model_1.UserSessionStatus.EXHAUSTED });
        return result.affected || 0;
    }
}
exports.UserSessionRepository = UserSessionRepository;
