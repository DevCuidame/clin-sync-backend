import { NotificationType } from '../../models/notification.model';

/**
 * Datos para crear una notificación
 */
export interface CreateNotificationDto {
  user_id: number;
  appointment_id?: number;
  type: NotificationType;
  title: string;
  message: string;
  scheduled_for?: Date;
}

/**
 * Plantilla de notificación
 */
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject: string;
  bodyTemplate: string;
  variables: string[];
}

/**
 * Datos para renderizar una plantilla
 */
export interface TemplateData {
  [key: string]: any;
}

/**
 * Opciones para los recordatorios automáticos
 */
export interface ReminderOptions {
  days?: number;
  hours?: number;
  minutes?: number;
  includeCancelled?: boolean;
}

/**
 * Configuración de email
 */
export interface EmailConfig {
  to: string;
  cc?: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  env?: string;
}

/**
 * Adjunto para email
 */
export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}
/**
 * Elemento de la cola de notificaciones
 */
export interface NotificationQueueItem {
  id: number;
  notificationId: number;
  type: 'email' | 'push' | 'inapp';
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retries: number;
  maxRetries: number;
  nextRetry?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Preferencia de notificación para un usuario
 */
export interface NotificationPreference {
  user_id: number;
  type: NotificationType;
  email: boolean;
  push: boolean;
  inapp: boolean;
}
