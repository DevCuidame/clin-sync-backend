"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const error_handler_1 = require("../utils/error-handler");
const logger_1 = __importDefault(require("../utils/logger"));
const environment_1 = __importDefault(require("../core/config/environment"));
/**
 * Manejador de errores para errores de desarrollo
 */
const sendErrorDev = (err, res) => {
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
const sendErrorProd = (err, res) => {
    // Errores operacionales confiables: enviar mensaje al cliente
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message
        });
    }
    else {
        // Errores de programación o desconocidos: no filtrar detalles
        logger_1.default.error('ERROR 💥:', err);
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
const handleTypeOrmError = (err) => {
    if (err.code === '23505') { // Error de unicidad
        const field = err.detail.match(/\((.*?)\)/)?.[1] || 'campo';
        return new error_handler_1.AppError(`El valor para '${field}' ya existe. Por favor use otro valor.`, 400);
    }
    if (err.code === '23503') { // Error de clave foránea
        return new error_handler_1.AppError('Esta operación no se puede completar debido a restricciones relacionales.', 400);
    }
    return new error_handler_1.AppError('Error en la base de datos.', 500);
};
/**
 * Middleware para manejar errores de JWT
 */
const handleJWTError = () => new error_handler_1.AppError('Token inválido. Por favor inicie sesión nuevamente.', 401);
/**
 * Middleware para manejar errores de expiración de JWT
 */
const handleJWTExpiredError = () => new error_handler_1.AppError('Su sesión ha expirado. Por favor inicie sesión nuevamente.', 401);
/**
 * Middleware principal para el manejo de errores
 */
const errorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (environment_1.default.env === 'development') {
        sendErrorDev(err, res);
    }
    else if (environment_1.default.env === 'production') {
        let error = { ...err };
        error.message = err.message;
        // Errores específicos
        if (error.name === 'QueryFailedError')
            error = handleTypeOrmError(error);
        if (error.name === 'JsonWebTokenError')
            error = handleJWTError();
        if (error.name === 'TokenExpiredError')
            error = handleJWTExpiredError();
        sendErrorProd(error, res);
    }
};
exports.errorMiddleware = errorMiddleware;
