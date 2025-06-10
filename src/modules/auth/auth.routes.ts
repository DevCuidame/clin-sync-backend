import { Router } from 'express';
import { AuthController } from '../auth/auth.controller';
import { validateDto } from '../../middlewares/validator.middleware';
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto, VerifyPasswordDto, DeleteAccountDto, ChangePasswordDto } from '../auth/auth.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const authController = new AuthController();

/**
 * @route POST /api/auth/login
 * @desc Login user and return JWT token
 * @access Public
 */
router.post('/login', validateDto(LoginDto), authController.login);

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validateDto(RegisterDto), authController.register);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh access token using a refresh token
 * @access Public
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password', validateDto(ForgotPasswordDto), authController.forgotPassword);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', validateDto(ResetPasswordDto), authController.resetPassword);

/**
 * @route GET /api/auth/verify-email/:token
 * @desc Verify email with token
 * @access Public
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @route POST /api/auth/verify-password
 * @desc Verificar contraseña para eliminación de cuenta
 * @access Private
 */
router.post('/verify-password', authMiddleware, validateDto(VerifyPasswordDto), authController.verifyPasswordForDeletion);

/**
 * @route GET /api/auth/account-deletion-info
 * @desc Obtener información para eliminación de cuenta
 * @access Private
 */
router.get('/account-deletion-info', authMiddleware, authController.getAccountDeletionInfo);

/**
 * @route DELETE /api/auth/delete-account
 * @desc Eliminar cuenta de usuario
 * @access Private
 */
router.delete('/delete-account', authMiddleware, validateDto(DeleteAccountDto), authController.deleteAccount);

/**
 * @route PUT /api/auth/change-password
 * @desc Cambiar contraseña de usuario
 * @access Private
 */
router.put('/change-password', authMiddleware, validateDto(ChangePasswordDto), authController.changePassword);

export default router;