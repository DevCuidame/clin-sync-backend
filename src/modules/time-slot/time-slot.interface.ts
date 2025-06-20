export interface CreateTimeSlotDto {
  professional_id: number;
  slot_date: string; // YYYY-MM-DD format
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  duration_minutes: number;
  status?: string;
  price_override?: number;
  max_bookings?: number;
  metadata?: any;
}

export interface UpdateTimeSlotDto {
  slot_date?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  status?: string;
  price_override?: number;
  max_bookings?: number;
  current_bookings?: number;
  metadata?: any;
}

export interface TimeSlotResponseDto {
  slot_id: number;
  professional_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: string;
  price_override?: number;
  max_bookings: number;
  current_bookings: number;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export interface TimeSlotWithProfessionalDto extends TimeSlotResponseDto {
  professional: {
    professional_id: number;
    first_name: string;
    last_name: string;
    email: string;
    specialization?: string;
  };
}

export interface TimeSlotFilterDto {
  professional_id?: number;
  start_date?: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format
  status?: string;
  available_only?: boolean;
  page?: number;
  limit?: number;
}

export interface BulkCreateTimeSlotsDto {
  professional_id: number;
  start_date: string; // YYYY-MM-DD format
  end_date: string; // YYYY-MM-DD format
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  duration_minutes: number;
  break_minutes?: number; // Break between slots
  days_of_week?: number[]; // 0=Sunday, 1=Monday, etc.
  exclude_dates?: string[]; // Dates to exclude
  price_override?: number;
  max_bookings?: number;
  metadata?: any;
}