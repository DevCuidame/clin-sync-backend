import { Router } from 'express';
import { ScheduleController } from './schedule.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const scheduleController = new ScheduleController();

// Create multiple schedules in batch
router.post('/batch', authMiddleware, async (req, res) => {
  await scheduleController.createMultipleSchedules(req, res);
});

// Create a new schedule
router.post('/', authMiddleware, async (req, res) => {
  await scheduleController.createSchedule(req, res);
});

// Get all schedules
router.get('/', authMiddleware, async (req, res) => {
  await scheduleController.getAllSchedules(req, res);
});

// Get schedules with filters (query parameters)
router.get('/search', authMiddleware, async (req, res) => {
  await scheduleController.getSchedulesWithFilters(req, res);
});

// Get schedules by day of week
router.get('/day/:day', authMiddleware, async (req, res) => {
  await scheduleController.getSchedulesByDay(req, res);
});

// Get schedules by professional ID
router.get('/professional/:professionalId', authMiddleware, async (req, res) => {
  await scheduleController.getSchedulesByProfessional(req, res);
});

// Get schedule by ID
router.get('/:id', authMiddleware, async (req, res) => {
  await scheduleController.getScheduleById(req, res);
});

// Update schedule
router.put('/:id', authMiddleware, async (req, res) => {
  await scheduleController.updateSchedule(req, res);
});

// Toggle schedule status (activate/deactivate)
router.patch('/:id/toggle-status', authMiddleware, async (req, res) => {
  await scheduleController.toggleScheduleStatus(req, res);
});

// Delete schedule
router.delete('/:id', authMiddleware, async (req, res) => {
  await scheduleController.deleteSchedule(req, res);
});

export default router;