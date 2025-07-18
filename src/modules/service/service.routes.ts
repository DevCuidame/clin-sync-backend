import { Router } from 'express';
import { ServiceController } from './service.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/role.middleware';

const router = Router();
const serviceController = new ServiceController();

router.use(authMiddleware);
// Public routes
router.get('/actives', (req, res) => serviceController.getServices(req, res));
router.get('/:id', (req, res) => serviceController.getServiceById(req, res));
router.get('/:id/complete', (req, res) => serviceController.getServiceByIdComplete(req, res));

// Protected routes (require authentication)
router.use(restrictTo(['admin']));
router.get('/', (req, res) => serviceController.getAllServices(req, res));
router.post('/', authMiddleware, (req, res) => serviceController.createService(req, res));
router.put('/:id', authMiddleware, (req, res) => serviceController.updateService(req, res));
router.delete('/:id', authMiddleware, (req, res) => serviceController.deleteService(req, res));
router.patch('/:id/toggle-status', authMiddleware, restrictTo(['admin']), (req, res) => serviceController.toggleServiceStatus(req, res));

export default router;