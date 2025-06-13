import { Request, Response } from 'express';
import { ScheduleService } from './schedule.service';
import { 
  CreateScheduleDto, 
  UpdateScheduleDto, 
  ScheduleFilterDto 
} from './schedule.interface';
import { DayOfWeek } from '../../models/schedule.model';

export class ScheduleController {
  private scheduleService: ScheduleService;

  constructor() {
    this.scheduleService = new ScheduleService();
  }

  async createSchedule(req: Request, res: Response): Promise<void> {
    try {
      const scheduleData: CreateScheduleDto = req.body;
      
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
      if (!Object.values(DayOfWeek).includes(scheduleData.day_of_week)) {
        res.status(400).json({
          success: false,
          message: 'Invalid day_of_week. Must be one of: ' + Object.values(DayOfWeek).join(', ')
        });
        return;
      }

      const schedule = await this.scheduleService.createSchedule(scheduleData);
      
      res.status(201).json({
        success: true,
        message: 'Schedule created successfully',
        data: schedule
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error creating schedule'
      });
    }
  }

  async getAllSchedules(req: Request, res: Response): Promise<void> {
    try {
      const schedules = await this.scheduleService.getAllSchedules();
      
      res.status(200).json({
        success: true,
        message: 'Schedules retrieved successfully',
        data: schedules,
        count: schedules.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving schedules'
      });
    }
  }

  async getScheduleById(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving schedule'
      });
    }
  }

  async getSchedulesByProfessional(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving schedules'
      });
    }
  }

  async getSchedulesByDay(req: Request, res: Response): Promise<void> {
    try {
      const dayOfWeek = req.params.day as DayOfWeek;
      
      if (!Object.values(DayOfWeek).includes(dayOfWeek)) {
        res.status(400).json({
          success: false,
          message: 'Invalid day of week. Must be one of: ' + Object.values(DayOfWeek).join(', ')
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving schedules'
      });
    }
  }

  async getSchedulesWithFilters(req: Request, res: Response): Promise<void> {
    try {
      const filters: ScheduleFilterDto = {};
      
      if (req.query.professional_id) {
        const professionalId = parseInt(req.query.professional_id as string);
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
        const dayOfWeek = req.query.day_of_week as DayOfWeek;
        if (!Object.values(DayOfWeek).includes(dayOfWeek)) {
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
        filters.valid_date = req.query.valid_date as string;
      }

      const schedules = await this.scheduleService.getSchedulesWithFilters(filters);
      
      res.status(200).json({
        success: true,
        message: 'Schedules retrieved successfully',
        data: schedules,
        count: schedules.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving schedules'
      });
    }
  }

  async updateSchedule(req: Request, res: Response): Promise<void> {
    try {
      const scheduleId = parseInt(req.params.id);
      const updateData: UpdateScheduleDto = req.body;
      
      if (isNaN(scheduleId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid schedule ID'
        });
        return;
      }

      // Validate day_of_week if provided
      if (updateData.day_of_week && !Object.values(DayOfWeek).includes(updateData.day_of_week)) {
        res.status(400).json({
          success: false,
          message: 'Invalid day_of_week. Must be one of: ' + Object.values(DayOfWeek).join(', ')
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
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error updating schedule'
      });
    }
  }

  async deleteSchedule(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error deleting schedule'
      });
    }
  }

  async toggleScheduleStatus(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error toggling schedule status'
      });
    }
  }
}