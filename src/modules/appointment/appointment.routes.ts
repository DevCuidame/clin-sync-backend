import { Router } from 'express';
import { AppointmentController } from './appointment.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import googleCalendarRoutes from '../google-calendar/google-calendar.routes';

const router = Router();
const appointmentController = new AppointmentController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas para citas
router.post('/', appointmentController.createAppointment.bind(appointmentController));
router.get('/', appointmentController.getAppointments.bind(appointmentController));
router.get('/upcoming/:userId', appointmentController.getUpcomingAppointments.bind(appointmentController));
router.get('/:id', appointmentController.getAppointmentById.bind(appointmentController));
router.put('/:id', appointmentController.updateAppointment.bind(appointmentController));
router.patch('/:id/cancel', appointmentController.cancelAppointment.bind(appointmentController));
router.patch('/:id/reschedule', appointmentController.rescheduleAppointment.bind(appointmentController));
router.patch('/:id/confirm', appointmentController.confirmAppointment.bind(appointmentController));
router.patch('/:id/complete', appointmentController.completeAppointment.bind(appointmentController));
router.delete('/:id', appointmentController.deleteAppointment.bind(appointmentController));

// Rutas de Google Calendar (sin autenticación para callback)
router.use('/google-calendar', googleCalendarRoutes);

export { router as appointmentRoutes };