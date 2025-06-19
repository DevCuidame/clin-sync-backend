// src/core/config/express.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './environment';
import { errorMiddleware } from '../../middlewares/error.middleware';
import path from 'path';

export const setupExpress = (existingApp?: Application): Application => {
  const app: Application = existingApp || express();
  
  // Middleware básicos
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Seguridad
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );

  // Logging
  if (config.env === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Configurar carpetas estáticas según configuración
  if (!config.enableCorsHandling) {
    // Usar la ruta configurada en lugar de hardcodeada
    const absoluteUploadPath = path.isAbsolute(config.fileUpload.path) 
      ? config.fileUpload.path 
      : path.join(process.cwd(), config.fileUpload.path);
      
    if (require('fs').existsSync(absoluteUploadPath)) {
      app.use('/uploads', express.static(absoluteUploadPath));
    }
    
    // Luego usar la ruta relativa configurada
    app.use(
      '/uploads',
      express.static(path.join(process.cwd(), config.fileUpload.path))
    );
  } else {
    // Si Node.js maneja CORS, agregar headers a archivos estáticos
    
    // Middleware para agregar headers CORS a rutas /uploads
    app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Cross-Origin-Resource-Policy', 'cross-origin');
      next();
    });
    
    // Usar la ruta configurada en lugar de hardcodeada
    const absoluteUploadPath = path.isAbsolute(config.fileUpload.path) 
      ? config.fileUpload.path 
      : path.join(process.cwd(), config.fileUpload.path);
      
    if (require('fs').existsSync(absoluteUploadPath)) {
      app.use('/uploads', express.static(absoluteUploadPath, {
        setHeaders: (res) => {
          res.set('Access-Control-Allow-Origin', '*');
          res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        },
      }));
    }
    
    app.use(
      '/uploads',
      express.static(path.join(process.cwd(), config.fileUpload.path), {
        setHeaders: (res) => {
          res.set('Access-Control-Allow-Origin', '*');
          res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        },
      })
    );
  }

  // Ruta de estado
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      message: 'API is running',
      timestamp: new Date(),
      environment: config.env,
    });
  });

  // Middleware global para manejo de errores debe ser el último
  app.use(errorMiddleware);

  return app;
};