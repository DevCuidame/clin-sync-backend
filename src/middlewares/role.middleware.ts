/**
 * Middleware de Control de Roles
 * Maneja la autorización basada en roles de usuario
 */

import { Request, Response, NextFunction } from 'express';
import  logger  from '../utils/logger';
import { AppDataSource } from '../core/config/database';
import { UserRole } from '../models/user-role.model';

/**
 * Interface extendida para Request con información de usuario
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    roles: string[];
    [key: string]: any;
  };
}

/**
 * Tipos de roles disponibles en el sistema
 */
export enum SystemRoles {
  ADMIN = 'admin',
  PROFESSIONAL = 'professional',
  CLIENT = 'client',
  MODERATOR = 'moderator'
}

/**
 * Middleware para restringir acceso basado en roles
 */
export function restrictTo(allowedRoles: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Acceso denegado. Usuario no autenticado.',
          error: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      // Obtener roles del usuario si no están en el request
      let userRoles = req.user.roles;
      if (!userRoles || userRoles.length === 0) {
        userRoles = await getUserRoles(req.user.id);
        req.user.roles = userRoles;
      }

      // Verificar si el usuario tiene al menos uno de los roles permitidos
      const hasPermission = allowedRoles.some(role => 
        userRoles.includes(role.toLowerCase())
      );

      if (!hasPermission) {
        logger.warn('Access denied - insufficient permissions', {
          userId: req.user.id,
          userEmail: req.user.email,
          userRoles,
          requiredRoles: allowedRoles,
          path: req.path,
          method: req.method
        });

        res.status(403).json({
          success: false,
          message: 'Acceso denegado. Permisos insuficientes.',
          error: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: allowedRoles,
          userRoles: userRoles
        });
        return;
      }

      logger.info('Access granted', {
        userId: req.user.id,
        userRoles,
        requiredRoles: allowedRoles,
        path: req.path,
        method: req.method
      });

      next();
    } catch (error) {
      logger.error('Error in role restriction middleware', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
}

/**
 * Middleware para verificar rol específico
 */
export function requireRole(role: string) {
  return restrictTo([role]);
}

/**
 * Middleware para verificar múltiples roles (el usuario debe tener TODOS)
 */
export function requireAllRoles(roles: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Acceso denegado. Usuario no autenticado.',
          error: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      let userRoles = req.user.roles;
      if (!userRoles || userRoles.length === 0) {
        userRoles = await getUserRoles(req.user.id);
        req.user.roles = userRoles;
      }

      // Verificar que el usuario tenga TODOS los roles requeridos
      const hasAllRoles = roles.every(role => 
        userRoles.includes(role.toLowerCase())
      );

      if (!hasAllRoles) {
        logger.warn('Access denied - missing required roles', {
          userId: req.user.id,
          userRoles,
          requiredRoles: roles,
          path: req.path
        });

        res.status(403).json({
          success: false,
          message: 'Acceso denegado. Se requieren todos los roles especificados.',
          error: 'MISSING_REQUIRED_ROLES',
          requiredRoles: roles,
          userRoles: userRoles
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Error in require all roles middleware', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
}

/**
 * Middleware para verificar si el usuario es administrador
 */
export const requireAdmin = requireRole(SystemRoles.ADMIN);

/**
 * Middleware para verificar si el usuario es profesional
 */
export const requireProfessional = requireRole(SystemRoles.PROFESSIONAL);

/**
 * Middleware para verificar si el usuario es cliente
 */
export const requireClient = requireRole(SystemRoles.CLIENT);

/**
 * Middleware para verificar si el usuario es admin o profesional
 */
export const requireAdminOrProfessional = restrictTo([SystemRoles.ADMIN, SystemRoles.PROFESSIONAL]);

/**
 * Middleware para verificar si el usuario puede acceder a sus propios recursos
 */
export function requireOwnershipOrRole(roles: string[], userIdParam: string = 'userId') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Acceso denegado. Usuario no autenticado.',
          error: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      // Obtener ID del usuario del parámetro o body
      const targetUserId = parseInt(req.params[userIdParam] || req.body[userIdParam]);
      
      // Si es el mismo usuario, permitir acceso
      if (req.user.id === targetUserId) {
        next();
        return;
      }

      // Si no es el mismo usuario, verificar roles
      let userRoles = req.user.roles;
      if (!userRoles || userRoles.length === 0) {
        userRoles = await getUserRoles(req.user.id);
        req.user.roles = userRoles;
      }

      const hasPermission = roles.some(role => 
        userRoles.includes(role.toLowerCase())
      );

      if (!hasPermission) {
        logger.warn('Access denied - not owner and insufficient roles', {
          userId: req.user.id,
          targetUserId,
          userRoles,
          requiredRoles: roles,
          path: req.path
        });

        res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo puedes acceder a tus propios recursos o necesitas permisos especiales.',
          error: 'OWNERSHIP_OR_ROLE_REQUIRED',
          requiredRoles: roles
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Error in ownership or role middleware', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
}

/**
 * Middleware condicional basado en roles
 */
export function conditionalRole(
  condition: (req: AuthenticatedRequest) => boolean,
  requiredRoles: string[]
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (condition(req)) {
      return restrictTo(requiredRoles)(req, res, next);
    }
    next();
  };
}

/**
 * Obtiene los roles de un usuario desde la base de datos
 */
async function getUserRoles(userId: number): Promise<string[]> {
  try {
    const userRoleRepository = AppDataSource.getRepository(UserRole);
    
    const userRoles = await userRoleRepository.find({
      where: { user: { id: userId } },
      relations: ['role']
    });

    return userRoles.map(userRole => userRole.role.role_name.toLowerCase());
  } catch (error) {
    logger.error('Error fetching user roles', { userId, error });
    return [];
  }
}

/**
 * Verifica si un usuario tiene un rol específico
 */
export async function userHasRole(userId: number, roleName: string): Promise<boolean> {
  try {
    const userRoles = await getUserRoles(userId);
    return userRoles.includes(roleName.toLowerCase());
  } catch (error) {
    logger.error('Error checking user role', { userId, roleName, error });
    return false;
  }
}

/**
 * Verifica si un usuario tiene alguno de los roles especificados
 */
export async function userHasAnyRole(userId: number, roleNames: string[]): Promise<boolean> {
  try {
    const userRoles = await getUserRoles(userId);
    return roleNames.some(role => userRoles.includes(role.toLowerCase()));
  } catch (error) {
    logger.error('Error checking user roles', { userId, roleNames, error });
    return false;
  }
}

/**
 * Verifica si un usuario tiene todos los roles especificados
 */
export async function userHasAllRoles(userId: number, roleNames: string[]): Promise<boolean> {
  try {
    const userRoles = await getUserRoles(userId);
    return roleNames.every(role => userRoles.includes(role.toLowerCase()));
  } catch (error) {
    logger.error('Error checking all user roles', { userId, roleNames, error });
    return false;
  }
}

/**
 * Middleware para logging de acceso basado en roles
 */
export function logRoleAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.user) {
    logger.info('Role-based access attempt', {
      userId: req.user.id,
      userEmail: req.user.email,
      userRoles: req.user.roles,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
  next();
}

/**
 * Middleware para verificar permisos específicos (extensible)
 */
export function requirePermission(permission: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Acceso denegado. Usuario no autenticado.',
          error: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      // Aquí se podría implementar un sistema más granular de permisos
      // Por ahora, mapear permisos a roles
      const permissionRoleMap: Record<string, string[]> = {
        'payments.create': [SystemRoles.ADMIN, SystemRoles.PROFESSIONAL, SystemRoles.CLIENT],
        'payments.refund': [SystemRoles.ADMIN, SystemRoles.PROFESSIONAL],
        'payments.view_all': [SystemRoles.ADMIN],
        'users.manage': [SystemRoles.ADMIN],
        'appointments.manage': [SystemRoles.ADMIN, SystemRoles.PROFESSIONAL],
        'reports.view': [SystemRoles.ADMIN, SystemRoles.PROFESSIONAL]
      };

      const requiredRoles = permissionRoleMap[permission];
      if (!requiredRoles) {
        logger.warn('Unknown permission requested', { permission, userId: req.user.id });
        res.status(403).json({
          success: false,
          message: 'Permiso no reconocido',
          error: 'UNKNOWN_PERMISSION'
        });
        return;
      }

      return restrictTo(requiredRoles)(req, res, next);
    } catch (error) {
      logger.error('Error in permission middleware', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
}