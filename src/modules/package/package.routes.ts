import { Router } from 'express';
import { PackageController } from './package.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const packageController = new PackageController();

// Public routes
router.get('/', packageController.getPackages);
router.get('/:id', packageController.getPackageById);

// Protected routes (require authentication)
router.get('/user/packages', authMiddleware, packageController.getUserPackages);
router.post('/', authMiddleware, packageController.createPackage);
router.put('/:id', authMiddleware, packageController.updatePackage);
router.delete('/:id', authMiddleware, packageController.deletePackage);

export default router;