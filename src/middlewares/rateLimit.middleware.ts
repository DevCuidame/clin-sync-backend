/**
 * Middleware de Rate Limiting
 * Implementación para controlar la frecuencia de requests
 */

import { Request, Response, NextFunction } from 'express';
import logger  from '../utils/logger';

interface RateLimitOptions {
  windowMs: number; // Ventana de tiempo en milisegundos
  max: number; // Máximo número de requests por ventana
  message?: any; // Mensaje de error personalizado
  standardHeaders?: boolean; // Incluir headers estándar de rate limit
  legacyHeaders?: boolean; // Incluir headers legacy
  skipSuccessfulRequests?: boolean; // No contar requests exitosos
  skipFailedRequests?: boolean; // No contar requests fallidos
  keyGenerator?: (req: Request) => string; // Función para generar la clave única
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

// Store en memoria para rate limiting (en producción usar Redis)
const rateLimitStore = new Map<string, RateLimitInfo>();

/**
 * Limpia entradas expiradas del store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, info] of rateLimitStore.entries()) {
    if (now > info.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Limpiar entradas expiradas cada 5 minutos
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Genera una clave única para el rate limiting
 */
function defaultKeyGenerator(req: Request): string {
  // Usar IP del cliente como clave por defecto
  const forwarded = req.headers['x-forwarded-for'] as string;
  const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
  return `rate_limit:${ip}`;
}

/**
 * Middleware de rate limiting
 */
export function rateLimitMiddleware(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = {
      success: false,
      message: 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
      error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders = true,
    legacyHeaders = false,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const resetTime = now + windowMs;

    // Obtener información actual del rate limit
    let rateLimitInfo = rateLimitStore.get(key);

    // Si no existe o ha expirado, crear nueva entrada
    if (!rateLimitInfo || now > rateLimitInfo.resetTime) {
      rateLimitInfo = {
        count: 0,
        resetTime
      };
      rateLimitStore.set(key, rateLimitInfo);
    }

    // Incrementar contador
    rateLimitInfo.count++;

    // Calcular valores para headers
    const remaining = Math.max(0, max - rateLimitInfo.count);
    const resetTimeSeconds = Math.ceil(rateLimitInfo.resetTime / 1000);

    // Agregar headers estándar
    if (standardHeaders) {
      res.set({
        'RateLimit-Limit': max.toString(),
        'RateLimit-Remaining': remaining.toString(),
        'RateLimit-Reset': resetTimeSeconds.toString()
      });
    }

    // Agregar headers legacy
    if (legacyHeaders) {
      res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTimeSeconds.toString()
      });
    }

    // Verificar si se ha excedido el límite
    if (rateLimitInfo.count > max) {
      logger.warn('Rate limit exceeded', {
        key,
        count: rateLimitInfo.count,
        max,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });

      // Agregar header de retry-after
      const retryAfter = Math.ceil((rateLimitInfo.resetTime - now) / 1000);
      res.set('Retry-After', retryAfter.toString());

      return res.status(429).json(message);
    }

    // Middleware para manejar skip de requests exitosos/fallidos
    const originalSend = res.send;
    res.send = function(body) {
      const statusCode = res.statusCode;
      
      // Decrementar contador si se debe omitir este request
      if (
        (skipSuccessfulRequests && statusCode >= 200 && statusCode < 300) ||
        (skipFailedRequests && statusCode >= 400)
      ) {
        rateLimitInfo!.count--;
      }

      return originalSend.call(this, body);
    };

    next();
  };
}

/**
 * Rate limiter específico para autenticación
 */
export const authRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por IP
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Intenta nuevamente en 15 minutos.',
    error: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true // No contar logins exitosos
});

/**
 * Rate limiter general para API
 */
export const apiRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
    error: 'API_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Rate limiter estricto para operaciones sensibles
 */
export const strictRateLimit = rateLimitMiddleware({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 intentos por hora
  message: {
    success: false,
    message: 'Límite de operaciones sensibles excedido. Intenta nuevamente en 1 hora.',
    error: 'STRICT_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Rate limiter para webhooks
 */
export const webhookRateLimit = rateLimitMiddleware({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 webhooks por minuto
  message: {
    success: false,
    message: 'Demasiados webhooks recibidos',
    error: 'WEBHOOK_RATE_LIMIT_EXCEEDED'
  },
  keyGenerator: (req: Request) => {
    // Para webhooks, usar una combinación de IP y User-Agent
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';
    return `webhook_rate_limit:${ip}:${userAgent}`;
  }
});

/**
 * Rate limiter personalizado por usuario autenticado
 */
export function createUserRateLimit(options: Omit<RateLimitOptions, 'keyGenerator'>) {
  return rateLimitMiddleware({
    ...options,
    keyGenerator: (req: Request) => {
      // Usar ID de usuario si está autenticado, sino IP
      const userId = (req as any).user?.id;
      if (userId) {
        return `user_rate_limit:${userId}`;
      }
      return defaultKeyGenerator(req);
    }
  });
}

/**
 * Obtiene estadísticas del rate limiting
 */
export function getRateLimitStats(): {
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
} {
  const now = Date.now();
  let activeEntries = 0;
  let expiredEntries = 0;

  for (const [, info] of rateLimitStore.entries()) {
    if (now > info.resetTime) {
      expiredEntries++;
    } else {
      activeEntries++;
    }
  }

  return {
    totalEntries: rateLimitStore.size,
    activeEntries,
    expiredEntries
  };
}

/**
 * Limpia manualmente todas las entradas del rate limit
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
  logger.info('Rate limit store cleared');
}

/**
 * Obtiene información de rate limit para una clave específica
 */
export function getRateLimitInfo(key: string): RateLimitInfo | null {
  return rateLimitStore.get(key) || null;
}