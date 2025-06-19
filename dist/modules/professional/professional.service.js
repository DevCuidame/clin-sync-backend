"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfessionalService = void 0;
const database_1 = require("../../core/config/database");
const professional_model_1 = require("../../models/professional.model");
class ProfessionalService {
    professionalRepository;
    constructor() {
        this.professionalRepository = database_1.AppDataSource.getRepository(professional_model_1.Professional);
    }
    async createProfessional(professionalData) {
        const professional = this.professionalRepository.create({
            ...professionalData,
            status: professional_model_1.ProfessionalStatus.PENDING_APPROVAL
        });
        return await this.professionalRepository.save(professional);
    }
    async getAllProfessionals() {
        return await this.professionalRepository.find({
            relations: ['user'],
            where: { status: professional_model_1.ProfessionalStatus.ACTIVE },
            select: {
                professional_id: true,
                user_id: true,
                license_number: true,
                specialization: true,
                bio: true,
                hourly_rate: true,
                experience_years: true,
                status: true,
                availability_config: true,
                created_at: true,
                updated_at: true,
                user: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    phone: true,
                    birth_date: true,
                    gender: true,
                    address: true,
                    status: true,
                    path: true,
                    created_at: true,
                    updated_at: true
                }
            }
        });
    }
    async getProfessionalById(id) {
        return await this.professionalRepository.findOne({
            where: { professional_id: id },
            relations: ['user'],
            select: {
                professional_id: true,
                user_id: true,
                license_number: true,
                specialization: true,
                bio: true,
                hourly_rate: true,
                experience_years: true,
                status: true,
                availability_config: true,
                created_at: true,
                updated_at: true,
                user: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    phone: true,
                    birth_date: true,
                    gender: true,
                    address: true,
                    status: true,
                    path: true,
                    created_at: true,
                    updated_at: true
                }
            }
        });
    }
    async getProfessionalByUserId(userId) {
        return await this.professionalRepository.findOne({
            where: { user_id: userId },
            relations: ['user'],
            select: {
                professional_id: true,
                user_id: true,
                license_number: true,
                specialization: true,
                bio: true,
                hourly_rate: true,
                experience_years: true,
                status: true,
                availability_config: true,
                created_at: true,
                updated_at: true,
                user: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    phone: true,
                    birth_date: true,
                    gender: true,
                    address: true,
                    status: true,
                    path: true,
                    created_at: true,
                    updated_at: true
                }
            }
        });
    }
    async updateProfessional(id, updateData) {
        await this.professionalRepository.update(id, updateData);
        const updatedProfessional = await this.getProfessionalById(id);
        if (!updatedProfessional) {
            throw new Error('Professional not found after update');
        }
        return updatedProfessional;
    }
    async deleteProfessional(id) {
        const result = await this.professionalRepository.delete(id);
        if (result.affected === 0) {
            throw new Error('Professional not found');
        }
    }
    async updateProfessionalStatus(id, status) {
        return await this.updateProfessional(id, { status });
    }
    async getProfessionalsBySpecialization(specialization) {
        return await this.professionalRepository.find({
            where: {
                specialization,
                status: professional_model_1.ProfessionalStatus.ACTIVE
            },
            relations: ['user'],
            select: {
                professional_id: true,
                user_id: true,
                license_number: true,
                specialization: true,
                bio: true,
                hourly_rate: true,
                experience_years: true,
                status: true,
                availability_config: true,
                created_at: true,
                updated_at: true,
                user: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    phone: true,
                    birth_date: true,
                    gender: true,
                    address: true,
                    status: true,
                    path: true,
                    created_at: true,
                    updated_at: true
                }
            }
        });
    }
}
exports.ProfessionalService = ProfessionalService;
