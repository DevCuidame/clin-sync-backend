import { Router } from 'express';
import { PackageController } from './package.controller';
import { authMiddleware, restrictTo } from '../../middlewares/auth.middleware';

const router = Router();
const packageController = new PackageController();

// Public routes
router.get('/', packageController.getPackages);
router.get('/:id', packageController.getPackageById);

// Protected routes (require authentication)
router.get('/user/packages', authMiddleware, packageController.getUserPackages);

// Admin only routes
router.get('/admin/all', authMiddleware, restrictTo('admin'), packageController.getAllPackagesAdmin);
router.post('/', authMiddleware, restrictTo('admin'), packageController.createPackage);
router.put('/:id', authMiddleware, restrictTo('admin'), packageController.updatePackage);
router.patch('/:id/toggle-status', authMiddleware, restrictTo('admin'), packageController.togglePackageStatus);
router.delete('/:id', authMiddleware, restrictTo('admin'), packageController.deletePackage);

export default router;