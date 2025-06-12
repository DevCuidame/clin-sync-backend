// Interfaz para crear una relación professional-service
export interface CreateProfessionalServiceDto {
  professional_id: number;
  service_id: number;
  custom_price?: number;
  custom_duration?: number;
  is_active?: boolean;
}

// Interfaz para actualizar
export interface UpdateProfessionalServiceDto {
  custom_price?: number;
  custom_duration?: number;
  is_active?: boolean;
}

// Interfaz de respuesta
export interface ProfessionalServiceResponseDto {
  prof_service_id: number;
  professional_id: number;
  service_id: number;
  custom_price?: number;
  custom_duration?: number;
  is_active: boolean;
  created_at: Date;
  professional?: {
    professional_id: number;
    license_number: string;
    specialization?: string;
  };
  service?: {
    service_id: number;
    service_name: string;
    price: number;
    duration: number;
  };
}

// Para consultas que incluyan datos del profesional y servicio
export interface ProfessionalServiceWithDetails {
  prof_service_id: number;
  professional_id: number;
  service_id: number;
  custom_price?: number;
  custom_duration?: number;
  is_active: boolean;
  created_at: Date;
  professional: {
    professional_id: number;
    license_number: string;
    specialization?: string;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  service: {
    service_id: number;
    service_name: string;
    description?: string;
    price: number;
    duration: number;
    category: string;
  };
}
