"use strict";
/**
 * Middleware de Validación
 * Maneja la validación de requests usando express-validator
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDevRequest = exports.validateStrictRequest = exports.validateJsonRequest = void 0;
exports.validateRequest = validateRequest;
exports.createValidationMiddleware = createValidationMiddleware;
exports.conditionalValidation = conditionalValidation;
exports.sanitizeRequest = sanitizeRequest;
exports.validateContentType = validateContentType;
exports.validateBodySize = validateBodySize;
exports.createCompleteValidation = createCompleteValidation;
const express_validator_1 = require("express-validator");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Middleware para validar requests usando express-validator
 */
function validateRequest(req, res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const formattedErrors = formatValidationErrors(errors.array());
        logger_1.default.warn('Request validation failed', {
            path: req.path,
            method: req.method,
            errors: formattedErrors,
            body: req.body,
            query: req.query,
            params: req.params
        });
        res.status(400).json({
            success: false,
            message: 'Datos de entrada no válidos',
            errors: formattedErrors,
            errorCount: formattedErrors.length
        });
        return;
    }
    next();
}
/**
 * Formatea los errores de validación para una mejor experiencia de usuario
 */
function formatValidationErrors(errors) {
    return errors.map(error => {
        // Type guard to check if it's a FieldValidationError
        if (error.type === 'field') {
            const fieldError = error;
            return {
                field: fieldError.path || 'unknown',
                value: fieldError.value,
                message: fieldError.msg || 'Valor no válido',
                location: fieldError.location || 'body'
            };
        }
        else {
            // Handle AlternativeValidationError or other types
            return {
                field: error.type || 'unknown',
                value: undefined,
                message: error.msg || 'Valor no válido',
                location: 'body'
            };
        }
    });
}
/**
 * Middleware de validación personalizado con opciones
 */
function createValidationMiddleware(options) {
    const { abortEarly = true, includeValues = false, customErrorHandler } = options;
    return (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const validationErrors = errors.array();
            // Si abortEarly está habilitado, solo mostrar el primer error
            const errorsToProcess = abortEarly ? [validationErrors[0]] : validationErrors;
            const formattedErrors = errorsToProcess.map((error) => {
                const formatted = {
                    field: error.param || error.type || 'unknown',
                    value: includeValues ? error.value : undefined,
                    message: error.msg || 'Valor no válido',
                    location: error.location || 'body'
                };
                // Remover value si no se debe incluir
                if (!includeValues) {
                    delete formatted.value;
                }
                return formatted;
            });
            logger_1.default.warn('Request validation failed', {
                path: req.path,
                method: req.method,
                errors: formattedErrors,
                totalErrors: validationErrors.length,
                abortEarly
            });
            // Usar handler personalizado si está definido
            if (customErrorHandler) {
                customErrorHandler(formattedErrors, req, res);
                return;
            }
            res.status(400).json({
                success: false,
                message: abortEarly
                    ? 'Error de validación encontrado'
                    : 'Errores de validación encontrados',
                errors: formattedErrors,
                errorCount: validationErrors.length
            });
            return;
        }
        next();
    };
}
/**
 * Middleware de validación específico para APIs JSON
 */
exports.validateJsonRequest = createValidationMiddleware({
    abortEarly: false,
    includeValues: false,
    customErrorHandler: (errors, req, res) => {
        res.status(400).json({
            success: false,
            message: 'Los datos enviados no son válidos',
            errors: errors.map(error => ({
                campo: error.field,
                mensaje: error.message,
                ubicacion: error.location
            })),
            timestamp: new Date().toISOString(),
            path: req.path
        });
    }
});
/**
 * Middleware de validación estricto (aborta en el primer error)
 */
exports.validateStrictRequest = createValidationMiddleware({
    abortEarly: true,
    includeValues: false,
    customErrorHandler: (errors, req, res) => {
        const error = errors[0];
        res.status(400).json({
            success: false,
            message: `Error en el campo '${error.field}': ${error.message}`,
            field: error.field,
            location: error.location,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * Middleware de validación para desarrollo (incluye valores)
 */
exports.validateDevRequest = createValidationMiddleware({
    abortEarly: false,
    includeValues: true,
    customErrorHandler: (errors, req, res) => {
        res.status(400).json({
            success: false,
            message: 'Errores de validación (modo desarrollo)',
            errors,
            requestData: {
                body: req.body,
                query: req.query,
                params: req.params
            },
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        });
    }
});
/**
 * Función helper para crear validaciones condicionales
 */
function conditionalValidation(condition, validationMiddleware) {
    return (req, res, next) => {
        if (condition(req)) {
            validationMiddleware(req, res, next);
        }
        else {
            next();
        }
    };
}
/**
 * Middleware para sanitizar datos después de la validación
 */
function sanitizeRequest(req, res, next) {
    // Sanitizar strings en body
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    // Sanitizar query parameters
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }
    next();
}
/**
 * Función helper para sanitizar objetos
 */
function sanitizeObject(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }
    if (typeof obj === 'string') {
        // Remover caracteres potencialmente peligrosos
        return obj
            .trim()
            .replace(/[<>"'&]/g, '') // Remover caracteres HTML básicos
            .replace(/\s+/g, ' '); // Normalizar espacios
    }
    return obj;
}
/**
 * Middleware para validar Content-Type
 */
function validateContentType(expectedTypes) {
    return (req, res, next) => {
        const contentType = req.get('Content-Type');
        if (!contentType) {
            res.status(400).json({
                success: false,
                message: 'Content-Type header es requerido',
                expectedTypes
            });
            return;
        }
        const isValidType = expectedTypes.some(type => contentType.toLowerCase().includes(type.toLowerCase()));
        if (!isValidType) {
            res.status(415).json({
                success: false,
                message: 'Content-Type no soportado',
                received: contentType,
                expectedTypes
            });
            return;
        }
        next();
    };
}
/**
 * Middleware para validar tamaño del body
 */
function validateBodySize(maxSizeBytes) {
    return (req, res, next) => {
        const contentLength = req.get('Content-Length');
        if (contentLength && parseInt(contentLength) > maxSizeBytes) {
            res.status(413).json({
                success: false,
                message: 'Payload demasiado grande',
                maxSize: maxSizeBytes,
                received: parseInt(contentLength)
            });
            return;
        }
        next();
    };
}
/**
 * Middleware combinado para validación completa
 */
function createCompleteValidation(options) {
    const { maxBodySize = 1024 * 1024, // 1MB por defecto
    allowedContentTypes = ['application/json'], sanitize = true, validationMode = 'normal' } = options;
    const middlewares = [];
    // Validar tamaño del body
    middlewares.push(validateBodySize(maxBodySize));
    // Validar Content-Type
    middlewares.push(validateContentType(allowedContentTypes));
    // Sanitizar si está habilitado
    if (sanitize) {
        middlewares.push(sanitizeRequest);
    }
    // Agregar validación según el modo
    switch (validationMode) {
        case 'strict':
            middlewares.push(exports.validateStrictRequest);
            break;
        case 'dev':
            middlewares.push(exports.validateDevRequest);
            break;
        default:
            middlewares.push(validateRequest);
    }
    return middlewares;
}
