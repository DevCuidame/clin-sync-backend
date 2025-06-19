import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth/auth.service';
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto } from '../auth/auth.dto';
import { ApiResponse } from '../../core/interfaces/response.interface';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Iniciar sesión de usuario
   * @route POST /api/auth/login
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const credentials: LoginDto = req.body;
      const result = await this.authService.login(credentials);
      
      const response: ApiResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refrescar token de acceso
   * @route POST /api/auth/refresh-token
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log("🚀 ~ AuthController ~ refreshToken ~ req.body:", req.body)
      const { refresh_token } = req.body;
      
      if (!refresh_token) {
        res.status(400).json({
          success: false,
          message: 'Refresh token no proporcionado',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      const result = await this.authService.refreshToken({ refresh_token });
      
      const response: ApiResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Registrar un nuevo usuario
   * @route POST /api/auth/register
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: RegisterDto = req.body;
      const result = await this.authService.register(userData);
      
      const response: ApiResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        timestamp: new Date().toISOString()
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Solicitar restablecimiento de contraseña
   * @route POST /api/auth/forgot-password
   */
  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email }: ForgotPasswordDto = req.body;
      const result = await this.authService.forgotPassword(email);
      
      const response: ApiResponse = {
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Restablecer contraseña
   * @route POST /api/auth/reset-password
   */
  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, password, confirmPassword }: ResetPasswordDto = req.body;
      
      // Verificar que las contraseñas coincidan
      if (password !== confirmPassword) {
        res.status(400).json({
          success: false,
          message: 'Las contraseñas no coinciden',
          timestamp: new Date().toISOString()
        });
      }
      
      const result = await this.authService.resetPassword(token, password);
      
      const response: ApiResponse = {
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verificar correo electrónico
   * @route GET /api/auth/verify-email/:token
   */
  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params;
      const result = await this.authService.verifyEmail(token);
      
      const response: ApiResponse = {
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cerrar sesión
   * @route POST /api/auth/logout
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(200).json({
          success: true,
          message: 'No hay sesión activa',
          timestamp: new Date().toISOString()
        });
      }
      
      const result = await this.authService.logout(userId);
      
      const response: ApiResponse = {
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verificar contraseña para eliminación de cuenta
   * @route POST /api/auth/verify-password
   */
  verifyPasswordForDeletion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { password } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'No autorizado',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await this.authService.verifyPasswordForDeletion(userId, password);
      
      const response: ApiResponse = {
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtener información para eliminación de cuenta
   * @route GET /api/auth/account-deletion-info
   */
  getAccountDeletionInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.getAccountDeletionInfo();
      
      const response: ApiResponse = {
        success: true,
        message: 'Información obtenida correctamente',
        data: result,
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Eliminar cuenta de usuario
   * @route DELETE /api/auth/delete-account
   */
  deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleteData = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'No autorizado',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await this.authService.deleteAccount(userId, deleteData);
      
      const response: ApiResponse = {
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cambiar contraseña de usuario
   * @route PUT /api/auth/change-password
   */
  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'No autorizado',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await this.authService.changePassword(userId, currentPassword, newPassword);
      
      const response: ApiResponse = {
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}