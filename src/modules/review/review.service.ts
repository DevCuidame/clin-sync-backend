import { Repository } from 'typeorm';
import { AppDataSource } from '../../core/config/database';
import { Review, ReviewStatus } from '../../models/review.model';
import { Appointment } from '../../models/appointment.model';
import { User } from '../../models/user.model';
import { Professional } from '../../models/professional.model';
import { CreateReviewDto, UpdateReviewDto, UpdateReviewStatusDto, ReviewFilterDto } from './review.dto';
import logger from '../../utils/logger';

export class ReviewService {
  private reviewRepository: Repository<Review>;
  private appointmentRepository: Repository<Appointment>;
  private userRepository: Repository<User>;
  private professionalRepository: Repository<Professional>;

  constructor() {
    this.reviewRepository = AppDataSource.getRepository(Review);
    this.appointmentRepository = AppDataSource.getRepository(Appointment);
    this.userRepository = AppDataSource.getRepository(User);
    this.professionalRepository = AppDataSource.getRepository(Professional);
  }

  async createReview(userId: number, createReviewDto: CreateReviewDto): Promise<Review> {
    try {
      // Verificar que la cita existe y pertenece al usuario
      const appointment = await this.appointmentRepository.findOne({
        where: { 
          appointment_id: createReviewDto.appointment_id,
          user_id: userId 
        },
        relations: ['professional']
      });

      if (!appointment) {
        throw new Error('Cita no encontrada o no pertenece al usuario');
      }

      // Verificar que la cita esté completada
      if (appointment.status !== 'completed') {
        throw new Error('Solo se pueden reseñar citas completadas');
      }

      // Verificar que no exista ya una reseña para esta cita
      const existingReview = await this.reviewRepository.findOne({
        where: { 
          appointment_id: createReviewDto.appointment_id,
          user_id: userId 
        }
      });

      if (existingReview) {
        throw new Error('Ya existe una reseña para esta cita');
      }

      // Crear la reseña
      const review = this.reviewRepository.create({
        ...createReviewDto,
        user_id: userId,
        professional_id: appointment.professional_id,
        status: ReviewStatus.PENDING
      });

      const savedReview = await this.reviewRepository.save(review);
      
      logger.info(`Nueva reseña creada: ${savedReview.review_id} por usuario ${userId}`);
      
      return await this.getReviewById(savedReview.review_id);
    } catch (error) {
      logger.error('Error al crear reseña:', error);
      throw error;
    }
  }

  async getReviews(filters: ReviewFilterDto): Promise<{ reviews: Review[], total: number, page: number, totalPages: number }> {
    try {
      const { page = 1, limit = 10, ...filterOptions } = filters;
      const skip = (page - 1) * limit;

      const queryBuilder = this.reviewRepository.createQueryBuilder('review')
        .leftJoinAndSelect('review.user', 'user')
        .leftJoinAndSelect('review.professional', 'professional')
        .leftJoinAndSelect('professional.user', 'professionalUser')
        .leftJoinAndSelect('review.appointment', 'appointment')
        .orderBy('review.created_at', 'DESC');

      // Aplicar filtros
      if (filterOptions.professional_id) {
        queryBuilder.andWhere('review.professional_id = :professionalId', { professionalId: filterOptions.professional_id });
      }

      if (filterOptions.user_id) {
        queryBuilder.andWhere('review.user_id = :userId', { userId: filterOptions.user_id });
      }

      if (filterOptions.status) {
        queryBuilder.andWhere('review.status = :status', { status: filterOptions.status });
      }

      if (filterOptions.rating) {
        queryBuilder.andWhere('review.rating = :rating', { rating: filterOptions.rating });
      }

      const [reviews, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      const totalPages = Math.ceil(total / limit);

      return {
        reviews,
        total,
        page,
        totalPages
      };
    } catch (error) {
      logger.error('Error al obtener reseñas:', error);
      throw error;
    }
  }

  async getReviewById(reviewId: number): Promise<Review> {
    try {
      const review = await this.reviewRepository.findOne({
        where: { review_id: reviewId },
        relations: ['user', 'professional', 'professional.user', 'appointment']
      });

      if (!review) {
        throw new Error('Reseña no encontrada');
      }

      return review;
    } catch (error) {
      logger.error('Error al obtener reseña por ID:', error);
      throw error;
    }
  }

  async getReviewsByProfessional(professionalId: number, status?: ReviewStatus): Promise<Review[]> {
    try {
      const queryBuilder = this.reviewRepository.createQueryBuilder('review')
        .leftJoinAndSelect('review.user', 'user')
        .leftJoinAndSelect('review.appointment', 'appointment')
        .where('review.professional_id = :professionalId', { professionalId })
        .orderBy('review.created_at', 'DESC');

      if (status) {
        queryBuilder.andWhere('review.status = :status', { status });
      }

      return await queryBuilder.getMany();
    } catch (error) {
      logger.error('Error al obtener reseñas del profesional:', error);
      throw error;
    }
  }

  async updateReview(reviewId: number, userId: number, updateReviewDto: UpdateReviewDto): Promise<Review> {
    try {
      const review = await this.reviewRepository.findOne({
        where: { 
          review_id: reviewId,
          user_id: userId 
        }
      });

      if (!review) {
        throw new Error('Reseña no encontrada o no pertenece al usuario');
      }

      // Solo permitir editar reseñas pendientes
      if (review.status !== ReviewStatus.PENDING) {
        throw new Error('Solo se pueden editar reseñas pendientes');
      }

      Object.assign(review, updateReviewDto);
      const updatedReview = await this.reviewRepository.save(review);
      
      logger.info(`Reseña actualizada: ${reviewId} por usuario ${userId}`);
      
      return await this.getReviewById(updatedReview.review_id);
    } catch (error) {
      logger.error('Error al actualizar reseña:', error);
      throw error;
    }
  }

  async updateReviewStatus(reviewId: number, updateStatusDto: UpdateReviewStatusDto): Promise<Review> {
    try {
      const review = await this.reviewRepository.findOne({
        where: { review_id: reviewId }
      });

      if (!review) {
        throw new Error('Reseña no encontrada');
      }

      review.status = updateStatusDto.status as ReviewStatus;
      const updatedReview = await this.reviewRepository.save(review);
      
      logger.info(`Estado de reseña actualizado: ${reviewId} a ${updateStatusDto.status}`);
      
      return await this.getReviewById(updatedReview.review_id);
    } catch (error) {
      logger.error('Error al actualizar estado de reseña:', error);
      throw error;
    }
  }

  async deleteReview(reviewId: number, userId: number): Promise<void> {
    try {
      const review = await this.reviewRepository.findOne({
        where: { 
          review_id: reviewId,
          user_id: userId 
        }
      });

      if (!review) {
        throw new Error('Reseña no encontrada o no pertenece al usuario');
      }

      // Solo permitir eliminar reseñas pendientes
      if (review.status !== ReviewStatus.PENDING) {
        throw new Error('Solo se pueden eliminar reseñas pendientes');
      }

      await this.reviewRepository.remove(review);
      
      logger.info(`Reseña eliminada: ${reviewId} por usuario ${userId}`);
    } catch (error) {
      logger.error('Error al eliminar reseña:', error);
      throw error;
    }
  }

  async getProfessionalRatingStats(professionalId: number): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
  }> {
    try {
      const reviews = await this.reviewRepository.find({
        where: { 
          professional_id: professionalId,
          status: ReviewStatus.APPROVED 
        }
      });

      if (reviews.length === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(review => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      });

      return {
        averageRating,
        totalReviews: reviews.length,
        ratingDistribution
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas de rating:', error);
      throw error;
    }
  }
}