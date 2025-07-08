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
  image_base64?: string; // Para recibir imagen en formato base64
  services?: Array<{
    service_id: string | number;
    sessions_included: number;
  }>;
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
  image_base64?: string; // Para recibir imagen en formato base64
  services?: Array<{
    service_id: string | number;
    sessions_included: number;
  }>;
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

export interface UserPackageWithSessionsDto {
  purchase_id: number;
  amount_paid: number;
  payment_status: string;
  payment_method?: string;
  transaction_id?: string;
  purchase_date: Date;
  expires_at: Date;
  sessions_used: number;        // NUEVO: Sesiones utilizadas
  sessions_remaining: number;   // NUEVO: Sesiones restantes
  status: UserPackageStatus;    // NUEVO: Estado del paquete
  package: PackageResponseDto;
}

// Enum para los estados del paquete del usuario
export enum UserPackageStatus {
  ACTIVE = 'active',
  EXHAUSTED = 'exhausted',
  CANCELLED = 'cancelled'
}