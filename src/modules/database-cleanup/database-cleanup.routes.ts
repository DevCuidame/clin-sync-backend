import { Router } from 'express';
import { DatabaseCleanupController } from './database-cleanup.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/role.middleware';

const router = Router();
const cleanupController = new DatabaseCleanupController();

// Todas las rutas requieren autenticación y rol de administrador
router.use(authMiddleware);
router.use(restrictTo(['admin']));

// GET /api/database-cleanup/stats - Obtener estadísticas de limpieza
router.get('/stats', cleanupController.getCleanupStats.bind(cleanupController));

// POST /api/database-cleanup/dry-run - Ejecutar simulación de limpieza
router.post('/dry-run', cleanupController.dryRunCleanup.bind(cleanupController));

// POST /api/database-cleanup/execute - Ejecutar limpieza real
router.post('/execute', cleanupController.executeCleanup.bind(cleanupController));

export default router;