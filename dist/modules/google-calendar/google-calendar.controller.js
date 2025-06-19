"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCalendarController = void 0;
const appointment_service_1 = require("../appointment/appointment.service");
const google_calendar_service_1 = require("./google-calendar.service");
const logger_1 = __importDefault(require("../../utils/logger"));
class GoogleCalendarController {
    appointmentService;
    constructor() {
        this.appointmentService = new appointment_service_1.AppointmentService();
    }
    /**
     * Obtiene la URL de autorización de Google Calendar
     */
    async getAuthUrl(req, res) {
        try {
            const authUrl = this.appointmentService.getGoogleCalendarAuthUrl();
            res.status(200).json({
                success: true,
                message: 'Google Calendar authorization URL generated',
                data: {
                    authUrl,
                    instructions: 'Visit this URL to authorize the application to access Google Calendar'
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error getting Google Calendar auth URL:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error generating authorization URL'
            });
        }
    }
    /**
     * Maneja el callback de autorización de Google
     */
    async handleCallback(req, res) {
        try {
            const { code, state } = req.query;
            if (!code) {
                res.status(400).json({
                    success: false,
                    message: 'Authorization code is required'
                });
                return;
            }
            // Crear una instancia temporal del servicio para obtener tokens
            const googleCalendarService = (0, google_calendar_service_1.createGoogleCalendarService)();
            const tokens = await googleCalendarService.getTokens(code);
            // Aquí podrías guardar los tokens en la base de datos asociados al usuario
            // Por ahora, solo devolvemos una respuesta de éxito
            res.status(200).json({
                success: true,
                message: 'Google Calendar authorization successful',
                data: {
                    message: 'Your Google Calendar has been successfully connected',
                    refreshToken: tokens.refresh_token ? 'Received' : 'Not received'
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error handling Google Calendar callback:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error processing authorization'
            });
        }
    }
    /**
     * Configura Google Calendar para un usuario específico
     */
    async setupUserCalendar(req, res) {
        try {
            const { userId, refreshToken } = req.body;
            if (!userId || !refreshToken) {
                res.status(400).json({
                    success: false,
                    message: 'User ID and refresh token are required'
                });
                return;
            }
            await this.appointmentService.setupGoogleCalendar(userId, refreshToken);
            res.status(200).json({
                success: true,
                message: 'Google Calendar configured successfully for user'
            });
        }
        catch (error) {
            logger_1.default.error('Error setting up user calendar:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error configuring Google Calendar'
            });
        }
    }
    /**
     * Verifica el estado de la integración de Google Calendar
     */
    async getIntegrationStatus(req, res) {
        try {
            // Verificar si las credenciales de Google están configuradas
            const hasCredentials = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
            let serviceStatus = 'not_configured';
            if (hasCredentials) {
                try {
                    (0, google_calendar_service_1.createGoogleCalendarService)();
                    serviceStatus = 'configured';
                }
                catch {
                    serviceStatus = 'error';
                }
            }
            res.status(200).json({
                success: true,
                message: 'Google Calendar integration status',
                data: {
                    hasCredentials,
                    serviceStatus,
                    features: {
                        automaticEventCreation: serviceStatus === 'configured',
                        eventUpdates: serviceStatus === 'configured',
                        eventDeletion: serviceStatus === 'configured',
                        reminders: serviceStatus === 'configured'
                    }
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error checking integration status:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error checking integration status'
            });
        }
    }
    /**
     * Prueba la conexión con Google Calendar
     */
    async testConnection(req, res) {
        try {
            const googleCalendarService = (0, google_calendar_service_1.createGoogleCalendarService)();
            // Intentar listar eventos para probar la conexión
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            await googleCalendarService.listEvents(now.toISOString(), tomorrow.toISOString());
            res.status(200).json({
                success: true,
                message: 'Google Calendar connection test successful',
                data: {
                    status: 'connected',
                    timestamp: new Date().toISOString()
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error testing Google Calendar connection:', error);
            res.status(500).json({
                success: false,
                message: 'Google Calendar connection test failed',
                error: error.message
            });
        }
    }
}
exports.GoogleCalendarController = GoogleCalendarController;
