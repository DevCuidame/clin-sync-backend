import { ServiceCategory } from '../../models/service.model';

export interface CreateServiceDto {
  service_name: string;
  description?: string;
  base_price: number;
  duration_minutes: number;
  category: ServiceCategory;
  is_active?: boolean;
  metadata?: any;
}

export interface UpdateServiceDto {
  service_name?: string;
  description?: string;
  base_price?: number;
  duration_minutes?: number;
  category?: ServiceCategory;
  is_active?: boolean;
  metadata?: any;
}

export interface ServiceResponseDto {
  service_id: number;
  service_name: string;
  description?: string;
  base_price: number;
  duration_minutes: number;
  category: ServiceCategory;
  is_active: boolean;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}