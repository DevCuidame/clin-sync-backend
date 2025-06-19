import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { BadRequestError } from '../../utils/error-handler';
import {
  ApiResponse,
  PaginationParams,
} from '../../core/interfaces/response.interface';
import { UpdatePasswordDto, UpdateUserDto } from './user.dto';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Obtener perfil del usuario autenticado
   * @route GET /api/users/profile
   */
  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Usuario no autenticado');
      }

      const user = await this.userService.getUserById(userId);

      const response: ApiResponse = {
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtener un usuario por ID
   * @route GET /api/users/:id
   */
  getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = parseInt(req.params.id);
      const user = await this.userService.getUserById(userId);

      const response: ApiResponse = {
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtener todos los usuarios (con paginación)
   * @route GET /api/users
   */
  getUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const params: PaginationParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sort: (req.query.sort as string) || 'id',
        order: (req.query.order as 'ASC' | 'DESC') || 'ASC',
      };

      const result = await this.userService.getUsers(params);

      const response: ApiResponse = {
        success: true,
        data: result.items,
        metadata: {
          totalItems: result.metadata.totalItems,
          itemCount: result.metadata.itemCount,
          totalPages: result.metadata.totalPages,
          currentPage: result.metadata.currentPage,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualizar perfil del usuario autenticado
   * @route PUT /api/users/profile
   */
  updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Usuario no autenticado');
      }

      const userData: UpdateUserDto = req.body;
      const updatedUser = await this.userService.updateUser(userId, userData);
      
      const response: ApiResponse = {
        success: true,
        message: 'Perfil actualizado correctamente',
        data: updatedUser,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualizar perfil del usuario autenticado incluyendo foto de perfil
   * @route PUT /api/users/profile-complete
   */
  updateProfileComplete = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Usuario no autenticado');
      }

      const userData: UpdateUserDto = req.body;
      const updatedUser = await this.userService.updateUserWithProfileImage(
        userId,
        userData
      );

      const response: ApiResponse = {
        success: true,
        message: 'Perfil y foto actualizados correctamente',
        data: updatedUser,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cambiar contraseña del usuario autenticado
   * @route PUT /api/users/change-password
   */
  changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Usuario no autenticado');
      }

      const {
        currentPassword,
        newPassword,
        confirmPassword,
      }: UpdatePasswordDto = req.body;

      // Verificar que las contraseñas coincidan
      if (newPassword !== confirmPassword) {
        throw new BadRequestError('Las contraseñas no coinciden');
      }

      await this.userService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      const response: ApiResponse = {
        success: true,
        message: 'Contraseña actualizada correctamente',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualizar imagen de perfil del usuario autenticado
   * @route PUT /api/users/profile-image
   */
  updateProfileImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Usuario no autenticado');
      }

      const { imageData, fileName } = req.body;

      if (!imageData) {
        throw new BadRequestError('No se proporcionó imagen');
      }

      const updatedUser = await this.userService.updateProfileImage(
        userId,
        imageData,
        fileName || 'profile-image'
      );

      const response: ApiResponse = {
        success: true,
        message: 'Imagen de perfil actualizada correctamente',
        data: { imageUrl: updatedUser.imagebs64 },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Asignar un rol a un usuario (solo administradores)
   * @route POST /api/users/:id/roles/:roleId
   */
  assignRole = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = parseInt(req.params.id);
      const roleId = parseInt(req.params.roleId);

      const result = await this.userService.assignRole(userId, roleId);

      const response: ApiResponse = {
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Eliminar un rol de un usuario (solo administradores)
   * @route DELETE /api/users/:id/roles/:roleId
   */
  removeRole = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = parseInt(req.params.id);
      const roleId = parseInt(req.params.roleId);

      const result = await this.userService.removeRole(userId, roleId);

      const response: ApiResponse = {
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Eliminar cuenta del usuario autenticado
   * @route DELETE /api/users/account
   */
  deleteAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Usuario no autenticado');
      }

      const result = await this.userService.deleteAccount(userId);

      const response: ApiResponse = {
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtener información completa del usuario autenticado
   * @route GET /api/users/complete-info
   */
  getUserCompleteInfo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('Usuario no autenticado');
      }

      const userCompleteInfo = await this.userService.getUserCompleteInfo(userId);

      const response: ApiResponse = {
        success: true,
        data: userCompleteInfo,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtener información completa de cualquier usuario (solo admin)
   * @route GET /api/users/:id/complete-info
   */
  getUserCompleteInfoById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = parseInt(req.params.id);

      if (!userId || isNaN(userId)) {
        throw new BadRequestError('ID de usuario inválido');
      }

      const userCompleteInfo = await this.userService.getUserCompleteInfo(userId);

      const response: ApiResponse = {
        success: true,
        data: userCompleteInfo,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };


  // ... existing code ...

/**
 * Obtener información completa de todos los usuarios
 * @route GET /api/users/all-complete-info
 */
getAllUsersCompleteInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const params: PaginationParams = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sort: (req.query.sort as string) || 'id',
      order: (req.query.order as 'ASC' | 'DESC') || 'ASC',
    };

    const result = await this.userService.getAllUsersCompleteInfo(params);

    const response: ApiResponse = {
      success: true,
      data: result.items,
      metadata: {
        totalItems: result.metadata.totalItems,
        itemCount: result.metadata.itemCount,
        totalPages: result.metadata.totalPages,
        currentPage: result.metadata.currentPage,
      },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

}
