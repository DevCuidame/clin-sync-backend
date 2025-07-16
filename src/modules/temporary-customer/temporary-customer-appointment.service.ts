import { Repository } from 'typeorm';
import { AppDataSource } from '../../core/config/database';
import { Appointment, AppointmentStatus } from '../../models/appointment.model';
import { CreateAppointmentDto } from '../appointment/appointment.dto';
import { InternalServerError, NotFoundError, BadRequestError, ValidationError, AppError } from '../../utils/error-handler';
import { User } from '../../models/user.model';
import { Professional } from '../../models/professional.model';
import { Service } from '../../models/service.model';
import { UserSession, UserSessionStatus } from '../../models/user-session.model';
import { TemporaryCustomer } from '../../models/temporary-customer.model';
import logger from '../../utils/logger';
import { createLocalDate } from '../../utils/date-format';

export class TemporaryCustomerAppointmentService {
  private appointmentRepository: Repository<Appointment>;
  private userRepository: Repository<User>;
  private professionalRepository: Repository<Professional>;
  private serviceRepository: Repository<Service>;
  private userSessionRepository: Repository<UserSession>;
  private temporaryCustomerRepository: Repository<TemporaryCustomer>;

  constructor() {
    this.appointmentRepository = AppDataSource.getRepository(Appointment);
    this.userRepository = AppDataSource.getRepository(User);
    this.professionalRepository = AppDataSource.getRepository(Professional);
    this.serviceRepository = AppDataSource.getRepository(Service);
    this.userSessionRepository = AppDataSource.getRepository(UserSession);
    this.temporaryCustomerRepository = AppDataSource.getRepository(TemporaryCustomer);
  }

  async createAppointment(data: CreateAppointmentDto): Promise<Appointment> {
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
      const hasConflict = await this.checkAvailability(
        data.professional_id,
        scheduledDate,
        data.duration_minutes
      );

      if (hasConflict) {
        throw new BadRequestError('Professional is not available at the requested time');
      }

      // Si se proporciona user_session_id, verificar y decrementar sesiones
      if (data.user_session_id) {
        await this.decrementUserSession(data.user_session_id);
      }

      const appointment = this.appointmentRepository.create({
        ...data,
        scheduled_at: scheduledDate,
        status: AppointmentStatus.SCHEDULED
      });

      const savedAppointment = await this.appointmentRepository.save(appointment);

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

  private async checkAvailability(
    professionalId: number,
    scheduledAt: Date,
    durationMinutes: number,
    excludeAppointmentId?: number
  ): Promise<boolean> {
    try {
      const endTime = new Date(scheduledAt.getTime() + durationMinutes * 60000);
      
      const queryBuilder = this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.professional_id = :professionalId', { professionalId })
        .andWhere('appointment.status IN (:...statuses)', {
          statuses: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
        })
        .andWhere(
          '(appointment.scheduled_at < :endTime AND appointment.scheduled_at + INTERVAL \'1 minute\' * appointment.duration_minutes > :startTime)',
          { startTime: scheduledAt, endTime }
        );

      if (excludeAppointmentId) {
        queryBuilder.andWhere('appointment.appointment_id != :excludeAppointmentId', {
          excludeAppointmentId
        });
      }

      const conflictingAppointment = await queryBuilder.getOne();
      return !!conflictingAppointment;
    } catch (error) {
      logger.error('Error checking availability:', error);
      throw new InternalServerError('Error checking professional availability');
    }
  }

  /**
   * Decrementa las sesiones restantes de una sesión de usuario
   * Si llega a 0, marca la sesión como EXHAUSTED
   */
  private async decrementUserSession(userSessionId: number): Promise<void> {
    try {
      const userSession = await this.userSessionRepository.findOne({
        where: { user_session_id: userSessionId }
      });

      if (!userSession) {
        throw new NotFoundError('User session not found');
      }

      if (userSession.status !== UserSessionStatus.ACTIVE) {
        throw new BadRequestError('User session is not active');
      }

      if (userSession.sessions_remaining <= 0) {
        throw new BadRequestError('No sessions remaining in this user session');
      }

      const newSessionsRemaining = userSession.sessions_remaining - 1;
      const newStatus = newSessionsRemaining === 0 ? UserSessionStatus.EXHAUSTED : userSession.status;

      await this.userSessionRepository.update(userSessionId, {
        sessions_remaining: newSessionsRemaining,
        status: newStatus
      });
      
      logger.info(`Session decremented for user session ${userSessionId}. Remaining sessions: ${newSessionsRemaining}. Status: ${newStatus}`);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error decrementing user session:', error);
      throw new InternalServerError('Error updating user session');
    }
  }

}