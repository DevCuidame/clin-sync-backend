"use strict";
/**
 * Middleware de Control de Roles
 * Maneja la autorización basada en roles de usuario
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminOrProfessional = exports.requireClient = exports.requireProfessional = exports.requireAdmin = exports.SystemRoles = void 0;
exports.restrictTo = restrictTo;
exports.requireRole = requireRole;
exports.requireAllRoles = requireAllRoles;
exports.requireOwnershipOrRole = requireOwnershipOrRole;
exports.conditionalRole = conditionalRole;
exports.userHasRole = userHasRole;
exports.userHasAnyRole = userHasAnyRole;
exports.userHasAllRoles = userHasAllRoles;
exports.logRoleAccess = logRoleAccess;
exports.requirePermission = requirePermission;
const logger_1 = __importDefault(require("../utils/logger"));
const database_1 = require("../core/config/database");
const user_role_model_1 = require("../models/user-role.model");
/**
 * Tipos de roles disponibles en el sistema
 */
var SystemRoles;
(function (SystemRoles) {
    SystemRoles["ADMIN"] = "admin";
    SystemRoles["PROFESSIONAL"] = "professional";
    SystemRoles["USER"] = "usuario";
    SystemRoles["MODERATOR"] = "moderator";
})(SystemRoles || (exports.SystemRoles = SystemRoles = {}));
/**
 * Middleware para restringir acceso basado en roles
 */
function restrictTo(allowedRoles) {
    return async (req, res, next) => {
        try {
            // Verificar que el usuario esté autenticado
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Acceso denegado. Usuario no autenticado.',
                    error: 'AUTHENTICATION_REQUIRED'
                });
                return;
            }
            // Obtener roles del usuario si no están en el request
            let userRoles = req.user.roles;
            if (!userRoles || userRoles.length === 0) {
                userRoles = await getUserRoles(req.user.id);
                req.user.roles = userRoles;
            }
            // Verificar si el usuario tiene al menos uno de los roles permitidos
            const hasPermission = allowedRoles.some(role => userRoles.includes(role.toLowerCase()));
            if (!hasPermission) {
                logger_1.default.warn('Access denied - insufficient permissions', {
                    userId: req.user.id,
                    userEmail: req.user.email,
                    userRoles,
                    requiredRoles: allowedRoles,
                    path: req.path,
                    method: req.method
                });
                res.status(403).json({
                    success: false,
                    message: 'Acceso denegado. Permisos insuficientes.',
                    error: 'INSUFFICIENT_PERMISSIONS',
                    requiredRoles: allowedRoles,
                    userRoles: userRoles
                });
                return;
            }
            logger_1.default.info('Access granted', {
                userId: req.user.id,
                userRoles,
                requiredRoles: allowedRoles,
                path: req.path,
                method: req.method
            });
            next();
        }
        catch (error) {
            logger_1.default.error('Error in role restriction middleware', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: 'INTERNAL_SERVER_ERROR'
            });
        }
    };
}
/**
 * Middleware para verificar rol específico
 */
function requireRole(role) {
    return restrictTo([role]);
}
/**
 * Middleware para verificar múltiples roles (el usuario debe tener TODOS)
 */
function requireAllRoles(roles) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Acceso denegado. Usuario no autenticado.',
                    error: 'AUTHENTICATION_REQUIRED'
                });
                return;
            }
            let userRoles = req.user.roles;
            if (!userRoles || userRoles.length === 0) {
                userRoles = await getUserRoles(req.user.id);
                req.user.roles = userRoles;
            }
            // Verificar que el usuario tenga TODOS los roles requeridos
            const hasAllRoles = roles.every(role => userRoles.includes(role.toLowerCase()));
            if (!hasAllRoles) {
                logger_1.default.warn('Access denied - missing required roles', {
                    userId: req.user.id,
                    userRoles,
                    requiredRoles: roles,
                    path: req.path
                });
                res.status(403).json({
                    success: false,
                    message: 'Acceso denegado. Se requieren todos los roles especificados.',
                    error: 'MISSING_REQUIRED_ROLES',
                    requiredRoles: roles,
                    userRoles: userRoles
                });
                return;
            }
            next();
        }
        catch (error) {
            logger_1.default.error('Error in require all roles middleware', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: 'INTERNAL_SERVER_ERROR'
            });
        }
    };
}
/**
 * Middleware para verificar si el usuario es administrador
 */
exports.requireAdmin = requireRole(SystemRoles.ADMIN);
/**
 * Middleware para verificar si el usuario es profesional
 */
exports.requireProfessional = requireRole(SystemRoles.PROFESSIONAL);
/**
 * Middleware para verificar si el usuario es cliente
 */
exports.requireClient = requireRole(SystemRoles.USER);
/**
 * Middleware para verificar si el usuario es admin o profesional
 */
exports.requireAdminOrProfessional = restrictTo([SystemRoles.ADMIN, SystemRoles.PROFESSIONAL]);
/**
 * Middleware para verificar si el usuario puede acceder a sus propios recursos
 */
function requireOwnershipOrRole(roles, userIdParam = 'userId') {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Acceso denegado. Usuario no autenticado.',
                    error: 'AUTHENTICATION_REQUIRED'
                });
                return;
            }
            // Obtener ID del usuario del parámetro o body
            const targetUserId = parseInt(req.params[userIdParam] || req.body[userIdParam]);
            // Si es el mismo usuario, permitir acceso
            if (req.user.id === targetUserId) {
                next();
                return;
            }
            // Si no es el mismo usuario, verificar roles
            let userRoles = req.user.roles;
            if (!userRoles || userRoles.length === 0) {
                userRoles = await getUserRoles(req.user.id);
                req.user.roles = userRoles;
            }
            const hasPermission = roles.some(role => userRoles.includes(role.toLowerCase()));
            if (!hasPermission) {
                logger_1.default.warn('Access denied - not owner and insufficient roles', {
                    userId: req.user.id,
                    targetUserId,
                    userRoles,
                    requiredRoles: roles,
                    path: req.path
                });
                res.status(403).json({
                    success: false,
                    message: 'Acceso denegado. Solo puedes acceder a tus propios recursos o necesitas permisos especiales.',
                    error: 'OWNERSHIP_OR_ROLE_REQUIRED',
                    requiredRoles: roles
                });
                return;
            }
            next();
        }
        catch (error) {
            logger_1.default.error('Error in ownership or role middleware', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: 'INTERNAL_SERVER_ERROR'
            });
        }
    };
}
/**
 * Middleware condicional basado en roles
 */
function conditionalRole(condition, requiredRoles) {
    return async (req, res, next) => {
        if (condition(req)) {
            return restrictTo(requiredRoles)(req, res, next);
        }
        next();
    };
}
/**
 * Obtiene los roles de un usuario desde la base de datos
 */
async function getUserRoles(userId) {
    try {
        const userRoleRepository = database_1.AppDataSource.getRepository(user_role_model_1.UserRole);
        const userRoles = await userRoleRepository.find({
            where: { user: { id: userId } },
            relations: ['role']
        });
        return userRoles.map(userRole => userRole.role.role_name.toLowerCase());
    }
    catch (error) {
        logger_1.default.error('Error fetching user roles', { userId, error });
        return [];
    }
}
/**
 * Verifica si un usuario tiene un rol específico
 */
async function userHasRole(userId, roleName) {
    try {
        const userRoles = await getUserRoles(userId);
        return userRoles.includes(roleName.toLowerCase());
    }
    catch (error) {
        logger_1.default.error('Error checking user role', { userId, roleName, error });
        return false;
    }
}
/**
 * Verifica si un usuario tiene alguno de los roles especificados
 */
async function userHasAnyRole(userId, roleNames) {
    try {
        const userRoles = await getUserRoles(userId);
        return roleNames.some(role => userRoles.includes(role.toLowerCase()));
    }
    catch (error) {
        logger_1.default.error('Error checking user roles', { userId, roleNames, error });
        return false;
    }
}
/**
 * Verifica si un usuario tiene todos los roles especificados
 */
async function userHasAllRoles(userId, roleNames) {
    try {
        const userRoles = await getUserRoles(userId);
        return roleNames.every(role => userRoles.includes(role.toLowerCase()));
    }
    catch (error) {
        logger_1.default.error('Error checking all user roles', { userId, roleNames, error });
        return false;
    }
}
/**
 * Middleware para logging de acceso basado en roles
 */
function logRoleAccess(req, res, next) {
    if (req.user) {
        logger_1.default.info('Role-based access attempt', {
            userId: req.user.id,
            userEmail: req.user.email,
            userRoles: req.user.roles,
            path: req.path,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    }
    next();
}
/**
 * Middleware para verificar permisos específicos (extensible)
 */
function requirePermission(permission) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Acceso denegado. Usuario no autenticado.',
                    error: 'AUTHENTICATION_REQUIRED'
                });
                return;
            }
            // Aquí se podría implementar un sistema más granular de permisos
            // Por ahora, mapear permisos a roles
            const permissionRoleMap = {
                'payments.create': [SystemRoles.ADMIN, SystemRoles.PROFESSIONAL, SystemRoles.USER],
                'payments.refund': [SystemRoles.ADMIN, SystemRoles.PROFESSIONAL],
                'payments.view_all': [SystemRoles.ADMIN],
                'users.manage': [SystemRoles.ADMIN],
                'appointments.manage': [SystemRoles.ADMIN, SystemRoles.PROFESSIONAL],
                'reports.view': [SystemRoles.ADMIN, SystemRoles.PROFESSIONAL]
            };
            const requiredRoles = permissionRoleMap[permission];
            if (!requiredRoles) {
                logger_1.default.warn('Unknown permission requested', { permission, userId: req.user.id });
                res.status(403).json({
                    success: false,
                    message: 'Permiso no reconocido',
                    error: 'UNKNOWN_PERMISSION'
                });
                return;
            }
            return restrictTo(requiredRoles)(req, res, next);
        }
        catch (error) {
            logger_1.default.error('Error in permission middleware', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: 'INTERNAL_SERVER_ERROR'
            });
        }
    };
}
