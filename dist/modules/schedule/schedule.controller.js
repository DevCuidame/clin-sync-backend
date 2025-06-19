"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleController = void 0;
const schedule_service_1 = require("./schedule.service");
const schedule_model_1 = require("../../models/schedule.model");
class ScheduleController {
    scheduleService;
    constructor() {
        this.scheduleService = new schedule_service_1.ScheduleService();
    }
    async createSchedule(req, res) {
        try {
            const scheduleData = req.body;
            // Validate required fields
            if (!scheduleData.professional_id || !scheduleData.day_of_week ||
                !scheduleData.start_time || !scheduleData.end_time) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required fields: professional_id, day_of_week, start_time, end_time'
                });
                return;
            }
            // Validate day_of_week enum
            if (!Object.values(schedule_model_1.DayOfWeek).includes(scheduleData.day_of_week)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid day_of_week. Must be one of: ' + Object.values(schedule_model_1.DayOfWeek).join(', ')
                });
                return;
            }
            const schedule = await this.scheduleService.createSchedule(scheduleData);
            res.status(201).json({
                success: true,
                message: 'Schedule created successfully',
                data: schedule
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error creating schedule'
            });
        }
    }
    async getAllSchedules(req, res) {
        try {
            const schedules = await this.scheduleService.getAllSchedules();
            res.status(200).json({
                success: true,
                message: 'Schedules retrieved successfully',
                data: schedules,
                count: schedules.length
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error retrieving schedules'
            });
        }
    }
    async getScheduleById(req, res) {
        try {
            const scheduleId = parseInt(req.params.id);
            if (isNaN(scheduleId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid schedule ID'
                });
                return;
            }
            const schedule = await this.scheduleService.getScheduleById(scheduleId);
            if (!schedule) {
                res.status(404).json({
                    success: false,
                    message: 'Schedule not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Schedule retrieved successfully',
                data: schedule
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error retrieving schedule'
            });
        }
    }
    async getSchedulesByProfessional(req, res) {
        try {
            const professionalId = parseInt(req.params.professionalId);
            const activeOnly = req.query.active === 'true';
            if (isNaN(professionalId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid professional ID'
                });
                return;
            }
            const schedules = activeOnly
                ? await this.scheduleService.getActiveSchedulesByProfessional(professionalId)
                : await this.scheduleService.getSchedulesByProfessional(professionalId);
            res.status(200).json({
                success: true,
                message: 'Schedules retrieved successfully',
                data: schedules,
                count: schedules.length
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error retrieving schedules'
            });
        }
    }
    async getSchedulesByDay(req, res) {
        try {
            const dayOfWeek = req.params.day;
            if (!Object.values(schedule_model_1.DayOfWeek).includes(dayOfWeek)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid day of week. Must be one of: ' + Object.values(schedule_model_1.DayOfWeek).join(', ')
                });
                return;
            }
            const schedules = await this.scheduleService.getSchedulesByDay(dayOfWeek);
            res.status(200).json({
                success: true,
                message: 'Schedules retrieved successfully',
                data: schedules,
                count: schedules.length
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error retrieving schedules'
            });
        }
    }
    async getSchedulesWithFilters(req, res) {
        try {
            const filters = {};
            if (req.query.professional_id) {
                const professionalId = parseInt(req.query.professional_id);
                if (isNaN(professionalId)) {
                    res.status(400).json({
                        success: false,
                        message: 'Invalid professional_id parameter'
                    });
                    return;
                }
                filters.professional_id = professionalId;
            }
            if (req.query.day_of_week) {
                const dayOfWeek = req.query.day_of_week;
                if (!Object.values(schedule_model_1.DayOfWeek).includes(dayOfWeek)) {
                    res.status(400).json({
                        success: false,
                        message: 'Invalid day_of_week parameter'
                    });
                    return;
                }
                filters.day_of_week = dayOfWeek;
            }
            if (req.query.is_active !== undefined) {
                filters.is_active = req.query.is_active === 'true';
            }
            if (req.query.valid_date) {
                filters.valid_date = req.query.valid_date;
            }
            const schedules = await this.scheduleService.getSchedulesWithFilters(filters);
            res.status(200).json({
                success: true,
                message: 'Schedules retrieved successfully',
                data: schedules,
                count: schedules.length
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error retrieving schedules'
            });
        }
    }
    async updateSchedule(req, res) {
        try {
            const scheduleId = parseInt(req.params.id);
            const updateData = req.body;
            if (isNaN(scheduleId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid schedule ID'
                });
                return;
            }
            // Validate day_of_week if provided
            if (updateData.day_of_week && !Object.values(schedule_model_1.DayOfWeek).includes(updateData.day_of_week)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid day_of_week. Must be one of: ' + Object.values(schedule_model_1.DayOfWeek).join(', ')
                });
                return;
            }
            const updatedSchedule = await this.scheduleService.updateSchedule(scheduleId, updateData);
            if (!updatedSchedule) {
                res.status(404).json({
                    success: false,
                    message: 'Schedule not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Schedule updated successfully',
                data: updatedSchedule
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error updating schedule'
            });
        }
    }
    async deleteSchedule(req, res) {
        try {
            const scheduleId = parseInt(req.params.id);
            if (isNaN(scheduleId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid schedule ID'
                });
                return;
            }
            const deleted = await this.scheduleService.deleteSchedule(scheduleId);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Schedule not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Schedule deleted successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error deleting schedule'
            });
        }
    }
    async toggleScheduleStatus(req, res) {
        try {
            const scheduleId = parseInt(req.params.id);
            if (isNaN(scheduleId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid schedule ID'
                });
                return;
            }
            const updatedSchedule = await this.scheduleService.toggleScheduleStatus(scheduleId);
            if (!updatedSchedule) {
                res.status(404).json({
                    success: false,
                    message: 'Schedule not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: `Schedule ${updatedSchedule.is_active ? 'activated' : 'deactivated'} successfully`,
                data: updatedSchedule
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error toggling schedule status'
            });
        }
    }
}
exports.ScheduleController = ScheduleController;
