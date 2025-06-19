import { Router } from 'express';
import { UserController } from './user.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validateDto } from '../../middlewares/validator.middleware';
import { UpdatePasswordDto, UpdateUserDto } from './user.dto';
import { restrictTo } from '../../middlewares/role.middleware';

const router = Router();
const userController = new UserController();

/**
 * Routes that require authentication
 */
router.use(authMiddleware);

/**
 * @route GET /api/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', userController.getProfile);

/**
 * @route PUT /api/users/profile
 * @desc Update current user profile
 * @access Private
 */
router.put('/profile', validateDto(UpdateUserDto), userController.updateProfile);

/**
 * @route PUT /api/users/change-password
 * @desc Change current user password
 * @access Private
 */
router.put('/change-password', validateDto(UpdatePasswordDto), userController.changePassword);

/**
 * @route PUT /api/users/profile-image
 * @desc Update current user profile image
 * @access Private
 */
router.put('/profile-image', userController.updateProfileImage);

/**
 * @route PUT /api/users/profile-complete
 * @desc Update current user profile with profile image
 * @access Private
 */
router.put('/profile-complete', validateDto(UpdateUserDto), userController.updateProfileComplete);

/**
 * @route DELETE /api/users/account
 * @desc Delete current user account
 * @access Private
 */
router.delete('/account', userController.deleteAccount);

// Información completa del usuario autenticado
router.get('/complete-info', userController.getUserCompleteInfo);

/**
 * Routes that require admin role
 */
router.use(restrictTo(['admin']));

/**
 * @route GET /api/users/all-complete-info
 * @desc Get complete info for all users
 * @access Private (Admin only)
 */
router.get('/all-complete-info', userController.getAllUsersCompleteInfo);

/**
 * @route GET /api/users
 * @desc Get all users with pagination
 * @access Private (Admin only)
 */
router.get('/', userController.getUsers);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private (Admin only)
 */
router.get('/:id', userController.getUserById);

/**
 * @route POST /api/users/:id/roles/:roleId
 * @desc Assign role to user
 * @access Private (Admin only)
 */
router.post('/:id/roles/:roleId', userController.assignRole);

/**
 * @route DELETE /api/users/:id/roles/:roleId
 * @desc Remove role from user
 * @access Private (Admin only)
 */
router.delete('/:id/roles/:roleId', userController.removeRole);

// Información completa de cualquier usuario (solo admin)
router.get('/:id/complete-info', userController.getUserCompleteInfoById);



export default router;