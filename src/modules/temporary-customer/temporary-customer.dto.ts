import { IsString, IsOptional, IsEnum, IsNumber, IsInt, Min } from 'class-validator';
import { IdentificationType } from '../../models/temporary-customer.model';
import { UserSessionStatus } from '../../models/user-session.model';

/**
 * DTO para búsqueda de cliente temporal por identificación
 */
export class SearchByIdentificationDto {
  @IsOptional()
  @IsEnum(IdentificationType)
  identification_type?: IdentificationType;

  @IsOptional()
  @IsString()
  identification_number?: string;
}

/**
 * DTO para búsqueda múltiple de clientes temporales
 */
export class SearchMultipleCustomersDto {
  @IsOptional()
  @IsString()
  q?: string; // Búsqueda general

  @IsOptional()
  @IsEnum(IdentificationType)
  identification_type?: IdentificationType;

  @IsOptional()
  @IsString()
  identification_number?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

/**
 * DTO para estadísticas de sesiones
 */
export class SessionStatsDto {
  @IsNumber()
  totalSessions!: number;

  @IsNumber()
  activeSessions!: number;

  @IsNumber()
  expiredSessions!: number;

  @IsNumber()
  exhaustedSessions!: number;

  @IsNumber()
  totalSessionsRemaining!: number;
}

/**
 * DTO para información de sesión con detalles del servicio
 */
export class SessionWithServiceDto {
  @IsNumber()
  id!: number;

  @IsNumber()
  purchase_id!: number;

  @IsNumber()
  service_id!: number;

  @IsNumber()
  sessions_purchased!: number;

  @IsNumber()
  sessions_remaining!: number;

  @IsString()
  expires_at!: string;

  @IsEnum(UserSessionStatus)
  status!: UserSessionStatus;

  @IsString()
  created_at!: string;

  @IsString()
  updated_at!: string;

  // Información del servicio
  service!: {
    id: number;
    service_name: string;
    description: string;
    price: number;
    duration_minutes: number;
  };
}

/**
 * DTO para la respuesta de sesiones del cliente
 */
export class CustomerSessionsResponseDto {
  customer!: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    identification_type: IdentificationType;
    identification_number: string;
    created_at: string;
    updated_at: string;
  };

  sessions!: SessionWithServiceDto[];

  sessionStats!: SessionStatsDto;
}

/**
 * DTO para la respuesta de búsqueda de cliente
 */
export class CustomerSearchResponseDto {
  @IsString()
  success!: boolean;

  @IsString()
  message!: string;

  data: any; // Puede ser TemporaryCustomer o TemporaryCustomer[] dependiendo del endpoint
}

/**
 * DTO para parámetros de paginación (opcional para futuras mejoras)
 */
export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 50;
}

/**
 * DTO para filtros avanzados de búsqueda
 */
export class AdvancedSearchDto extends SearchMultipleCustomersDto {
  @IsOptional()
  @IsString()
  date_from?: string; // Fecha de creación desde

  @IsOptional()
  @IsString()
  date_to?: string; // Fecha de creación hasta

  @IsOptional()
  @IsString()
  sort_by?: string; // Campo por el cual ordenar

  @IsOptional()
  @IsString()
  sort_order?: 'ASC' | 'DESC'; // Orden ascendente o descendente
}