"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityExceptionService = void 0;
const database_1 = require("../../core/config/database");
const availability_exception_model_1 = require("../../models/availability-exception.model");
const professional_model_1 = require("../../models/professional.model");
class AvailabilityExceptionService {
    availabilityExceptionRepository;
    professionalRepository;
    constructor() {
        this.availabilityExceptionRepository = database_1.AppDataSource.getRepository(availability_exception_model_1.AvailabilityException);
        this.professionalRepository = database_1.AppDataSource.getRepository(professional_model_1.Professional);
    }
    async createAvailabilityException(exceptionData) {
        // Verify professional exists
        const professional = await this.professionalRepository.findOne({
            where: { professional_id: exceptionData.professional_id }
        });
        if (!professional) {
            throw new Error('Professional not found');
        }
        // Validate date format
        this.validateDateFormat(exceptionData.exception_date);
        // Validate time format if provided
        if (exceptionData.start_time) {
            this.validateTimeFormat(exceptionData.start_time);
        }
        if (exceptionData.end_time) {
            this.validateTimeFormat(exceptionData.end_time);
        }
        // Validate time range if both times are provided
        if (exceptionData.start_time && exceptionData.end_time) {
            this.validateTimeRange(exceptionData.start_time, exceptionData.end_time);
        }
        // Check for overlapping exceptions
        await this.checkForOverlappingExceptions(exceptionData.professional_id, exceptionData.exception_date, exceptionData.start_time, exceptionData.end_time, exceptionData.type);
        const exception = this.availabilityExceptionRepository.create({
            ...exceptionData,
            exception_date: new Date(exceptionData.exception_date)
        });
        const savedException = await this.availabilityExceptionRepository.save(exception);
        return this.mapToResponseDto(savedException);
    }
    async bulkCreateAvailabilityExceptions(bulkData) {
        // Verify professional exists
        const professional = await this.professionalRepository.findOne({
            where: { professional_id: bulkData.professional_id }
        });
        if (!professional) {
            throw new Error('Professional not found');
        }
        const createdExceptions = [];
        for (const exceptionData of bulkData.exceptions) {
            const fullExceptionData = {
                professional_id: bulkData.professional_id,
                ...exceptionData
            };
            try {
                const exception = await this.createAvailabilityException(fullExceptionData);
                createdExceptions.push(exception);
            }
            catch (error) {
                // Log error but continue with other exceptions
                console.error(`Failed to create exception for date ${exceptionData.exception_date}:`, error.message);
            }
        }
        return createdExceptions;
    }
    async getAllAvailabilityExceptions() {
        const exceptions = await this.availabilityExceptionRepository.find({
            order: { exception_date: 'ASC', start_time: 'ASC' }
        });
        return exceptions.map(exception => this.mapToResponseDto(exception));
    }
    async getAvailabilityExceptionById(exceptionId) {
        const exception = await this.availabilityExceptionRepository.findOne({
            where: { exception_id: exceptionId },
            relations: ['professional', 'professional.user'],
            select: {
                professional: {
                    professional_id: true,
                    license_number: true,
                    specialization: true,
                    user: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone: true,
                        birth_date: true,
                        gender: true,
                        address: true,
                        status: true,
                        path: true,
                        created_at: true,
                        updated_at: true
                    }
                }
            }
        });
        if (!exception) {
            return null;
        }
        return this.mapToWithProfessionalDto(exception);
    }
    async getAvailabilityExceptionsByProfessional(professionalId) {
        const exceptions = await this.availabilityExceptionRepository.find({
            where: { professional_id: professionalId },
            order: { exception_date: 'ASC', start_time: 'ASC' }
        });
        return exceptions.map(exception => this.mapToResponseDto(exception));
    }
    async getAvailabilityExceptionsByType(type) {
        const exceptions = await this.availabilityExceptionRepository.find({
            where: { type },
            relations: ['professional', 'professional.user'],
            select: {
                professional: {
                    professional_id: true,
                    license_number: true,
                    specialization: true,
                    user: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone: true,
                        birth_date: true,
                        gender: true,
                        address: true,
                        status: true,
                        path: true,
                        created_at: true,
                        updated_at: true
                    }
                }
            },
            order: { exception_date: 'ASC', start_time: 'ASC' }
        });
        return exceptions.map(exception => this.mapToWithProfessionalDto(exception));
    }
    async getAvailabilityExceptionsByDateRange(professionalId, startDate, endDate) {
        const exceptions = await this.availabilityExceptionRepository.find({
            where: {
                professional_id: professionalId,
                exception_date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            },
            order: { exception_date: 'ASC', start_time: 'ASC' }
        });
        return exceptions.map(exception => this.mapToResponseDto(exception));
    }
    async getAvailabilityExceptionsWithFilters(filters) {
        const queryBuilder = this.availabilityExceptionRepository.createQueryBuilder('exception');
        if (filters.professional_id) {
            queryBuilder.andWhere('exception.professional_id = :professionalId', {
                professionalId: filters.professional_id
            });
        }
        if (filters.type) {
            queryBuilder.andWhere('exception.type = :type', {
                type: filters.type
            });
        }
        if (filters.specific_date) {
            queryBuilder.andWhere('exception.exception_date = :specificDate', {
                specificDate: new Date(filters.specific_date)
            });
        }
        else {
            if (filters.date_from) {
                queryBuilder.andWhere('exception.exception_date >= :dateFrom', {
                    dateFrom: new Date(filters.date_from)
                });
            }
            if (filters.date_to) {
                queryBuilder.andWhere('exception.exception_date <= :dateTo', {
                    dateTo: new Date(filters.date_to)
                });
            }
        }
        queryBuilder.orderBy('exception.exception_date', 'ASC')
            .addOrderBy('exception.start_time', 'ASC');
        const exceptions = await queryBuilder.getMany();
        return exceptions.map(exception => this.mapToResponseDto(exception));
    }
    async updateAvailabilityException(exceptionId, updateData) {
        const existingException = await this.availabilityExceptionRepository.findOne({
            where: { exception_id: exceptionId }
        });
        if (!existingException) {
            return null;
        }
        // Validate date format if provided
        if (updateData.exception_date) {
            this.validateDateFormat(updateData.exception_date);
        }
        // Validate time format if provided
        if (updateData.start_time) {
            this.validateTimeFormat(updateData.start_time);
        }
        if (updateData.end_time) {
            this.validateTimeFormat(updateData.end_time);
        }
        // Validate time range if both times are being updated
        if (updateData.start_time || updateData.end_time) {
            const startTime = updateData.start_time || existingException.start_time;
            const endTime = updateData.end_time || existingException.end_time;
            if (startTime && endTime) {
                this.validateTimeRange(startTime, endTime);
            }
        }
        // Check for overlapping exceptions if relevant fields are being updated
        if (updateData.exception_date || updateData.start_time !== undefined ||
            updateData.end_time !== undefined || updateData.type) {
            await this.checkForOverlappingExceptions(existingException.professional_id, updateData.exception_date || existingException.exception_date.toISOString().split('T')[0], updateData.start_time !== undefined ? updateData.start_time : existingException.start_time, updateData.end_time !== undefined ? updateData.end_time : existingException.end_time, updateData.type || existingException.type, exceptionId);
        }
        const updatePayload = { ...updateData };
        if (updateData.exception_date) {
            updatePayload.exception_date = new Date(updateData.exception_date);
        }
        await this.availabilityExceptionRepository.update(exceptionId, updatePayload);
        const updatedException = await this.availabilityExceptionRepository.findOne({
            where: { exception_id: exceptionId }
        });
        return updatedException ? this.mapToResponseDto(updatedException) : null;
    }
    async deleteAvailabilityException(exceptionId) {
        const result = await this.availabilityExceptionRepository.delete(exceptionId);
        return result.affected ? result.affected > 0 : false;
    }
    async deleteAvailabilityExceptionsByProfessional(professionalId) {
        const result = await this.availabilityExceptionRepository.delete({ professional_id: professionalId });
        return result.affected || 0;
    }
    async deleteAvailabilityExceptionsByDateRange(professionalId, startDate, endDate) {
        const queryBuilder = this.availabilityExceptionRepository.createQueryBuilder()
            .delete()
            .where('professional_id = :professionalId', { professionalId })
            .andWhere('exception_date >= :startDate', { startDate: new Date(startDate) })
            .andWhere('exception_date <= :endDate', { endDate: new Date(endDate) });
        const result = await queryBuilder.execute();
        return result.affected || 0;
    }
    // Helper methods
    validateDateFormat(date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            throw new Error(`Invalid date format: ${date}. Expected format: YYYY-MM-DD`);
        }
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            throw new Error(`Invalid date: ${date}`);
        }
    }
    validateTimeFormat(time) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(time)) {
            throw new Error(`Invalid time format: ${time}. Expected format: HH:MM`);
        }
    }
    validateTimeRange(startTime, endTime) {
        const start = new Date(`1970-01-01T${startTime}:00`);
        const end = new Date(`1970-01-01T${endTime}:00`);
        if (start >= end) {
            throw new Error('Start time must be before end time');
        }
    }
    async checkForOverlappingExceptions(professionalId, exceptionDate, startTime, endTime, type, excludeExceptionId) {
        const queryBuilder = this.availabilityExceptionRepository.createQueryBuilder('exception')
            .where('exception.professional_id = :professionalId', { professionalId })
            .andWhere('exception.exception_date = :exceptionDate', {
            exceptionDate: new Date(exceptionDate)
        });
        if (excludeExceptionId) {
            queryBuilder.andWhere('exception.exception_id != :excludeExceptionId', { excludeExceptionId });
        }
        // Check time overlaps only if both start and end times are provided
        if (startTime && endTime) {
            queryBuilder.andWhere('((exception.start_time IS NULL AND exception.end_time IS NULL) OR ' +
                '(exception.start_time IS NOT NULL AND exception.end_time IS NOT NULL AND ' +
                'exception.start_time < :endTime AND exception.end_time > :startTime))', { startTime, endTime });
        }
        // For certain types, we might want to allow overlaps (e.g., breaks within unavailable periods)
        if (type === availability_exception_model_1.ExceptionType.BREAK) {
            // Breaks can overlap with unavailable periods, so we check for other breaks only
            queryBuilder.andWhere('exception.type = :type', { type: availability_exception_model_1.ExceptionType.BREAK });
        }
        const overlappingExceptions = await queryBuilder.getMany();
        if (overlappingExceptions.length > 0) {
            const overlappingType = overlappingExceptions[0].type;
            throw new Error(`Exception overlaps with existing ${overlappingType} exception for this professional on the same date`);
        }
    }
    mapToResponseDto(exception) {
        return {
            exception_id: exception.exception_id,
            professional_id: exception.professional_id,
            exception_date: exception.exception_date.toISOString().split('T')[0],
            start_time: exception.start_time,
            end_time: exception.end_time,
            type: exception.type,
            reason: exception.reason,
            created_at: exception.created_at.toISOString()
        };
    }
    mapToWithProfessionalDto(exception) {
        return {
            ...this.mapToResponseDto(exception),
            professional: {
                professional_id: exception.professional.professional_id,
                license_number: exception.professional.license_number,
                specialization: exception.professional.specialization || "",
                user: {
                    user_id: exception.professional.user.id,
                    first_name: exception.professional.user.first_name,
                    last_name: exception.professional.user.last_name,
                    email: exception.professional.user.email,
                    phone: exception.professional.user.phone
                }
            }
        };
    }
}
exports.AvailabilityExceptionService = AvailabilityExceptionService;
