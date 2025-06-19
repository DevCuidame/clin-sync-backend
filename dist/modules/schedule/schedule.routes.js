"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const schedule_controller_1 = require("./schedule.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const scheduleController = new schedule_controller_1.ScheduleController();
// Create a new schedule
router.post('/', auth_middleware_1.authMiddleware, async (req, res) => {
    await scheduleController.createSchedule(req, res);
});
// Get all schedules
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    await scheduleController.getAllSchedules(req, res);
});
// Get schedules with filters (query parameters)
router.get('/search', auth_middleware_1.authMiddleware, async (req, res) => {
    await scheduleController.getSchedulesWithFilters(req, res);
});
// Get schedules by day of week
router.get('/day/:day', auth_middleware_1.authMiddleware, async (req, res) => {
    await scheduleController.getSchedulesByDay(req, res);
});
// Get schedules by professional ID
router.get('/professional/:professionalId', auth_middleware_1.authMiddleware, async (req, res) => {
    await scheduleController.getSchedulesByProfessional(req, res);
});
// Get schedule by ID
router.get('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    await scheduleController.getScheduleById(req, res);
});
// Update schedule
router.put('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    await scheduleController.updateSchedule(req, res);
});
// Toggle schedule status (activate/deactivate)
router.patch('/:id/toggle-status', auth_middleware_1.authMiddleware, async (req, res) => {
    await scheduleController.toggleScheduleStatus(req, res);
});
// Delete schedule
router.delete('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    await scheduleController.deleteSchedule(req, res);
});
exports.default = router;
