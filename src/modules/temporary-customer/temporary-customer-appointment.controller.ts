import { Request, Response } from 'express';
import { TemporaryCustomerAppointmentService } from './temporary-customer-appointment.service';
import { CreateAppointmentDto } from '../appointment/appointment.dto';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { AppointmentStatus } from '../../models/appointment.model';

export class TemporaryCustomerAppointmentController {
  private temporaryCustomerAppointmentService: TemporaryCustomerAppointmentService;

  constructor() {
    this.temporaryCustomerAppointmentService = new TemporaryCustomerAppointmentService();
  }

  async createAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;

      const dto = plainToClass(CreateAppointmentDto, req.body);
      dto.user_id = userId;
      dto.status = AppointmentStatus.SCHEDULED;
      
      const errors = await validate(dto);
      
      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.map(error => Object.values(error.constraints || {}).join(', '))
        });
        return;
      }
      
      const appointment = await this.temporaryCustomerAppointmentService.createAppointment(dto);
      
      // Crear un resumen completo con todos los datos relacionados
      const appointmentSummary = {
        appointment: {
          id: appointment.appointment_id,
          scheduled_at: appointment.scheduled_at,
          duration_minutes: appointment.duration_minutes,
          status: appointment.status,
          amount: appointment.amount,
          notes: appointment.notes,
          google_calendar_event_id: appointment.google_calendar_event_id,
          created_at: appointment.created_at
        },
        client: {
          id: appointment.user?.id,
          name: appointment.user?.first_name,
          email: appointment.user?.email,
          phone: appointment.user?.phone
        },
        professional: {
          id: appointment.professional?.professional_id,
          name: appointment.professional?.user?.first_name,
          email: appointment.professional?.user?.email,
          specialization: appointment.professional?.specialization,
          license_number: appointment.professional?.license_number
        },
        service: {
          id: appointment.service?.service_id,
          name: appointment.service?.service_name,
          description: appointment.service?.description,
          duration_minutes: appointment.service?.duration_minutes,
          price: appointment.service?.base_price
        },
      };
      
      
      res.status(201).json({
        success: true,
        message: 'Cita para cliente temporal creada exitosamente',
        data: appointmentSummary,
      });
      
    } catch (error: any) {
      
      res.status(400).json({
        success: false,
        message: error.message || 'Error creating appointment for temporary customer'
      });
    }
  }
}