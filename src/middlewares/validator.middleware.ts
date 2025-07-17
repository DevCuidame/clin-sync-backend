import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BadRequestError } from '../utils/error-handler';

/**
 * Middleware para validar los datos de petición según el DTO especificado
 * @param dto - La clase DTO a usar para validación
 * @param source - Fuente de datos a validar (body, query, params)
 */
export const validateDto = (dto: any, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dtoObj = plainToInstance(dto, req[source]);
      
      // Validar
      const errors: ValidationError[] = await validate(dtoObj, {
        whitelist: true,
        forbidNonWhitelisted: true
      });
      
      if (errors.length > 0) {
        // Log detallado para webhooks
        if (req.path.includes('/webhooks')) {
          console.log('🔍 Webhook validation failed:', {
            path: req.path,
            method: req.method,
            headers: req.headers,
            bodyKeys: Object.keys(req[source] || {}),
            bodyPreview: JSON.stringify(req[source]).substring(0, 500),
            validationErrors: errors.map(error => ({
              property: error.property,
              value: error.value,
              constraints: error.constraints
            }))
          });
        }
        
        // Formatear errores para una mejor experiencia de usuario
        const formattedErrors = errors.map(error => {
          const constraints = error.constraints || {};
          return {
            property: error.property,
            value: error.value,
            messages: Object.values(constraints)
          };
        });
        
        return next(new BadRequestError(`Validación fallida: ${JSON.stringify(formattedErrors)}`));
      }
      
      // Si no hay errores, continuar
      req[source] = dtoObj;
      next();
    } catch (error) {
      console.error('❌ Error in validateDto middleware:', error);
      return next(new BadRequestError('Error en la validación de datos'));
    }
  };
};