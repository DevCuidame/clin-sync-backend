import { Router } from 'express';
import { ServiceController } from './service.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const serviceController = new ServiceController();

// Public routes
router.get('/', (req, res) => serviceController.getServices(req, res));
router.get('/:id', (req, res) => serviceController.getServiceById(req, res));

// Protected routes (require authentication)
router.post('/', authMiddleware, (req, res) => serviceController.createService(req, res));
router.put('/:id', authMiddleware, (req, res) => serviceController.updateService(req, res));
router.delete('/:id', authMiddleware, (req, res) => serviceController.deleteService(req, res));

export default router;