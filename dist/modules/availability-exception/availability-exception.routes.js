"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const availability_exception_controller_1 = require("./availability-exception.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const availabilityExceptionController = new availability_exception_controller_1.AvailabilityExceptionController();
// Create a new availability exception
router.post('/', auth_middleware_1.authMiddleware, async (req, res) => {
    await availabilityExceptionController.createAvailabilityException(req, res);
});
// Bulk create availability exceptions
router.post('/bulk', auth_middleware_1.authMiddleware, async (req, res) => {
    await availabilityExceptionController.bulkCreateAvailabilityExceptions(req, res);
});
// Get all availability exceptions
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    await availabilityExceptionController.getAllAvailabilityExceptions(req, res);
});
// Get availability exceptions with filters (query parameters)
router.get('/search', auth_middleware_1.authMiddleware, async (req, res) => {
    await availabilityExceptionController.getAvailabilityExceptionsWithFilters(req, res);
});
// Get availability exceptions by type
router.get('/type/:type', auth_middleware_1.authMiddleware, async (req, res) => {
    await availabilityExceptionController.getAvailabilityExceptionsByType(req, res);
});
// Get availability exceptions by professional ID
router.get('/professional/:professionalId', auth_middleware_1.authMiddleware, async (req, res) => {
    await availabilityExceptionController.getAvailabilityExceptionsByProfessional(req, res);
});
// Get availability exceptions by professional ID and date range
router.get('/professional/:professionalId/date-range', auth_middleware_1.authMiddleware, async (req, res) => {
    await availabilityExceptionController.getAvailabilityExceptionsByDateRange(req, res);
});
// Get availability exception by ID
router.get('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    await availabilityExceptionController.getAvailabilityExceptionById(req, res);
});
// Update availability exception
router.put('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    await availabilityExceptionController.updateAvailabilityException(req, res);
});
// Delete availability exception
router.delete('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    await availabilityExceptionController.deleteAvailabilityException(req, res);
});
// Delete all availability exceptions for a professional
router.delete('/professional/:professionalId', auth_middleware_1.authMiddleware, async (req, res) => {
    await availabilityExceptionController.deleteAvailabilityExceptionsByProfessional(req, res);
});
// Delete availability exceptions by professional ID and date range
router.delete('/professional/:professionalId/date-range', auth_middleware_1.authMiddleware, async (req, res) => {
    await availabilityExceptionController.deleteAvailabilityExceptionsByDateRange(req, res);
});
exports.default = router;
