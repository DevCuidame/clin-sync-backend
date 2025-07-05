import { AppDataSource } from '../../core/config/database';
import { Professional, ProfessionalStatus } from '../../models/professional.model';
import { ProfessionalService as ProfessionalServiceModel } from '../../models/professional-service.model';
import { Review } from '../../models/review.model';
import { Schedule } from '../../models/schedule.model';
import { Repository } from 'typeorm';
import { CreateProfessionalDto, UpdateProfessionalDto } from './professional.dto';
import { ReviewService } from '../review/review.service';
import { ScheduleService } from '../schedule/schedule.service';

export class ProfessionalService {
  private professionalRepository: Repository<Professional>;
  private professionalServiceRepository: Repository<ProfessionalServiceModel>;
  private reviewService: ReviewService;
  private scheduleService: ScheduleService;

  constructor() {
    this.professionalRepository = AppDataSource.getRepository(Professional);
    this.professionalServiceRepository = AppDataSource.getRepository(ProfessionalServiceModel);
    this.reviewService = new ReviewService();
    this.scheduleService = new ScheduleService();
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
      where: { status: ProfessionalStatus.ACTIVE },
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

  async getProfessionalById(id: number): Promise<Professional | null> {
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

  async getProfessionalByUserId(userId: number): Promise<Professional | null> {
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

  async getProfessionalCompleteInfoByUserId(userId: number): Promise<any> {
    // Obtener información básica del profesional
    const professional = await this.getProfessionalByUserId(userId);
    
    if (!professional) {
      throw new Error('Professional not found for this user');
    }

    // Obtener servicios del profesional
    const services = await this.professionalServiceRepository.find({
      where: { 
        professional_id: professional.professional_id,
        is_active: true 
      },
      relations: ['service'],
      select: {
        prof_service_id: true,
        professional_id: true,
        service_id: true,
        custom_price: true,
        custom_duration: true,
        is_active: true,
        created_at: true,
        service: {
          service_id: true,
          service_name: true,
          description: true,
          base_price: true,
          duration_minutes: true,
          category: true,
          is_active: true
        }
      }
    });

    // Obtener reseñas y estadísticas
    const reviews = await this.reviewService.getReviewsByProfessional(professional.professional_id, 'approved' as any);
    const ratingStats = await this.reviewService.getProfessionalRatingStats(professional.professional_id);

    // Obtener horarios
    const schedules = await this.scheduleService.getActiveSchedulesByProfessional(professional.professional_id);

    // Mapear servicios
    const mappedServices = services.map(service => ({
      prof_service_id: service.prof_service_id,
      service_id: service.service_id,
      custom_price: service.custom_price,
      custom_duration: service.custom_duration,
      service: {
        service_id: service.service.service_id,
        service_name: service.service.service_name,
        description: service.service.description,
        base_price: service.service.base_price,
        duration_minutes: service.service.duration_minutes,
        category: service.service.category,
        final_price: service.custom_price || service.service.base_price,
        final_duration: service.custom_duration || service.service.duration_minutes
      }
    }));

    // Mapear reseñas
    const mappedReviews = reviews.map(review => ({
      review_id: review.review_id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      user: {
        first_name: review.user?.first_name,
        last_name: review.user?.last_name
      }
    }));

    return {
      professional: {
        professional_id: professional.professional_id,
        user_id: professional.user_id,
        license_number: professional.license_number,
        specialization: professional.specialization,
        bio: professional.bio,
        hourly_rate: professional.hourly_rate,
        experience_years: professional.experience_years,
        status: professional.status,
        availability_config: professional.availability_config,
        created_at: professional.created_at,
        updated_at: professional.updated_at,
        user: professional.user
      },
      services: mappedServices,
      reviews: mappedReviews,
      rating_stats: ratingStats,
      schedules: schedules,
      summary: {
        total_services: mappedServices.length,
        total_reviews: mappedReviews.length,
        average_rating: ratingStats.averageRating,
        total_schedules: schedules.length
      }
    };
  }
}