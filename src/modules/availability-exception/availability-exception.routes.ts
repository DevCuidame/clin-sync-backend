import { Router } from 'express';
import { AvailabilityExceptionController } from './availability-exception.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const availabilityExceptionController = new AvailabilityExceptionController();

// Create a new availability exception
router.post('/', authMiddleware, async (req, res) => {
  await availabilityExceptionController.createAvailabilityException(req, res);
});

// Bulk create availability exceptions
router.post('/bulk', authMiddleware, async (req, res) => {
  await availabilityExceptionController.bulkCreateAvailabilityExceptions(req, res);
});

// Get all availability exceptions
router.get('/', authMiddleware, async (req, res) => {
  await availabilityExceptionController.getAllAvailabilityExceptions(req, res);
});

// Get availability exceptions with filters (query parameters)
router.get('/search', authMiddleware, async (req, res) => {
  await availabilityExceptionController.getAvailabilityExceptionsWithFilters(req, res);
});

// Get availability exceptions by type
router.get('/type/:type', authMiddleware, async (req, res) => {
  await availabilityExceptionController.getAvailabilityExceptionsByType(req, res);
});

// Get availability exceptions by professional ID
router.get('/professional/:professionalId', authMiddleware, async (req, res) => {
  await availabilityExceptionController.getAvailabilityExceptionsByProfessional(req, res);
});

// Get availability exceptions by professional ID and date range
router.get('/professional/:professionalId/date-range', authMiddleware, async (req, res) => {
  await availabilityExceptionController.getAvailabilityExceptionsByDateRange(req, res);
});

// Get availability exception by ID
router.get('/:id', authMiddleware, async (req, res) => {
  await availabilityExceptionController.getAvailabilityExceptionById(req, res);
});

// Update availability exception
router.put('/:id', authMiddleware, async (req, res) => {
  await availabilityExceptionController.updateAvailabilityException(req, res);
});

// Delete availability exception
router.delete('/:id', authMiddleware, async (req, res) => {
  await availabilityExceptionController.deleteAvailabilityException(req, res);
});

// Delete all availability exceptions for a professional
router.delete('/professional/:professionalId', authMiddleware, async (req, res) => {
  await availabilityExceptionController.deleteAvailabilityExceptionsByProfessional(req, res);
});

// Delete availability exceptions by professional ID and date range
router.delete('/professional/:professionalId/date-range', authMiddleware, async (req, res) => {
  await availabilityExceptionController.deleteAvailabilityExceptionsByDateRange(req, res);
});

export default router;