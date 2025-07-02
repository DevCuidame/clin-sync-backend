import { Router } from 'express';
import { ReviewController } from './review.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/role.middleware';

const router = Router();
const reviewController = new ReviewController();

// Rutas públicas (solo reseñas aprobadas)
router.get('/professional/:professionalId', reviewController.getReviewsByProfessional.bind(reviewController));
router.get('/professional/:professionalId/stats', reviewController.getProfessionalRatingStats.bind(reviewController));
router.get('/', reviewController.getReviews.bind(reviewController));
router.get('/:id', reviewController.getReviewById.bind(reviewController));

// Rutas que requieren autenticación
router.use(authMiddleware);

// Rutas para usuarios autenticados
router.post('/', reviewController.createReview.bind(reviewController));
router.get('/my/reviews', reviewController.getMyReviews.bind(reviewController));
router.put('/:id', reviewController.updateReview.bind(reviewController));
router.delete('/:id', reviewController.deleteReview.bind(reviewController));

// Rutas solo para admin y moderadores
router.put('/:id/status', 
  restrictTo(['admin', 'moderator']), 
  reviewController.updateReviewStatus.bind(reviewController)
);

export default router;