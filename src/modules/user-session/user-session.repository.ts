import { FindOptionsWhere, LessThan, MoreThan, Not } from 'typeorm';
import { BaseRepository } from '../../core/repositories/base.repository';
import { UserSession, UserSessionStatus } from '../../models/user-session.model';
import { UserSessionFilterOptions } from './user-session.interface';
import { NotFoundError } from '../../utils/error-handler';

export class UserSessionRepository extends BaseRepository<UserSession> {
  constructor() {
    super(UserSession);
  }

  /**
   * Encuentra sesiones por purchase_id
   * @param purchaseId ID de la compra
   * @returns Lista de sesiones
   */
  async findByPurchaseId(purchaseId: number): Promise<UserSession[]> {
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
  async findActiveByPurchaseId(purchaseId: number): Promise<UserSession[]> {
    return await this.repository.find({
      where: {
        purchase_id: purchaseId,
        status: UserSessionStatus.ACTIVE,
        sessions_remaining: MoreThan(0),
        expires_at: MoreThan(new Date())
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
  async findByServiceId(serviceId: number): Promise<UserSession[]> {
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
  async findExpiredSessions(): Promise<UserSession[]> {
    return await this.repository.find({
      where: {
        expires_at: LessThan(new Date()),
        status: Not(UserSessionStatus.EXPIRED)
      },
      relations: ['purchase', 'service']
    });
  }

  /**
   * Encuentra sesiones agotadas (sin sesiones restantes)
   * @returns Lista de sesiones agotadas
   */
  async findExhaustedSessions(): Promise<UserSession[]> {
    return await this.repository.find({
      where: {
        sessions_remaining: 0,
        status: Not(UserSessionStatus.EXHAUSTED)
      },
      relations: ['purchase', 'service']
    });
  }

  /**
   * Busca sesiones con filtros
   * @param filters Filtros de búsqueda
   * @returns Lista de sesiones filtradas
   */
  async findWithFilters(filters: UserSessionFilterOptions): Promise<UserSession[]> {
    const where: FindOptionsWhere<UserSession> = {};

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
      where.expires_at = LessThan(filters.expires_before);
    }

    if (filters.expires_after) {
      where.expires_at = MoreThan(filters.expires_after);
    }

    if (filters.has_remaining_sessions !== undefined) {
      if (filters.has_remaining_sessions) {
        where.sessions_remaining = MoreThan(0);
      } else {
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
  async updateStatus(userSessionId: number, status: UserSessionStatus): Promise<UserSession> {
    await this.repository.update(userSessionId, { status });
    const userSession = await this.findById(userSessionId);
    
    if (!userSession) {
      throw new NotFoundError(`Sesión de usuario con ID ${userSessionId} no encontrada`);
    }
    
    return userSession;
  }

  /**
   * Reduce las sesiones restantes
   * @param userSessionId ID de la sesión
   * @param sessionsToUse Número de sesiones a usar
   * @returns Sesión actualizada
   */
  async useSessions(userSessionId: number, sessionsToUse: number = 1): Promise<UserSession> {
    const userSession = await this.findById(userSessionId);
    
    if (!userSession) {
      throw new NotFoundError(`Sesión de usuario con ID ${userSessionId} no encontrada`);
    }

    const newSessionsRemaining = Math.max(0, userSession.sessions_remaining - sessionsToUse);
    const newStatus = newSessionsRemaining === 0 ? UserSessionStatus.EXHAUSTED : userSession.status;

    await this.repository.update(userSessionId, {
      sessions_remaining: newSessionsRemaining,
      status: newStatus
    });

    return await this.findById(userSessionId) as UserSession;
  }

  /**
   * Marca sesiones expiradas como expiradas
   * @returns Número de sesiones actualizadas
   */
  async markExpiredSessions(): Promise<number> {
    const result = await this.repository.update(
      {
        expires_at: LessThan(new Date()),
        status: Not(UserSessionStatus.EXPIRED)
      },
      { status: UserSessionStatus.EXPIRED }
    );

    return result.affected || 0;
  }

  /**
   * Marca sesiones agotadas como agotadas
   * @returns Número de sesiones actualizadas
   */
  async markExhaustedSessions(): Promise<number> {
    const result = await this.repository.update(
      {
        sessions_remaining: 0,
        status: Not(UserSessionStatus.EXHAUSTED)
      },
      { status: UserSessionStatus.EXHAUSTED }
    );

    return result.affected || 0;
  }
}