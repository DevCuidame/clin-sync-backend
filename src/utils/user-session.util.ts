import { UserSessionService } from '../modules/user-session/user-session.service';
import { UserSessionStatus } from '../models/user-session.model';
import { logger } from './logger';

/**
 * Utilidades para el manejo de sesiones de usuario
 */
export class UserSessionUtil {
  private static userSessionService = new UserSessionService();

  /**
   * Proceso automático para actualizar el estado de las sesiones
   * Debe ejecutarse periódicamente (ej: cada hora o diariamente)
   */
  static async processSessionMaintenance(): Promise<{
    expiredSessions: number;
    exhaustedSessions: number;
  }> {
    try {
      logger.info('Iniciando mantenimiento de sesiones de usuario');
      
      // Marcar sesiones expiradas
      const expiredCount = await this.userSessionService.processExpiredSessions();
      logger.info(`${expiredCount} sesiones marcadas como expiradas`);
      
      // Marcar sesiones agotadas
      const exhaustedCount = await this.userSessionService.processExhaustedSessions();
      logger.info(`${exhaustedCount} sesiones marcadas como agotadas`);
      
      logger.info('Mantenimiento de sesiones completado exitosamente');
      
      return {
        expiredSessions: expiredCount,
        exhaustedSessions: exhaustedCount
      };
    } catch (error) {
      logger.error('Error durante el mantenimiento de sesiones:', error);
      throw error;
    }
  }

  /**
   * Valida si una sesión puede ser utilizada
   * @param userSession Sesión a validar
   * @param sessionsToUse Número de sesiones que se quieren usar
   * @returns Objeto con el resultado de la validación
   */
  static validateSessionUsage(userSession: any, sessionsToUse: number = 1): {
    isValid: boolean;
    reason?: string;
  } {
    // Verificar estado activo
    if (userSession.status !== UserSessionStatus.ACTIVE) {
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
  static getDaysUntilExpiration(expiresAt: Date): number {
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
  static getUsagePercentage(totalSessions: number, remainingSessions: number): number {
    if (totalSessions <= 0) return 0;
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
  static getSessionAlerts(userSession: any, warningDays: number = 7, warningSessionsThreshold: number = 2): {
    hasAlerts: boolean;
    alerts: string[];
  } {
    const alerts: string[] = [];
    
    // Verificar expiración próxima
    const daysUntilExpiration = this.getDaysUntilExpiration(userSession.expires_at);
    if (daysUntilExpiration <= 0) {
      alerts.push('La sesión ha expirado');
    } else if (daysUntilExpiration <= warningDays) {
      alerts.push(`La sesión expira en ${daysUntilExpiration} día(s)`);
    }
    
    // Verificar pocas sesiones restantes
    if (userSession.sessions_remaining <= 0) {
      alerts.push('No quedan sesiones disponibles');
    } else if (userSession.sessions_remaining <= warningSessionsThreshold) {
      alerts.push(`Solo quedan ${userSession.sessions_remaining} sesión(es)`);
    }
    
    // Verificar estado inactivo
    if (userSession.status !== UserSessionStatus.ACTIVE) {
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
  static formatSessionInfo(userSession: any): {
    id: number;
    serviceName: string;
    sessionsRemaining: number;
    expiresAt: string;
    status: string;
    daysUntilExpiration: number;
    isExpired: boolean;
    isExhausted: boolean;
    alerts: string[];
  } {
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
  static createSessionSummary(userSessions: any[]): {
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    exhaustedSessions: number;
    cancelledSessions: number;
    totalRemainingSessions: number;
    sessionsNeedingAttention: number;
    upcomingExpirations: any[];
  } {
    let activeSessions = 0;
    let expiredSessions = 0;
    let exhaustedSessions = 0;
    let cancelledSessions = 0;
    let totalRemainingSessions = 0;
    let sessionsNeedingAttention = 0;
    const upcomingExpirations: any[] = [];
    
    userSessions.forEach(session => {
      switch (session.status) {
        case UserSessionStatus.ACTIVE:
          activeSessions++;
          totalRemainingSessions += session.sessions_remaining;
          break;
        case UserSessionStatus.EXPIRED:
          expiredSessions++;
          break;
        case UserSessionStatus.EXHAUSTED:
          exhaustedSessions++;
          break;
        case UserSessionStatus.CANCELLED:
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
      if (daysUntilExpiration > 0 && daysUntilExpiration <= 30 && session.status === UserSessionStatus.ACTIVE) {
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