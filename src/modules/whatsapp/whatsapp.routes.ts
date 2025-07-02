import { Router } from 'express';
import { WhatsAppController } from './whatsapp.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const whatsAppController = new WhatsAppController();

// Todas las rutas requieren autenticación
// router.use(authMiddleware);

/**
 * @route POST /api/whatsapp/qr-scan-notification
 * @desc Envía notificación de WhatsApp para escaneo de QR
 * @access Private
 * @body {
 *   phoneNumber: string,
 *   userName: string,
 *   patientName: string,
 *   latitude: number,
 *   longitude: number
 * }
 */
router.post('/qr-scan-notification', whatsAppController.sendQRScanNotification);

/**
 * @route POST /api/whatsapp/send-template
 * @desc Envía mensaje de WhatsApp usando plantilla personalizada
 * @access Private
 * @body {
 *   phoneNumber: string,
 *   templateName: string,
 *   templateParams: {
 *     userName: string,
 *     patientName: string,
 *     time: string,
 *     latitude: string,
 *     longitude: string
 *   }
 * }
 */
router.post('/send-template', whatsAppController.sendTemplateMessage);

/**
 * @route GET /api/whatsapp/health
 * @desc Verifica el estado del servicio de WhatsApp
 * @access Private
 */
router.get('/health', whatsAppController.healthCheck);

export default router;