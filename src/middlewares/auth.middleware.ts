import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/error-handler';
import config from '../core/config/environment';
import { AppDataSource } from '../core/config/database';
import { User } from '../models/user.model';

// Extender interface de Request para incluir usuario
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Middleware que verifica el token JWT y añade el usuario a la petición
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new UnauthorizedError('No ha iniciado sesión. Por favor inicie sesión para acceder.'));
    }

    // 2) Verificar token
    const decoded: any = jwt.verify(token, config.jwt.secret);

    // Rechazar refresh tokens en rutas protegidas
    if (decoded.type === 'refresh') {
      return next(
        new UnauthorizedError('Tipo de token inválido. Use un token de acceso para esta operación.')
      );
    }

    // 3) Comprobar si el usuario todavía existe
    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({ 
      where: { id: decoded.id }
    });

    if (!currentUser) {
      return next(
        new UnauthorizedError('El usuario asociado a este token ya no existe.')
      );
    }

    // 4) Añadir el usuario a req
    req.user = currentUser;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Token inválido. Por favor inicie sesión de nuevo.'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Su sesión ha expirado. Por favor inicie sesión de nuevo.'));
    }
    next(error);
  }
};

/**
 * Middleware que verifica que un token es un refresh token válido
 */
export const refreshTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return next(new UnauthorizedError('Refresh token no proporcionado.'));
    }

    // Verificar token
    const decoded: any = jwt.verify(refresh_token, config.jwt.secret);

    // Verificar que sea un refresh token
    if (decoded.type !== 'refresh') {
      return next(
        new UnauthorizedError('Token inválido. Se requiere un refresh token.')
      );
    }

    // Comprobar si el usuario todavía existe
    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({ 
      where: { id: decoded.id }
    });

    if (!currentUser) {
      return next(
        new UnauthorizedError('El usuario asociado a este token ya no existe.')
      );
    }

    // Añadir el usuario a req
    req.user = currentUser;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Token inválido.'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('El refresh token ha expirado.'));
    }
    next(error);
  }
};

/**
 * Middleware que restringe acceso a ciertos roles
 */
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('No tiene permiso para realizar esta acción'));
    }
    
    // if (!roles.includes(req.user.role)) {
    //   return next(
    //     new UnauthorizedError('No tiene permiso para realizar esta acción')
    //   );
    // }

    next();
  };
};