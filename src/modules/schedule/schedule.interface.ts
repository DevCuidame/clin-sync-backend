import { DayOfWeek } from '../../models/schedule.model';

export interface CreateScheduleDto {
  professional_id: number;
  day_of_week: DayOfWeek;
  start_time: string; // Format: "HH:MM"
  end_time: string;   // Format: "HH:MM"
  is_active?: boolean;
  valid_from?: string; // Format: "YYYY-MM-DD"
  valid_until?: string; // Format: "YYYY-MM-DD"
  // Campos para descansos
  has_break?: boolean;
  break_start_time?: string; // Format: "HH:MM"
  break_end_time?: string;   // Format: "HH:MM"
  break_description?: string;
}

export interface UpdateScheduleDto {
  day_of_week?: DayOfWeek;
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
  valid_from?: string;
  valid_until?: string;
  // Campos para descansos
  has_break?: boolean;
  break_start_time?: string;
  break_end_time?: string;
  break_description?: string;
}

export interface ScheduleResponseDto {
  schedule_id: number;
  professional_id: number;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  is_active: boolean;
  valid_from?: string;
  valid_until?: string;
  // Campos para descansos
  has_break: boolean;
  break_start_time?: string;
  break_end_time?: string;
  break_description?: string;
  created_at: string;
}

export interface ScheduleWithProfessionalDto extends ScheduleResponseDto {
  professional: {
    professional_id: number;
    license_number: string;
    specialization: string;
    user: {
      user_id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
    };
  };
}

export interface ScheduleFilterDto {
  professional_id?: number;
  user_id?: number; // Filter by user_id to find professional's schedules
  day_of_week?: DayOfWeek;
  is_active?: boolean;
  valid_date?: string; // Filter schedules valid on this date
}