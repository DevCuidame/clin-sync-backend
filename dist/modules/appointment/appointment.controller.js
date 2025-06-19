"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentController = void 0;
const appointment_service_1 = require("./appointment.service");
const appointment_dto_1 = require("./appointment.dto");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class AppointmentController {
    appointmentService;
    constructor() {
        this.appointmentService = new appointment_service_1.AppointmentService();
    }
    async createAppointment(req, res) {
        try {
            const dto = (0, class_transformer_1.plainToClass)(appointment_dto_1.CreateAppointmentDto, req.body);
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.map(error => Object.values(error.constraints || {}).join(', '))
                });
                return;
            }
            const appointment = await this.appointmentService.createAppointment(dto);
            res.status(201).json({
                success: true,
                message: 'Appointment created successfully',
                data: appointment
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error creating appointment'
            });
        }
    }
    async getAppointments(req, res) {
        try {
            const query = (0, class_transformer_1.plainToClass)(appointment_dto_1.AppointmentQueryDto, req.query);
            const result = await this.appointmentService.getAppointments(query);
            res.status(200).json({
                success: true,
                message: 'Appointments retrieved successfully',
                data: result.appointments,
                pagination: {
                    total: result.total,
                    page: query.page || 1,
                    limit: query.limit || 10,
                    totalPages: Math.ceil(result.total / (query.limit || 10))
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error fetching appointments'
            });
        }
    }
    async getAppointmentById(req, res) {
        try {
            const appointmentId = parseInt(req.params.id);
            if (isNaN(appointmentId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid appointment ID'
                });
                return;
            }
            const appointment = await this.appointmentService.getAppointmentById(appointmentId);
            if (!appointment) {
                res.status(404).json({
                    success: false,
                    message: 'Appointment not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Appointment retrieved successfully',
                data: appointment
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error fetching appointment'
            });
        }
    }
    async updateAppointment(req, res) {
        try {
            const appointmentId = parseInt(req.params.id);
            if (isNaN(appointmentId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid appointment ID'
                });
                return;
            }
            const dto = (0, class_transformer_1.plainToClass)(appointment_dto_1.UpdateAppointmentDto, req.body);
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.map(error => Object.values(error.constraints || {}).join(', '))
                });
                return;
            }
            const appointment = await this.appointmentService.updateAppointment(appointmentId, dto);
            if (!appointment) {
                res.status(404).json({
                    success: false,
                    message: 'Appointment not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Appointment updated successfully',
                data: appointment
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error updating appointment'
            });
        }
    }
    async cancelAppointment(req, res) {
        try {
            const appointmentId = parseInt(req.params.id);
            if (isNaN(appointmentId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid appointment ID'
                });
                return;
            }
            const dto = (0, class_transformer_1.plainToClass)(appointment_dto_1.CancelAppointmentDto, req.body);
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.map(error => Object.values(error.constraints || {}).join(', '))
                });
                return;
            }
            const appointment = await this.appointmentService.cancelAppointment(appointmentId, dto);
            if (!appointment) {
                res.status(404).json({
                    success: false,
                    message: 'Appointment not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Appointment cancelled successfully',
                data: appointment
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error cancelling appointment'
            });
        }
    }
    async rescheduleAppointment(req, res) {
        try {
            const appointmentId = parseInt(req.params.id);
            if (isNaN(appointmentId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid appointment ID'
                });
                return;
            }
            const dto = (0, class_transformer_1.plainToClass)(appointment_dto_1.RescheduleAppointmentDto, req.body);
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.map(error => Object.values(error.constraints || {}).join(', '))
                });
                return;
            }
            const appointment = await this.appointmentService.rescheduleAppointment(appointmentId, dto);
            if (!appointment) {
                res.status(404).json({
                    success: false,
                    message: 'Appointment not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Appointment rescheduled successfully',
                data: appointment
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error rescheduling appointment'
            });
        }
    }
    async confirmAppointment(req, res) {
        try {
            const appointmentId = parseInt(req.params.id);
            if (isNaN(appointmentId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid appointment ID'
                });
                return;
            }
            const appointment = await this.appointmentService.confirmAppointment(appointmentId);
            if (!appointment) {
                res.status(404).json({
                    success: false,
                    message: 'Appointment not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Appointment confirmed successfully',
                data: appointment
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error confirming appointment'
            });
        }
    }
    async completeAppointment(req, res) {
        try {
            const appointmentId = parseInt(req.params.id);
            if (isNaN(appointmentId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid appointment ID'
                });
                return;
            }
            const appointment = await this.appointmentService.completeAppointment(appointmentId);
            if (!appointment) {
                res.status(404).json({
                    success: false,
                    message: 'Appointment not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Appointment completed successfully',
                data: appointment
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error completing appointment'
            });
        }
    }
    async deleteAppointment(req, res) {
        try {
            const appointmentId = parseInt(req.params.id);
            if (isNaN(appointmentId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid appointment ID'
                });
                return;
            }
            const deleted = await this.appointmentService.deleteAppointment(appointmentId);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Appointment not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Appointment deleted successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error deleting appointment'
            });
        }
    }
    async getUpcomingAppointments(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const days = parseInt(req.query.days) || 7;
            if (isNaN(userId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid user ID'
                });
                return;
            }
            const appointments = await this.appointmentService.getUpcomingAppointments(userId, days);
            res.status(200).json({
                success: true,
                message: 'Upcoming appointments retrieved successfully',
                data: appointments
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error fetching upcoming appointments'
            });
        }
    }
}
exports.AppointmentController = AppointmentController;
