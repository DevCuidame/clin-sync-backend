import { Request, Response } from 'express';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentQueryDto, CancelAppointmentDto, RescheduleAppointmentDto } from './appointment.dto';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export class AppointmentController {
  private appointmentService: AppointmentService;

  constructor() {
    this.appointmentService = new AppointmentService();
  }

  async createAppointment(req: Request, res: Response): Promise<void> {
    try {

      const userId = req.user.id;

      const dto = plainToClass(CreateAppointmentDto, req.body);
      dto.user_id = userId;
      const errors = await validate(dto);

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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error creating appointment'
      });
    }
  }

  async getAppointments(req: Request, res: Response): Promise<void> {
    try {
      const query = plainToClass(AppointmentQueryDto, req.query);
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching appointments'
      });
    }
  }

  async getAppointmentById(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching appointment'
      });
    }
  }

  async updateAppointment(req: Request, res: Response): Promise<void> {
    try {
      const appointmentId = parseInt(req.params.id);
      
      if (isNaN(appointmentId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid appointment ID'
        });
        return;
      }

      const dto = plainToClass(UpdateAppointmentDto, req.body);
      const errors = await validate(dto);

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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating appointment'
      });
    }
  }

  async cancelAppointment(req: Request, res: Response): Promise<void> {
    try {
      const appointmentId = parseInt(req.params.id);
      
      if (isNaN(appointmentId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid appointment ID'
        });
        return;
      }

      const dto = plainToClass(CancelAppointmentDto, req.body);
      const errors = await validate(dto);

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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error cancelling appointment'
      });
    }
  }

  async rescheduleAppointment(req: Request, res: Response): Promise<void> {
    try {
      const appointmentId = parseInt(req.params.id);
      
      if (isNaN(appointmentId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid appointment ID'
        });
        return;
      }

      const dto = plainToClass(RescheduleAppointmentDto, req.body);
      const errors = await validate(dto);

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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error rescheduling appointment'
      });
    }
  }

  async confirmAppointment(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error confirming appointment'
      });
    }
  }

  async completeAppointment(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error completing appointment'
      });
    }
  }

  async deleteAppointment(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error deleting appointment'
      });
    }
  }

  async getUpcomingAppointments(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const days = parseInt(req.query.days as string) || 7;
      
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching upcoming appointments'
      });
    }
  }
}