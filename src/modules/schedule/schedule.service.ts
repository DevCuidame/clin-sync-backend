import { AppDataSource } from '../../core/config/database';
import { Schedule, DayOfWeek } from '../../models/schedule.model';
import { Professional } from '../../models/professional.model';
import { 
  CreateScheduleDto, 
  UpdateScheduleDto, 
  ScheduleResponseDto, 
  ScheduleWithProfessionalDto,
  ScheduleFilterDto 
} from './schedule.interface';
import { Repository } from 'typeorm';

export class ScheduleService {
  private scheduleRepository: Repository<Schedule>;
  private professionalRepository: Repository<Professional>;

  constructor() {
    this.scheduleRepository = AppDataSource.getRepository(Schedule);
    this.professionalRepository = AppDataSource.getRepository(Professional);
  }

  async createSchedule(scheduleData: CreateScheduleDto): Promise<ScheduleResponseDto> {
    // Verify professional exists
    const professional = await this.professionalRepository.findOne({
      where: { professional_id: scheduleData.professional_id }
    });

    if (!professional) {
      throw new Error('Professional not found');
    }

    // Validate time format and logic
    this.validateTimeFormat(scheduleData.start_time);
    this.validateTimeFormat(scheduleData.end_time);
    this.validateTimeRange(scheduleData.start_time, scheduleData.end_time);

    // Validate break times if break is enabled
    if (scheduleData.has_break) {
      this.validateBreakTimes(scheduleData);
    }

    // Check for overlapping schedules
    await this.checkForOverlappingSchedules(
      scheduleData.professional_id,
      scheduleData.day_of_week,
      scheduleData.start_time,
      scheduleData.end_time,
      scheduleData.valid_from,
      scheduleData.valid_until
    );

    const schedule = this.scheduleRepository.create({
      ...scheduleData,
      valid_from: scheduleData.valid_from ? new Date(scheduleData.valid_from) : undefined,
      valid_until: scheduleData.valid_until ? new Date(scheduleData.valid_until) : undefined
    });

    const savedSchedule = await this.scheduleRepository.save(schedule);
    return this.mapToResponseDto(savedSchedule);
  }

  async createMultipleSchedules(schedulesData: CreateScheduleDto[]): Promise<{
    success: ScheduleResponseDto[];
    errors: { index: number; error: string; data: CreateScheduleDto }[];
  }> {
    const results: ScheduleResponseDto[] = [];
    const errors: { index: number; error: string; data: CreateScheduleDto }[] = [];

    for (let i = 0; i < schedulesData.length; i++) {
      try {
        const schedule = await this.createSchedule(schedulesData[i]);
        results.push(schedule);
      } catch (error: any) {
        errors.push({
          index: i,
          error: error.message || 'Unknown error',
          data: schedulesData[i]
        });
      }
    }

    return {
      success: results,
      errors: errors
    };
  }

  async getAllSchedules(): Promise<ScheduleResponseDto[]> {
    const schedules = await this.scheduleRepository.find({
      order: { day_of_week: 'ASC', start_time: 'ASC' }
    });
    return schedules.map(schedule => this.mapToResponseDto(schedule));
  }

  async getScheduleById(scheduleId: number): Promise<ScheduleWithProfessionalDto | null> {
    const schedule = await this.scheduleRepository.findOne({
      where: { schedule_id: scheduleId },
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

    if (!schedule) {
      return null;
    }

    return this.mapToWithProfessionalDto(schedule);
  }

  async getSchedulesByProfessional(professionalId: number): Promise<ScheduleResponseDto[]> {
    const schedules = await this.scheduleRepository.find({
      where: { professional_id: professionalId },
      order: { day_of_week: 'ASC', start_time: 'ASC' }
    });
    return schedules.map(schedule => this.mapToResponseDto(schedule));
  }

  async getActiveSchedulesByProfessional(professionalId: number): Promise<ScheduleResponseDto[]> {
    const schedules = await this.scheduleRepository.find({
      where: { 
        professional_id: professionalId,
        is_active: true
      },
      order: { day_of_week: 'ASC', start_time: 'ASC' }
    });
    return schedules.map(schedule => this.mapToResponseDto(schedule));
  }

  async getSchedulesByDay(dayOfWeek: DayOfWeek): Promise<ScheduleWithProfessionalDto[]> {
    const schedules = await this.scheduleRepository.find({
      where: { 
        day_of_week: dayOfWeek,
        is_active: true
      },
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
      order: { start_time: 'ASC' }
    });
    return schedules.map(schedule => this.mapToWithProfessionalDto(schedule));
  }

  async getSchedulesWithFilters(filters: ScheduleFilterDto): Promise<ScheduleResponseDto[]> {
    const queryBuilder = this.scheduleRepository.createQueryBuilder('schedule');

    // Handle user_id filter by finding the corresponding professional_id
    if (filters.user_id) {
      const professional = await this.professionalRepository.findOne({
        where: { user_id: filters.user_id }
      });
      
      if (!professional) {
        // If no professional found for this user_id, return empty array
        return [];
      }
      
      queryBuilder.andWhere('schedule.professional_id = :professionalId', {
        professionalId: professional.professional_id
      });
    } else if (filters.professional_id) {
      queryBuilder.andWhere('schedule.professional_id = :professionalId', {
        professionalId: filters.professional_id
      });
    }

    if (filters.day_of_week) {
      queryBuilder.andWhere('schedule.day_of_week = :dayOfWeek', {
        dayOfWeek: filters.day_of_week
      });
    }

    if (filters.is_active !== undefined) {
      queryBuilder.andWhere('schedule.is_active = :isActive', {
        isActive: filters.is_active
      });
    }

    if (filters.valid_date) {
      const validDate = new Date(filters.valid_date);
      queryBuilder.andWhere(
        '(schedule.valid_from IS NULL OR schedule.valid_from <= :validDate) AND ' +
        '(schedule.valid_until IS NULL OR schedule.valid_until >= :validDate)',
        { validDate }
      );
    }

    queryBuilder.orderBy('schedule.day_of_week', 'ASC')
                .addOrderBy('schedule.start_time', 'ASC');

    const schedules = await queryBuilder.getMany();
    return schedules.map(schedule => this.mapToResponseDto(schedule));
  }

  async updateSchedule(scheduleId: number, updateData: UpdateScheduleDto): Promise<ScheduleResponseDto | null> {
    const existingSchedule = await this.scheduleRepository.findOne({
      where: { schedule_id: scheduleId }
    });

    if (!existingSchedule) {
      return null;
    }

    // Validate time format and logic if times are being updated
    if (updateData.start_time) {
      this.validateTimeFormat(updateData.start_time);
    }
    if (updateData.end_time) {
      this.validateTimeFormat(updateData.end_time);
    }
    if (updateData.start_time || updateData.end_time) {
      const startTime = updateData.start_time || existingSchedule.start_time;
      const endTime = updateData.end_time || existingSchedule.end_time;
      this.validateTimeRange(startTime, endTime);
    }

    // Validate break times if break is being enabled or modified
    if (updateData.has_break === true || 
        (existingSchedule.has_break && 
         (updateData.break_start_time || updateData.break_end_time))) {
      
      // Prepare data for validation with existing values as fallbacks
      const breakValidationData = {
        ...updateData,
        start_time: updateData.start_time || existingSchedule.start_time,
        end_time: updateData.end_time || existingSchedule.end_time,
        break_start_time: updateData.break_start_time || existingSchedule.break_start_time,
        break_end_time: updateData.break_end_time || existingSchedule.break_end_time
      };
      
      this.validateBreakTimes(breakValidationData);
    }

    // Check for overlapping schedules if relevant fields are being updated
    if (updateData.day_of_week || updateData.start_time || updateData.end_time || 
        updateData.valid_from !== undefined || updateData.valid_until !== undefined) {
      await this.checkForOverlappingSchedules(
        existingSchedule.professional_id,
        updateData.day_of_week || existingSchedule.day_of_week,
        updateData.start_time || existingSchedule.start_time,
        updateData.end_time || existingSchedule.end_time,
        updateData.valid_from !== undefined ? updateData.valid_from : 
          (existingSchedule.valid_from ? existingSchedule.valid_from.toISOString().split('T')[0] : undefined),
        updateData.valid_until !== undefined ? updateData.valid_until : 
          (existingSchedule.valid_until ? existingSchedule.valid_until.toISOString().split('T')[0] : undefined),
        scheduleId
      );
    }

    const updatePayload: any = { ...updateData };
    if (updateData.valid_from !== undefined) {
      updatePayload.valid_from = updateData.valid_from ? new Date(updateData.valid_from) : null;
    }
    if (updateData.valid_until !== undefined) {
      updatePayload.valid_until = updateData.valid_until ? new Date(updateData.valid_until) : null;
    }

    await this.scheduleRepository.update(scheduleId, updatePayload);
    
    const updatedSchedule = await this.scheduleRepository.findOne({
      where: { schedule_id: scheduleId }
    });
    
    return updatedSchedule ? this.mapToResponseDto(updatedSchedule) : null;
  }

  async deleteSchedule(scheduleId: number): Promise<boolean> {
    const result = await this.scheduleRepository.delete(scheduleId);
    return result.affected ? result.affected > 0 : false;
  }

  async toggleScheduleStatus(scheduleId: number): Promise<ScheduleResponseDto | null> {
    const schedule = await this.scheduleRepository.findOne({
      where: { schedule_id: scheduleId }
    });

    if (!schedule) {
      return null;
    }

    schedule.is_active = !schedule.is_active;
    const updatedSchedule = await this.scheduleRepository.save(schedule);
    return this.mapToResponseDto(updatedSchedule);
  }

  // Helper methods
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

  private validateBreakTimes(scheduleData: CreateScheduleDto | UpdateScheduleDto): void {
    if (!scheduleData.break_start_time || !scheduleData.break_end_time) {
      throw new Error('Break start time and end time are required when has_break is true');
    }

    // Validate break time format
    this.validateTimeFormat(scheduleData.break_start_time);
    this.validateTimeFormat(scheduleData.break_end_time);

    // Validate break time range
    this.validateTimeRange(scheduleData.break_start_time, scheduleData.break_end_time);

    // Get schedule times (for update operations, we need to handle existing values)
    const scheduleStart = (scheduleData as any).start_time;
    const scheduleEnd = (scheduleData as any).end_time;

    if (scheduleStart && scheduleEnd) {
      // Validate that break is within schedule hours
      const scheduleStartTime = new Date(`1970-01-01T${scheduleStart}:00`);
      const scheduleEndTime = new Date(`1970-01-01T${scheduleEnd}:00`);
      const breakStartTime = new Date(`1970-01-01T${scheduleData.break_start_time}:00`);
      const breakEndTime = new Date(`1970-01-01T${scheduleData.break_end_time}:00`);

      if (breakStartTime < scheduleStartTime || breakEndTime > scheduleEndTime) {
        throw new Error('Break time must be within schedule hours');
      }
    }
  }

  private async checkForOverlappingSchedules(
    professionalId: number,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    validFrom?: string,
    validUntil?: string,
    excludeScheduleId?: number
  ): Promise<void> {
    const queryBuilder = this.scheduleRepository.createQueryBuilder('schedule')
      .where('schedule.professional_id = :professionalId', { professionalId })
      .andWhere('schedule.day_of_week = :dayOfWeek', { dayOfWeek })
      .andWhere('schedule.is_active = true')
      .andWhere(
        '(schedule.start_time < :endTime AND schedule.end_time > :startTime)',
        { startTime, endTime }
      );

    if (excludeScheduleId) {
      queryBuilder.andWhere('schedule.schedule_id != :excludeScheduleId', { excludeScheduleId });
    }

    // Check date range overlaps
    if (validFrom || validUntil) {
      let dateCondition = '';
      const params: any = {};

      if (validFrom && validUntil) {
        dateCondition = '(schedule.valid_from IS NULL OR schedule.valid_from <= :validUntil) AND ' +
                       '(schedule.valid_until IS NULL OR schedule.valid_until >= :validFrom)';
        params.validFrom = validFrom;
        params.validUntil = validUntil;
      } else if (validFrom) {
        dateCondition = 'schedule.valid_until IS NULL OR schedule.valid_until >= :validFrom';
        params.validFrom = validFrom;
      } else if (validUntil) {
        dateCondition = 'schedule.valid_from IS NULL OR schedule.valid_from <= :validUntil';
        params.validUntil = validUntil;
      }

      if (dateCondition) {
        queryBuilder.andWhere(`(${dateCondition})`, params);
      }
    }

    const overlappingSchedules = await queryBuilder.getMany();
    
    if (overlappingSchedules.length > 0) {
      throw new Error('Schedule overlaps with existing schedule for this professional');
    }
  }

  private mapToResponseDto(schedule: Schedule): ScheduleResponseDto {
    return {
      schedule_id: schedule.schedule_id,
      professional_id: schedule.professional_id,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      is_active: schedule.is_active,
      valid_from: schedule.valid_from ? schedule.valid_from.toISOString().split('T')[0] : undefined,
      valid_until: schedule.valid_until ? schedule.valid_until.toISOString().split('T')[0] : undefined,
      // Campos de descanso
      has_break: schedule.has_break || false,
      break_start_time: schedule.break_start_time,
      break_end_time: schedule.break_end_time,
      break_description: schedule.break_description,
      created_at: schedule.created_at.toISOString()
    };
  }

  private mapToWithProfessionalDto(schedule: Schedule): ScheduleWithProfessionalDto {
    return {
      ...this.mapToResponseDto(schedule),
      professional: {
        professional_id: schedule.professional.professional_id,
        license_number: schedule.professional.license_number,
        specialization: schedule.professional.specialization || '',
        user: {
          user_id: schedule.professional.user.id,
          first_name: schedule.professional.user.first_name,
          last_name: schedule.professional.user.last_name,
          email: schedule.professional.user.email,
          phone: schedule.professional.user.phone
        }
      }
    };
  }
}