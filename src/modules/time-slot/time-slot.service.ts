import { Repository, Between, In } from 'typeorm';
import { AppDataSource } from '../../core/config/database';
import { TimeSlot, SlotStatus } from '../../models/time-slot.model';
import { Professional } from '../../models/professional.model';
import {
  CreateTimeSlotDto,
  UpdateTimeSlotDto,
  TimeSlotResponseDto,
  TimeSlotWithProfessionalDto,
  TimeSlotFilterDto,
  BulkCreateTimeSlotsDto
} from './time-slot.interface';

export class TimeSlotService {
  private timeSlotRepository: Repository<TimeSlot>;
  private professionalRepository: Repository<Professional>;

  constructor() {
    this.timeSlotRepository = AppDataSource.getRepository(TimeSlot);
    this.professionalRepository = AppDataSource.getRepository(Professional);
  }

  async createTimeSlot(timeSlotData: CreateTimeSlotDto): Promise<TimeSlotResponseDto> {
    // Verify professional exists
    const professional = await this.professionalRepository.findOne({
      where: { professional_id: timeSlotData.professional_id }
    });

    if (!professional) {
      throw new Error('Professional not found');
    }

    // Validate time format and logic
    this.validateTimeFormat(timeSlotData.start_time);
    this.validateTimeFormat(timeSlotData.end_time);
    this.validateTimeRange(timeSlotData.start_time, timeSlotData.end_time);
    this.validateDate(timeSlotData.slot_date);

    // Check for overlapping time slots
    await this.checkForOverlappingSlots(
      timeSlotData.professional_id,
      timeSlotData.slot_date,
      timeSlotData.start_time,
      timeSlotData.end_time
    );

    const timeSlot = this.timeSlotRepository.create({
      ...timeSlotData,
      slot_date: new Date(timeSlotData.slot_date),
      status: (timeSlotData.status as SlotStatus) || SlotStatus.AVAILABLE,
      max_bookings: timeSlotData.max_bookings || 1,
      current_bookings: 0
    });

    const savedTimeSlot = await this.timeSlotRepository.save(timeSlot);
    return this.formatTimeSlotResponse(savedTimeSlot);
  }

  async getTimeSlotsByProfessional(
    professionalId: number,
    filters: TimeSlotFilterDto = {}
  ): Promise<TimeSlotResponseDto[]> {
    const queryBuilder = this.timeSlotRepository
      .createQueryBuilder('timeSlot')
      .where('timeSlot.professional_id = :professionalId', { professionalId });

    // Apply date filters
    if (filters.start_date) {
      queryBuilder.andWhere('timeSlot.slot_date >= :startDate', {
        startDate: filters.start_date
      });
    }

    if (filters.end_date) {
      queryBuilder.andWhere('timeSlot.slot_date <= :endDate', {
        endDate: filters.end_date
      });
    }

    // Apply status filter
    if (filters.status) {
      queryBuilder.andWhere('timeSlot.status = :status', {
        status: filters.status
      });
    }

    // Filter only available slots
    if (filters.available_only) {
      queryBuilder.andWhere('timeSlot.status = :availableStatus', {
        availableStatus: SlotStatus.AVAILABLE
      });
      queryBuilder.andWhere('timeSlot.current_bookings < timeSlot.max_bookings');
    }

    // Apply pagination
    if (filters.page && filters.limit) {
      const skip = (filters.page - 1) * filters.limit;
      queryBuilder.skip(skip).take(filters.limit);
    }

    // Order by date and time
    queryBuilder.orderBy('timeSlot.slot_date', 'ASC')
      .addOrderBy('timeSlot.start_time', 'ASC');

    const timeSlots = await queryBuilder.getMany();
    return timeSlots.map(slot => this.formatTimeSlotResponse(slot));
  }

  async getTimeSlotById(slotId: number): Promise<TimeSlotResponseDto | null> {
    const timeSlot = await this.timeSlotRepository.findOne({
      where: { slot_id: slotId }
    });

    if (!timeSlot) {
      return null;
    }

    return this.formatTimeSlotResponse(timeSlot);
  }

  async getTimeSlotWithProfessional(slotId: number): Promise<TimeSlotWithProfessionalDto | null> {
    const timeSlot = await this.timeSlotRepository.findOne({
      where: { slot_id: slotId },
      relations: ['professional', 'professional.user']
    });

    if (!timeSlot) {
      return null;
    }

    return {
      ...this.formatTimeSlotResponse(timeSlot),
      professional: {
        professional_id: timeSlot.professional.professional_id,
        first_name: timeSlot.professional.user.first_name,
        last_name: timeSlot.professional.user.last_name,
        email: timeSlot.professional.user.email,
        specialization: timeSlot.professional.specialization
      }
    };
  }

  async updateTimeSlot(slotId: number, updateData: UpdateTimeSlotDto): Promise<TimeSlotResponseDto> {
    const timeSlot = await this.timeSlotRepository.findOne({
      where: { slot_id: slotId }
    });

    if (!timeSlot) {
      throw new Error('Time slot not found');
    }

    // Validate time format if provided
    if (updateData.start_time) {
      this.validateTimeFormat(updateData.start_time);
    }
    if (updateData.end_time) {
      this.validateTimeFormat(updateData.end_time);
    }
    if (updateData.slot_date) {
      this.validateDate(updateData.slot_date);
    }

    // Validate time range if both times are provided
    const startTime = updateData.start_time || timeSlot.start_time;
    const endTime = updateData.end_time || timeSlot.end_time;
    this.validateTimeRange(startTime, endTime);

    // Check for overlapping slots if time or date is being changed
    if (updateData.start_time || updateData.end_time || updateData.slot_date) {
      const currentSlotDate = timeSlot.slot_date instanceof Date 
        ? timeSlot.slot_date 
        : new Date(timeSlot.slot_date);
      const slotDate = updateData.slot_date || currentSlotDate.toISOString().split('T')[0];
      await this.checkForOverlappingSlots(
        timeSlot.professional_id,
        slotDate,
        startTime,
        endTime,
        slotId
      );
    }

    // Update the time slot
    Object.assign(timeSlot, {
      ...updateData,
      slot_date: updateData.slot_date ? new Date(updateData.slot_date) : timeSlot.slot_date,
      status: updateData.status ? (updateData.status as SlotStatus) : timeSlot.status
    });

    const updatedTimeSlot = await this.timeSlotRepository.save(timeSlot);
    return this.formatTimeSlotResponse(updatedTimeSlot);
  }

  async deleteTimeSlot(slotId: number): Promise<boolean> {
    const result = await this.timeSlotRepository.delete(slotId);
    return result.affected ? result.affected > 0 : false;
  }

  async bulkCreateTimeSlots(bulkData: BulkCreateTimeSlotsDto): Promise<TimeSlotResponseDto[]> {
    // Verify professional exists
    const professional = await this.professionalRepository.findOne({
      where: { professional_id: bulkData.professional_id }
    });

    if (!professional) {
      throw new Error('Professional not found');
    }

    // Validate input data
    this.validateTimeFormat(bulkData.start_time);
    this.validateTimeFormat(bulkData.end_time);
    this.validateTimeRange(bulkData.start_time, bulkData.end_time);
    this.validateDate(bulkData.start_date);
    this.validateDate(bulkData.end_date);

    const startDate = new Date(bulkData.start_date);
    const endDate = new Date(bulkData.end_date);

    if (startDate > endDate) {
      throw new Error('Start date must be before or equal to end date');
    }

    const timeSlots: TimeSlot[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      // Check if this day should be included
      if (!bulkData.days_of_week || bulkData.days_of_week.includes(dayOfWeek)) {
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Check if this date should be excluded
        if (!bulkData.exclude_dates || !bulkData.exclude_dates.includes(dateString)) {
          const slotsForDay = this.generateSlotsForDay(
            bulkData.professional_id,
            dateString,
            bulkData.start_time,
            bulkData.end_time,
            bulkData.duration_minutes,
            bulkData.break_minutes || 0,
            bulkData.price_override,
            bulkData.max_bookings || 1,
            bulkData.metadata
          );
          
          timeSlots.push(...slotsForDay);
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const savedTimeSlots = await this.timeSlotRepository.save(timeSlots);
    return savedTimeSlots.map(slot => this.formatTimeSlotResponse(slot));
  }

  private generateSlotsForDay(
    professionalId: number,
    date: string,
    startTime: string,
    endTime: string,
    durationMinutes: number,
    breakMinutes: number,
    priceOverride?: number,
    maxBookings: number = 1,
    metadata?: any
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    let currentMinutes = startMinutes;
    
    while (currentMinutes + durationMinutes <= endMinutes) {
      const slotStartHour = Math.floor(currentMinutes / 60);
      const slotStartMinute = currentMinutes % 60;
      const slotEndMinutes = currentMinutes + durationMinutes;
      const slotEndHour = Math.floor(slotEndMinutes / 60);
      const slotEndMinute = slotEndMinutes % 60;
      
      const slotStartTime = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')}`;
      const slotEndTime = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`;
      
      const timeSlot = this.timeSlotRepository.create({
        professional_id: professionalId,
        slot_date: new Date(date),
        start_time: slotStartTime,
        end_time: slotEndTime,
        duration_minutes: durationMinutes,
        status: SlotStatus.AVAILABLE,
        price_override: priceOverride,
        max_bookings: maxBookings,
        current_bookings: 0,
        metadata
      });
      
      slots.push(timeSlot);
      currentMinutes += durationMinutes + breakMinutes;
    }
    
    return slots;
  }

  private async checkForOverlappingSlots(
    professionalId: number,
    slotDate: string,
    startTime: string,
    endTime: string,
    excludeSlotId?: number
  ): Promise<void> {
    const queryBuilder = this.timeSlotRepository
      .createQueryBuilder('timeSlot')
      .where('timeSlot.professional_id = :professionalId', { professionalId })
      .andWhere('timeSlot.slot_date = :slotDate', { slotDate })
      .andWhere(
        '(timeSlot.start_time < :endTime AND timeSlot.end_time > :startTime)',
        { startTime, endTime }
      );

    if (excludeSlotId) {
      queryBuilder.andWhere('timeSlot.slot_id != :excludeSlotId', { excludeSlotId });
    }

    const overlappingSlot = await queryBuilder.getOne();

    if (overlappingSlot) {
      throw new Error(
        `Time slot overlaps with existing slot from ${overlappingSlot.start_time} to ${overlappingSlot.end_time}`
      );
    }
  }

  private validateTimeFormat(time: string): void {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      throw new Error(`Invalid time format: ${time}. Expected format: HH:MM`);
    }
  }

  private validateTimeRange(startTime: string, endTime: string): void {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    if (startMinutes >= endMinutes) {
      throw new Error('Start time must be before end time');
    }
  }

  private validateDate(date: string): void {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new Error(`Invalid date format: ${date}. Expected format: YYYY-MM-DD`);
    }
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }
  }

  private formatTimeSlotResponse(timeSlot: TimeSlot): TimeSlotResponseDto {
    // Ensure slot_date is a Date object
    const slotDate = timeSlot.slot_date instanceof Date 
      ? timeSlot.slot_date 
      : new Date(timeSlot.slot_date);
    
    return {
      slot_id: timeSlot.slot_id,
      professional_id: timeSlot.professional_id,
      slot_date: slotDate.toISOString().split('T')[0],
      start_time: timeSlot.start_time,
      end_time: timeSlot.end_time,
      duration_minutes: timeSlot.duration_minutes,
      status: timeSlot.status,
      price_override: timeSlot.price_override,
      max_bookings: timeSlot.max_bookings,
      current_bookings: timeSlot.current_bookings,
      metadata: timeSlot.metadata,
      created_at: timeSlot.created_at,
      updated_at: timeSlot.updated_at
    };
  }
}