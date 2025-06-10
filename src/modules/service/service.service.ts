import { AppDataSource } from '../../core/config/database';
import { Service, ServiceCategory } from '../../models/service.model';
import { Repository } from 'typeorm';
import { CreateServiceDto, UpdateServiceDto } from './service.dto';

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

  async getAllServices(filters?: ServiceFilters): Promise<Service[]> {
    const queryBuilder = this.serviceRepository.createQueryBuilder('service');
    
    if (filters?.category) {
      queryBuilder.andWhere('service.category = :category', { category: filters.category });
    }
    
    if (filters?.is_active !== undefined) {
      queryBuilder.andWhere('service.is_active = :is_active', { is_active: filters.is_active });
    }
    
    return await queryBuilder.getMany();
  }

  async getServiceById(id: number): Promise<Service | null> {
    return await this.serviceRepository.findOne({
      where: { service_id: id }
    });
  }

  async updateService(id: number, updateData: UpdateServiceDto): Promise<Service> {
    await this.serviceRepository.update(id, updateData);
    const updatedService = await this.getServiceById(id);
    
    if (!updatedService) {
      throw new Error('Service not found after update');
    }
    
    return updatedService;
  }

  async deleteService(id: number): Promise<void> {
    const result = await this.serviceRepository.delete(id);
    
    if (result.affected === 0) {
      throw new Error('Service not found');
    }
  }

  async getServicesByCategory(category: ServiceCategory): Promise<Service[]> {
    return await this.serviceRepository.find({
      where: { 
        category,
        is_active: true 
      }
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