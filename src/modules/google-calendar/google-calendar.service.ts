import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import logger from '../../utils/logger';
import config from '../../core/config/environment';

export interface CalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken?: string;
  accessToken?: string;
}

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: any;

  constructor(calendarConfig: GoogleCalendarConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      calendarConfig.clientId,
      calendarConfig.clientSecret,
      calendarConfig.redirectUri
    );

    if (calendarConfig.refreshToken) {
      this.oauth2Client.setCredentials({
        refresh_token: calendarConfig.refreshToken,
        access_token: calendarConfig.accessToken
      });
    }

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Genera la URL de autorización para obtener el código de autorización
   */
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  /**
   * Intercambia el código de autorización por tokens de acceso
   */
  async getTokens(code: string): Promise<any> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      logger.error('Error getting tokens from Google:', error);
      throw new Error('Failed to get tokens from Google');
    }
  }

  /**
   * Crea un evento en Google Calendar
   */
  async createEvent(event: CalendarEvent, calendarId: string = 'primary'): Promise<any> {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        resource: event,
        sendUpdates: 'all' // Envía notificaciones a todos los asistentes
      });

      logger.info('Event created successfully:', response.data.id);
      return response.data;
    } catch (error) {
      logger.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * Actualiza un evento existente en Google Calendar
   */
  async updateEvent(
    eventId: string, 
    event: Partial<CalendarEvent>, 
    calendarId: string = 'primary'
  ): Promise<any> {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        resource: event,
        sendUpdates: 'all'
      });

      logger.info('Event updated successfully:', eventId);
      return response.data;
    } catch (error) {
      logger.error('Error updating calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  /**
   * Elimina un evento de Google Calendar
   */
  async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: 'all'
      });

      logger.info('Event deleted successfully:', eventId);
    } catch (error) {
      logger.error('Error deleting calendar event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  /**
   * Obtiene un evento específico de Google Calendar
   */
  async getEvent(eventId: string, calendarId: string = 'primary'): Promise<any> {
    try {
      const response = await this.calendar.events.get({
        calendarId,
        eventId
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting calendar event:', error);
      throw new Error('Failed to get calendar event');
    }
  }

  /**
   * Lista eventos en un rango de fechas
   */
  async listEvents(
    timeMin: string,
    timeMax: string,
    calendarId: string = 'primary'
  ): Promise<any[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items || [];
    } catch (error) {
      logger.error('Error listing calendar events:', error);
      throw new Error('Failed to list calendar events');
    }
  }

  /**
   * Verifica si hay conflictos de horario
   */
  async checkAvailability(
    startTime: string,
    endTime: string,
    calendarId: string = 'primary'
  ): Promise<boolean> {
    try {
      const events = await this.listEvents(startTime, endTime, calendarId);
      return events.length === 0; // True si no hay eventos (disponible)
    } catch (error) {
      logger.error('Error checking availability:', error);
      return false; // En caso de error, asumir no disponible
    }
  }

  /**
   * Refresca el token de acceso si es necesario
   */
  async refreshAccessToken(): Promise<void> {
    try {
      await this.oauth2Client.getAccessToken();
      logger.info('Access token refreshed successfully');
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }
}

/**
 * Factory function para crear una instancia del servicio de Google Calendar
 */
export function createGoogleCalendarService(userConfig?: Partial<GoogleCalendarConfig>): GoogleCalendarService {
  const defaultConfig: GoogleCalendarConfig = {
    clientId: config.google?.clientId || process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: config.google?.clientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: config.google?.redirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/auth/google/callback',
    refreshToken: userConfig?.refreshToken,
    accessToken: userConfig?.accessToken
  };

  const finalConfig = { ...defaultConfig, ...userConfig };

  if (!finalConfig.clientId || !finalConfig.clientSecret) {
    throw new Error('Google Calendar credentials are not configured');
  }

  return new GoogleCalendarService(finalConfig);
}