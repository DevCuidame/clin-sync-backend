import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error-handler';
import logger from '../utils/logger';
import config from '../core/config/environment';

/**
 * Manejador de errores para errores de desarrollo
 */
const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err
  });
};

/**
 * Manejador de errores para errores de producción
 */
const sendErrorProd = (err: AppError, res: Response) => {
  // Errores operacionales confiables: enviar mensaje al cliente
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message
    });
  } else {
    // Errores de programación o desconocidos: no filtrar detalles
    logger.error('ERROR 💥:', err);
    
    // Enviar mensaje genérico
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Algo salió mal'
    });
  }
};

/**
 * Middleware para manejar errores en TypeORM
 */
const handleTypeOrmError = (err: any): AppError => {
  if (err.code === '23505') { // Error de unicidad
    const field = err.detail.match(/\((.*?)\)/)?.[1] || 'campo';
    return new AppError(`El valor para '${field}' ya existe. Por favor use otro valor.`, 400);
  }
  
  if (err.code === '23503') { // Error de clave foránea
    return new AppError('Esta operación no se puede completar debido a restricciones relacionales.', 400);
  }
  
  return new AppError('Error en la base de datos.', 500);
};

/**
 * Middleware para manejar errores de JWT
 */
const handleJWTError = () => 
  new AppError('Token inválido. Por favor inicie sesión nuevamente.', 401);

/**
 * Middleware para manejar errores de expiración de JWT
 */
const handleJWTExpiredError = () => 
  new AppError('Su sesión ha expirado. Por favor inicie sesión nuevamente.', 401);

/**
 * Middleware principal para el manejo de errores
 */
export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (config.env === 'development') {
    sendErrorDev(err, res);
  } else if (config.env === 'production') {
    let error = { ...err };
    error.message = err.message;
    
    // Errores específicos
    if (error.name === 'QueryFailedError') error = handleTypeOrmError(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    
    sendErrorProd(error, res);
  }
};