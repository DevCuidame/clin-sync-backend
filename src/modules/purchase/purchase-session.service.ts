import { Purchase, PaymentStatus } from '../../models/purchase.model';
import { PackageService } from '../../models/package-service.model';
import { UserSession, UserSessionStatus } from '../../models/user-session.model';
import { Package } from '../../models/package.model';
import { User } from '../../models/user.model';
import { Service } from '../../models/service.model';
import { Repository, In } from 'typeorm';
import { AppDataSource } from '../../core/config/database';
import logger  from '../../utils/logger';
import { NotFoundError, BadRequestError } from '../../utils/error-handler';

export class PurchaseSessionService {
  private purchaseRepository: Repository<Purchase>;
  private packageServiceRepository: Repository<PackageService>;
  private userSessionRepository: Repository<UserSession>;
  private packageRepository: Repository<Package>;

  constructor() {
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.packageServiceRepository = AppDataSource.getRepository(PackageService);
    this.userSessionRepository = AppDataSource.getRepository(UserSession);
    this.packageRepository = AppDataSource.getRepository(Package);
  }

  /**
   * Crea sesiones manualmente para una compra específica
   * Útil como respaldo o para casos especiales
   */
  async createSessionsForPurchase(purchaseId: number): Promise<UserSession[]> {
    try {
      // Verificar que la compra existe y está completada
      const purchase = await this.purchaseRepository.findOne({
        where: { 
          purchase_id: purchaseId,
          payment_status: PaymentStatus.COMPLETED 
        },
        relations: ['package']
      });

      if (!purchase) {
        throw new NotFoundError('Compra no encontrada o no está completada');
      }

      // Verificar si ya existen sesiones
      const existingSessions = await this.userSessionRepository.find({
        where: { purchase_id: purchaseId }
      });

      if (existingSessions.length > 0) {
        throw new BadRequestError('Las sesiones ya fueron creadas para esta compra');
      }

      // Obtener servicios del paquete
      const packageServices = await this.packageServiceRepository.find({
        where: { package_id: purchase.package_id },
        relations: ['service']
      });

      if (packageServices.length === 0) {
        throw new BadRequestError('No se encontraron servicios para este paquete');
      }

      const createdSessions: UserSession[] = [];

      // Crear una sesión por cada servicio del paquete
      for (const packageService of packageServices) {
        const session = this.userSessionRepository.create({
          purchase_id: purchase.purchase_id,
          service_id: packageService.service_id,
          sessions_remaining: packageService.sessions_included,
          sessions_purchased: packageService.sessions_included,
          expires_at: purchase.expires_at,
          status: UserSessionStatus.ACTIVE
        });

        const savedSession = await this.userSessionRepository.save(session);
        createdSessions.push(savedSession);
      }

      logger.info('Sessions created manually for purchase', {
        purchaseId: purchase.purchase_id,
        packageId: purchase.package_id,
        sessionsCreated: createdSessions.length
      });

      return createdSessions;

    } catch (error) {
      logger.error('Error creating sessions manually for purchase', {
        purchaseId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Verifica si una compra ya tiene sesiones creadas
   */
  async hasSessionsCreated(purchaseId: number): Promise<boolean> {
    const sessions = await this.userSessionRepository.find({
      where: { purchase_id: purchaseId }
    });
    return sessions.length > 0;
  }

  /**
   * Obtiene las sesiones de una compra específica
   */
  async getSessionsByPurchase(purchaseId: number): Promise<UserSession[]> {
    return await this.userSessionRepository.find({
      where: { purchase_id: purchaseId },
      relations: ['service', 'purchase'],
      order: { created_at: 'DESC' }
    });
  }

  /**
   * Obtiene estadísticas de sesiones para una compra
   */
  async getSessionStats(purchaseId: number): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    exhaustedSessions: number;
    totalSessionsRemaining: number;
  }> {
    const sessions = await this.userSessionRepository.find({
      where: { purchase_id: purchaseId }
    });

    const stats = {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === UserSessionStatus.ACTIVE).length,
      expiredSessions: sessions.filter(s => s.status === UserSessionStatus.EXPIRED).length,
      exhaustedSessions: sessions.filter(s => s.status === UserSessionStatus.EXHAUSTED).length,
      totalSessionsRemaining: sessions.reduce((sum, s) => sum + s.sessions_remaining, 0)
    };

    return stats;
  }

  /**
   * Obtiene datos completos de sesiones por paquete
   * Incluye información del paquete, usuarios, servicios y estadísticas
   */
  async getCompleteSessionsByPackage(packageId: number): Promise<{
    package: Package;
    sessions: UserSession[];
    stats: {
      totalSessions: number;
      activeSessions: number;
      expiredSessions: number;
      exhaustedSessions: number;
      totalSessionsRemaining: number;
    };
  }> {
    try {
      // Verificar que el paquete existe
      const packageEntity = await this.packageRepository.findOne({
        where: { package_id: packageId }
      });

      if (!packageEntity) {
        throw new NotFoundError('Paquete no encontrado');
      }

      // Obtener todas las compras completadas de este paquete
      const purchases = await this.purchaseRepository.find({
        where: { 
          package_id: packageId,
          payment_status: PaymentStatus.COMPLETED 
        }
      });

      // Obtener todas las sesiones de este paquete
      const purchaseIds = purchases.map(p => p.purchase_id);
      const sessions = purchaseIds.length > 0 
        ? await this.userSessionRepository.find({
            where: { 
              purchase_id: In(purchaseIds)
            },
            relations: ['service', 'purchase', 'purchase.user']
          })
        : []; // Si no hay compras, retornar array vacío

      // Calcular estadísticas de las sesiones
      const stats = {
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.status === UserSessionStatus.ACTIVE).length,
        expiredSessions: sessions.filter(s => s.status === UserSessionStatus.EXPIRED).length,
        exhaustedSessions: sessions.filter(s => s.status === UserSessionStatus.EXHAUSTED).length,
        totalSessionsRemaining: sessions.reduce((sum, s) => sum + s.sessions_remaining, 0)
      };

      const result = {
        package: packageEntity,
        sessions,
        stats
      };

      logger.info('Package sessions retrieved', {
        packageId,
        totalSessions: sessions.length
      });

      return result;

    } catch (error) {
      logger.error('Error getting complete sessions by package', {
        packageId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
   }

   /**
    * Detecta y procesa compras completadas que no tienen sesiones creadas
    * Útil para procesar compras que fallaron en la creación automática
    */
   async detectAndCreateMissingSessions(): Promise<{
     processedPurchases: number;
     createdSessions: number;
     errors: Array<{
       purchaseId: number;
       error: string;
     }>;
   }> {
     try {
       // Obtener todas las compras completadas
       const completedPurchases = await this.purchaseRepository.find({
         where: { 
           payment_status: PaymentStatus.COMPLETED 
         },
         relations: ['user', 'package']
       });

       logger.info('Starting detection of purchases without sessions', {
         totalCompletedPurchases: completedPurchases.length
       });

       const purchasesWithoutSessions: Purchase[] = [];
       
       // Verificar cuáles compras no tienen sesiones
       for (const purchase of completedPurchases) {
         const existingSessions = await this.userSessionRepository.find({
           where: { purchase_id: purchase.purchase_id }
         });
         
         if (existingSessions.length === 0) {
           purchasesWithoutSessions.push(purchase);
         }
       }

       logger.info('Purchases without sessions detected', {
         purchasesWithoutSessions: purchasesWithoutSessions.length
       });

       let processedPurchases = 0;
       let totalCreatedSessions = 0;
       const errors: Array<{ purchaseId: number; error: string }> = [];

       // Procesar cada compra sin sesiones
       for (const purchase of purchasesWithoutSessions) {
         try {
           // Obtener servicios del paquete
           const packageServices = await this.packageServiceRepository.find({
             where: { package_id: purchase.package_id },
             relations: ['service']
           });

           if (packageServices.length === 0) {
             errors.push({
               purchaseId: purchase.purchase_id,
               error: 'No se encontraron servicios para el paquete'
             });
             continue;
           }

           // Crear sesiones para esta compra
           const createdSessions: UserSession[] = [];
           
           for (const packageService of packageServices) {
             const session = this.userSessionRepository.create({
               purchase_id: purchase.purchase_id,
               service_id: packageService.service_id,
               sessions_remaining: packageService.sessions_included,
               expires_at: purchase.expires_at,
               status: UserSessionStatus.ACTIVE
             });

             const savedSession = await this.userSessionRepository.save(session);
             createdSessions.push(savedSession);
           }

           processedPurchases++;
           totalCreatedSessions += createdSessions.length;

           logger.info('Sessions created for purchase without sessions', {
             purchaseId: purchase.purchase_id,
             userId: purchase.user_id,
             packageId: purchase.package_id,
             sessionsCreated: createdSessions.length
           });

         } catch (error) {
           const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
           errors.push({
             purchaseId: purchase.purchase_id,
             error: errorMessage
           });
           
           logger.error('Error creating sessions for purchase', {
             purchaseId: purchase.purchase_id,
             error: errorMessage
           });
         }
       }

       const result = {
         processedPurchases,
         createdSessions: totalCreatedSessions,
         errors
       };

       logger.info('Detection and creation of missing sessions completed', result);

       return result;

     } catch (error) {
       logger.error('Error in detectAndCreateMissingSessions', {
         error: error instanceof Error ? error.message : 'Unknown error'
       });
       throw error;
     }
   }
 }