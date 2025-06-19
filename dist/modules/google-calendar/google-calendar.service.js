"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCalendarService = void 0;
exports.createGoogleCalendarService = createGoogleCalendarService;
const googleapis_1 = require("googleapis");
const logger_1 = __importDefault(require("../../utils/logger"));
const environment_1 = __importDefault(require("../../core/config/environment"));
class GoogleCalendarService {
    oauth2Client;
    calendar;
    constructor(calendarConfig) {
        this.oauth2Client = new googleapis_1.google.auth.OAuth2(calendarConfig.clientId, calendarConfig.clientSecret, calendarConfig.redirectUri);
        if (calendarConfig.refreshToken) {
            this.oauth2Client.setCredentials({
                refresh_token: calendarConfig.refreshToken,
                access_token: calendarConfig.accessToken
            });
        }
        this.calendar = googleapis_1.google.calendar({ version: 'v3', auth: this.oauth2Client });
    }
    /**
     * Genera la URL de autorización para obtener el código de autorización
     */
    getAuthUrl() {
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
    async getTokens(code) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);
            return tokens;
        }
        catch (error) {
            logger_1.default.error('Error getting tokens from Google:', error);
            throw new Error('Failed to get tokens from Google');
        }
    }
    /**
     * Crea un evento en Google Calendar
     */
    async createEvent(event, calendarId = 'primary') {
        try {
            const response = await this.calendar.events.insert({
                calendarId,
                resource: event,
                sendUpdates: 'all' // Envía notificaciones a todos los asistentes
            });
            logger_1.default.info('Event created successfully:', response.data.id);
            return response.data;
        }
        catch (error) {
            logger_1.default.error('Error creating calendar event:', error);
            throw new Error('Failed to create calendar event');
        }
    }
    /**
     * Actualiza un evento existente en Google Calendar
     */
    async updateEvent(eventId, event, calendarId = 'primary') {
        try {
            const response = await this.calendar.events.update({
                calendarId,
                eventId,
                resource: event,
                sendUpdates: 'all'
            });
            logger_1.default.info('Event updated successfully:', eventId);
            return response.data;
        }
        catch (error) {
            logger_1.default.error('Error updating calendar event:', error);
            throw new Error('Failed to update calendar event');
        }
    }
    /**
     * Elimina un evento de Google Calendar
     */
    async deleteEvent(eventId, calendarId = 'primary') {
        try {
            await this.calendar.events.delete({
                calendarId,
                eventId,
                sendUpdates: 'all'
            });
            logger_1.default.info('Event deleted successfully:', eventId);
        }
        catch (error) {
            logger_1.default.error('Error deleting calendar event:', error);
            throw new Error('Failed to delete calendar event');
        }
    }
    /**
     * Obtiene un evento específico de Google Calendar
     */
    async getEvent(eventId, calendarId = 'primary') {
        try {
            const response = await this.calendar.events.get({
                calendarId,
                eventId
            });
            return response.data;
        }
        catch (error) {
            logger_1.default.error('Error getting calendar event:', error);
            throw new Error('Failed to get calendar event');
        }
    }
    /**
     * Lista eventos en un rango de fechas
     */
    async listEvents(timeMin, timeMax, calendarId = 'primary') {
        try {
            const response = await this.calendar.events.list({
                calendarId,
                timeMin,
                timeMax,
                singleEvents: true,
                orderBy: 'startTime'
            });
            return response.data.items || [];
        }
        catch (error) {
            logger_1.default.error('Error listing calendar events:', error);
            throw new Error('Failed to list calendar events');
        }
    }
    /**
     * Verifica si hay conflictos de horario
     */
    async checkAvailability(startTime, endTime, calendarId = 'primary') {
        try {
            const events = await this.listEvents(startTime, endTime, calendarId);
            return events.length === 0; // True si no hay eventos (disponible)
        }
        catch (error) {
            logger_1.default.error('Error checking availability:', error);
            return false; // En caso de error, asumir no disponible
        }
    }
    /**
     * Refresca el token de acceso si es necesario
     */
    async refreshAccessToken() {
        try {
            await this.oauth2Client.getAccessToken();
            logger_1.default.info('Access token refreshed successfully');
        }
        catch (error) {
            logger_1.default.error('Error refreshing access token:', error);
            throw new Error('Failed to refresh access token');
        }
    }
}
exports.GoogleCalendarService = GoogleCalendarService;
/**
 * Factory function para crear una instancia del servicio de Google Calendar
 */
function createGoogleCalendarService(userConfig) {
    const defaultConfig = {
        clientId: environment_1.default.google?.clientId || process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: environment_1.default.google?.clientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: environment_1.default.google?.redirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/auth/google/callback',
        refreshToken: userConfig?.refreshToken,
        accessToken: userConfig?.accessToken
    };
    const finalConfig = { ...defaultConfig, ...userConfig };
    if (!finalConfig.clientId || !finalConfig.clientSecret) {
        throw new Error('Google Calendar credentials are not configured');
    }
    return new GoogleCalendarService(finalConfig);
}
