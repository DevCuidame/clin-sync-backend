"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceService = void 0;
const database_1 = require("../../core/config/database");
const service_model_1 = require("../../models/service.model");
class ServiceService {
    serviceRepository;
    constructor() {
        this.serviceRepository = database_1.AppDataSource.getRepository(service_model_1.Service);
    }
    async createService(serviceData) {
        const service = this.serviceRepository.create(serviceData);
        return await this.serviceRepository.save(service);
    }
    async getServices(filters) {
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
    async getAllServices() {
        try {
            const queryBuilder = this.serviceRepository.createQueryBuilder('service');
            const result = await queryBuilder.getMany();
            return result;
        }
        catch (error) {
            console.error('❌ Error en getAllServices:', error);
            throw error;
        }
    }
    async getServiceById(id) {
        return await this.serviceRepository.findOne({
            where: { service_id: id },
        });
    }
    async updateService(id, updateData) {
        await this.serviceRepository.update(id, updateData);
        const updatedService = await this.getServiceById(id);
        if (!updatedService) {
            throw new Error('Service not found after update');
        }
        return updatedService;
    }
    async deleteService(id) {
        const result = await this.serviceRepository.delete(id);
        if (result.affected === 0) {
            throw new Error('Service not found');
        }
    }
    async getServicesByCategory(category) {
        return await this.serviceRepository.find({
            where: {
                category,
                is_active: true,
            },
        });
    }
    async toggleServiceStatus(id) {
        const service = await this.getServiceById(id);
        if (!service) {
            throw new Error('Service not found');
        }
        return await this.updateService(id, { is_active: !service.is_active });
    }
}
exports.ServiceService = ServiceService;
