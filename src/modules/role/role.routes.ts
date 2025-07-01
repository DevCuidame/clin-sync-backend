import { Router } from 'express';
import { roleController } from './role.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/role.middleware';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authMiddleware);
router.use(restrictTo(['admin']));

/**
 * @route GET /api/roles
 * @desc Obtiene todos los roles activos
 * @access Requiere autenticación
 */
router.get('/', roleController.getAllRoles);

/**
 * @route GET /api/roles/:id
 * @desc Obtiene un rol por ID
 * @access Requiere autenticación
 */
router.get('/:id', roleController.getRoleById);

/**
 * @route GET /api/roles/name/:name
 * @desc Obtiene un rol por nombre
 * @access Requiere autenticación
 */
router.get('/name/:name', roleController.getRoleByName);

export default router;