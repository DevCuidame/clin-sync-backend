"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_2 = require("./core/config/express");
const database_1 = require("./core/config/database");
const routes_1 = __importDefault(require("./routes"));
const environment_1 = __importDefault(require("./core/config/environment"));
const logger_1 = __importDefault(require("./utils/logger"));
const cors_middleware_1 = require("./middlewares/cors.middleware");
const app = (0, express_1.default)();
app.use(cors_middleware_1.corsMiddleware);
(0, express_2.setupExpress)(app);
// Middleware de logging para debug
app.use((req, res, next) => {
    logger_1.default.info(`📥 ${req.method} ${req.url}`);
    next();
});
// Ruta de health check ANTES de las rutas principales
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is running',
        timestamp: new Date(),
        environment: environment_1.default.env,
    });
});
// IMPORTANTE: Definir rutas de la API
logger_1.default.info(`🔧 Mounting routes on: ${environment_1.default.server.apiPrefix}`);
app.use(environment_1.default.server.apiPrefix, routes_1.default);
// Middleware de debug para ver qué rutas están registradas
app.use((req, res, next) => {
    logger_1.default.warn(`🔍 Route not found: ${req.method} ${req.originalUrl}`);
    next();
});
// Ruta 404 para rutas no encontradas (DEBE IR AL FINAL)
app.use('*', (req, res) => {
    logger_1.default.error(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.originalUrl}`,
        timestamp: new Date().toISOString(),
    });
});
// Inicializar conexión a la base de datos
const initializeDatabase = async () => {
    try {
        await database_1.AppDataSource.initialize();
        logger_1.default.info('✅ Conexión a la base de datos establecida');
    }
    catch (error) {
        logger_1.default.error('❌ Error al conectar a la base de datos:', error);
        throw error;
    }
};
// Función para inicializar la aplicación
const initializeApp = async () => {
    try {
        await initializeDatabase();
        // Debug: Mostrar rutas registradas
        app._router.stack.forEach((middleware) => {
            if (middleware.route) {
            }
            else if (middleware.name === 'router') {
                middleware.handle.stack.forEach((handler) => {
                    if (handler.route) {
                        logger_1.default.info(`📍 Nested Route: ${handler.route.path}`);
                    }
                });
            }
        });
        logger_1.default.info('✅ Aplicación inicializada correctamente');
    }
    catch (error) {
        logger_1.default.error('❌ Error al inicializar la aplicación:', error);
        process.exit(1);
    }
};
// Inicializar aplicación
initializeApp();
exports.default = app;
