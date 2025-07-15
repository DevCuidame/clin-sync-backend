import { TemporaryCustomer } from '../../models/temporary-customer.model';
import { UserSession } from '../../models/user-session.model';

/**
 * Interface para las estadísticas de sesiones
 */
export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  exhaustedSessions: number;
  totalSessionsRemaining: number;
}

/**
 * Interface para el estado de gestión de sesiones (para uso en frontend)
 * Esta interface se exporta para que el frontend la use
 */
export interface SessionManagementState {
  // Búsqueda de cliente
  searchForm: any; // FormGroup será tipado en el frontend Angular
  searchResults: TemporaryCustomer[];
  selectedCustomer: TemporaryCustomer | null;
  
  // Sesiones del cliente
  customerSessions: UserSession[];
  sessionStats: SessionStats;
  
  // Estados de carga
  loading: boolean;
  processingSession: boolean;
}

/**
 * Interface para los parámetros de búsqueda de clientes
 */
export interface CustomerSearchParams {
  identification_type?: string;
  identification_number?: string;
  q?: string; // Búsqueda general
  phone?: string;
  email?: string;
}

/**
 * Interface para la respuesta de búsqueda de cliente
 */
export interface CustomerSearchResponse {
  success: boolean;
  message: string;
  data: TemporaryCustomer | TemporaryCustomer[];
}

/**
 * Interface para la respuesta de sesiones del cliente
 */
export interface CustomerSessionsResponse {
  success: boolean;
  message: string;
  data: {
    customer: TemporaryCustomer;
    sessions: UserSession[];
    sessionStats: SessionStats;
  };
}

/**
 * Interface para los filtros de búsqueda del formulario
 */
export interface SearchFormData {
  identificationType: string;
  identificationNumber: string;
  generalSearch?: string;
  phone?: string;
  email?: string;
}

/**
 * Interface para el estado de una sesión individual
 */
export interface SessionDisplayInfo {
  session: UserSession;
  statusColor: string;
  statusText: string;
  canUse: boolean;
  canCancel: boolean;
  canReactivate: boolean;
}

/**
 * Interface para las acciones disponibles en una sesión
 */
export interface SessionAction {
  type: 'use' | 'cancel' | 'reactivate' | 'schedule';
  label: string;
  icon: string;
  color: string;
  enabled: boolean;
}

/**
 * Interface para la configuración de colores por estado de sesión
 */
export interface SessionStatusConfig {
  active: {
    color: string;
    bgColor: string;
    text: string;
  };
  expired: {
    color: string;
    bgColor: string;
    text: string;
  };
  exhausted: {
    color: string;
    bgColor: string;
    text: string;
  };
  cancelled: {
    color: string;
    bgColor: string;
    text: string;
  };
}