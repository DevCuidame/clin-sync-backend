import { ProfessionalStatus } from '../../models/professional.model';

export interface CreateProfessionalDto {
  user_id: number;
  license_number: string;
  specialization?: string;
  bio?: string;
  hourly_rate?: number;
  experience_years?: number;
  availability_config?: any;
}

export interface UpdateProfessionalDto {
  license_number?: string;
  specialization?: string;
  bio?: string;
  hourly_rate?: number;
  experience_years?: number;
  status?: ProfessionalStatus;
  availability_config?: any;
}

export interface ProfessionalResponseDto {
  professional_id: number;
  user_id: number;
  license_number: string;
  specialization?: string;
  bio?: string;
  hourly_rate?: number;
  experience_years?: number;
  status: ProfessionalStatus;
  availability_config?: any;
  created_at: Date;
  updated_at: Date;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}