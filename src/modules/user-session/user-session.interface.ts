import { UserSessionStatus } from '../../models/user-session.model';
import { FilterOptions } from '../../core/interfaces/response.interface';

/**
 * Interfaz para representar una sesión de usuario
 */
export interface IUserSession {
  user_session_id: number;
  purchase_id: number;
  service_id: number;
  sessions_remaining: number;
  sessions_purchased: number;
  expires_at: Date;
  status: UserSessionStatus;
  created_at: Date;
  updated_at: Date;
  purchase?: any;
  service?: any;
}

/**
 * Interfaz para crear una nueva sesión de usuario
 */
export interface ICreateUserSessionData {
  purchase_id: number;
  service_id: number;
  sessions_remaining: number;
  sessions_purchased: number;
  expires_at: Date;
  status?: UserSessionStatus;
}

/**
 * Interfaz para actualizar una sesión de usuario
 */
export interface IUpdateUserSessionData {
  sessions_remaining?: number;
  expires_at?: Date;
  status?: UserSessionStatus;
}

/**
 * Interfaz para usar una sesión
 */
export interface IUseSessionData {
  user_session_id: number;
  sessions_to_use?: number; // Por defecto 1
}

/**
 * Interfaz para filtros de búsqueda de sesiones
 */
export interface UserSessionFilterOptions extends FilterOptions {
  purchase_id?: number;
  service_id?: number;
  status?: UserSessionStatus;
  expires_before?: Date;
  expires_after?: Date;
  has_remaining_sessions?: boolean;
}

/**
 * Interfaz para respuesta de sesiones con información adicional
 */
export interface IUserSessionWithDetails extends IUserSession {
  user_id?: number;
  user_name?: string;
  service_name?: string;
  package_name?: string;
  is_expired?: boolean;
  is_exhausted?: boolean;
}