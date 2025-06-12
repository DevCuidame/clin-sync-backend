import { UserSessionRepository } from './user-session.repository';
import { UserSession, UserSessionStatus } from '../../models/user-session.model';
import {
  ICreateUserSessionData,
  IUpdateUserSessionData,
  IUseSessionData,
  UserSessionFilterOptions,
  IUserSessionWithDetails
} from './user-session.interface';
import { BadRequestError, NotFoundError } from '../../utils/error-handler';
import { Repository } from 'typeorm';
import { AppDataSource } from '../../core/config/database';
import { Purchase } from '../../models/purchase.model';
import { Service } from '../../models/service.model';

export class UserSessionService {
  private userSessionRepository: UserSessionRepository;
  private purchaseRepository: Repository<Purchase>;
  private serviceRepository: Repository<Service>;

  constructor() {
    this.userSessionRepository = new UserSessionRepository();
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.serviceRepository = AppDataSource.getRepository(Service);
  }

  /**
   * Crear una nueva sesión de usuario
   * @param data Datos para crear la sesión
   * @returns Sesión creada
   */
  async createUserSession(data: ICreateUserSessionData): Promise<UserSession> {
    // Validar que la compra existe
    const purchase = await this.purchaseRepository.findOne({
      where: { purchase_id: data.purchase_id }
    });
    if (!purchase) {
      throw new NotFoundError(`Compra con ID ${data.purchase_id} no encontrada`);
    }

    // Validar que el servicio existe
    const service = await this.serviceRepository.findOne({
      where: { service_id: data.service_id }
    });
    if (!service) {
      throw new NotFoundError(`Servicio con ID ${data.service_id} no encontrado`);
    }

    // Validar que la fecha de expiración sea futura
    if (data.expires_at <= new Date()) {
      throw new BadRequestError('La fecha de expiración debe ser futura');
    }

    // Validar que el número de sesiones sea positivo
    if (data.sessions_remaining <= 0) {
      throw new BadRequestError('El número de sesiones debe ser mayor a 0');
    }

    const userSession = await this.userSessionRepository.create({
      purchase_id: data.purchase_id,
      service_id: data.service_id,
      sessions_remaining: data.sessions_remaining,
      expires_at: data.expires_at,
      status: data.status || UserSessionStatus.ACTIVE
    });

    return userSession;
  }

  /**
   * Obtener una sesión por ID
   * @param userSessionId ID de la sesión
   * @returns Sesión encontrada
   */
  async getUserSessionById(userSessionId: number): Promise<UserSession> {
    const userSession = await this.userSessionRepository.findById(userSessionId);
    
    if (!userSession) {
      throw new NotFoundError(`Sesión de usuario con ID ${userSessionId} no encontrada`);
    }

    return userSession;
  }

  /**
   * Obtener sesiones por compra
   * @param purchaseId ID de la compra
   * @returns Lista de sesiones
   */
  async getUserSessionsByPurchase(purchaseId: number): Promise<UserSession[]> {
    return await this.userSessionRepository.findByPurchaseId(purchaseId);
  }

  /**
   * Obtener sesiones activas por compra
   * @param purchaseId ID de la compra
   * @returns Lista de sesiones activas
   */
  async getActiveUserSessionsByPurchase(purchaseId: number): Promise<UserSession[]> {
    return await this.userSessionRepository.findActiveByPurchaseId(purchaseId);
  }

  /**
   * Obtener sesiones por servicio
   * @param serviceId ID del servicio
   * @returns Lista de sesiones
   */
  async getUserSessionsByService(serviceId: number): Promise<UserSession[]> {
    return await this.userSessionRepository.findByServiceId(serviceId);
  }

  /**
   * Usar sesiones (reducir el contador)
   * @param data Datos para usar sesiones
   * @returns Sesión actualizada
   */
  async useSessions(data: IUseSessionData): Promise<UserSession> {
    const userSession = await this.getUserSessionById(data.user_session_id);
    
    // Validar que la sesión esté activa
    if (userSession.status !== UserSessionStatus.ACTIVE) {
      throw new BadRequestError(`La sesión no está activa. Estado actual: ${userSession.status}`);
    }

    // Validar que no esté expirada
    if (userSession.expires_at <= new Date()) {
      throw new BadRequestError('La sesión ha expirado');
    }

    // Validar que tenga sesiones disponibles
    const sessionsToUse = data.sessions_to_use || 1;
    if (userSession.sessions_remaining < sessionsToUse) {
      throw new BadRequestError(
        `No hay suficientes sesiones disponibles. Disponibles: ${userSession.sessions_remaining}, Solicitadas: ${sessionsToUse}`
      );
    }

    return await this.userSessionRepository.useSessions(data.user_session_id, sessionsToUse);
  }

  /**
   * Actualizar una sesión
   * @param userSessionId ID de la sesión
   * @param data Datos a actualizar
   * @returns Sesión actualizada
   */
  async updateUserSession(userSessionId: number, data: IUpdateUserSessionData): Promise<UserSession> {
    const userSession = await this.getUserSessionById(userSessionId);

    // Validaciones
    if (data.expires_at && data.expires_at <= new Date()) {
      throw new BadRequestError('La fecha de expiración debe ser futura');
    }

    if (data.sessions_remaining !== undefined && data.sessions_remaining < 0) {
      throw new BadRequestError('El número de sesiones no puede ser negativo');
    }

    const updatedUserSession = await this.userSessionRepository.update(userSessionId, data, 'userSession');
    return updatedUserSession;
  }

  /**
   * Cancelar una sesión
   * @param userSessionId ID de la sesión
   * @returns Sesión cancelada
   */
  async cancelUserSession(userSessionId: number): Promise<UserSession> {
    return await this.userSessionRepository.updateStatus(userSessionId, UserSessionStatus.CANCELLED);
  }

  /**
   * Reactivar una sesión cancelada
   * @param userSessionId ID de la sesión
   * @returns Sesión reactivada
   */
  async reactivateUserSession(userSessionId: number): Promise<UserSession> {
    const userSession = await this.getUserSessionById(userSessionId);
    
    if (userSession.status !== UserSessionStatus.CANCELLED) {
      throw new BadRequestError('Solo se pueden reactivar sesiones canceladas');
    }

    // Verificar que no esté expirada
    if (userSession.expires_at <= new Date()) {
      throw new BadRequestError('No se puede reactivar una sesión expirada');
    }

    // Verificar que tenga sesiones restantes
    if (userSession.sessions_remaining <= 0) {
      throw new BadRequestError('No se puede reactivar una sesión sin sesiones restantes');
    }

    return await this.userSessionRepository.updateStatus(userSessionId, UserSessionStatus.ACTIVE);
  }

  /**
   * Buscar sesiones con filtros
   * @param filters Filtros de búsqueda
   * @returns Lista de sesiones filtradas
   */
  async searchUserSessions(filters: UserSessionFilterOptions): Promise<UserSession[]> {
    return await this.userSessionRepository.findWithFilters(filters);
  }

  /**
   * Obtener sesiones con detalles adicionales
   * @param filters Filtros de búsqueda
   * @returns Lista de sesiones con detalles
   */
  async getUserSessionsWithDetails(filters: UserSessionFilterOptions): Promise<IUserSessionWithDetails[]> {
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
  async processExpiredSessions(): Promise<number> {
    return await this.userSessionRepository.markExpiredSessions();
  }

  /**
   * Proceso automático para marcar sesiones agotadas
   * @returns Número de sesiones marcadas como agotadas
   */
  async processExhaustedSessions(): Promise<number> {
    return await this.userSessionRepository.markExhaustedSessions();
  }

  /**
   * Obtener estadísticas de sesiones por usuario
   * @param userId ID del usuario
   * @returns Estadísticas de sesiones
   */
  async getUserSessionStats(userId: number): Promise<any> {
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
          case UserSessionStatus.ACTIVE:
            activeSessions++;
            remainingSessions += session.sessions_remaining;
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
  async deleteUserSession(userSessionId: number): Promise<boolean> {
    const userSession = await this.getUserSessionById(userSessionId);
    return await this.userSessionRepository.delete(userSessionId, 'userSession');
  }
}