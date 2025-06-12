export interface CreatePackageDto {
  package_name: string;
  description?: string;
  price: number;
  total_sessions: number;
  validity_days: number;
  discount_percentage?: number;
  is_active?: boolean;
  terms_conditions?: string;
  image_url?: string;
}

export interface UpdatePackageDto {
  package_name?: string;
  description?: string;
  price?: number;
  total_sessions?: number;
  validity_days?: number;
  discount_percentage?: number;
  is_active?: boolean;
  terms_conditions?: string;
  image_url?: string;
}

export interface PackageResponseDto {
  package_id: number;
  package_name: string;
  description?: string;
  price: number;
  total_sessions: number;
  validity_days: number;
  discount_percentage?: number;
  is_active: boolean;
  terms_conditions?: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}