import { ExceptionType } from '../../models/availability-exception.model';

export interface CreateAvailabilityExceptionDto {
  professional_id: number;
  exception_date: string; // Format: "YYYY-MM-DD"
  start_time?: string;    // Format: "HH:MM" (optional for full-day exceptions)
  end_time?: string;      // Format: "HH:MM" (optional for full-day exceptions)
  type: ExceptionType;
  reason?: string;
}

export interface UpdateAvailabilityExceptionDto {
  exception_date?: string;
  start_time?: string;
  end_time?: string;
  type?: ExceptionType;
  reason?: string;
}

export interface AvailabilityExceptionResponseDto {
  exception_id: number;
  professional_id: number;
  exception_date: string;
  start_time?: string;
  end_time?: string;
  type: ExceptionType;
  reason?: string;
  created_at: string;
}

export interface AvailabilityExceptionWithProfessionalDto extends AvailabilityExceptionResponseDto {
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

export interface AvailabilityExceptionFilterDto {
  professional_id?: number;
  type?: ExceptionType;
  date_from?: string;  // Filter exceptions from this date
  date_to?: string;    // Filter exceptions until this date
  specific_date?: string; // Filter exceptions for a specific date
}

export interface BulkCreateAvailabilityExceptionDto {
  professional_id: number;
  exceptions: {
    exception_date: string;
    start_time?: string;
    end_time?: string;
    type: ExceptionType;
    reason?: string;
  }[];
}