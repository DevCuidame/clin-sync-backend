import { Router } from 'express';
import { TimeSlotController } from './time-slot.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const timeSlotController = new TimeSlotController();

// Create a new time slot
router.post('/', authMiddleware, async (req, res) => {
  await timeSlotController.createTimeSlot(req, res);
});

// Bulk create time slots
router.post('/bulk', authMiddleware, async (req, res) => {
  await timeSlotController.bulkCreateTimeSlots(req, res);
});

// Get time slots by professional ID with filters
router.get('/professional/:professionalId', async (req, res) => {
  await timeSlotController.getTimeSlotsByProfessional(req, res);
});

// Get available time slots by professional ID
router.get('/professional/:professionalId/available', async (req, res) => {
  await timeSlotController.getAvailableTimeSlots(req, res);
});

// Hybrid endpoints for automatic slot generation (MUST come before generic routes)
// Check availability for a specific date (with auto-generation)
router.get('/professional/:professionalId/availability/:date', async (req, res) => {
  await timeSlotController.checkAvailability(req, res);
});

// Get time slots by professional ID and date range
router.get('/professional/:professionalId/:startDate/:endDate', async (req, res) => {
  await timeSlotController.getTimeSlotsByDateRange(req, res);
});

// Get a specific time slot by ID
router.get('/:slotId', async (req, res) => {
  await timeSlotController.getTimeSlotById(req, res);
});

// Get a specific time slot with professional details
router.get('/:slotId/with-professional', async (req, res) => {
  await timeSlotController.getTimeSlotWithProfessional(req, res);
});

// Update a time slot
router.put('/:slotId', authMiddleware, async (req, res) => {
  await timeSlotController.updateTimeSlot(req, res);
});

// Delete a time slot
router.delete('/:slotId', authMiddleware, async (req, res) => {
  await timeSlotController.deleteTimeSlot(req, res);
});

// Get slot statistics for a specific date
router.get('/professional/:professionalId/statistics/:date', async (req, res) => {
  await timeSlotController.getSlotStatistics(req, res);
});

// Pre-generate time slots for a date range
router.post('/professional/:professionalId/pre-generate', authMiddleware, async (req, res) => {
  await timeSlotController.preGenerateSlots(req, res);
});

export default router;