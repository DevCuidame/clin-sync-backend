"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.ValidationError = exports.UnprocessableEntityError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    status;
    isOperational;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class BadRequestError extends AppError {
    constructor(message = 'Solicitud inválida') {
        super(message, 400);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = 'No autorizado') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class UnprocessableEntityError extends AppError {
    constructor(message = 'Datos no procesables') {
        super(message, 422);
    }
}
exports.UnprocessableEntityError = UnprocessableEntityError;
class ValidationError extends AppError {
    constructor(message = 'Error de validación') {
        super(message, 400);
    }
}
exports.ValidationError = ValidationError;
class ForbiddenError extends AppError {
    constructor(message = 'Acceso prohibido') {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Recurso no encontrado') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Conflicto de recursos') {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
class InternalServerError extends AppError {
    constructor(message = 'Error interno del servidor') {
        super(message, 500);
    }
}
exports.InternalServerError = InternalServerError;
