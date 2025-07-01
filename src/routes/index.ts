import { Router } from 'express';

// Import statements
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/user/user.routes';
import roleRoutes from '../modules/role/role.routes';
import serviceRoutes from '../modules/service/service.routes';
import packageRoutes from '../modules/package/package.routes';
import purchaseRoutes from '../modules/purchase/purchase.routes';
import locationRoutes from '../modules/location/location.routes';

import { notificationRoutes } from '../modules/notification/notification.routes';
import { appointmentRoutes as newAppointmentRoutes } from '../modules/appointment/appointment.routes';
import { professionalRoutes } from '../modules/professional/professional.routes';
import { userSessionRoutes } from '../modules/user-session/user-session.routes';
import scheduleRoutes from '../modules/schedule/schedule.routes';
import availabilityExceptionRoutes from '../modules/availability-exception/availability-exception.routes';
import { paymentRoutes } from '../modules/payment/payment.routes';
import timeSlotRoutes from '../modules/time-slot/time-slot.routes';

const router = Router();

//Index
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/services', serviceRoutes);
router.use('/packages', packageRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/locations', locationRoutes);
router.use('/appointments', newAppointmentRoutes);
router.use('/professionals', professionalRoutes)
router.use('/user-sessions', userSessionRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/availability-exceptions', availabilityExceptionRoutes);
router.use('/time-slots', timeSlotRoutes);
// Rutas de notificación actualizadas
router.use('/notifications', notificationRoutes);
// Rutas de pagos con Wompi
router.use('/payments', paymentRoutes);

export default router;
