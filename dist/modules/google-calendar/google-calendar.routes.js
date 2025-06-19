"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const google_calendar_controller_1 = require("./google-calendar.controller");
const router = (0, express_1.Router)();
const googleCalendarController = new google_calendar_controller_1.GoogleCalendarController();
// Rutas para Google Calendar
router.get('/auth-url', googleCalendarController.getAuthUrl.bind(googleCalendarController));
router.get('/callback', googleCalendarController.handleCallback.bind(googleCalendarController));
router.post('/setup', googleCalendarController.setupUserCalendar.bind(googleCalendarController));
router.get('/status', googleCalendarController.getIntegrationStatus.bind(googleCalendarController));
router.get('/test', googleCalendarController.testConnection.bind(googleCalendarController));
exports.default = router;
