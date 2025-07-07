import { Repository } from 'typeorm';
import { AppDataSource } from '../../core/config/database';
import { Package } from '../../models/package.model';
import { Purchase } from '../../models/purchase.model';
import { Service } from '../../models/service.model';
import { PackageService as PackageServiceModel } from '../../models/package-service.model';
import { CreatePackageDto, UpdatePackageDto, PackageResponseDto } from './package.dto';
import { FileUploadService } from '../../utils/file-upload.util';

export class PackageService {
  private packageRepository: Repository<Package>;
  private packageServiceRepository: Repository<PackageServiceModel>;
  private serviceRepository: Repository<Service>;

  constructor() {
    this.packageRepository = AppDataSource.getRepository(Package);
    this.packageServiceRepository = AppDataSource.getRepository(PackageServiceModel);
    this.serviceRepository = AppDataSource.getRepository(Service);
  }

  async createPackage(packageData: CreatePackageDto): Promise<PackageResponseDto> {
    // Usar transacción para asegurar consistencia
    return await AppDataSource.transaction(async manager => {
      // Crear el paquete
      const newPackage = manager.create(Package, {
        package_name: packageData.package_name,
        description: packageData.description,
        price: packageData.price,
        total_sessions: packageData.total_sessions,
        validity_days: packageData.validity_days,
        discount_percentage: packageData.discount_percentage,
        is_active: packageData.is_active ?? true,
        terms_conditions: packageData.terms_conditions,
        image_url: packageData.image_url
      });

      const savedPackage = await manager.save(Package, newPackage);

      // Si se proporcionaron servicios, crear las relaciones
      if (packageData.services && packageData.services.length > 0) {
        for (const serviceData of packageData.services) {
          // Verificar que el servicio existe
          const service = await manager.findOne(Service, {
            where: { service_id: parseInt(serviceData.service_id.toString()) }
          });

          if (service) {
            const packageService = manager.create(PackageServiceModel, {
              package_id: savedPackage.package_id,
              service_id: service.service_id,
              sessions_included: serviceData.sessions_included
            });

            await manager.save(PackageServiceModel, packageService);
          }
        }
      }

      return this.mapToResponseDto(savedPackage);
    });
  }

  async getAllPackages(isActive?: boolean): Promise<PackageResponseDto[]> {
    const queryBuilder = this.packageRepository.createQueryBuilder('package');
    
    if (isActive !== undefined) {
      queryBuilder.where('package.is_active = :isActive', { isActive });
    }
    
    queryBuilder.orderBy('package.created_at', 'DESC');
    
    const packages = await queryBuilder.getMany();
    return packages.map(pkg => this.mapToResponseDto(pkg));
  }

  async getPackageById(packageId: number): Promise<PackageResponseDto | null> {
    const packageData = await this.packageRepository.findOne({
      where: { package_id: packageId }
    });

    if (!packageData) {
      return null;
    }

    return this.mapToResponseDto(packageData);
  }

  async getPackageWithServices(packageId: number): Promise<any | null> {
    const packageWithRelations = await this.packageRepository
      .createQueryBuilder('package')
      .leftJoinAndSelect('package.packageServices', 'ps')
      .leftJoinAndSelect('ps.service', 'service')
      .where('package.package_id = :packageId', { packageId })
      .getOne();

    if (!packageWithRelations) {
      return null;
    }

    const services = packageWithRelations.packageServices?.map(ps => ({
      service_id: ps.service.service_id,
      service_name: ps.service.service_name,
      description: ps.service.description,
      base_price: ps.service.base_price,
      duration_minutes: ps.service.duration_minutes,
      category: ps.service.category,
      sessions_included: ps.sessions_included
    })) || [];

    return {
      ...this.mapToResponseDto(packageWithRelations),
      services: services,
      total_services: services.length
    };
  }

  async updatePackage(packageId: number, updateData: UpdatePackageDto): Promise<PackageResponseDto | null> {
    // Usar transacción para asegurar consistencia
    return await AppDataSource.transaction(async manager => {
      const existingPackage = await manager.findOne(Package, {
        where: { package_id: packageId }
      });

      if (!existingPackage) {
        return null;
      }

      // Crear una copia de updateData sin el campo services
      const { services, ...packageUpdateData } = updateData;

      // Update only provided fields (excluding services)
      Object.keys(packageUpdateData).forEach(key => {
        if (packageUpdateData[key as keyof typeof packageUpdateData] !== undefined) {
          (existingPackage as any)[key] = packageUpdateData[key as keyof typeof packageUpdateData];
        }
      });

      existingPackage.updated_at = new Date();
      const updatedPackage = await manager.save(Package, existingPackage);

      // Si se proporcionaron servicios, actualizar las relaciones
      if (services && services.length >= 0) {
        // Eliminar todas las relaciones existentes
        await manager.delete(PackageServiceModel, { package_id: packageId });

        // Crear las nuevas relaciones
        for (const serviceData of services) {
          // Verificar que el servicio existe
          const service = await manager.findOne(Service, {
            where: { service_id: parseInt(serviceData.service_id.toString()) }
          });

          if (service) {
            const packageService = manager.create(PackageServiceModel, {
              package_id: packageId,
              service_id: service.service_id,
              sessions_included: serviceData.sessions_included
            });

            await manager.save(PackageServiceModel, packageService);
          }
        }
      }

      return this.mapToResponseDto(updatedPackage);
    });
  }

  async deletePackage(packageId: number): Promise<boolean> {
    // Obtener el paquete antes de eliminarlo para acceder a la imagen
    const packageToDelete = await this.packageRepository.findOne({
      where: { package_id: packageId }
    });
    
    if (!packageToDelete) {
      return false;
    }
    
    // Eliminar la imagen asociada si existe
    if (packageToDelete.image_url) {
      try {
        await FileUploadService.deleteFile(packageToDelete.image_url);
      } catch (error) {
        console.warn('Error al eliminar imagen del paquete:', error);
        // Continuar con la eliminación del paquete aunque falle la eliminación de la imagen
      }
    }
    
    const result = await this.packageRepository.delete({ package_id: packageId });
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }

  async getActivePackages(): Promise<PackageResponseDto[]> {
    return this.getAllPackages(true);
  }

  async togglePackageStatus(packageId: number): Promise<PackageResponseDto | null> {
    const packageData = await this.packageRepository.findOne({
      where: { package_id: packageId }
    });

    if (!packageData) {
      return null;
    }

    packageData.is_active = !packageData.is_active;
    packageData.updated_at = new Date();
    
    const updatedPackage = await this.packageRepository.save(packageData);
    return this.mapToResponseDto(updatedPackage);
  }

  async getPackagesByPriceRange(minPrice: number, maxPrice: number): Promise<PackageResponseDto[]> {
    const packages = await this.packageRepository
      .createQueryBuilder('package')
      .where('package.price >= :minPrice AND package.price <= :maxPrice', { minPrice, maxPrice })
      .andWhere('package.is_active = :isActive', { isActive: true })
      .orderBy('package.price', 'ASC')
      .getMany();

    return packages.map(pkg => this.mapToResponseDto(pkg));
  }

  async getUserPackages(userId: number): Promise<any[]> {
    const purchaseRepository = AppDataSource.getRepository(Purchase);
    
    const userPurchases = await purchaseRepository
      .createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.package', 'package')
      .where('purchase.user_id = :userId', { userId })
      .andWhere('purchase.payment_status = :status', { status: 'completed' })
      .orderBy('purchase.purchase_date', 'DESC')
      .getMany();

    return userPurchases.map(purchase => ({
      purchase_id: purchase.purchase_id,
      amount_paid: purchase.amount_paid,
      payment_status: purchase.payment_status,
      payment_method: purchase.payment_method,
      transaction_id: purchase.transaction_id,
      purchase_date: purchase.purchase_date,
      expires_at: purchase.expires_at,
      package: this.mapToResponseDto(purchase.package)
    }));
  }

  async getAllPackagesWithServices(): Promise<any[]> {
    // Consulta optimizada usando una sola query con joins
    const packagesWithRelations = await this.packageRepository
      .createQueryBuilder('package')
      .leftJoinAndSelect('package.packageServices', 'ps')
      .leftJoinAndSelect('ps.service', 'service')
      .orderBy('package.created_at', 'DESC')
      .addOrderBy('service.service_name', 'ASC')
      .getMany();

    // Mapear los resultados al formato deseado
    return packagesWithRelations.map(pkg => {
      const services = pkg.packageServices?.map(ps => ({
        service_id: ps.service.service_id,
        service_name: ps.service.service_name,
        description: ps.service.description,
        base_price: ps.service.base_price,
        duration_minutes: ps.service.duration_minutes,
        category: ps.service.category,
        sessions_included: ps.sessions_included
      })) || [];

      return {
        ...this.mapToResponseDto(pkg),
        services: services,
        total_services: services.length
      };
    });
  }

  private mapToResponseDto(packageData: Package): PackageResponseDto {
    return {
      package_id: packageData.package_id,
      package_name: packageData.package_name,
      description: packageData.description,
      price: packageData.price,
      total_sessions: packageData.total_sessions,
      validity_days: packageData.validity_days,
      discount_percentage: packageData.discount_percentage,
      is_active: packageData.is_active,
      terms_conditions: packageData.terms_conditions,
      image_url: packageData.image_url,
      created_at: packageData.created_at,
      updated_at: packageData.updated_at
    };
  }
}