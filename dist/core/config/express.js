"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupExpress = void 0;
// src/core/config/express.ts
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const environment_1 = __importDefault(require("./environment"));
const error_middleware_1 = require("../../middlewares/error.middleware");
const path_1 = __importDefault(require("path"));
const setupExpress = (existingApp) => {
    const app = existingApp || (0, express_1.default)();
    // Middleware básicos
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Seguridad
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: false,
    }));
    // Logging
    if (environment_1.default.env === 'development') {
        app.use((0, morgan_1.default)('dev'));
    }
    else {
        app.use((0, morgan_1.default)('combined'));
    }
    // Configurar carpetas estáticas según configuración
    if (environment_1.default.enableCorsHandling) {
        // Si Apache maneja CORS, servir archivos sin headers adicionales
        // Primero intentar con la ruta absoluta si existe
        const absoluteUploadPath = '/home/developer/uploads';
        if (require('fs').existsSync(absoluteUploadPath)) {
            app.use('/uploads', express_1.default.static(absoluteUploadPath));
        }
        // Luego usar la ruta relativa configurada
        app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), environment_1.default.fileUpload.path)));
    }
    else {
        // Si Node.js maneja CORS, agregar headers a archivos estáticos
        // Middleware para agregar headers CORS a rutas /uploads
        app.use('/uploads', (req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Cross-Origin-Resource-Policy', 'cross-origin');
            next();
        });
        // Servir archivos estáticos con headers CORS
        const absoluteUploadPath = '/home/developer/uploads';
        if (require('fs').existsSync(absoluteUploadPath)) {
            app.use('/uploads', express_1.default.static(absoluteUploadPath, {
                setHeaders: (res) => {
                    res.set('Access-Control-Allow-Origin', '*');
                    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
                },
            }));
        }
        app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), environment_1.default.fileUpload.path), {
            setHeaders: (res) => {
                res.set('Access-Control-Allow-Origin', '*');
                res.set('Cross-Origin-Resource-Policy', 'cross-origin');
            },
        }));
    }
    // Ruta de estado
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'success',
            message: 'API is running',
            timestamp: new Date(),
            environment: environment_1.default.env,
        });
    });
    // Middleware global para manejo de errores debe ser el último
    app.use(error_middleware_1.errorMiddleware);
    return app;
};
exports.setupExpress = setupExpress;
