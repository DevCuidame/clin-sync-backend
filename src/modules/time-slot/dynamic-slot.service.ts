import { Repository } from 'typeorm';
import { AppDataSource } from '../../core/config/database';
import { Schedule, DayOfWeek } from '../../models/schedule.model';
import { AvailabilityException, ExceptionType } from '../../models/availability-exception.model';
import { TimeSlot, SlotStatus } from '../../models/time-slot.model';
import { Professional } from '../../models/professional.model';
import { TimeSlotResponseDto } from './time-slot.interface';

export class DynamicSlotService {
  private scheduleRepository: Repository<Schedule>;
  private availabilityExceptionRepository: Repository<AvailabilityException>;
  private timeSlotRepository: Repository<TimeSlot>;
  private professionalRepository: Repository<Professional>;

  constructor() {
    this.scheduleRepository = AppDataSource.getRepository(Schedule);
    this.availabilityExceptionRepository = AppDataSource.getRepository(AvailabilityException);
    this.timeSlotRepository = AppDataSource.getRepository(TimeSlot);
    this.professionalRepository = AppDataSource.getRepository(Professional);
  }

  async generateVirtualSlots(
    professionalId: number,
    date: string,
    duration: number = 30
  ): Promise<TimeSlotResponseDto[]> {
    try {
      // 1. Verificar que el profesional existe
      const professional = await this.professionalRepository.findOne({
        where: { professional_id: professionalId }
      });

      if (!professional) {
        return [];
      }

      // 2. Obtener el día de la semana
      const dayOfWeek = this.getDayOfWeek(date);
      
      // 3. Obtener horario del profesional para ese día
      const schedule = await this.getScheduleForDay(professionalId, dayOfWeek, date);
      
      if (!schedule) {
        return [];
      }

      // 4. Verificar excepciones de disponibilidad
      const exceptions = await this.getExceptionsForDate(professionalId, date);
      
      if (this.isDayUnavailable(exceptions)) {
        return [];
      }

      // 5. Obtener slots ya existentes para evitar duplicados
      const existingSlots = await this.getExistingSlotsForDate(professionalId, date);
      
      // 6. Generar slots virtuales
      const virtualSlots = this.generateSlotsFromSchedule(
        schedule,
        date,
        duration,
        exceptions,
        existingSlots
      );

      return virtualSlots;
    } catch (error) {
      console.error('Error generating virtual slots:', error);
      return [];
    }
  }

  private getDayOfWeek(date: string): DayOfWeek {
    const dateObj = new Date(date);
    const dayIndex = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const dayMap: { [key: number]: DayOfWeek } = {
      0: DayOfWeek.SUNDAY,
      1: DayOfWeek.MONDAY,
      2: DayOfWeek.TUESDAY,
      3: DayOfWeek.WEDNESDAY,
      4: DayOfWeek.THURSDAY,
      5: DayOfWeek.FRIDAY,
      6: DayOfWeek.SATURDAY
    };

    return dayMap[dayIndex];
  }

  private async getScheduleForDay(
    professionalId: number,
    dayOfWeek: DayOfWeek,
    date: string
  ): Promise<Schedule | null> {
    const targetDate = new Date(date);
    
    return await this.scheduleRepository.findOne({
      where: {
        professional_id: professionalId,
        day_of_week: dayOfWeek,
        is_active: true
      }
    });
  }

  private async getExceptionsForDate(
    professionalId: number,
    date: string
  ): Promise<AvailabilityException[]> {
    const targetDate = new Date(date);
    
    return await this.availabilityExceptionRepository.find({
      where: {
        professional_id: professionalId,
        exception_date: targetDate
      }
    });
  }

  private isDayUnavailable(exceptions: AvailabilityException[]): boolean {
    return exceptions.some(exception => 
      exception.type === ExceptionType.UNAVAILABLE ||
      exception.type === ExceptionType.VACATION
    );
  }

  private async getExistingSlotsForDate(
    professionalId: number,
    date: string
  ): Promise<TimeSlot[]> {
    const targetDate = new Date(date);
    
    return await this.timeSlotRepository.find({
      where: {
        professional_id: professionalId,
        slot_date: targetDate
      }
    });
  }

  private generateSlotsFromSchedule(
    schedule: Schedule,
    date: string,
    duration: number,
    exceptions: AvailabilityException[],
    existingSlots: TimeSlot[]
  ): TimeSlotResponseDto[] {
    const slots: TimeSlotResponseDto[] = [];
    const startTime = this.parseTime(schedule.start_time);
    const endTime = this.parseTime(schedule.end_time);
    
    let currentTime = startTime;
    let slotId = 1000000; // ID temporal para slots virtuales
    
    while (currentTime + duration <= endTime) {
      const slotStartTime = this.formatTime(currentTime);
      const slotEndTime = this.formatTime(currentTime + duration);
      
      // Verificar si ya existe un slot en este horario
      const existingSlot = existingSlots.find(slot => 
        slot.start_time === slotStartTime
      );
      
      if (!existingSlot) {
        // Verificar si hay excepciones que afecten este horario
        const isBlocked = this.isTimeBlocked(
          slotStartTime,
          slotEndTime,
          exceptions
        );
        
        if (!isBlocked) {
          slots.push({
            slot_id: slotId++,
            professional_id: schedule.professional_id,
            slot_date: date,
            start_time: slotStartTime,
            end_time: slotEndTime,
            duration_minutes: duration,
            status: SlotStatus.AVAILABLE,
            max_bookings: 1,
            current_bookings: 0,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
      
      currentTime += duration;
    }
    
    return slots;
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private isTimeBlocked(
    startTime: string,
    endTime: string,
    exceptions: AvailabilityException[]
  ): boolean {
    return exceptions.some(exception => {
      if (!exception.start_time || !exception.end_time) {
        return false;
      }
      
      const exceptionStart = this.parseTime(exception.start_time);
      const exceptionEnd = this.parseTime(exception.end_time);
      const slotStart = this.parseTime(startTime);
      const slotEnd = this.parseTime(endTime);
      
      // Verificar si hay solapamiento
      return (
        (slotStart >= exceptionStart && slotStart < exceptionEnd) ||
        (slotEnd > exceptionStart && slotEnd <= exceptionEnd) ||
        (slotStart <= exceptionStart && slotEnd >= exceptionEnd)
      );
    });
  }
}