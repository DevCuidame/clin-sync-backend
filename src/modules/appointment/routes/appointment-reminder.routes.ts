/**
 * Rutas para el sistema de recordatorios de citas
 * Proporciona endpoints para gestionar y monitorear recordatorios automáticos
 */

import { Router } from 'express';
import { appointmentReminderController } from '../controllers/appointment-reminder.controller';
import { requireRole, restrictTo } from '../../../middlewares/role.middleware';
import { authMiddleware } from '../../../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route GET /api/appointments/reminders/stats
 * @desc Obtiene estadísticas del sistema de recordatorios
 * @access Admin, Professional
 */
router.get('/stats', 
  restrictTo(['admin', 'professional']),
  appointmentReminderController.getReminderStats.bind(appointmentReminderController)
);

/**
 * @route POST /api/appointments/reminders/process
 * @desc Procesa recordatorios pendientes manualmente
 * @access Admin only
 */
router.post('/process',
  restrictTo(['admin']),
  appointmentReminderController.processReminders.bind(appointmentReminderController)
);

/**
 * @route POST /api/appointments/reminders/:appointmentId/schedule
 * @desc Programa un recordatorio específico para una cita
 * @access Admin, Professional
 * @body { reminderType: '24h' | '2h' }
 */
router.post('/:appointmentId/schedule',
  restrictTo(['admin', 'professional']),
  appointmentReminderController.scheduleReminder.bind(appointmentReminderController)
);

/**
 * @route DELETE /api/appointments/reminders/:appointmentId
 * @desc Cancela los recordatorios de una cita específica
 * @access Admin, Professional
 */
router.delete('/:appointmentId',
  restrictTo(['admin', 'professional']),
  appointmentReminderController.cancelReminders.bind(appointmentReminderController)
);

/**
 * @route GET /api/appointments/reminders/health
 * @desc Verifica el estado del sistema de recordatorios
 * @access Admin only
 */
router.get('/health',
  restrictTo(['admin']),
  appointmentReminderController.healthCheck.bind(appointmentReminderController)
);

export default router;