"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentService = void 0;
const typeorm_1 = require("typeorm");
const database_1 = require("../../core/config/database");
const appointment_model_1 = require("../../models/appointment.model");
const error_handler_1 = require("../../utils/error-handler");
const google_calendar_service_1 = require("../google-calendar/google-calendar.service");
const user_model_1 = require("../../models/user.model");
const professional_model_1 = require("../../models/professional.model");
const service_model_1 = require("../../models/service.model");
const logger_1 = __importDefault(require("../../utils/logger"));
class AppointmentService {
    appointmentRepository;
    userRepository;
    professionalRepository;
    serviceRepository;
    googleCalendarService = null;
    constructor() {
        this.appointmentRepository = database_1.AppDataSource.getRepository(appointment_model_1.Appointment);
        this.userRepository = database_1.AppDataSource.getRepository(user_model_1.User);
        this.professionalRepository = database_1.AppDataSource.getRepository(professional_model_1.Professional);
        this.serviceRepository = database_1.AppDataSource.getRepository(service_model_1.Service);
        // Inicializar Google Calendar Service si las credenciales están disponibles
        try {
            this.googleCalendarService = (0, google_calendar_service_1.createGoogleCalendarService)();
        }
        catch (error) {
            logger_1.default.warn('Google Calendar service not initialized - credentials missing');
        }
    }
    async createAppointment(data) {
        try {
            // Validar fecha
            const scheduledDate = new Date(data.scheduled_at);
            if (isNaN(scheduledDate.getTime())) {
                throw new error_handler_1.ValidationError('Invalid date format for scheduled_at');
            }
            if (scheduledDate <= new Date()) {
                throw new error_handler_1.BadRequestError('Cannot schedule appointments in the past');
            }
            // Verificar disponibilidad del profesional
            const conflictingAppointment = await this.checkAvailability(data.professional_id, scheduledDate, data.duration_minutes);
            if (conflictingAppointment) {
                throw new error_handler_1.BadRequestError('Professional is not available at the requested time');
            }
            const appointment = this.appointmentRepository.create({
                ...data,
                scheduled_at: scheduledDate,
                status: appointment_model_1.AppointmentStatus.SCHEDULED
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
                }
                catch (error) {
                    logger_1.default.error('Error creating Google Calendar event:', error);
                    // No fallar la creación de la cita si Google Calendar falla
                }
            }
            return savedAppointment;
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error creating appointment');
        }
    }
    async getAppointments(query) {
        try {
            const { user_id, professional_id, service_id, status, start_date, end_date, page = 1, limit = 10 } = query;
            const skip = (page - 1) * limit;
            const queryBuilder = this.appointmentRepository.createQueryBuilder('appointment');
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
                    start_date: new Date(start_date),
                    end_date: new Date(end_date)
                });
            }
            else if (start_date) {
                queryBuilder.andWhere('appointment.scheduled_at >= :start_date', {
                    start_date: new Date(start_date)
                });
            }
            else if (end_date) {
                queryBuilder.andWhere('appointment.scheduled_at <= :end_date', {
                    end_date: new Date(end_date)
                });
            }
            queryBuilder
                .orderBy('appointment.scheduled_at', 'ASC')
                .skip(skip)
                .take(limit);
            const [appointments, total] = await queryBuilder.getManyAndCount();
            return { appointments, total };
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error fetching appointments');
        }
    }
    async getAppointmentById(appointmentId) {
        try {
            return await this.appointmentRepository.findOne({
                where: { appointment_id: appointmentId }
            });
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error fetching appointment');
        }
    }
    async updateAppointment(appointmentId, data) {
        try {
            const appointment = await this.getAppointmentById(appointmentId);
            if (!appointment) {
                return null;
            }
            // Si se está cambiando la fecha/hora, verificar disponibilidad
            if (data.scheduled_at && data.scheduled_at !== appointment.scheduled_at.toISOString()) {
                const conflictingAppointment = await this.checkAvailability(appointment.professional_id, new Date(data.scheduled_at), data.duration_minutes || appointment.duration_minutes, appointmentId);
                if (conflictingAppointment) {
                    throw new Error('Professional is not available at the requested time');
                }
            }
            const updateData = {
                ...data,
                scheduled_at: data.scheduled_at ? new Date(data.scheduled_at) : undefined
            };
            await this.appointmentRepository.update(appointmentId, updateData);
            const updatedAppointment = await this.getAppointmentById(appointmentId);
            // Actualizar evento en Google Calendar si existe
            if (updatedAppointment && this.googleCalendarService) {
                try {
                    await this.updateGoogleCalendarEvent(updatedAppointment);
                }
                catch (error) {
                    logger_1.default.error('Error updating Google Calendar event:', error);
                }
            }
            return updatedAppointment;
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error updating appointment');
        }
    }
    async cancelAppointment(appointmentId, data) {
        try {
            const appointment = await this.getAppointmentById(appointmentId);
            if (!appointment) {
                throw new error_handler_1.NotFoundError('Appointment not found');
            }
            if (appointment.status === appointment_model_1.AppointmentStatus.CANCELLED) {
                throw new error_handler_1.BadRequestError('Appointment is already cancelled');
            }
            if (appointment.status === appointment_model_1.AppointmentStatus.COMPLETED) {
                throw new error_handler_1.BadRequestError('Cannot cancel a completed appointment');
            }
            await this.appointmentRepository.update(appointmentId, {
                status: appointment_model_1.AppointmentStatus.CANCELLED,
                cancellation_reason: data.cancellation_reason,
            });
            const cancelledAppointment = await this.getAppointmentById(appointmentId);
            // Eliminar evento de Google Calendar si existe
            if (cancelledAppointment && this.googleCalendarService) {
                try {
                    await this.deleteGoogleCalendarEvent(cancelledAppointment);
                }
                catch (error) {
                    logger_1.default.error('Error deleting Google Calendar event:', error);
                }
            }
            return cancelledAppointment;
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error cancelling appointment');
        }
    }
    async rescheduleAppointment(appointmentId, data) {
        try {
            const appointment = await this.getAppointmentById(appointmentId);
            if (!appointment) {
                throw new error_handler_1.NotFoundError('Appointment not found');
            }
            if (appointment.status === appointment_model_1.AppointmentStatus.CANCELLED) {
                throw new error_handler_1.BadRequestError('Cannot reschedule a cancelled appointment');
            }
            if (appointment.status === appointment_model_1.AppointmentStatus.COMPLETED) {
                throw new error_handler_1.BadRequestError('Cannot reschedule a completed appointment');
            }
            // Validar nueva fecha
            const newScheduledDate = new Date(data.new_scheduled_at);
            if (isNaN(newScheduledDate.getTime())) {
                throw new error_handler_1.ValidationError('Invalid date format for new_scheduled_at');
            }
            if (newScheduledDate <= new Date()) {
                throw new error_handler_1.BadRequestError('Cannot reschedule appointments to the past');
            }
            // Verificar disponibilidad en la nueva fecha/hora
            const conflictingAppointment = await this.checkAvailability(appointment.professional_id, newScheduledDate, data.new_duration_minutes || appointment.duration_minutes, appointmentId);
            if (conflictingAppointment) {
                throw new error_handler_1.BadRequestError('Professional is not available at the requested time');
            }
            await this.appointmentRepository.update(appointmentId, {
                scheduled_at: newScheduledDate,
                duration_minutes: data.new_duration_minutes || appointment.duration_minutes,
                notes: data.reason ? `${appointment.notes || ''} - Rescheduled: ${data.reason}` : appointment.notes,
            });
            return await this.getAppointmentById(appointmentId);
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error rescheduling appointment');
        }
    }
    async confirmAppointment(appointmentId) {
        try {
            const appointment = await this.getAppointmentById(appointmentId);
            if (!appointment) {
                throw new error_handler_1.NotFoundError('Appointment not found');
            }
            if (appointment.status !== appointment_model_1.AppointmentStatus.SCHEDULED) {
                throw new error_handler_1.BadRequestError('Only scheduled appointments can be confirmed');
            }
            await this.appointmentRepository.update(appointmentId, {
                status: appointment_model_1.AppointmentStatus.CONFIRMED
            });
            return await this.getAppointmentById(appointmentId);
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error confirming appointment');
        }
    }
    async completeAppointment(appointmentId) {
        try {
            const appointment = await this.getAppointmentById(appointmentId);
            if (!appointment) {
                throw new error_handler_1.NotFoundError('Appointment not found');
            }
            if (appointment.status === appointment_model_1.AppointmentStatus.CANCELLED) {
                throw new error_handler_1.BadRequestError('Cannot complete a cancelled appointment');
            }
            await this.appointmentRepository.update(appointmentId, {
                status: appointment_model_1.AppointmentStatus.COMPLETED
            });
            return await this.getAppointmentById(appointmentId);
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error completing appointment');
        }
    }
    async deleteAppointment(appointmentId) {
        try {
            const result = await this.appointmentRepository.delete(appointmentId);
            return result.affected ? result.affected > 0 : false;
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error deleting appointment');
        }
    }
    async getUpcomingAppointments(userId, days = 7) {
        try {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + days);
            return await this.appointmentRepository.find({
                where: {
                    user_id: userId,
                    scheduled_at: (0, typeorm_1.Between)(startDate, endDate),
                    status: appointment_model_1.AppointmentStatus.SCHEDULED || appointment_model_1.AppointmentStatus.CONFIRMED
                },
                order: { scheduled_at: 'ASC' }
            });
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error fetching upcoming appointments');
        }
    }
    async checkAvailability(professionalId, scheduledAt, durationMinutes, excludeAppointmentId) {
        try {
            const endTime = new Date(scheduledAt.getTime() + durationMinutes * 60000);
            const queryBuilder = this.appointmentRepository.createQueryBuilder('appointment')
                .where('appointment.professional_id = :professionalId', { professionalId })
                .andWhere('appointment.status NOT IN (:...excludedStatuses)', {
                excludedStatuses: [appointment_model_1.AppointmentStatus.CANCELLED, appointment_model_1.AppointmentStatus.COMPLETED]
            })
                .andWhere('(appointment.scheduled_at < :endTime AND appointment.scheduled_at + appointment.duration_minutes * INTERVAL \'1 minute\' > :scheduledAt)', { scheduledAt, endTime });
            if (excludeAppointmentId) {
                queryBuilder.andWhere('appointment.appointment_id != :excludeAppointmentId', { excludeAppointmentId });
            }
            return await queryBuilder.getOne();
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error checking availability');
        }
    }
    /**
     * Crea un evento en Google Calendar para una cita
     */
    async createGoogleCalendarEvent(appointment) {
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
                logger_1.default.error('Missing required data for Google Calendar event creation');
                return null;
            }
            const startTime = new Date(appointment.scheduled_at);
            const endTime = new Date(startTime.getTime() + (appointment.duration_minutes * 60000));
            const calendarEvent = {
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
        }
        catch (error) {
            logger_1.default.error('Error creating Google Calendar event:', error);
            return null;
        }
    }
    /**
     * Actualiza un evento en Google Calendar
     */
    async updateGoogleCalendarEvent(appointment) {
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
            const updatedEvent = {
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
            await this.googleCalendarService.updateEvent(appointment.google_calendar_event_id, updatedEvent);
        }
        catch (error) {
            logger_1.default.error('Error updating Google Calendar event:', error);
        }
    }
    /**
     * Elimina un evento de Google Calendar
     */
    async deleteGoogleCalendarEvent(appointment) {
        if (!this.googleCalendarService || !appointment.google_calendar_event_id) {
            return;
        }
        try {
            await this.googleCalendarService.deleteEvent(appointment.google_calendar_event_id);
        }
        catch (error) {
            logger_1.default.error('Error deleting Google Calendar event:', error);
        }
    }
    /**
     * Configura Google Calendar para un usuario específico
     */
    async setupGoogleCalendar(userId, refreshToken) {
        try {
            // Aquí podrías guardar el refresh token del usuario en la base de datos
            // para usar su calendario personal
            logger_1.default.info(`Google Calendar configured for user ${userId}`);
        }
        catch (error) {
            logger_1.default.error('Error setting up Google Calendar:', error);
            throw new error_handler_1.InternalServerError('Error configuring Google Calendar');
        }
    }
    /**
     * Obtiene la URL de autorización de Google Calendar
     */
    getGoogleCalendarAuthUrl() {
        if (!this.googleCalendarService) {
            throw new error_handler_1.BadRequestError('Google Calendar service not available');
        }
        return this.googleCalendarService.getAuthUrl();
    }
}
exports.AppointmentService = AppointmentService;
