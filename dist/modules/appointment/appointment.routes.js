"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentRoutes = void 0;
const express_1 = require("express");
const appointment_controller_1 = require("./appointment.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const google_calendar_routes_1 = __importDefault(require("../google-calendar/google-calendar.routes"));
const router = (0, express_1.Router)();
exports.appointmentRoutes = router;
const appointmentController = new appointment_controller_1.AppointmentController();
// Aplicar middleware de autenticación a todas las rutas
router.use(auth_middleware_1.authMiddleware);
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
router.use('/google-calendar', google_calendar_routes_1.default);
