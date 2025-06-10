import { AppDataSource } from '../../core/config/database';
import { Professional, ProfessionalStatus } from '../../models/professional.model';
import { Repository } from 'typeorm';
import { CreateProfessionalDto, UpdateProfessionalDto } from './professional.dto';

export class ProfessionalService {
  private professionalRepository: Repository<Professional>;

  constructor() {
    this.professionalRepository = AppDataSource.getRepository(Professional);
  }

  async createProfessional(professionalData: CreateProfessionalDto): Promise<Professional> {
    const professional = this.professionalRepository.create({
      ...professionalData,
      status: ProfessionalStatus.PENDING_APPROVAL
    });
    
    return await this.professionalRepository.save(professional);
  }

  async getAllProfessionals(): Promise<Professional[]> {
    return await this.professionalRepository.find({
      relations: ['user'],
      where: { status: ProfessionalStatus.ACTIVE }
    });
  }

  async getProfessionalById(id: number): Promise<Professional | null> {
    return await this.professionalRepository.findOne({
      where: { professional_id: id },
      relations: ['user']
    });
  }

  async getProfessionalByUserId(userId: number): Promise<Professional | null> {
    return await this.professionalRepository.findOne({
      where: { user_id: userId },
      relations: ['user']
    });
  }

  async updateProfessional(id: number, updateData: UpdateProfessionalDto): Promise<Professional> {
    await this.professionalRepository.update(id, updateData);
    const updatedProfessional = await this.getProfessionalById(id);
    
    if (!updatedProfessional) {
      throw new Error('Professional not found after update');
    }
    
    return updatedProfessional;
  }

  async deleteProfessional(id: number): Promise<void> {
    const result = await this.professionalRepository.delete(id);
    
    if (result.affected === 0) {
      throw new Error('Professional not found');
    }
  }

  async updateProfessionalStatus(id: number, status: ProfessionalStatus): Promise<Professional> {
    return await this.updateProfessional(id, { status });
  }

  async getProfessionalsBySpecialization(specialization: string): Promise<Professional[]> {
    return await this.professionalRepository.find({
      where: { 
        specialization,
        status: ProfessionalStatus.ACTIVE 
      },
      relations: ['user']
    });
  }
}