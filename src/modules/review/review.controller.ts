import { Request, Response } from 'express';
import { ReviewService } from './review.service';
import { CreateReviewDto, UpdateReviewDto, UpdateReviewStatusDto, ReviewFilterDto } from './review.dto';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import logger from '../../utils/logger';

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  // Crear una nueva reseña (solo usuarios autenticados)
  async createReview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const createReviewDto = plainToClass(CreateReviewDto, req.body);
      const errors = await validate(createReviewDto);

      if (errors.length > 0) {
        res.status(400).json({ 
          error: 'Datos de entrada inválidos', 
          details: errors.map(err => Object.values(err.constraints || {})).flat()
        });
        return;
      }

      const review = await this.reviewService.createReview(userId, createReviewDto);
      
      res.status(201).json({
        message: 'Reseña creada exitosamente',
        data: review
      });
    } catch (error: any) {
      logger.error('Error en createReview:', error);
      res.status(400).json({ error: error.message || 'Error al crear la reseña' });
    }
  }

  // Obtener reseñas con filtros (público para reseñas aprobadas, admin para todas)
  async getReviews(req: Request, res: Response): Promise<void> {
    try {
      const filterDto = plainToClass(ReviewFilterDto, req.query);
      const errors = await validate(filterDto);

      if (errors.length > 0) {
        res.status(400).json({ 
          error: 'Parámetros de filtro inválidos', 
          details: errors.map(err => Object.values(err.constraints || {})).flat()
        });
        return;
      }

      // Si no es admin, solo mostrar reseñas aprobadas
      const userRole = req.user?.role;
      if (userRole !== 'admin' && userRole !== 'moderator') {
        filterDto.status = 'approved' as any;
      }

      const result = await this.reviewService.getReviews(filterDto);
      
      res.status(200).json({
        message: 'Reseñas obtenidas exitosamente',
        data: result
      });
    } catch (error: any) {
      logger.error('Error en getReviews:', error);
      res.status(500).json({ error: error.message || 'Error al obtener las reseñas' });
    }
  }

  // Obtener una reseña específica por ID
  async getReviewById(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = parseInt(req.params.id);
      
      if (isNaN(reviewId)) {
        res.status(400).json({ error: 'ID de reseña inválido' });
        return;
      }

      const review = await this.reviewService.getReviewById(reviewId);
      
      // Si no es admin/moderador y la reseña no está aprobada, no mostrarla
      const userRole = req.user?.role;
      if (userRole !== 'admin' && userRole !== 'moderator' && review.status !== 'approved') {
        res.status(404).json({ error: 'Reseña no encontrada' });
        return;
      }

      res.status(200).json({
        message: 'Reseña obtenida exitosamente',
        data: review
      });
    } catch (error: any) {
      logger.error('Error en getReviewById:', error);
      if (error.message === 'Reseña no encontrada') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Error al obtener la reseña' });
      }
    }
  }

  // Obtener reseñas de un profesional específico
  async getReviewsByProfessional(req: Request, res: Response): Promise<void> {
    try {
      const professionalId = parseInt(req.params.professionalId);
      
      if (isNaN(professionalId)) {
        res.status(400).json({ error: 'ID de profesional inválido' });
        return;
      }

      // Solo mostrar reseñas aprobadas para usuarios no admin
      const userRole = req.user?.role;
      const status = (userRole === 'admin' || userRole === 'moderator') ? undefined : 'approved' as any;
      
      const reviews = await this.reviewService.getReviewsByProfessional(professionalId, status);
      
      res.status(200).json({
        message: 'Reseñas del profesional obtenidas exitosamente',
        data: reviews
      });
    } catch (error: any) {
      logger.error('Error en getReviewsByProfessional:', error);
      res.status(500).json({ error: error.message || 'Error al obtener las reseñas del profesional' });
    }
  }

  // Actualizar una reseña (solo el autor)
  async updateReview(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (isNaN(reviewId)) {
        res.status(400).json({ error: 'ID de reseña inválido' });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const updateReviewDto = plainToClass(UpdateReviewDto, req.body);
      const errors = await validate(updateReviewDto);

      if (errors.length > 0) {
        res.status(400).json({ 
          error: 'Datos de entrada inválidos', 
          details: errors.map(err => Object.values(err.constraints || {})).flat()
        });
        return;
      }

      const review = await this.reviewService.updateReview(reviewId, userId, updateReviewDto);
      
      res.status(200).json({
        message: 'Reseña actualizada exitosamente',
        data: review
      });
    } catch (error: any) {
      logger.error('Error en updateReview:', error);
      if (error.message.includes('no encontrada') || error.message.includes('no pertenece')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('pendientes')) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Error al actualizar la reseña' });
      }
    }
  }

  // Actualizar estado de una reseña (solo admin/moderador)
  async updateReviewStatus(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = parseInt(req.params.id);
      
      if (isNaN(reviewId)) {
        res.status(400).json({ error: 'ID de reseña inválido' });
        return;
      }

      const updateStatusDto = plainToClass(UpdateReviewStatusDto, req.body);
      const errors = await validate(updateStatusDto);

      if (errors.length > 0) {
        res.status(400).json({ 
          error: 'Datos de entrada inválidos', 
          details: errors.map(err => Object.values(err.constraints || {})).flat()
        });
        return;
      }

      const review = await this.reviewService.updateReviewStatus(reviewId, updateStatusDto);
      
      res.status(200).json({
        message: 'Estado de reseña actualizado exitosamente',
        data: review
      });
    } catch (error: any) {
      logger.error('Error en updateReviewStatus:', error);
      if (error.message === 'Reseña no encontrada') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Error al actualizar el estado de la reseña' });
      }
    }
  }

  // Eliminar una reseña (solo el autor)
  async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (isNaN(reviewId)) {
        res.status(400).json({ error: 'ID de reseña inválido' });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      await this.reviewService.deleteReview(reviewId, userId);
      
      res.status(200).json({
        message: 'Reseña eliminada exitosamente'
      });
    } catch (error: any) {
      logger.error('Error en deleteReview:', error);
      if (error.message.includes('no encontrada') || error.message.includes('no pertenece')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('pendientes')) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Error al eliminar la reseña' });
      }
    }
  }

  // Obtener estadísticas de rating de un profesional
  async getProfessionalRatingStats(req: Request, res: Response): Promise<void> {
    try {
      const professionalId = parseInt(req.params.professionalId);
      
      if (isNaN(professionalId)) {
        res.status(400).json({ error: 'ID de profesional inválido' });
        return;
      }

      const stats = await this.reviewService.getProfessionalRatingStats(professionalId);
      
      res.status(200).json({
        message: 'Estadísticas de rating obtenidas exitosamente',
        data: stats
      });
    } catch (error: any) {
      logger.error('Error en getProfessionalRatingStats:', error);
      res.status(500).json({ error: error.message || 'Error al obtener las estadísticas de rating' });
    }
  }

  // Obtener mis reseñas (usuario autenticado)
  async getMyReviews(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const filterDto = plainToClass(ReviewFilterDto, { ...req.query, user_id: userId });
      const result = await this.reviewService.getReviews(filterDto);
      
      res.status(200).json({
        message: 'Mis reseñas obtenidas exitosamente',
        data: result
      });
    } catch (error: any) {
      logger.error('Error en getMyReviews:', error);
      res.status(500).json({ error: error.message || 'Error al obtener mis reseñas' });
    }
  }
}