import { Router } from 'express';
import { TemporaryCustomerController } from './temporary-customer.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/role.middleware';

const router = Router();
const temporaryCustomerController = new TemporaryCustomerController();

// Todas las rutas requieren autenticación y rol de admin o profesional
router.use(authMiddleware);
router.use(restrictTo(['admin', 'professional']));

/**
 * @route GET /api/temporary-customers/search
 * @desc Buscar cliente temporal por identificación
 * @access Admin, Professional
 * @query identification_type - Tipo de identificación (cedula, passport, etc.)
 * @query identification_number - Número de identificación
 */
router.get('/search', temporaryCustomerController.searchByIdentification);

/**
 * @route GET /api/temporary-customers/search-multiple
 * @desc Buscar clientes temporales por múltiples criterios
 * @access Admin, Professional
 * @query q - Búsqueda general (nombre, apellido, teléfono, email, identificación)
 * @query identification_type - Tipo de identificación específica
 * @query identification_number - Número de identificación específico
 * @query phone - Teléfono
 * @query email - Email
 */
router.get('/search-multiple', temporaryCustomerController.searchMultiple);

/**
 * @route GET /api/temporary-customers/:customerId/sessions
 * @desc Obtener sesiones de un cliente temporal con estadísticas
 * @access Admin, Professional
 * @param customerId - ID del cliente temporal
 */
router.get('/:customerId/sessions', temporaryCustomerController.getCustomerSessions);

/**
 * @route GET /api/temporary-customers/:customerId/complete
 * @desc Obtener información completa del cliente con sesiones y estadísticas
 * @access Admin, Professional
 * @param customerId - ID del cliente temporal
 */
router.get('/:customerId/complete', temporaryCustomerController.getCompleteCustomerInfo);

/**
 * @route GET /api/temporary-customers/:customerId/history
 * @desc Obtener historial completo de sesiones de un cliente temporal
 * @access Admin, Professional
 * @param customerId - ID del cliente temporal
 */
router.get('/:customerId/history', temporaryCustomerController.getCustomerHistory);

export default router;