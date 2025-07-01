import { Request, Response, NextFunction } from 'express';
import { RoleRepository } from './role.repository';
import { NotFoundError } from '../../utils/error-handler';
import { ApiResponse } from '../../core/interfaces/response.interface';

export class RoleController {
  private roleRepository: RoleRepository;

  constructor() {
    this.roleRepository = new RoleRepository();
  }

  /**
   * Obtiene todos los roles activos
   * @route GET /api/roles
   */
  getAllRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = await this.roleRepository.findAll({
        where: { is_active: true },
        order: { role_name: 'ASC' }
      });

      const response: ApiResponse = {
        success: true,
        message: 'Roles obtenidos exitosamente',
        data: roles,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene un rol por ID
   * @route GET /api/roles/:id
   */
  getRoleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const role = await this.roleRepository.findById(parseInt(id));

      if (!role) {
        throw new NotFoundError('Rol no encontrado');
      }

      const response: ApiResponse = {
        success: true,
        message: 'Rol obtenido exitosamente',
        data: role,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene un rol por nombre
   * @route GET /api/roles/name/:name
   */
  getRoleByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = req.params;
      const role = await this.roleRepository.findByName(name);

      if (!role) {
        throw new NotFoundError('Rol no encontrado');
      }

      const response: ApiResponse = {
        success: true,
        message: 'Rol obtenido exitosamente',
        data: role,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}

export const roleController = new RoleController();