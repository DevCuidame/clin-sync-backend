import { Request, Response } from 'express';
import { TimeSlotService } from './time-slot.service';
import {
  CreateTimeSlotDto,
  UpdateTimeSlotDto,
  TimeSlotFilterDto,
  BulkCreateTimeSlotsDto
} from './time-slot.interface';
import { SlotStatus } from '../../models/time-slot.model';

export class TimeSlotController {
  private timeSlotService: TimeSlotService;

  constructor() {
    this.timeSlotService = new TimeSlotService();
  }

  async createTimeSlot(req: Request, res: Response): Promise<void> {
    try {
      const timeSlotData: CreateTimeSlotDto = req.body;
      
      // Validate required fields
      if (!timeSlotData.professional_id || !timeSlotData.slot_date || 
          !timeSlotData.start_time || !timeSlotData.end_time || 
          !timeSlotData.duration_minutes) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: professional_id, slot_date, start_time, end_time, duration_minutes'
        });
        return;
      }

      // Validate status enum if provided
      if (timeSlotData.status && !Object.values(SlotStatus).includes(timeSlotData.status as SlotStatus)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: ' + Object.values(SlotStatus).join(', ')
        });
        return;
      }

      const timeSlot = await this.timeSlotService.createTimeSlot(timeSlotData);
      
      res.status(201).json({
        success: true,
        message: 'Time slot created successfully',
        data: timeSlot
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error creating time slot'
      });
    }
  }

  async getTimeSlotsByProfessional(req: Request, res: Response): Promise<void> {
    try {
      const professionalId = parseInt(req.params.professionalId);
      
      if (isNaN(professionalId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid professional ID'
        });
        return;
      }

      // Extract query parameters for filtering
      const filters: TimeSlotFilterDto = {
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        status: req.query.status as string,
        available_only: req.query.available_only === 'true',
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof TimeSlotFilterDto] === undefined) {
          delete filters[key as keyof TimeSlotFilterDto];
        }
      });

      const timeSlots = await this.timeSlotService.getTimeSlotsByProfessional(professionalId, filters);
      
      res.status(200).json({
        success: true,
        message: 'Time slots retrieved successfully',
        data: timeSlots,
        count: timeSlots.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving time slots'
      });
    }
  }

  async getTimeSlotById(req: Request, res: Response): Promise<void> {
    try {
      const slotId = parseInt(req.params.slotId);
      
      if (isNaN(slotId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid slot ID'
        });
        return;
      }

      const timeSlot = await this.timeSlotService.getTimeSlotById(slotId);
      
      if (!timeSlot) {
        res.status(404).json({
          success: false,
          message: 'Time slot not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Time slot retrieved successfully',
        data: timeSlot
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving time slot'
      });
    }
  }

  async getTimeSlotWithProfessional(req: Request, res: Response): Promise<void> {
    try {
      const slotId = parseInt(req.params.slotId);
      
      if (isNaN(slotId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid slot ID'
        });
        return;
      }

      const timeSlot = await this.timeSlotService.getTimeSlotWithProfessional(slotId);
      
      if (!timeSlot) {
        res.status(404).json({
          success: false,
          message: 'Time slot not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Time slot with professional retrieved successfully',
        data: timeSlot
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving time slot'
      });
    }
  }

  async updateTimeSlot(req: Request, res: Response): Promise<void> {
    try {
      const slotId = parseInt(req.params.slotId);
      
      if (isNaN(slotId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid slot ID'
        });
        return;
      }

      const updateData: UpdateTimeSlotDto = req.body;

      // Validate status enum if provided
      if (updateData.status && !Object.values(SlotStatus).includes(updateData.status as SlotStatus)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: ' + Object.values(SlotStatus).join(', ')
        });
        return;
      }

      const timeSlot = await this.timeSlotService.updateTimeSlot(slotId, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Time slot updated successfully',
        data: timeSlot
      });
    } catch (error: any) {
      if (error.message === 'Time slot not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message || 'Error updating time slot'
        });
      }
    }
  }

  async deleteTimeSlot(req: Request, res: Response): Promise<void> {
    try {
      const slotId = parseInt(req.params.slotId);
      
      if (isNaN(slotId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid slot ID'
        });
        return;
      }

      const deleted = await this.timeSlotService.deleteTimeSlot(slotId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Time slot not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Time slot deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error deleting time slot'
      });
    }
  }

  async bulkCreateTimeSlots(req: Request, res: Response): Promise<void> {
    try {
      const bulkData: BulkCreateTimeSlotsDto = req.body;
      
      // Validate required fields
      if (!bulkData.professional_id || !bulkData.start_date || !bulkData.end_date ||
          !bulkData.start_time || !bulkData.end_time || !bulkData.duration_minutes) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: professional_id, start_date, end_date, start_time, end_time, duration_minutes'
        });
        return;
      }

      const timeSlots = await this.timeSlotService.bulkCreateTimeSlots(bulkData);
      
      res.status(201).json({
        success: true,
        message: `${timeSlots.length} time slots created successfully`,
        data: timeSlots,
        count: timeSlots.length
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error creating time slots'
      });
    }
  }

  async getAvailableTimeSlots(req: Request, res: Response): Promise<void> {
    try {
      const professionalId = parseInt(req.params.professionalId);
      
      if (isNaN(professionalId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid professional ID'
        });
        return;
      }

      // Extract query parameters for filtering
      const filters: TimeSlotFilterDto = {
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        available_only: true, // Force to only available slots
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof TimeSlotFilterDto] === undefined) {
          delete filters[key as keyof TimeSlotFilterDto];
        }
      });

      const timeSlots = await this.timeSlotService.getTimeSlotsByProfessional(professionalId, filters);
      
      res.status(200).json({
        success: true,
        message: 'Available time slots retrieved successfully',
        data: timeSlots,
        count: timeSlots.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving available time slots'
      });
    }
  }

  async getTimeSlotsByDateRange(req: Request, res: Response): Promise<void> {
    try {
      const professionalId = parseInt(req.params.professionalId);
      const startDate = req.params.startDate;
      const endDate = req.params.endDate;
      
      if (isNaN(professionalId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid professional ID'
        });
        return;
      }

      const filters: TimeSlotFilterDto = {
        start_date: startDate,
        end_date: endDate,
        status: req.query.status as string,
        available_only: req.query.available_only === 'true'
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof TimeSlotFilterDto] === undefined) {
          delete filters[key as keyof TimeSlotFilterDto];
        }
      });

      const timeSlots = await this.timeSlotService.getTimeSlotsByProfessional(professionalId, filters);
      
      res.status(200).json({
        success: true,
        message: 'Time slots retrieved successfully',
        data: timeSlots,
        count: timeSlots.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving time slots'
      });
    }
  }
}