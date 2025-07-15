import { TemporaryCustomer, IdentificationType } from '../../models/temporary-customer.model';
import { UserSession, UserSessionStatus } from '../../models/user-session.model';
import { Purchase } from '../../models/purchase.model';
import { Service } from '../../models/service.model';
import { User } from '../../models/user.model';
import { Repository, Like, MoreThan } from 'typeorm';
import { NotFoundError } from '../../utils/error-handler';
import { AppDataSource } from '../../core/config/database';

interface SearchCustomersParams {
  generalSearch?: string;
  identificationType?: IdentificationType;
  identificationNumber?: string;
  phone?: string;
  email?: string;
}

interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  exhaustedSessions: number;
  totalSessionsRemaining: number;
}

interface CustomerSessionData {
  customer: TemporaryCustomer;
  sessions: UserSession[];
  sessionStats: SessionStats;
}

export class TemporaryCustomerService {
  private temporaryCustomerRepository: Repository<TemporaryCustomer>;
  private purchaseRepository: Repository<Purchase>;
  private userSessionRepository: Repository<UserSession>;

  constructor() {
    this.temporaryCustomerRepository = AppDataSource.getRepository(TemporaryCustomer);
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.userSessionRepository = AppDataSource.getRepository(UserSession);
  }

  /**
   * Buscar cliente temporal por identificación
   */
  async findByIdentification(
    identificationType: IdentificationType,
    identificationNumber: string
  ): Promise<TemporaryCustomer | null> {
    try {
      const customer = await this.temporaryCustomerRepository.findOne({
        where: {
          identification_type: identificationType,
          identification_number: identificationNumber
        },
        relations: ['user']
      });

      return customer;
    } catch (error) {
      console.error('Error finding temporary customer by identification:', error);
      throw error;
    }
  }

  /**
   * Buscar múltiples clientes temporales por diferentes criterios
   */
  async searchCustomers(params: SearchCustomersParams): Promise<TemporaryCustomer[]> {
    try {
      const queryBuilder = this.temporaryCustomerRepository
        .createQueryBuilder('customer')
        .leftJoinAndSelect('customer.user', 'user');

      // Búsqueda general (nombre, apellido, teléfono, email)
      if (params.generalSearch) {
        const searchTerm = `%${params.generalSearch}%`;
        queryBuilder.andWhere(
          '(customer.first_name ILIKE :search OR customer.last_name ILIKE :search OR customer.phone ILIKE :search OR customer.email ILIKE :search OR customer.identification_number ILIKE :search)',
          { search: searchTerm }
        );
      }

      // Búsqueda específica por identificación
      if (params.identificationType) {
        queryBuilder.andWhere('customer.identification_type = :identificationType', {
          identificationType: params.identificationType
        });
      }
      if (params.identificationNumber) {
        queryBuilder.andWhere('customer.identification_number ILIKE :identificationNumber', {
          identificationNumber: `%${params.identificationNumber}%`
        });
      }

      // Búsqueda por teléfono
      if (params.phone) {
        queryBuilder.andWhere('customer.phone ILIKE :phone', {
          phone: `%${params.phone}%`
        });
      }

      // Búsqueda por email
      if (params.email) {
        queryBuilder.andWhere('customer.email ILIKE :email', {
          email: `%${params.email}%`
        });
      }

      const customers = await queryBuilder
        .take(50) // Limitar resultados para evitar sobrecarga
        .orderBy('customer.created_at', 'DESC')
        .getMany();

      return customers;
    } catch (error) {
      console.error('Error searching temporary customers:', error);
      throw error;
    }
  }

  /**
   * Obtener sesiones de un cliente temporal con estadísticas
   */
  async getCustomerSessionsWithStats(customerId: number): Promise<CustomerSessionData> {
    try {
      // Obtener todas las sesiones del cliente con una sola consulta optimizada
      const sessions = await this.userSessionRepository
        .createQueryBuilder('session')
        .leftJoinAndSelect('session.service', 'service')
        .leftJoinAndSelect('session.purchase', 'purchase')
        .leftJoinAndSelect('purchase.temporaryCustomer', 'customer')
        .where('purchase.temp_customer_id = :customerId', { customerId })
        .getMany();
        
      // Extraer customer de la primera sesión
      const customer = sessions[0]?.purchase?.temporaryCustomer;
      if (!customer) {
        throw new NotFoundError('Cliente temporal no encontrado');
      }
      
      // Calcular estadísticas
      const sessionStats = this.calculateSessionStats(sessions);
      
      return {
        customer,
        sessions,
        sessionStats
      };
    } catch (error) {
      console.error('Error getting customer sessions with stats:', error);
      throw error;
    }
  }

  /**
   * Obtener información completa del cliente (cliente + sesiones + estadísticas)
   */
  async getCompleteCustomerInfo(customerId: number): Promise<CustomerSessionData> {
    return this.getCustomerSessionsWithStats(customerId);
  }

  /**
   * Calcular estadísticas de sesiones
   */
  private calculateSessionStats(sessions: UserSession[]): SessionStats {
    const stats: SessionStats = {
      totalSessions: sessions.length,
      activeSessions: 0,
      expiredSessions: 0,
      exhaustedSessions: 0,
      totalSessionsRemaining: 0
    };

    const now = new Date();

    sessions.forEach(session => {
      // Contar sesiones por estado
      switch (session.status) {
        case UserSessionStatus.ACTIVE:
          stats.activeSessions++;
          stats.totalSessionsRemaining += session.sessions_remaining || 0;
          break;
        case UserSessionStatus.EXPIRED:
          stats.expiredSessions++;
          break;
        case UserSessionStatus.EXHAUSTED:
          stats.exhaustedSessions++;
          break;
        case UserSessionStatus.CANCELLED:
          // Las sesiones canceladas no se cuentan en ninguna categoría específica
          break;
      }
    });

    return stats;
  }

  /**
   * Obtener sesiones activas de un cliente
   */
  async getActiveCustomerSessions(customerId: number): Promise<UserSession[]> {

    try {
      const activeSessions = await this.userSessionRepository
        .createQueryBuilder('session')
        .leftJoinAndSelect('session.service', 'service')
        .leftJoin('session.purchase', 'purchase')
        .where('purchase.temp_customer_id = :customerId', { customerId })
        .andWhere('session.status = :status', { status: UserSessionStatus.ACTIVE })
        .andWhere('session.sessions_remaining > :zero', { zero: 0 })
        .andWhere('session.expires_at > :now', { now: new Date() })
        .getMany();

      return activeSessions;
    } catch (error) {
      console.error('Error getting active customer sessions:', error);
      throw error;
    }
  }

  /**
   * Obtener historial completo de sesiones de un cliente temporal
   * Incluye información detallada de cada sesión ordenada cronológicamente
   */
  async getCustomerSessionHistory(customerId: number): Promise<{
    customer: TemporaryCustomer;
    sessionHistory: UserSession[];
    summary: {
      totalSessions: number;
      totalPurchases: number;
      totalAmountSpent: number;
      firstPurchaseDate: Date | null;
      lastActivityDate: Date | null;
      sessionsByStatus: Record<string, number>;
    };
  }> {
    try {
      // Verificar que el cliente existe
      const customer = await this.temporaryCustomerRepository.findOne({
        where: { temp_customer_id: customerId }
      });

      if (!customer) {
        throw new NotFoundError('Cliente temporal no encontrado');
      }

      // Obtener todas las sesiones del cliente con información completa
      const sessionHistory = await this.userSessionRepository
        .createQueryBuilder('session')
        .leftJoinAndSelect('session.service', 'service')
        .leftJoinAndSelect('session.purchase', 'purchase')
        .leftJoinAndSelect('purchase.package', 'package')
        .where('purchase.temp_customer_id = :customerId', { customerId })
        .orderBy('session.created_at', 'DESC')
        .getMany();

      // Obtener información de compras para el resumen
      const purchases = await this.purchaseRepository
        .createQueryBuilder('purchase')
        .where('purchase.temp_customer_id = :customerId', { customerId })
        .getMany();

      // Calcular resumen
      const validPurchaseDates = purchases.filter(p => p.updated_at).map(p => p.updated_at.getTime());
      const validSessionDates = sessionHistory.filter(s => s.updated_at).map(s => s.updated_at.getTime());
      
      const summary = {
        totalSessions: sessionHistory.length,
        totalPurchases: purchases.length,
        totalAmountSpent: purchases.reduce((total, purchase) => total + (purchase.amount_paid || 0), 0),
        firstPurchaseDate: validPurchaseDates.length > 0 ? 
          new Date(Math.min(...validPurchaseDates)) : null,
        lastActivityDate: validSessionDates.length > 0 ? 
          new Date(Math.max(...validSessionDates)) : null,
        sessionsByStatus: sessionHistory.reduce((acc, session) => {
          acc[session.status] = (acc[session.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return {
        customer,
        sessionHistory,
        summary
      };
    } catch (error) {
      console.error('Error getting customer session history:', error);
      throw error;
    }
  }
}