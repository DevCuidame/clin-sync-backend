import express, { Request, Response, NextFunction } from 'express';
import { setupExpress } from './core/config/express';
import { AppDataSource } from './core/config/database';
import routes from './routes';
import config from './core/config/environment';
import logger from './utils/logger';
import { corsMiddleware } from './middlewares/cors.middleware';
import { initializeDatabaseCleanup, shutdownDatabaseCleanup } from './modules/database-cleanup';

const app = express();

app.use(corsMiddleware);

setupExpress(app);


// Middleware de logging para debug
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`📥 ${req.method} ${req.url}`);
  next();
});

// Ruta de health check ANTES de las rutas principales
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date(),
    environment: config.env,
  });
});

// IMPORTANTE: Definir rutas de la API
logger.info(`🔧 Mounting routes on: ${config.server.apiPrefix}`);
app.use(config.server.apiPrefix, routes);

// Middleware de debug para ver qué rutas están registradas
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.warn(`🔍 Route not found: ${req.method} ${req.originalUrl}`);
  next();
});


// Ruta 404 para rutas no encontradas (DEBE IR AL FINAL)
app.use('*', (req: Request, res: Response) => {
  logger.error(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

// Inicializar conexión a la base de datos
const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    logger.info('✅ Conexión a la base de datos establecida');
  } catch (error) {
    logger.error('❌ Error al conectar a la base de datos:', error);
    throw error;
  }
};

// Función para inicializar la aplicación
const initializeApp = async (): Promise<void> => {
  try {
    await initializeDatabase();
    
    // Inicializar módulo de limpieza de base de datos
    initializeDatabaseCleanup();
    
    // Debug: Mostrar rutas registradas
    app._router.stack.forEach((middleware: any) => {
      if (middleware.route) {
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach((handler: any) => {
          if (handler.route) {
            logger.info(`📍 Nested Route: ${handler.route.path}`);
          }
        });
      }
    });
    
    logger.info('✅ Aplicación inicializada correctamente');
  } catch (error) {
    logger.error('❌ Error al inicializar la aplicación:', error);
    process.exit(1);
  }
};

// Manejar cierre graceful de la aplicación
process.on('SIGTERM', () => {
  logger.info('🔄 Recibida señal SIGTERM, cerrando aplicación...');
  shutdownDatabaseCleanup();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('🔄 Recibida señal SIGINT, cerrando aplicación...');
  shutdownDatabaseCleanup();
  process.exit(0);
});

// Inicializar aplicación
initializeApp();

export default app;