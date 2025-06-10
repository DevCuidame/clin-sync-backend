import { Router } from 'express';
import { LocationController } from './location.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const locationController = new LocationController();

/**
 * Routes that require authentication
 */
// router.use(authMiddleware);

/**
 * @route GET /api/locations/departments
 * @desc Get all departments
 * @access Private
 */
router.get('/departments', locationController.getDepartments);

/**
 * @route GET /api/locations/townships/:departmentId
 * @desc Get townships by department ID
 * @access Private
 */
router.get('/townships/:departmentId', locationController.getTownshipsByDepartment);

export default router;