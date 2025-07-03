import { AppDataSource } from '../../core/config/database';
import { AvailabilityException, ExceptionType } from '../../models/availability-exception.model';
import { Professional } from '../../models/professional.model';
import { 
  CreateAvailabilityExceptionDto, 
  UpdateAvailabilityExceptionDto, 
  AvailabilityExceptionResponseDto, 
  AvailabilityExceptionWithProfessionalDto,
  AvailabilityExceptionFilterDto,
  BulkCreateAvailabilityExceptionDto
} from './availability-exception.interface';
import { Repository } from 'typeorm';
import { createLocalDate } from '../../utils/date-format';

export class AvailabilityExceptionService {
  private availabilityExceptionRepository: Repository<AvailabilityException>;
  private professionalRepository: Repository<Professional>;

  constructor() {
    this.availabilityExceptionRepository = AppDataSource.getRepository(AvailabilityException);
    this.professionalRepository = AppDataSource.getRepository(Professional);
  }

  async createAvailabilityException(exceptionData: CreateAvailabilityExceptionDto): Promise<AvailabilityExceptionResponseDto> {
    // Verify professional exists - if professional_id is actually user_id, find by user_id
    let professional = await this.professionalRepository.findOne({
      where: { professional_id: exceptionData.professional_id }
    });

    // If not found by professional_id, try to find by user_id (frontend might send user_id)
    if (!professional) {
      professional = await this.professionalRepository.findOne({
        where: { user_id: exceptionData.professional_id }
      });
    }

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
    await this.checkForOverlappingExceptions(
      professional.professional_id,
      exceptionData.exception_date,
      exceptionData.start_time,
      exceptionData.end_time,
      exceptionData.type
    );

    const exception = this.availabilityExceptionRepository.create({
      ...exceptionData,
      professional_id: professional.professional_id,
      exception_date: createLocalDate(exceptionData.exception_date)
    });

    const savedException = await this.availabilityExceptionRepository.save(exception);
    return this.mapToResponseDto(savedException);
  }

  async bulkCreateAvailabilityExceptions(bulkData: BulkCreateAvailabilityExceptionDto): Promise<AvailabilityExceptionResponseDto[]> {
    // Verify professional exists - if professional_id is actually user_id, find by user_id
    let professional = await this.professionalRepository.findOne({
      where: { professional_id: bulkData.professional_id }
    });

    // If not found by professional_id, try to find by user_id (frontend might send user_id)
    if (!professional) {
      professional = await this.professionalRepository.findOne({
        where: { user_id: bulkData.professional_id }
      });
    }

    if (!professional) {
      throw new Error('Professional not found');
    }

    const createdExceptions: AvailabilityExceptionResponseDto[] = [];

    for (const exceptionData of bulkData.exceptions) {
      const fullExceptionData: CreateAvailabilityExceptionDto = {
        professional_id: professional.professional_id,
        ...exceptionData
      };

      try {
        const exception = await this.createAvailabilityException(fullExceptionData);
        createdExceptions.push(exception);
      } catch (error: any) {
        // Log error but continue with other exceptions
        console.error(`Failed to create exception for date ${exceptionData.exception_date}:`, error.message);
      }
    }

    return createdExceptions;
  }

  async getAllAvailabilityExceptions(): Promise<AvailabilityExceptionResponseDto[]> {
    const exceptions = await this.availabilityExceptionRepository.find({
      order: { exception_date: 'ASC', start_time: 'ASC' }
    });
    return exceptions.map(exception => this.mapToResponseDto(exception));
  }

  async getAvailabilityExceptionById(exceptionId: number): Promise<AvailabilityExceptionWithProfessionalDto | null> {
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

  async getAvailabilityExceptionsByProfessional(professionalId: number): Promise<AvailabilityExceptionResponseDto[]> {
    // First, verify if professionalId is actually a user_id
    let actualProfessionalId = professionalId;
    
    const professional = await this.professionalRepository.findOne({
      where: { user_id: professionalId }
    });
    
    if (professional) {
      actualProfessionalId = professional.professional_id;
    }

    const exceptions = await this.availabilityExceptionRepository.find({
      where: { professional_id: actualProfessionalId },
      order: { exception_date: 'ASC', start_time: 'ASC' }
    });
    return exceptions.map(exception => this.mapToResponseDto(exception));
  }

  async getAvailabilityExceptionsByType(type: ExceptionType): Promise<AvailabilityExceptionWithProfessionalDto[]> {
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

  async getAvailabilityExceptionsByDateRange(
    professionalId: number, 
    startDate: string, 
    endDate: string
  ): Promise<AvailabilityExceptionResponseDto[]> {
    // First, verify if professionalId is actually a user_id
    let actualProfessionalId = professionalId;
    
    const professional = await this.professionalRepository.findOne({
      where: { user_id: professionalId }
    });
    
    if (professional) {
      actualProfessionalId = professional.professional_id;
    }

    const exceptions = await this.availabilityExceptionRepository.find({
      where: {
        professional_id: actualProfessionalId,
        exception_date: {
          $gte: createLocalDate(startDate),
          $lte: createLocalDate(endDate)
        } as any
      },
      order: { exception_date: 'ASC', start_time: 'ASC' }
    });
    return exceptions.map(exception => this.mapToResponseDto(exception));
  }

  async getAvailabilityExceptionsWithFilters(filters: AvailabilityExceptionFilterDto): Promise<AvailabilityExceptionResponseDto[]> {
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
        specificDate: createLocalDate(filters.specific_date)
      });
    } else {
      if (filters.date_from) {
        queryBuilder.andWhere('exception.exception_date >= :dateFrom', {
          dateFrom: createLocalDate(filters.date_from)
        });
      }

      if (filters.date_to) {
        queryBuilder.andWhere('exception.exception_date <= :dateTo', {
          dateTo: createLocalDate(filters.date_to)
        });
      }
    }

    queryBuilder.orderBy('exception.exception_date', 'ASC')
                .addOrderBy('exception.start_time', 'ASC');

    const exceptions = await queryBuilder.getMany();
    return exceptions.map(exception => this.mapToResponseDto(exception));
  }

  async updateAvailabilityException(
    exceptionId: number, 
    updateData: UpdateAvailabilityExceptionDto
  ): Promise<AvailabilityExceptionResponseDto | null> {
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
      await this.checkForOverlappingExceptions(
        existingException.professional_id,
        updateData.exception_date || existingException.exception_date.toISOString().split('T')[0],
        updateData.start_time !== undefined ? updateData.start_time : existingException.start_time,
        updateData.end_time !== undefined ? updateData.end_time : existingException.end_time,
        updateData.type || existingException.type,
        exceptionId
      );
    }

    const updatePayload: any = { ...updateData };
    if (updateData.exception_date) {
      updatePayload.exception_date = createLocalDate(updateData.exception_date);
    }

    await this.availabilityExceptionRepository.update(exceptionId, updatePayload);
    
    const updatedException = await this.availabilityExceptionRepository.findOne({
      where: { exception_id: exceptionId }
    });
    
    return updatedException ? this.mapToResponseDto(updatedException) : null;
  }

  async deleteAvailabilityException(exceptionId: number): Promise<boolean> {
    const result = await this.availabilityExceptionRepository.delete(exceptionId);
    return result.affected ? result.affected > 0 : false;
  }

  async deleteAvailabilityExceptionsByProfessional(professionalId: number): Promise<number> {
    const result = await this.availabilityExceptionRepository.delete({ professional_id: professionalId });
    return result.affected || 0;
  }

  async deleteAvailabilityExceptionsByDateRange(
    professionalId: number, 
    startDate: string, 
    endDate: string
  ): Promise<number> {
    const queryBuilder = this.availabilityExceptionRepository.createQueryBuilder()
      .delete()
      .where('professional_id = :professionalId', { professionalId })
      .andWhere('exception_date >= :startDate', { startDate: createLocalDate(startDate) })
      .andWhere('exception_date <= :endDate', { endDate: createLocalDate(endDate) });

    const result = await queryBuilder.execute();
    return result.affected || 0;
  }

  // Helper methods
  private validateDateFormat(date: string): void {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new Error(`Invalid date format: ${date}. Expected format: YYYY-MM-DD`);
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }
  }

  private validateTimeFormat(time: string): void {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      throw new Error(`Invalid time format: ${time}. Expected format: HH:MM`);
    }
  }

  private validateTimeRange(startTime: string, endTime: string): void {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    
    if (start >= end) {
      throw new Error('Start time must be before end time');
    }
  }

  private async checkForOverlappingExceptions(
    professionalId: number,
    exceptionDate: string,
    startTime?: string,
    endTime?: string,
    type?: ExceptionType,
    excludeExceptionId?: number
  ): Promise<void> {
    const queryBuilder = this.availabilityExceptionRepository.createQueryBuilder('exception')
      .where('exception.professional_id = :professionalId', { professionalId })
      .andWhere('exception.exception_date = :exceptionDate', { 
        exceptionDate: createLocalDate(exceptionDate) 
      });

    if (excludeExceptionId) {
      queryBuilder.andWhere('exception.exception_id != :excludeExceptionId', { excludeExceptionId });
    }

    // Check time overlaps only if both start and end times are provided
    if (startTime && endTime) {
      queryBuilder.andWhere(
        '((exception.start_time IS NULL AND exception.end_time IS NULL) OR ' +
        '(exception.start_time IS NOT NULL AND exception.end_time IS NOT NULL AND ' +
        'exception.start_time < :endTime AND exception.end_time > :startTime))',
        { startTime, endTime }
      );
    }

    // For certain types, we might want to allow overlaps (e.g., breaks within unavailable periods)
    if (type === ExceptionType.BREAK) {
      // Breaks can overlap with unavailable periods, so we check for other breaks only
      queryBuilder.andWhere('exception.type = :type', { type: ExceptionType.BREAK });
    }

    const overlappingExceptions = await queryBuilder.getMany();
    
    if (overlappingExceptions.length > 0) {
      const overlappingType = overlappingExceptions[0].type;
      throw new Error(
        `Exception overlaps with existing ${overlappingType} exception for this professional on the same date`
      );
    }
  }

  private mapToResponseDto(exception: AvailabilityException): AvailabilityExceptionResponseDto {
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

  private mapToWithProfessionalDto(exception: AvailabilityException): AvailabilityExceptionWithProfessionalDto {
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