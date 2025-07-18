import { AppDataSource } from '../../core/config/database';
import { Service, ServiceCategory } from '../../models/service.model';
import { Repository } from 'typeorm';
import { CreateServiceDto, UpdateServiceDto } from './service.dto';
import { FileUploadService } from '../../utils/file-upload.util';

interface ServiceFilters {
  category?: string;
  is_active?: boolean;
}

export class ServiceService {
  private serviceRepository: Repository<Service>;

  constructor() {
    this.serviceRepository = AppDataSource.getRepository(Service);
  }

  async createService(serviceData: CreateServiceDto): Promise<Service> {
    const service = this.serviceRepository.create(serviceData);
    return await this.serviceRepository.save(service);
  }

  async getServices(filters?: ServiceFilters): Promise<Service[]> {
    const queryBuilder = this.serviceRepository.createQueryBuilder('service');

    if (filters?.category) {
      queryBuilder.andWhere('service.category = :category', {
        category: filters.category,
      });
    }

    if (filters?.is_active !== undefined) {
      queryBuilder.andWhere('service.is_active = :is_active', {
        is_active: filters.is_active,
      });
    }

    return await queryBuilder.getMany();
  }

  async getAllServices(): Promise<Service[]> {
    try {
      const queryBuilder = this.serviceRepository.createQueryBuilder('service');
      const result = await queryBuilder.getMany();
      return result;
    } catch (error) {
      console.error('❌ Error en getAllServices:', error);
      throw error;
    }
  }

  async getServiceById(id: number): Promise<Service | null> {
    return await this.serviceRepository.findOne({
      where: { service_id: id },
    });
  }

    async getServiceByIdComplete(id: number, userId?: number): Promise<any | null> {
    // Obtener el servicio base
    const service = await this.serviceRepository.findOne({
      where: { service_id: id },
    });

    if (!service) {
      return null;
    }

    let enrichedData: any = {
      sessions: [],
      appointments: [],
      purchases: []
    };

    // Si se proporciona userId, obtener datos específicos del usuario
    if (userId) {
      // Obtener sesiones del usuario para este servicio (a través de user_sessions)
      const userSessions = await AppDataSource.getRepository('UserSession')
        .createQueryBuilder('userSession')
        .leftJoinAndSelect('userSession.purchase', 'purchase')
        .leftJoinAndSelect('userSession.service', 'service')
        .where('purchase.user_id = :userId', { userId })
        .andWhere('userSession.service_id = :serviceId', { serviceId: id })
        .andWhere('purchase.payment_status = :status', { status: 'completed' })
        .getMany();

      // Obtener citas del usuario para este servicio
      const userAppointments = await AppDataSource.getRepository('Appointment')
        .createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.service', 'service')
        .leftJoinAndSelect('appointment.professional', 'professional')
        .leftJoinAndSelect('professional.user', 'professionalUser')
        .where('appointment.user_id = :userId', { userId })
        .andWhere('appointment.service_id = :serviceId', { serviceId: id })
        .orderBy('appointment.scheduled_at', 'DESC')
        .getMany();

      // Obtener solo las compras que tienen user_sessions asociadas
      const sessionPurchaseIds = userSessions.map(session => session.purchase_id);
      const userPurchases = sessionPurchaseIds.length > 0 
        ? await AppDataSource.getRepository('Purchase')
            .createQueryBuilder('purchase')
            .leftJoinAndSelect('purchase.service', 'service')
            .where('purchase.purchase_id IN (:...purchaseIds)', { purchaseIds: sessionPurchaseIds })
            .orderBy('purchase.purchase_date', 'DESC')
            .getMany()
        : [];

      // Mapear sesiones (basadas en user_sessions)
      enrichedData.sessions = userSessions.map(userSession => ({
        user_session_id: userSession.user_session_id,
        purchase_id: userSession.purchase_id,
        service_name: userSession.service.service_name,
        sessions_purchased: userSession.sessions_purchased,
        sessions_remaining: userSession.sessions_remaining,
        sessions_used: userSession.sessions_purchased - userSession.sessions_remaining,
        status: userSession.status,
        expires_at: userSession.expires_at,
        created_at: userSession.created_at,
        updated_at: userSession.updated_at,
        purchase_info: {
          amount_paid: userSession.purchase.amount_paid,
          purchase_date: userSession.purchase.purchase_date,
          payment_status: userSession.purchase.payment_status,
          purchase_type: userSession.purchase.purchase_type
        }
      }));

      // Mapear citas
      enrichedData.appointments = userAppointments.map(appointment => ({
        appointment_id: appointment.appointment_id,
        scheduled_at: appointment.scheduled_at,
        status: appointment.status,
        duration_minutes: appointment.duration_minutes,
        amount: appointment.amount,
        notes: appointment.notes,
        cancellation_reason: appointment.cancellation_reason,
        user_session_id: appointment.user_session_id,
        created_at: appointment.created_at,
        professional: {
          professional_id: appointment.professional.professional_id,
          specialization: appointment.professional.specialization,
          user: {
            first_name: appointment.professional.user.first_name,
            last_name: appointment.professional.user.last_name
          }
        }
      }));

      // Mapear compras
      enrichedData.purchases = userPurchases.map(purchase => ({
        purchase_id: purchase.purchase_id,
        service_name: purchase.service.service_name,
        amount_paid: purchase.amount_paid,
        payment_status: purchase.payment_status,
        purchase_date: purchase.purchase_date,
        payment_method: purchase.payment_method,
        purchase_type: purchase.purchase_type,
        transaction_id: purchase.transaction_id,
        reference: purchase.reference,
        expires_at: purchase.expires_at,
        created_at: purchase.purchase_date,
        updated_at: purchase.updated_at,
        service: {
          service_id: purchase.service.service_id,
          service_name: purchase.service.service_name,
          description: purchase.service.description,
          base_price: purchase.service.base_price,
          duration_minutes: purchase.service.duration_minutes,
          category: purchase.service.category
        }
      }));
    }

    // Construir respuesta enriquecida
    return {
      ...service,
      user_data: enrichedData
    };
  }

  async updateService(
    id: number,
    updateData: UpdateServiceDto
  ): Promise<Service> {
    await this.serviceRepository.update(id, updateData);
    const updatedService = await this.getServiceById(id);

    if (!updatedService) {
      throw new Error('Service not found after update');
    }

    return updatedService;
  }

  async deleteService(id: number): Promise<void> {
    // Obtener el servicio antes de eliminarlo para acceder a la imagen
    const serviceToDelete = await this.serviceRepository.findOne({
      where: { service_id: id }
    });
    
    if (!serviceToDelete) {
      throw new Error('Service not found');
    }
    
    // Eliminar la imagen asociada si existe
    if (serviceToDelete.image_url) {
      try {
        await FileUploadService.deleteFile(serviceToDelete.image_url);
      } catch (error) {
        console.warn('Error al eliminar imagen del servicio:', error);
        // Continuar con la eliminación del servicio aunque falle la eliminación de la imagen
      }
    }
    
    const result = await this.serviceRepository.delete(id);

    if (result.affected === 0) {
      throw new Error('Service not found');
    }
  }

  async getServicesByCategory(category: ServiceCategory): Promise<Service[]> {
    return await this.serviceRepository.find({
      where: {
        category,
        is_active: true,
      },
    });
  }

  async toggleServiceStatus(id: number): Promise<Service> {
    const service = await this.getServiceById(id);

    if (!service) {
      throw new Error('Service not found');
    }

    return await this.updateService(id, { is_active: !service.is_active });
  }
}
