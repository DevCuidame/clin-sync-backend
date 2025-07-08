import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString, IsBoolean } from 'class-validator';
import { AppointmentStatus } from '../../models/appointment.model';

export class CreateAppointmentDto {
  @IsNumber()
  @IsNotEmpty()
  user_id!: number;

  @IsNumber()
  @IsNotEmpty()
  professional_id!: number;

  @IsNumber()
  @IsNotEmpty()
  service_id!: number;

  @IsOptional()
  @IsNumber()
  user_session_id?: number;

  @IsDateString()
  @IsNotEmpty()
  scheduled_at!: string;

  @IsNumber()
  @IsNotEmpty()
  duration_minutes!: number;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  google_calendar_event_id?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  cancellation_reason?: string;

  @IsOptional()
  @IsBoolean()
  reminder_sent?: boolean;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @IsOptional()
  @IsNumber()
  duration_minutes?: number;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  cancellation_reason?: string;

  @IsOptional()
  @IsBoolean()
  reminder_sent?: boolean;
}

export class AppointmentQueryDto {
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @IsOptional()
  @IsNumber()
  professional_id?: number;

  @IsOptional()
  @IsNumber()
  service_id?: number;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}

export class CancelAppointmentDto {
  @IsString()
  @IsNotEmpty()
  cancellation_reason!: string;
}

export class RescheduleAppointmentDto {
  @IsDateString()
  @IsNotEmpty()
  new_scheduled_at!: string;

  @IsOptional()
  @IsNumber()
  new_duration_minutes?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UserAppointmentsWithSessionsDto {
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @IsOptional()
  @IsNumber()
  professional_id?: number;

  @IsOptional()
  @IsNumber()
  service_id?: number;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsNumber()
  user_session_id?: number;

  @IsOptional()
  @IsNumber()
  package_id?: number;

  @IsOptional()
  @IsBoolean()
  include_session_details?: boolean = true;

  @IsOptional()
  @IsBoolean()
  include_service_details?: boolean = true;

  @IsOptional()
  @IsBoolean()
  include_professional_details?: boolean = true;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}