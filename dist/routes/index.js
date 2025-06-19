"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Import statements
const auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
const user_routes_1 = __importDefault(require("../modules/user/user.routes"));
const service_routes_1 = __importDefault(require("../modules/service/service.routes"));
const package_routes_1 = __importDefault(require("../modules/package/package.routes"));
const purchase_routes_1 = __importDefault(require("../modules/purchase/purchase.routes"));
const location_routes_1 = __importDefault(require("../modules/location/location.routes"));
const notification_routes_1 = require("../modules/notification/notification.routes");
const appointment_routes_1 = require("../modules/appointment/appointment.routes");
const professional_routes_1 = require("../modules/professional/professional.routes");
const user_session_routes_1 = require("../modules/user-session/user-session.routes");
const schedule_routes_1 = __importDefault(require("../modules/schedule/schedule.routes"));
const availability_exception_routes_1 = __importDefault(require("../modules/availability-exception/availability-exception.routes"));
const payment_routes_1 = require("../modules/payment/payment.routes");
const router = (0, express_1.Router)();
//Index
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/services', service_routes_1.default);
router.use('/packages', package_routes_1.default);
router.use('/purchases', purchase_routes_1.default);
router.use('/locations', location_routes_1.default);
router.use('/appointments', appointment_routes_1.appointmentRoutes);
router.use('/professionals', professional_routes_1.professionalRoutes);
router.use('/user-sessions', user_session_routes_1.userSessionRoutes);
router.use('/schedules', schedule_routes_1.default);
router.use('/availability-exceptions', availability_exception_routes_1.default);
// Rutas de notificación actualizadas
router.use('/notifications', notification_routes_1.notificationRoutes);
// Rutas de pagos con Wompi
router.use('/payments', payment_routes_1.paymentRoutes);
exports.default = router;
