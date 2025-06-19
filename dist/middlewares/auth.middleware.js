"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = exports.refreshTokenMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_handler_1 = require("../utils/error-handler");
const environment_1 = __importDefault(require("../core/config/environment"));
const database_1 = require("../core/config/database");
/**
 * Middleware que verifica el token JWT y añade el usuario a la petición
 */
const authMiddleware = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return next(new error_handler_1.UnauthorizedError('No ha iniciado sesión. Por favor inicie sesión para acceder.'));
        }
        // 2) Verificar token
        const decoded = jsonwebtoken_1.default.verify(token, environment_1.default.jwt.secret);
        // Rechazar refresh tokens en rutas protegidas
        if (decoded.type === 'refresh') {
            return next(new error_handler_1.UnauthorizedError('Tipo de token inválido. Use un token de acceso para esta operación.'));
        }
        // 3) Comprobar si el usuario todavía existe
        const userRepository = database_1.AppDataSource.getRepository('users');
        const currentUser = await userRepository.findOne({
            where: { id: decoded.id }
        });
        if (!currentUser) {
            return next(new error_handler_1.UnauthorizedError('El usuario asociado a este token ya no existe.'));
        }
        // 4) Añadir el usuario a req
        req.user = currentUser;
        next();
    }
    catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new error_handler_1.UnauthorizedError('Token inválido. Por favor inicie sesión de nuevo.'));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new error_handler_1.UnauthorizedError('Su sesión ha expirado. Por favor inicie sesión de nuevo.'));
        }
        next(error);
    }
};
exports.authMiddleware = authMiddleware;
/**
 * Middleware que verifica que un token es un refresh token válido
 */
const refreshTokenMiddleware = async (req, res, next) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            return next(new error_handler_1.UnauthorizedError('Refresh token no proporcionado.'));
        }
        // Verificar token
        const decoded = jsonwebtoken_1.default.verify(refresh_token, environment_1.default.jwt.secret);
        // Verificar que sea un refresh token
        if (decoded.type !== 'refresh') {
            return next(new error_handler_1.UnauthorizedError('Token inválido. Se requiere un refresh token.'));
        }
        // Comprobar si el usuario todavía existe
        const userRepository = database_1.AppDataSource.getRepository('users');
        const currentUser = await userRepository.findOne({
            where: { id: decoded.id }
        });
        if (!currentUser) {
            return next(new error_handler_1.UnauthorizedError('El usuario asociado a este token ya no existe.'));
        }
        // Añadir el usuario a req
        req.user = currentUser;
        next();
    }
    catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new error_handler_1.UnauthorizedError('Token inválido.'));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new error_handler_1.UnauthorizedError('El refresh token ha expirado.'));
        }
        next(error);
    }
};
exports.refreshTokenMiddleware = refreshTokenMiddleware;
/**
 * Middleware que restringe acceso a ciertos roles
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new error_handler_1.UnauthorizedError('No tiene permiso para realizar esta acción'));
        }
        // if (!roles.includes(req.user.role)) {
        //   return next(
        //     new UnauthorizedError('No tiene permiso para realizar esta acción')
        //   );
        // }
        next();
    };
};
exports.restrictTo = restrictTo;
