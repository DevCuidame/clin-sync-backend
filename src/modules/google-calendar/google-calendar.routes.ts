import { Router } from 'express';
import { GoogleCalendarController } from './google-calendar.controller';

const router = Router();
const googleCalendarController = new GoogleCalendarController();

// Rutas para Google Calendar
router.get('/auth-url', googleCalendarController.getAuthUrl.bind(googleCalendarController));
router.get('/callback', googleCalendarController.handleCallback.bind(googleCalendarController));
router.post('/setup', googleCalendarController.setupUserCalendar.bind(googleCalendarController));
router.get('/status', googleCalendarController.getIntegrationStatus.bind(googleCalendarController));
router.get('/test', googleCalendarController.testConnection.bind(googleCalendarController));

export default router;