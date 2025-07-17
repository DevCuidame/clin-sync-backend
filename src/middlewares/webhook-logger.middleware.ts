import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Middleware específico para logging detallado de webhooks
 * Captura información completa del request antes de cualquier procesamiento
 */
export const webhookLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Solo aplicar a rutas de webhooks
  if (!req.path.includes('/webhooks')) {
    return next();
  }

  const startTime = Date.now();
  
  // Capturar información completa del request
  const requestInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
    headers: {
      'x-signature': req.headers['x-signature'] ? 
        (req.headers['x-signature'] as string).substring(0, 10) + '...' : 'missing',
      'x-timestamp': req.headers['x-timestamp'] || 'missing',
      'x-event-id': req.headers['x-event-id'] || 'missing',
      'authorization': req.headers['authorization'] ? 'present' : 'missing'
    },
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
    bodyStructure: req.body ? {
      hasEvent: !!req.body.event,
      hasData: !!req.body.data,
      hasTimestamp: !!req.body.timestamp,
      hasSignature: !!req.body.signature,
      hasEnvironment: !!req.body.environment,
      eventType: req.body.event,
      environment: req.body.environment,
      dataKeys: req.body.data ? Object.keys(req.body.data) : []
    } : null
  };

  logger.info('📥 Webhook request received', requestInfo);

  // Interceptar la respuesta para logging
  const originalSend = res.send;
  res.send = function(body: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    logger.info('📤 Webhook response sent', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: body ? body.length : 0,
      success: res.statusCode >= 200 && res.statusCode < 300
    });
    
    return originalSend.call(this, body);
  };

  next();
};

/**
 * Middleware para capturar errores específicos de webhooks
 */
export const webhookErrorMiddleware = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (!req.path.includes('/webhooks')) {
    return next(error);
  }

  logger.error('❌ Webhook processing error', {
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack,
      statusCode: error.statusCode
    },
    request: {
      method: req.method,
      path: req.path,
      headers: req.headers,
      bodyPreview: req.body ? JSON.stringify(req.body).substring(0, 200) : 'empty'
    }
  });

  next(error);
};