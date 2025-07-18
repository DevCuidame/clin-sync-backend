import { Repository, Between } from 'typeorm';
import { AppDataSource } from '../../core/config/database';
import { Appointment, AppointmentStatus } from '../../models/appointment.model';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentQueryDto, CancelAppointmentDto, RescheduleAppointmentDto } from './appointment.dto';
import { InternalServerError, NotFoundError, BadRequestError, ValidationError, AppError } from '../../utils/error-handler';
import { GoogleCalendarService, createGoogleCalendarService, CalendarEvent } from '../google-calendar/google-calendar.service';
import { User } from '../../models/user.model';
import { Professional } from '../../models/professional.model';
import { Service } from '../../models/service.model';
import { UserSession, UserSessionStatus } from '../../models/user-session.model';
import logger from '../../utils/logger';
import { createLocalDate } from '../../utils/date-format';
import { UserSessionUtil } from '../../utils/user-session.util';
import { AppointmentNotificationService } from './services/appointment-notification.service';
import { AppointmentReminderService } from './services/appointment-reminder.service';

export class AppointmentService {
  private appointmentRepository: Repository<Appointment>;
  private userRepository: Repository<User>;
  private professionalRepository: Repository<Professional>;
  private serviceRepository: Repository<Service>;
  private userSessionRepository: Repository<UserSession>;
  private googleCalendarService: GoogleCalendarService | null = null;
  private notificationService: AppointmentNotificationService;
  private reminderService: AppointmentReminderService;

  constructor() {
    this.appointmentRepository = AppDataSource.getRepository(Appointment);
    this.userRepository = AppDataSource.getRepository(User);
    this.professionalRepository = AppDataSource.getRepository(Professional);
    this.serviceRepository = AppDataSource.getRepository(Service);
    this.userSessionRepository = AppDataSource.getRepository(UserSession);
    this.notificationService = new AppointmentNotificationService();
    this.reminderService = new AppointmentReminderService();
    
    // Inicializar Google Calendar Service si las credenciales están disponibles
    try {
      this.googleCalendarService = createGoogleCalendarService();
    } catch (error) {
      logger.warn('Google Calendar service not initialized - credentials missing');
    }
  }

  async createAppointment(data: CreateAppointmentDto): Promise<Appointment> {
    console.log("🚀 ~ AppointmentService ~ createAppointment ~ data:", data)
    try {
      // Validar fecha
      const scheduledDate = createLocalDate(data.scheduled_at);
      if (isNaN(scheduledDate.getTime())) {
        throw new ValidationError('Invalid date format for scheduled_at');
      }

      if (scheduledDate <= new Date()) {
        throw new BadRequestError('Cannot schedule appointments in the past');
      }

      // Verificar disponibilidad del profesional
      const conflictingAppointment = await this.checkAvailability(
        data.professional_id,
        scheduledDate,
        data.duration_minutes
      );

      if (conflictingAppointment) {
        throw new BadRequestError('Professional is not available at the requested time');
      }

      // Validar sesión de usuario (ahora obligatoria)
      const userSession = await this.userSessionRepository.findOne({
        where: { user_session_id: data.user_session_id },
        relations: ['service', 'purchase']
      });

      if (!userSession) {
        throw new BadRequestError('Sesión de usuario no encontrada');
      }

      // Verificar que la sesión pertenece al usuario correcto
      if (userSession.purchase.user_id !== data.user_id) {
        throw new BadRequestError('La sesión no pertenece al usuario especificado');
      }

      // Verificar que el servicio de la sesión coincide con el servicio de la cita
      if (userSession.service_id !== data.service_id) {
        throw new BadRequestError('El servicio de la sesión no coincide con el servicio de la cita');
      }

      // Usar la utilidad para validar el uso de la sesión
      const validation = UserSessionUtil.validateSessionUsage(userSession, 1);
      if (!validation.isValid) {
        throw new BadRequestError(`Error de validación de sesión: ${validation.reason}`);
      }

      // Decrementar las sesiones disponibles
      userSession.sessions_remaining -= 1;
      
      // Si no quedan sesiones, marcar como agotada
      if (userSession.sessions_remaining <= 0) {
        userSession.status = UserSessionStatus.EXHAUSTED;
      }
      
      await this.userSessionRepository.save(userSession);

      const appointment = this.appointmentRepository.create({
        ...data,
        scheduled_at: scheduledDate,
        status: AppointmentStatus.SCHEDULED,
        reminder_24h_sent: true,
        reminder_2h_sent: true
      });

      const savedAppointment = await this.appointmentRepository.save(appointment);

      // Crear evento en Google Calendar si el servicio está disponible
      if (this.googleCalendarService) {
        try {
          const calendarEvent = await this.createGoogleCalendarEvent(savedAppointment);
          if (calendarEvent) {
            savedAppointment.google_calendar_event_id = calendarEvent.id;
            await this.appointmentRepository.save(savedAppointment);
          }
        } catch (error) {
          logger.error('Error creating Google Calendar event:', error);
          // No fallar la creación de la cita si Google Calendar falla
        }
      }

      // Programar recordatorios automáticos
      try {
        await this.reminderService.scheduleReminder(savedAppointment.appointment_id, '24h');
        await this.reminderService.scheduleReminder(savedAppointment.appointment_id, '2h');
        logger.info(`Reminders scheduled for appointment ${savedAppointment.appointment_id}`);
      } catch (error) {
        logger.error('Error scheduling reminders:', error);
        // No fallar la creación de la cita si los recordatorios fallan
      }

      // Obtener la cita completa con todas las relaciones
      const appointmentWithRelations = await this.getAppointmentById(savedAppointment.appointment_id);
      return appointmentWithRelations || savedAppointment;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error creating appointment');
    }
  }

  async getAppointments(query: AppointmentQueryDto): Promise<{ appointments: Appointment[], total: number }> {
    try {
      const { user_id, professional_id, service_id, status, start_date, end_date, page = 1, limit = 10 } = query;
      const skip = (page - 1) * limit;

      const queryBuilder = this.appointmentRepository.createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.user', 'user')
        .leftJoinAndSelect('appointment.professional', 'professional')
        .leftJoinAndSelect('professional.user', 'professionalUser')
        .leftJoinAndSelect('appointment.service', 'service')
        .leftJoinAndSelect('appointment.user_session', 'user_session');

      if (user_id) {
        queryBuilder.andWhere('appointment.user_id = :user_id', { user_id });
      }

      if (professional_id) {
        queryBuilder.andWhere('appointment.professional_id = :professional_id', { professional_id });
      }

      if (service_id) {
        queryBuilder.andWhere('appointment.service_id = :service_id', { service_id });
      }

      if (status) {
        queryBuilder.andWhere('appointment.status = :status', { status });
      }

      if (start_date && end_date) {
        queryBuilder.andWhere('appointment.scheduled_at BETWEEN :start_date AND :end_date', {
          start_date: createLocalDate(start_date),
          end_date: createLocalDate(end_date)
        });
      } else if (start_date) {
        queryBuilder.andWhere('appointment.scheduled_at >= :start_date', {
          start_date: createLocalDate(start_date)
        });
      } else if (end_date) {
        queryBuilder.andWhere('appointment.scheduled_at <= :end_date', {
          end_date: createLocalDate(end_date)
        });
      }

      queryBuilder
        .orderBy('appointment.scheduled_at', 'ASC')
        .skip(skip)
        .take(limit);

      const [appointments, total] = await queryBuilder.getManyAndCount();

      return { appointments, total };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error fetching appointments');
    }
  }

  async getAppointmentById(appointmentId: number): Promise<Appointment | null> {
    try {
      return await this.appointmentRepository.findOne({
        where: { appointment_id: appointmentId },
        relations: ['user', 'professional', 'professional.user', 'service', 'user_session']
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error fetching appointment');
    }
  }

  async updateAppointment(appointmentId: number, data: UpdateAppointmentDto): Promise<Appointment | null> {
    try {
      const appointment = await this.getAppointmentById(appointmentId);
      if (!appointment) {
        return null;
      }

      // Si se está cambiando la fecha/hora, verificar disponibilidad
      if (data.scheduled_at && data.scheduled_at !== appointment.scheduled_at.toISOString()) {
        const conflictingAppointment = await this.checkAvailability(
          appointment.professional_id,
          createLocalDate(data.scheduled_at),
          data.duration_minutes || appointment.duration_minutes,
          appointmentId
        );

        if (conflictingAppointment) {
          throw new Error('Professional is not available at the requested time');
        }
      }

      const updateData = {
        ...data,
        scheduled_at: data.scheduled_at ? createLocalDate(data.scheduled_at) : undefined
      };

      await this.appointmentRepository.update(appointmentId, updateData);
      const updatedAppointment = await this.getAppointmentById(appointmentId);
      
      // Actualizar evento en Google Calendar si existe
      if (updatedAppointment && this.googleCalendarService) {
        try {
          await this.updateGoogleCalendarEvent(updatedAppointment);
        } catch (error) {
          logger.error('Error updating Google Calendar event:', error);
        }
      }
      
      return updatedAppointment;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error updating appointment');
    }
  }

  async cancelAppointment(appointmentId: number, data: CancelAppointmentDto): Promise<Appointment | null> {
    try {
      const appointment = await this.getAppointmentById(appointmentId);
      if (!appointment) {
        throw new NotFoundError('Appointment not found');
      }

      if (appointment.status === AppointmentStatus.CANCELLED) {
        throw new BadRequestError('Appointment is already cancelled');
      }

      if (appointment.status === AppointmentStatus.COMPLETED) {
        throw new BadRequestError('Cannot cancel a completed appointment');
      }

      // Restaurar sesión si la cita tenía una sesión asociada
      if (appointment.user_session_id) {
        const userSession = await this.userSessionRepository.findOne({
          where: { user_session_id: appointment.user_session_id }
        });

        if (userSession) {
          // Incrementar las sesiones disponibles
          userSession.sessions_remaining += 1;
          
          // Si la sesión estaba agotada, cambiar el estado a activo
          if (userSession.status === UserSessionStatus.EXHAUSTED) {
            userSession.status = UserSessionStatus.ACTIVE;
          }
          
          await this.userSessionRepository.save(userSession);
        }
      }

      await this.appointmentRepository.update(appointmentId, {
        status: AppointmentStatus.CANCELLED,
        cancellation_reason: data.cancellation_reason,
      });

      const cancelledAppointment = await this.getAppointmentById(appointmentId);
      
      // Eliminar evento de Google Calendar si existe
      if (cancelledAppointment && this.googleCalendarService) {
        try {
          await this.deleteGoogleCalendarEvent(cancelledAppointment);
        } catch (error) {
          logger.error('Error deleting Google Calendar event:', error);
        }
      }

      // Cancelar recordatorios programados
      try {
        await this.reminderService.cancelReminders(appointmentId);
        logger.info(`Reminders cancelled for appointment ${appointmentId}`);
      } catch (error) {
        logger.error('Error cancelling reminders:', error);
      }

      // Enviar notificación por correo electrónico
      if (cancelledAppointment) {
        try {
          await this.notificationService.sendCancellationNotification({
            appointment: cancelledAppointment,
            recipientEmail: cancelledAppointment.user.email,
            recipientName: `${cancelledAppointment.user.first_name} ${cancelledAppointment.user.last_name}`,
            professionalName: `${cancelledAppointment.professional?.user?.first_name || ''} ${cancelledAppointment.professional?.user?.last_name || ''}`.trim(),
            serviceName: cancelledAppointment.service?.service_name,
            reason: data.cancellation_reason
          });
        } catch (error) {
          logger.error('Error sending cancellation notification:', error);
          // No fallar la cancelación si el envío de correo falla
        }
      }

      return cancelledAppointment;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error cancelling appointment');
    }
  }

  async rescheduleAppointment(appointmentId: number, data: RescheduleAppointmentDto): Promise<Appointment | null> {
    try {
      const appointment = await this.getAppointmentById(appointmentId);
      if (!appointment) {
        throw new NotFoundError('Appointment not found');
      }

      if (appointment.status === AppointmentStatus.CANCELLED) {
        throw new BadRequestError('Cannot reschedule a cancelled appointment');
      }

      if (appointment.status === AppointmentStatus.COMPLETED) {
        throw new BadRequestError('Cannot reschedule a completed appointment');
      }

      // Validar nueva fecha
      const newScheduledDate = createLocalDate(data.new_scheduled_at);
      if (isNaN(newScheduledDate.getTime())) {
        throw new ValidationError('Invalid date format for new_scheduled_at');
      }

      if (newScheduledDate <= new Date()) {
        throw new BadRequestError('Cannot reschedule appointments to the past');
      }

      // Verificar disponibilidad en la nueva fecha/hora
      const conflictingAppointment = await this.checkAvailability(
        appointment.professional_id,
        newScheduledDate,
        data.new_duration_minutes || appointment.duration_minutes,
        appointmentId
      );

      if (conflictingAppointment) {
        throw new BadRequestError('Professional is not available at the requested time');
      }

      await this.appointmentRepository.update(appointmentId, {
        scheduled_at: newScheduledDate,
        duration_minutes: data.new_duration_minutes || appointment.duration_minutes,
        notes: data.reason ? `${appointment.notes || ''} - Rescheduled: ${data.reason}` : appointment.notes,
        reminder_24h_sent: false,
        reminder_2h_sent: false
      });

      const rescheduledAppointment = await this.getAppointmentById(appointmentId);

      // Reprogramar recordatorios para la nueva fecha
      try {
        await this.reminderService.cancelReminders(appointmentId);
        await this.reminderService.scheduleReminder(appointmentId, '24h');
        await this.reminderService.scheduleReminder(appointmentId, '2h');
        logger.info(`Reminders rescheduled for appointment ${appointmentId}`);
      } catch (error) {
        logger.error('Error rescheduling reminders:', error);
      }

      // Enviar notificación por correo electrónico
      if (rescheduledAppointment) {
        try {
          await this.notificationService.sendRescheduleNotification({
            appointment: rescheduledAppointment,
            recipientEmail: rescheduledAppointment.user.email,
            recipientName: `${rescheduledAppointment.user.first_name} ${rescheduledAppointment.user.last_name}`,
            professionalName: `${rescheduledAppointment.professional?.user?.first_name || ''} ${rescheduledAppointment.professional?.user?.last_name || ''}`.trim(),
            serviceName: rescheduledAppointment.service?.service_name,
            reason: data.reason,
            newDateTime: newScheduledDate
          });
        } catch (error) {
          logger.error('Error sending reschedule notification:', error);
          // No fallar la reprogramación si el envío de correo falla
        }
      }

      return rescheduledAppointment;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error rescheduling appointment');
    }
  }

  async confirmAppointment(appointmentId: number): Promise<Appointment | null> {
    try {
      const appointment = await this.getAppointmentById(appointmentId);
      if (!appointment) {
        throw new NotFoundError('Appointment not found');
      }

      if (appointment.status !== AppointmentStatus.SCHEDULED) {
        throw new BadRequestError('Only scheduled appointments can be confirmed');
      }

      await this.appointmentRepository.update(appointmentId, {
        status: AppointmentStatus.CONFIRMED
      });

      const confirmedAppointment = await this.getAppointmentById(appointmentId);

      // Enviar notificación por correo electrónico
      if (confirmedAppointment) {
        try {
          await this.notificationService.sendConfirmationNotification({
            appointment: confirmedAppointment,
            recipientEmail: confirmedAppointment.user.email,
            recipientName: `${confirmedAppointment.user.first_name} ${confirmedAppointment.user.last_name}`,
            professionalName: `${confirmedAppointment.professional?.user?.first_name || ''} ${confirmedAppointment.professional?.user?.last_name || ''}`.trim(),
            serviceName: confirmedAppointment.service?.service_name
          });
        } catch (error) {
          logger.error('Error sending confirmation notification:', error);
          // No fallar la confirmación si el envío de correo falla
        }
      }

      return confirmedAppointment;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error confirming appointment');
    }
  }

  async completeAppointment(appointmentId: number): Promise<Appointment | null> {
    try {
      const appointment = await this.getAppointmentById(appointmentId);
      if (!appointment) {
        throw new NotFoundError('Appointment not found');
      }

      if (appointment.status === AppointmentStatus.CANCELLED) {
        throw new BadRequestError('Cannot complete a cancelled appointment');
      }

      if (appointment.status === AppointmentStatus.COMPLETED) {
        throw new BadRequestError('Appointment is already completed');
      }

      // Actualizar el estado de la cita
      await this.appointmentRepository.update(appointmentId, {
        status: AppointmentStatus.COMPLETED
      });

      // Si la cita tiene una sesión asociada, decrementar sessions_remaining
      if (appointment.user_session_id) {
        const userSession = await this.userSessionRepository.findOne({
          where: { user_session_id: appointment.user_session_id }
        });

        if (userSession && userSession.sessions_remaining > 0) {
          const newSessionsRemaining = userSession.sessions_remaining - 1;
          
          // Actualizar sessions_remaining
          await this.userSessionRepository.update(appointment.user_session_id, {
            sessions_remaining: newSessionsRemaining,
            // Si no quedan sesiones, marcar como expirada
            status: newSessionsRemaining === 0 ? UserSessionStatus.EXPIRED : userSession.status
          });

          logger.info(`Session decremented for appointment ${appointmentId}. Remaining sessions: ${newSessionsRemaining}`);
        }
      }

      const completedAppointment = await this.getAppointmentById(appointmentId);

      // Enviar notificación por correo electrónico
      if (completedAppointment) {
        try {
          await this.notificationService.sendCompletionNotification({
            appointment: completedAppointment,
            recipientEmail: completedAppointment.user.email,
            recipientName: `${completedAppointment.user.first_name} ${completedAppointment.user.last_name}`,
            professionalName: `${completedAppointment.professional?.user?.first_name || ''} ${completedAppointment.professional?.user?.last_name || ''}`.trim(),
            serviceName: completedAppointment.service?.service_name
          });
        } catch (error) {
          logger.error('Error sending completion notification:', error);
          // No fallar la finalización si el envío de correo falla
        }
      }

      return completedAppointment;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error completing appointment');
    }
  }

  async markAsNoShow(appointmentId: number): Promise<Appointment | null> {
    try {
      const appointment = await this.getAppointmentById(appointmentId);
      if (!appointment) {
        throw new NotFoundError('Appointment not found');
      }

      if (appointment.status === AppointmentStatus.CANCELLED) {
        throw new BadRequestError('Cannot mark a cancelled appointment as no-show');
      }

      if (appointment.status === AppointmentStatus.COMPLETED) {
        throw new BadRequestError('Cannot mark a completed appointment as no-show');
      }

      if (appointment.status === AppointmentStatus.NO_SHOW) {
        throw new BadRequestError('Appointment is already marked as no-show');
      }

      await this.appointmentRepository.update(appointmentId, {
        status: AppointmentStatus.NO_SHOW
      });

      return await this.getAppointmentById(appointmentId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error marking appointment as no-show');
    }
  }

  async deleteAppointment(appointmentId: number): Promise<boolean> {
    try {
      const result = await this.appointmentRepository.delete(appointmentId);
      return result.affected ? result.affected > 0 : false;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error deleting appointment');
    }
  }

  async getUpcomingAppointments(userId: number, days: number = 7, page: number = 1, limit: number = 10): Promise<{ appointments: Appointment[], total: number }> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + days);
      const skip = (page - 1) * limit;

      const queryBuilder = this.appointmentRepository.createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.user', 'user')
        .leftJoinAndSelect('appointment.professional', 'professional')
        .leftJoinAndSelect('professional.user', 'professionalUser')
        .leftJoinAndSelect('appointment.service', 'service')
        .leftJoinAndSelect('appointment.user_session', 'user_session')
        .where('appointment.user_id = :userId', { userId })
        .andWhere('appointment.scheduled_at BETWEEN :startDate AND :endDate', { startDate, endDate })
        .andWhere('appointment.status IN (:...statuses)', { statuses: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] })
        .orderBy('appointment.scheduled_at', 'ASC')
        .skip(skip)
        .take(limit);

      const [appointments, total] = await queryBuilder.getManyAndCount();

      return { appointments, total };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error fetching upcoming appointments');
    }
  }

  async getUpcomingAppointmentsByProfessional(userId: number, days: number = 7, page: number = 1, limit: number = 10): Promise<{ appointments: Appointment[], total: number }> {
    try {
      // Primero buscar el profesional por el ID del usuario
      const professional = await this.professionalRepository.findOne({
        where: { user_id: userId }
      });

      if (!professional) {
        throw new NotFoundError('Professional not found for this user');
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + days);
      const skip = (page - 1) * limit;

      const queryBuilder = this.appointmentRepository.createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.user', 'user')
        .leftJoinAndSelect('appointment.professional', 'professional')
        .leftJoinAndSelect('professional.user', 'professionalUser')
        .leftJoinAndSelect('appointment.service', 'service')
        .leftJoinAndSelect('appointment.user_session', 'user_session')
        .where('appointment.professional_id = :professionalId', { professionalId: professional.professional_id })
        .andWhere('appointment.scheduled_at BETWEEN :startDate AND :endDate', { startDate, endDate })
        .andWhere('appointment.status IN (:...statuses)', { statuses: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] })
        .orderBy('appointment.scheduled_at', 'ASC')
        .skip(skip)
        .take(limit);

      const [appointments, total] = await queryBuilder.getManyAndCount();

      return { appointments, total };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error fetching professional upcoming appointments');
    }
  }

  async getUserAppointmentsWithSessions(query: any): Promise<{ appointments: any[], total: number }> {
    try {
      const { 
        user_id, 
        professional_id, 
        service_id, 
        status, 
        start_date, 
        end_date, 
        user_session_id,
        package_id,
        include_session_details = true,
        include_service_details = true,
        include_professional_details = true,
        page = 1, 
        limit = 10 
      } = query;
      
      const skip = (page - 1) * limit;

      const queryBuilder = this.appointmentRepository.createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.user', 'user')
        .leftJoinAndSelect('appointment.professional', 'professional')
        .leftJoinAndSelect('professional.user', 'professionalUser')
        .leftJoinAndSelect('appointment.service', 'service')
        .leftJoinAndSelect('appointment.user_session', 'user_session')
        .leftJoinAndSelect('user_session.purchase', 'purchase')
        .leftJoinAndSelect('purchase.package', 'package')
        .orderBy('appointment.scheduled_at', 'DESC');

      // Aplicar filtros
      if (user_id) {
        queryBuilder.andWhere('appointment.user_id = :user_id', { user_id });
      }

      if (professional_id) {
        queryBuilder.andWhere('appointment.professional_id = :professional_id', { professional_id });
      }

      if (service_id) {
        queryBuilder.andWhere('appointment.service_id = :service_id', { service_id });
      }

      if (status) {
        queryBuilder.andWhere('appointment.status = :status', { status });
      }

      if (user_session_id) {
        queryBuilder.andWhere('appointment.user_session_id = :user_session_id', { user_session_id });
      }

      if (start_date) {
        queryBuilder.andWhere('appointment.scheduled_at >= :start_date', { start_date });
      }

      if (end_date) {
        queryBuilder.andWhere('appointment.scheduled_at <= :end_date', { end_date });
      }

      if (package_id) {
        queryBuilder.andWhere('package.package_id = :package_id', { package_id });
      }

      // Paginación
      queryBuilder.skip(skip).take(limit);

      const [appointments, total] = await queryBuilder.getManyAndCount();

      // Mapear los resultados para incluir información adicional
      const mappedAppointments = appointments.map(appointment => {
        const result: any = {
          appointment_id: appointment.appointment_id,
          user_id: appointment.user_id,
          professional_id: appointment.professional_id,
          service_id: appointment.service_id,
          user_session_id: appointment.user_session_id,
          scheduled_at: appointment.scheduled_at,
          duration_minutes: appointment.duration_minutes,
          status: appointment.status,
          amount: appointment.amount,
          notes: appointment.notes,
          cancellation_reason: appointment.cancellation_reason,
          reminder_24h_sent: appointment.reminder_24h_sent,
          reminder_2h_sent: appointment.reminder_2h_sent,
          google_calendar_event_id: appointment.google_calendar_event_id,
          created_at: appointment.created_at,
          updated_at: appointment.updated_at
        };

        // Incluir detalles del usuario
        if (appointment.user) {
          result.user = {
            id: appointment.user.id,
            first_name: appointment.user.first_name,
            last_name: appointment.user.last_name,
            email: appointment.user.email,
            phone: appointment.user.phone
          };
        }

        // Incluir detalles del profesional si se solicita
        if (include_professional_details && appointment.professional) {
          result.professional = {
            professional_id: appointment.professional.professional_id,
            user_id: appointment.professional.user_id,
            specialization: appointment.professional.specialization,
            license_number: appointment.professional.license_number,
            years_experience: appointment.professional.experience_years,
            bio: appointment.professional.bio,
            user: appointment.professional.user ? {
              id: appointment.professional.user.id,
              first_name: appointment.professional.user.first_name,
              last_name: appointment.professional.user.last_name,
              email: appointment.professional.user.email
            } : null
          };
        }

        // Incluir detalles del servicio si se solicita
        if (include_service_details && appointment.service) {
          result.service = {
            service_id: appointment.service.service_id,
            service_name: appointment.service.service_name,
            description: appointment.service.description,
            base_price: appointment.service.base_price,
            duration_minutes: appointment.service.duration_minutes,
            category: appointment.service.category,
            is_active: appointment.service.is_active
          };
        }

        // Incluir detalles de la sesión si se solicita
        if (include_session_details && appointment.user_session) {
          result.user_session = {
            user_session_id: appointment.user_session.user_session_id,
            purchase_id: appointment.user_session.purchase_id,
            service_id: appointment.user_session.service_id,
            sessions_remaining: appointment.user_session.sessions_remaining,
            expires_at: appointment.user_session.expires_at,
            status: appointment.user_session.status,
            created_at: appointment.user_session.created_at,
            purchase: appointment.user_session.purchase ? {
              purchase_id: appointment.user_session.purchase.purchase_id,
              amount_paid: appointment.user_session.purchase.amount_paid,
              purchase_date: appointment.user_session.purchase.purchase_date,
              payment_status: appointment.user_session.purchase.payment_status,
              package: appointment.user_session.purchase.package ? {
                package_id: appointment.user_session.purchase.package.package_id,
                package_name: appointment.user_session.purchase.package.package_name,
                description: appointment.user_session.purchase.package.description,
                total_sessions: appointment.user_session.purchase.package.total_sessions,
                validity_days: appointment.user_session.purchase.package.validity_days,
                price: appointment.user_session.purchase.package.price
              } : null
            } : null
          };
        }

        return result;
      });

      return { appointments: mappedAppointments, total };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error fetching user appointments with sessions');
    }
  }

  private async checkAvailability(
    professionalId: number,
    scheduledAt: Date,
    durationMinutes: number,
    excludeAppointmentId?: number
  ): Promise<Appointment | null> {
    try {
      const endTime = new Date(scheduledAt.getTime() + durationMinutes * 60000);
      
      const queryBuilder = this.appointmentRepository.createQueryBuilder('appointment')
        .where('appointment.professional_id = :professionalId', { professionalId })
        .andWhere('appointment.status NOT IN (:...excludedStatuses)', {
          excludedStatuses: [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED]
        })
        .andWhere(
          '(appointment.scheduled_at < :endTime AND appointment.scheduled_at + appointment.duration_minutes * INTERVAL \'1 minute\' > :scheduledAt)',
          { scheduledAt, endTime }
        );

      if (excludeAppointmentId) {
        queryBuilder.andWhere('appointment.appointment_id != :excludeAppointmentId', { excludeAppointmentId });
      }

      return await queryBuilder.getOne();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error checking availability');
    }
  }

  /**
   * Crea un evento en Google Calendar para una cita
   */
  private async createGoogleCalendarEvent(appointment: Appointment): Promise<any | null> {
    if (!this.googleCalendarService) {
      return null;
    }

    try {
      // Obtener información del usuario, profesional y servicio
      const [user, professional, service] = await Promise.all([
        this.userRepository.findOne({ where: { id: appointment.user_id } }),
        this.professionalRepository.findOne({ where: { professional_id: appointment.professional_id } }),
        this.serviceRepository.findOne({ where: { service_id: appointment.service_id } })
      ]);

      if (!user || !professional || !service) {
        logger.error('Missing required data for Google Calendar event creation');
        return null;
      }

      const startTime = new Date(appointment.scheduled_at);
      const endTime = new Date(startTime.getTime() + (appointment.duration_minutes * 60000));

      const calendarEvent: CalendarEvent = {
        summary: `Cita médica - ${service.category}`,
        description: `Cita con ${professional.user.first_name} ${professional.user.last_name}\n` +
                    `Servicio: ${service.category}\n` +
                    `Paciente: ${user.first_name} ${user.last_name}\n` +
                    `Duración: ${appointment.duration_minutes} minutos\n` +
                    (appointment.notes ? `Notas: ${appointment.notes}` : ''),
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'America/Bogota'
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'America/Bogota'
        },
        attendees: [
          {
            email: user.email,
            displayName: `${user.first_name} ${user.last_name}`
          },
          {
            email: professional.user.email || '',
            displayName: `Dr. ${professional.user.first_name} ${professional.user.last_name}`
          }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 horas antes
            { method: 'popup', minutes: 60 }, // 1 hora antes
            { method: 'popup', minutes: 15 } // 15 minutos antes
          ]
        }
      };

      return await this.googleCalendarService.createEvent(calendarEvent);
    } catch (error) {
      logger.error('Error creating Google Calendar event:', error);
      return null;
    }
  }

  /**
   * Actualiza un evento en Google Calendar
   */
  private async updateGoogleCalendarEvent(appointment: Appointment): Promise<void> {
    if (!this.googleCalendarService || !appointment.google_calendar_event_id) {
      return;
    }

    try {
      const [user, professional, service] = await Promise.all([
        this.userRepository.findOne({ where: { id: appointment.user_id } }),
        this.professionalRepository.findOne({ where: { professional_id: appointment.professional_id } }),
        this.serviceRepository.findOne({ where: { service_id: appointment.service_id } })
      ]);

      if (!user || !professional || !service) {
        return;
      }

      const startTime = new Date(appointment.scheduled_at);
      const endTime = new Date(startTime.getTime() + (appointment.duration_minutes * 60000));

      const updatedEvent: Partial<CalendarEvent> = {
        summary: `Cita médica - ${service.category}`,
        description: `Cita con ${professional.user.first_name} ${professional.user.last_name}\n` +
                    `Servicio: ${service.category}\n` +
                    `Paciente: ${user.first_name} ${user.last_name}\n` +
                    `Duración: ${appointment.duration_minutes} minutos\n` +
                    `Estado: ${appointment.status}\n` +
                    (appointment.notes ? `Notas: ${appointment.notes}` : ''),
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'America/Bogota'
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'America/Bogota'
        }
      };

      await this.googleCalendarService.updateEvent(
        appointment.google_calendar_event_id,
        updatedEvent
      );
    } catch (error) {
      logger.error('Error updating Google Calendar event:', error);
    }
  }

  /**
   * Elimina un evento de Google Calendar
   */
  private async deleteGoogleCalendarEvent(appointment: Appointment): Promise<void> {
    if (!this.googleCalendarService || !appointment.google_calendar_event_id) {
      return;
    }

    try {
      await this.googleCalendarService.deleteEvent(appointment.google_calendar_event_id);
    } catch (error) {
      logger.error('Error deleting Google Calendar event:', error);
    }
  }

  /**
   * Configura Google Calendar para un usuario específico
   */
  async setupGoogleCalendar(userId: number, refreshToken: string): Promise<void> {
    try {
      // Aquí podrías guardar el refresh token del usuario en la base de datos
      // para usar su calendario personal
      logger.info(`Google Calendar configured for user ${userId}`);
    } catch (error) {
      logger.error('Error setting up Google Calendar:', error);
      throw new InternalServerError('Error configuring Google Calendar');
    }
  }

  /**
   * Obtiene la URL de autorización de Google Calendar
   */
  getGoogleCalendarAuthUrl(): string {
    if (!this.googleCalendarService) {
      throw new BadRequestError('Google Calendar service not available');
    }
    return this.googleCalendarService.getAuthUrl();
  }
}