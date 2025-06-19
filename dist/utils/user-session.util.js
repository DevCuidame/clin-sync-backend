"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSessionUtil = void 0;
const user_session_service_1 = require("../modules/user-session/user-session.service");
const user_session_model_1 = require("../models/user-session.model");
const logger_1 = __importDefault(require("./logger"));
/**
 * Utilidades para el manejo de sesiones de usuario
 */
class UserSessionUtil {
    static userSessionService = new user_session_service_1.UserSessionService();
    /**
     * Proceso automático para actualizar el estado de las sesiones
     * Debe ejecutarse periódicamente (ej: cada hora o diariamente)
     */
    static async processSessionMaintenance() {
        try {
            logger_1.default.info('Iniciando mantenimiento de sesiones de usuario');
            // Marcar sesiones expiradas
            const expiredCount = await this.userSessionService.processExpiredSessions();
            logger_1.default.info(`${expiredCount} sesiones marcadas como expiradas`);
            // Marcar sesiones agotadas
            const exhaustedCount = await this.userSessionService.processExhaustedSessions();
            logger_1.default.info(`${exhaustedCount} sesiones marcadas como agotadas`);
            logger_1.default.info('Mantenimiento de sesiones completado exitosamente');
            return {
                expiredSessions: expiredCount,
                exhaustedSessions: exhaustedCount
            };
        }
        catch (error) {
            logger_1.default.error('Error durante el mantenimiento de sesiones:', error);
            throw error;
        }
    }
    /**
     * Valida si una sesión puede ser utilizada
     * @param userSession Sesión a validar
     * @param sessionsToUse Número de sesiones que se quieren usar
     * @returns Objeto con el resultado de la validación
     */
    static validateSessionUsage(userSession, sessionsToUse = 1) {
        // Verificar estado activo
        if (userSession.status !== user_session_model_1.UserSessionStatus.ACTIVE) {
            return {
                isValid: false,
                reason: `La sesión no está activa. Estado actual: ${userSession.status}`
            };
        }
        // Verificar expiración
        if (userSession.expires_at <= new Date()) {
            return {
                isValid: false,
                reason: 'La sesión ha expirado'
            };
        }
        // Verificar sesiones disponibles
        if (userSession.sessions_remaining < sessionsToUse) {
            return {
                isValid: false,
                reason: `No hay suficientes sesiones disponibles. Disponibles: ${userSession.sessions_remaining}, Solicitadas: ${sessionsToUse}`
            };
        }
        return { isValid: true };
    }
    /**
     * Calcula los días restantes hasta la expiración
     * @param expiresAt Fecha de expiración
     * @returns Número de días restantes (negativo si ya expiró)
     */
    static getDaysUntilExpiration(expiresAt) {
        const now = new Date();
        const diffTime = expiresAt.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    /**
     * Obtiene el porcentaje de sesiones utilizadas
     * @param totalSessions Total de sesiones iniciales
     * @param remainingSessions Sesiones restantes
     * @returns Porcentaje utilizado (0-100)
     */
    static getUsagePercentage(totalSessions, remainingSessions) {
        if (totalSessions <= 0)
            return 0;
        const usedSessions = totalSessions - remainingSessions;
        return Math.round((usedSessions / totalSessions) * 100);
    }
    /**
     * Determina si una sesión necesita atención (próxima a expirar o pocas sesiones)
     * @param userSession Sesión a evaluar
     * @param warningDays Días de anticipación para advertencia de expiración
     * @param warningSessionsThreshold Umbral de sesiones restantes para advertencia
     * @returns Objeto con alertas
     */
    static getSessionAlerts(userSession, warningDays = 7, warningSessionsThreshold = 2) {
        const alerts = [];
        // Verificar expiración próxima
        const daysUntilExpiration = this.getDaysUntilExpiration(userSession.expires_at);
        if (daysUntilExpiration <= 0) {
            alerts.push('La sesión ha expirado');
        }
        else if (daysUntilExpiration <= warningDays) {
            alerts.push(`La sesión expira en ${daysUntilExpiration} día(s)`);
        }
        // Verificar pocas sesiones restantes
        if (userSession.sessions_remaining <= 0) {
            alerts.push('No quedan sesiones disponibles');
        }
        else if (userSession.sessions_remaining <= warningSessionsThreshold) {
            alerts.push(`Solo quedan ${userSession.sessions_remaining} sesión(es)`);
        }
        // Verificar estado inactivo
        if (userSession.status !== user_session_model_1.UserSessionStatus.ACTIVE) {
            alerts.push(`La sesión está ${userSession.status}`);
        }
        return {
            hasAlerts: alerts.length > 0,
            alerts
        };
    }
    /**
     * Formatea la información de una sesión para mostrar al usuario
     * @param userSession Sesión a formatear
     * @returns Información formateada
     */
    static formatSessionInfo(userSession) {
        const daysUntilExpiration = this.getDaysUntilExpiration(userSession.expires_at);
        const alerts = this.getSessionAlerts(userSession);
        return {
            id: userSession.user_session_id,
            serviceName: userSession.service?.service_name || 'Servicio no especificado',
            sessionsRemaining: userSession.sessions_remaining,
            expiresAt: userSession.expires_at.toISOString().split('T')[0], // Solo fecha
            status: userSession.status,
            daysUntilExpiration,
            isExpired: daysUntilExpiration <= 0,
            isExhausted: userSession.sessions_remaining <= 0,
            alerts: alerts.alerts
        };
    }
    /**
     * Crea un resumen de sesiones para un usuario
     * @param userSessions Lista de sesiones del usuario
     * @returns Resumen de sesiones
     */
    static createSessionSummary(userSessions) {
        let activeSessions = 0;
        let expiredSessions = 0;
        let exhaustedSessions = 0;
        let cancelledSessions = 0;
        let totalRemainingSessions = 0;
        let sessionsNeedingAttention = 0;
        const upcomingExpirations = [];
        userSessions.forEach(session => {
            switch (session.status) {
                case user_session_model_1.UserSessionStatus.ACTIVE:
                    activeSessions++;
                    totalRemainingSessions += session.sessions_remaining;
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
            // Verificar si necesita atención
            const alerts = this.getSessionAlerts(session);
            if (alerts.hasAlerts) {
                sessionsNeedingAttention++;
            }
            // Verificar expiraciones próximas (próximos 30 días)
            const daysUntilExpiration = this.getDaysUntilExpiration(session.expires_at);
            if (daysUntilExpiration > 0 && daysUntilExpiration <= 30 && session.status === user_session_model_1.UserSessionStatus.ACTIVE) {
                upcomingExpirations.push({
                    sessionId: session.user_session_id,
                    serviceName: session.service?.service_name,
                    daysUntilExpiration,
                    sessionsRemaining: session.sessions_remaining
                });
            }
        });
        // Ordenar expiraciones próximas por días restantes
        upcomingExpirations.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
        return {
            totalSessions: userSessions.length,
            activeSessions,
            expiredSessions,
            exhaustedSessions,
            cancelledSessions,
            totalRemainingSessions,
            sessionsNeedingAttention,
            upcomingExpirations
        };
    }
}
exports.UserSessionUtil = UserSessionUtil;
