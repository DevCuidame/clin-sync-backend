/**
 * Rutas para las pruebas del sistema de correos electrónicos
 */

import { Router } from 'express';
import { EmailTestController } from '../controllers/email-test.controller';
import { validateRequest } from '../../../middlewares/validation.middleware';
import { body, query } from 'express-validator';

const router = Router();
const emailTestController = new EmailTestController();

/**
 * @route GET /api/email-test/status
 * @desc Verificar estado del sistema de correos
 * @access Public (en desarrollo)
 */
router.get('/status', emailTestController.checkEmailSystemStatus);

/**
 * @route GET /api/email-test/info
 * @desc Obtener información del sistema de correos
 * @access Public (en desarrollo)
 */
router.get('/info', emailTestController.getEmailSystemInfo);

/**
 * @route POST /api/email-test/send-test
 * @desc Enviar correo de prueba simple
 * @access Public (en desarrollo)
 */
router.post(
  '/send-test',
  [
    body('to')
      .optional()
      .isEmail()
      .withMessage('Debe proporcionar un correo electrónico válido'),
    body('subject')
      .optional()
      .isString()
      .isLength({ min: 1, max: 200 })
      .withMessage('El asunto debe tener entre 1 y 200 caracteres'),
    body('message')
      .optional()
      .isString()
      .isLength({ max: 10000 })
      .withMessage('El mensaje no puede exceder 10000 caracteres')
  ],
  validateRequest,
  emailTestController.sendTestEmail
);

/**
 * @route POST /api/email-test/system-verification
 * @desc Enviar correo de verificación del sistema
 * @access Public (en desarrollo)
 */
router.post(
  '/system-verification',
  [
    body('to')
      .notEmpty()
      .withMessage('El campo "to" es requerido')
      .isEmail()
      .withMessage('Debe proporcionar un correo electrónico válido')
  ],
  validateRequest,
  emailTestController.sendSystemVerificationEmail
);

/**
 * @route POST /api/email-test/send-multiple
 * @desc Enviar múltiples correos de prueba
 * @access Public (en desarrollo)
 */
router.post(
  '/send-multiple',
  [
    body('emails')
      .isArray({ min: 1, max: 10 })
      .withMessage('Debe proporcionar un array de 1 a 10 direcciones de correo'),
    body('emails.*')
      .isEmail()
      .withMessage('Todas las direcciones deben ser correos electrónicos válidos')
  ],
  validateRequest,
  emailTestController.sendMultipleTestEmails
);

export default router;