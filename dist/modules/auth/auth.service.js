"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = __importDefault(require("../../core/config/environment"));
const error_handler_1 = require("../../utils/error-handler");
const logger_1 = __importDefault(require("../../utils/logger"));
const password_util_1 = require("../../utils/password.util");
// import { PatientRepository } from '../patient/patient.repository'; // Temporarily commented - needs migration
const user_repository_1 = require("../user/user.repository");
const file_upload_util_1 = require("../../utils/file-upload.util");
const database_1 = require("../../core/config/database");
const role_repository_1 = require("../role/role.repository");
const user_role_model_1 = require("../../models/user-role.model");
const email_service_1 = require("../notification/services/email.service");
const date_format_1 = require("../../utils/date-format");
const notification_template_service_1 = require("../notification/services/notification-template.service");
const template_file_service_1 = require("../notification/services/template-file.service");
class AuthService {
    userRepository;
    roleRepository;
    emailService;
    notificationTemplateService;
    templateFileService;
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
        this.roleRepository = new role_repository_1.RoleRepository();
        this.emailService = email_service_1.EmailService.getInstance();
        this.notificationTemplateService = new notification_template_service_1.NotificationTemplateService();
        this.templateFileService = new template_file_service_1.TemplateFileService();
    }
    /**
     * Iniciar sesión de usuario
     * @param credentials Credenciales de inicio de sesión
     * @returns Respuesta de autenticación con token y datos de usuario
     */
    async login(credentials) {
        const { email, password } = credentials;
        const normalizedEmail = email.toLowerCase();
        // Buscar usuario por email incluyendo el campo password
        const user = await this.userRepository.findByEmail(normalizedEmail, true);
        if (!user) {
            throw new error_handler_1.UnauthorizedError('Credenciales inválidas');
        }
        // Verificar contraseña
        if (!user.password_hash) {
            throw new error_handler_1.UnauthorizedError('Este usuario no tiene contraseña configurada');
        }
        // Verificar contraseña (compatible con MD5 y PBKDF2)
        const isPasswordValid = password_util_1.PasswordService.verifyPassword(password, user.password_hash);
        if (!isPasswordValid) {
            throw new error_handler_1.UnauthorizedError('Credenciales inválidas');
        }
        // Verificar que el correo electrónico esté verificado
        if (!user.verified) {
            throw new error_handler_1.UnauthorizedError('Debe verificar su correo electrónico antes de iniciar sesión');
        }
        const message = 'Sesión iniciada exitosamente';
        // Generar token JWT
        const token = await this.generateToken(user);
        // Generar refresh token
        const refreshToken = this.generateRefreshToken(user);
        // Actualizar token de sesión en la base de datos
        await this.userRepository.updateSessionToken(user.id, token);
        // Obtener el rol del usuario para incluirlo en la respuesta
        const userRoleRepository = database_1.AppDataSource.getRepository(user_role_model_1.UserRole);
        const userRole = await userRoleRepository.findOne({
            where: { user_id: user.id },
            relations: ['role']
        });
        const roleName = userRole?.role?.role_name || 'usuario';
        // Crear objeto de respuesta (exclude imagebs64 from user data as well)
        const userData = {
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                verified: user.verified,
                phone: user.phone,
                identification_type: user.identification_type,
                identification_number: user.identification_number,
                address: user.address,
                gender: user.gender,
                birth_date: (0, date_format_1.formatBirthDate)(user.birth_date),
                city_id: user.city_id,
                department: null,
                pubname: user.pubname,
                privname: user.privname,
                imagebs64: user.imagebs64,
                path: user.path,
                role: roleName,
            },
            access_token: token,
            refresh_token: refreshToken,
        };
        const locationRepository = database_1.AppDataSource.getRepository('townships');
        const cityData = await locationRepository.findOne({
            where: { id: user.city_id },
            relations: ['department']
        });
        if (cityData?.department) {
            userData.user.department = cityData.department.id;
        }
        return {
            success: true,
            message,
            data: userData,
            token,
            refresh_token: refreshToken
        };
    }
    /**
     * Refrescar token de acceso usando un refresh token
     * @param refreshTokenData Datos del refresh token
     * @returns Nuevo token de acceso
     */
    async refreshToken(refreshTokenData) {
        const { refresh_token } = refreshTokenData;
        try {
            // Verificar refresh token
            const decoded = jsonwebtoken_1.default.verify(refresh_token, environment_1.default.jwt.secret);
            // Validar que sea un refresh token
            if (decoded.type !== 'refresh') {
                throw new error_handler_1.UnauthorizedError('Token inválido');
            }
            // Buscar usuario
            const user = await this.userRepository.findById(decoded.id);
            if (!user) {
                throw new error_handler_1.UnauthorizedError('Usuario no encontrado');
            }
            // Generar nuevo token de acceso
            const newAccessToken = await this.generateToken(user);
            // Generar nuevo refresh token (opcional, para implementar rotación de tokens)
            const newRefreshToken = this.generateRefreshToken(user);
            // Actualizar token de sesión en la base de datos (opcional)
            await this.userRepository.updateSessionToken(user.id, newAccessToken);
            // Obtener el rol del usuario para incluirlo en la respuesta
            const userRoleRepository = database_1.AppDataSource.getRepository(user_role_model_1.UserRole);
            const userRole = await userRoleRepository.findOne({
                where: { user_id: user.id },
                relations: ['role']
            });
            const roleName = userRole?.role?.role_name || 'User';
            return {
                success: true,
                message: 'Token renovado exitosamente',
                data: {
                    access_token: newAccessToken,
                    refresh_token: newRefreshToken,
                    role: roleName // Incluir el rol del usuario en la respuesta
                },
                token: newAccessToken,
                refresh_token: newRefreshToken
            };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new error_handler_1.UnauthorizedError('Refresh token inválido o expirado');
            }
            throw error;
        }
    }
    /**
     * Generar refresh token JWT
     * @param user Usuario
     * @returns Refresh token JWT
     */
    generateRefreshToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            name: user.first_name,
            type: 'refresh',
            token_version: 1, // Versión del token para invalidación masiva si es necesario
        };
        return jsonwebtoken_1.default.sign(payload, environment_1.default.jwt.secret, {
            expiresIn: '30d', // El refresh token dura más tiempo
        });
    }
    /**
     * Registrar un nuevo usuario
     * @param userData Datos del nuevo usuario
     * @returns Respuesta de autenticación
     */
    async register(userData) {
        const normalizedUserData = {
            ...userData,
            email: userData.email.toLowerCase()
        };
        const { email, password } = normalizedUserData;
        // Verificar si el email ya está registrado
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new error_handler_1.BadRequestError('No logramos registrar tu correo electrónico.');
        }
        // Verificar si el numero de identificación ya está registrado
        const existingUserIdentification = await this.userRepository.findByIdentification(normalizedUserData.identification_number);
        if (existingUserIdentification) {
            throw new error_handler_1.BadRequestError('No logramos registrar tu número de documento.');
        }
        // Generar hash de la contraseña
        const hashedPassword = password_util_1.PasswordService.hashPassword(password);
        const imageBase64 = normalizedUserData.imagebs64;
        const userDataToSave = { ...normalizedUserData };
        delete userDataToSave.imagebs64;
        const newUser = await this.userRepository.create({
            ...userDataToSave,
            password_hash: hashedPassword,
            verified: false,
            created_at: new Date(),
            updated_at: new Date(),
        });
        // Asignar rol por defecto al usuario
        try {
            // Obtener el rol por defecto (normalmente 'User')
            const defaultRole = await this.roleRepository.getDefaultRole();
            if (defaultRole) {
                // Verificar si el usuario ya tiene este rol
                const userRoleRepository = database_1.AppDataSource.getRepository(user_role_model_1.UserRole);
                const existingUserRole = await userRoleRepository.findOne({
                    where: {
                        user_id: newUser.id,
                        role_id: defaultRole.role_id
                    }
                });
                if (!existingUserRole) {
                    // Crear la relación usuario-rol solo si no existe
                    const userRole = userRoleRepository.create({
                        user_id: newUser.id,
                        role_id: defaultRole.role_id
                    });
                    await userRoleRepository.save(userRole);
                }
            }
            else {
                logger_1.default.warn(`No se pudo asignar rol por defecto al usuario ${newUser.id} porque no existe el rol 'usuario'`);
            }
        }
        catch (error) {
            logger_1.default.error(`Error al asignar rol al usuario ${newUser.id}:`, error);
            // No fallamos el proceso completo si hay error en la asignación de rol
        }
        // Si hay imagen, guardarla y actualizar la URL de la foto
        let photoUrl = '';
        if (imageBase64) {
            try {
                // Guardar imagen usando el servicio de utilidad
                photoUrl = await file_upload_util_1.FileUploadService.saveBase64Image(imageBase64, 'users', 'profile');
                if (photoUrl) {
                    // Actualizar la URL en la base de datos
                    await this.userRepository.update(newUser.id, {
                        path: photoUrl,
                        updated_at: new Date(),
                    }, 'User');
                    // Actualizar el objeto del paciente antes de devolverlo
                    newUser.path = photoUrl;
                }
            }
            catch (error) {
                console.error('Error al guardar imagen de paciente:', error);
                // No fallamos el proceso completo si hay error en la imagen
            }
        }
        // TODO: Enviar email de verificación (implementar en un servicio de email)
        return {
            success: true,
            message: 'Usuario registrado exitosamente. Por favor, verifica tu correo electrónico.',
            data: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.first_name,
                lastname: newUser.last_name,
            },
        };
    }
    /**
     * Solicitar restablecimiento de contraseña
     * @param email Email del usuario
     * @returns Respuesta de autenticación
     */
    async forgotPassword(email) {
        // Verificar si el usuario existe
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            // Por seguridad, no informar si el email existe o no
            return {
                success: true,
                message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.',
            };
        }
        // Generar token de restablecimiento
        const resetToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, environment_1.default.jwt.secret, { expiresIn: '1h' });
        // Actualizar token en la base de datos
        await this.userRepository.updateSessionToken(user.id, resetToken);
        // Construir la URL de restablecimiento
        const resetUrl = `https://${environment_1.default.server.production_url}/reset-password?token=${resetToken}`;
        // Enviar email con instrucciones
        try {
            // Intentar usar la plantilla desde archivo
            let emailHtml = '';
            let emailSubject = 'Restablecimiento de contraseña';
            try {
                // Intentar obtener la plantilla desde archivo
                emailHtml = await this.templateFileService.renderTemplate('password_reset', {
                    userName: user.first_name,
                    resetUrl: resetUrl,
                    expirationTime: '1 hora'
                });
            }
            catch (templateError) {
                // Si no se puede leer la plantilla desde archivo, intentar usar la plantilla de la base de datos
                logger_1.default.warn('No se pudo leer la plantilla desde archivo, intentando usar plantilla de la base de datos');
                try {
                    // Intentar obtener la plantilla por código desde la base de datos
                    const { subject, body } = await this.notificationTemplateService.renderTemplate('password_reset', {
                        userName: user.first_name,
                        resetUrl: resetUrl,
                        expirationTime: '1 hora'
                    });
                    emailHtml = body;
                    emailSubject = subject;
                }
                catch (dbTemplateError) {
                    // Si no existe la plantilla en la base de datos, usar la plantilla en línea
                    logger_1.default.warn('Plantilla de restablecimiento de contraseña no encontrada, usando plantilla por defecto');
                    emailHtml = `
            <h1>Restablecimiento de contraseña</h1>
            <p>Hola ${user.first_name},</p>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
            <p><a href="${resetUrl}">Restablecer contraseña</a></p>
            <p>Este enlace expirará en 1 hora.</p>
            <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
            <p>Saludos,<br>El equipo de Cuidame Health</p>
          `;
                }
            }
            // Enviar el correo
            await this.emailService.sendEmail({
                to: user.email,
                subject: emailSubject,
                html: emailHtml
            });
            logger_1.default.info(`Email de restablecimiento enviado a ${user.email}`);
        }
        catch (error) {
            logger_1.default.error('Error al enviar email de restablecimiento:', error);
            // No devolvemos el error al usuario por seguridad
        }
        return {
            success: true,
            message: 'Se han enviado instrucciones para restablecer tu contraseña a tu correo.',
        };
    }
    /**
     * Restablecer contraseña de usuario
     * @param token Token de restablecimiento
     * @param newPassword Nueva contraseña
     * @returns Respuesta de autenticación
     */
    async resetPassword(token, newPassword) {
        try {
            // Verificar token
            const decoded = jsonwebtoken_1.default.verify(token, environment_1.default.jwt.secret);
            // Buscar usuario
            const user = await this.userRepository.findById(decoded.id);
            if (!user || user.session_token !== token) {
                throw new error_handler_1.UnauthorizedError('Token inválido o expirado');
            }
            // Generar hash de la nueva contraseña
            const hashedPassword = password_util_1.PasswordService.hashPasswordMD5(newPassword);
            // Actualizar contraseña y limpiar token
            await this.userRepository.update(user.id, {
                password_hash: hashedPassword,
                session_token: null,
            }, 'Usuario');
            return {
                success: true,
                message: 'Contraseña actualizada correctamente',
            };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new error_handler_1.UnauthorizedError('Token inválido o expirado');
            }
            throw error;
        }
    }
    /**
     * Verificar email de usuario
     * @param token Token de verificación
     * @returns Respuesta de autenticación
     */
    async verifyEmail(token) {
        try {
            // Verificar token
            const decoded = jsonwebtoken_1.default.verify(token, environment_1.default.jwt.secret);
            // Buscar usuario
            const user = await this.userRepository.findById(decoded.id);
            if (!user || user.session_token !== token) {
                throw new error_handler_1.UnauthorizedError('Token inválido o expirado');
            }
            // Actualizar estado de verificación y limpiar token
            await this.userRepository.updateVerificationStatus(user.id, true);
            await this.userRepository.updateSessionToken(user.id, null);
            return {
                success: true,
                message: 'Correo electrónico verificado correctamente',
            };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new error_handler_1.UnauthorizedError('Token inválido o expirado');
            }
            throw error;
        }
    }
    /**
     * Cambiar contraseña de usuario
     * @param userId ID del usuario
     * @param currentPassword Contraseña actual
     * @param newPassword Nueva contraseña
     * @returns Respuesta de autenticación
     */
    async changePassword(userId, currentPassword, newPassword) {
        // Buscar usuario por ID
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new error_handler_1.NotFoundError('Usuario no encontrado');
        }
        // Buscar usuario por email para incluir la contraseña
        const userWithPassword = await this.userRepository.findByEmail(user.email, true);
        if (!userWithPassword || !userWithPassword.password_hash) {
            throw new error_handler_1.UnauthorizedError('Este usuario no tiene contraseña configurada');
        }
        // Verificar contraseña actual (compatible con MD5 y PBKDF2)
        const isPasswordValid = password_util_1.PasswordService.verifyPassword(currentPassword, userWithPassword.password_hash);
        if (!isPasswordValid) {
            throw new error_handler_1.UnauthorizedError('La contraseña actual es incorrecta');
        }
        // Generar hash de la nueva contraseña
        const hashedPassword = password_util_1.PasswordService.hashPasswordMD5(newPassword);
        // Actualizar contraseña
        await this.userRepository.update(user.id, {
            password_hash: hashedPassword,
            updated_at: new Date(),
        }, 'Usuario');
        return {
            success: true,
            message: 'Contraseña actualizada correctamente',
        };
    }
    /**
     * Cerrar sesión de usuario
     * @param userId ID del usuario
     * @returns Respuesta de autenticación
     */
    async logout(userId) {
        // Limpiar token de sesión
        await this.userRepository.updateSessionToken(userId, null);
        return {
            success: true,
            message: 'Sesión cerrada correctamente',
        };
    }
    /**
     * Generar token JWT
     * @param user Usuario
     * @returns Token JWT
     */
    async generateToken(user) {
        // Obtener el rol del usuario
        const userRoleRepository = database_1.AppDataSource.getRepository(user_role_model_1.UserRole);
        const userRole = await userRoleRepository.findOne({
            where: { user_id: user.id },
            relations: ['role']
        });
        const payload = {
            id: user.id,
            email: user.email,
            name: user.first_name,
            role: userRole?.role?.role_name || 'User'
        };
        // @ts-ignore - Forzar a TypeScript a ignorar este error específico
        return jsonwebtoken_1.default.sign(payload, environment_1.default.jwt.secret, {
            expiresIn: environment_1.default.jwt.expiresIn,
        });
    }
    /**
     * Verificar contraseña del usuario para eliminación de cuenta
     * @param userId ID del usuario
     * @param password Contraseña a verificar
     * @returns Respuesta de autenticación
     */
    async verifyPasswordForDeletion(userId, password) {
        // Buscar usuario por ID
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new error_handler_1.NotFoundError('Usuario no encontrado');
        }
        // Buscar usuario por email para incluir la contraseña
        const userWithPassword = await this.userRepository.findByEmail(user.email, true);
        if (!userWithPassword || !userWithPassword.password_hash) {
            throw new error_handler_1.UnauthorizedError('Este usuario no tiene contraseña configurada');
        }
        // Verificar contraseña (compatible con MD5 y PBKDF2)
        const isPasswordValid = password_util_1.PasswordService.verifyPassword(password, userWithPassword.password_hash);
        if (!isPasswordValid) {
            throw new error_handler_1.UnauthorizedError('Contraseña incorrecta');
        }
        return {
            success: true,
            message: 'Contraseña verificada correctamente',
        };
    }
    /**
     * Obtener información para eliminación de cuenta
     * @returns Información para eliminación de cuenta
     */
    async getAccountDeletionInfo() {
        // Lista de razones predefinidas para eliminación de cuenta
        const reasons = [
            'Ya no necesito el servicio',
            'Preocupaciones de privacidad',
            'Problemas técnicos',
            'Servicio al cliente',
            'Otro motivo'
        ];
        // Texto de confirmación que el usuario debe escribir
        const confirmationText = 'ELIMINAR';
        return {
            reasons,
            confirmationText
        };
    }
    /**
     * Eliminar cuenta de usuario
     * @param userId ID del usuario
     * @param deleteData Datos para eliminación de cuenta
     * @returns Respuesta de autenticación
     */
    async deleteAccount(userId, deleteData) {
        const { password, confirmation, reason, otherReason } = deleteData;
        // Verificar que la confirmación sea correcta
        const accountInfo = await this.getAccountDeletionInfo();
        if (confirmation !== accountInfo.confirmationText) {
            throw new error_handler_1.BadRequestError('El texto de confirmación no es correcto');
        }
        // Verificar contraseña y obtener usuario
        await this.verifyPasswordForDeletion(userId, password);
        // Registrar la razón de eliminación (esto podría guardarse en una tabla de auditoría)
        logger_1.default.info(`Usuario ${userId} eliminó su cuenta. Razón: ${reason || 'No especificada'} ${otherReason ? `- ${otherReason}` : ''}`);
        // Eliminar usuario (o marcar como inactivo, dependiendo de la política de la aplicación)
        // Opción 1: Eliminar completamente
        await this.userRepository.delete(userId, 'Usuario');
        // Opción 2: Marcar como inactivo y anonimizar datos (descomentar si se prefiere esta opción)
        /*
        await this.userRepository.update(
          userId,
          {
            active: false,
            email: `deleted_${userId}_${Date.now()}@deleted.com`,
            name: 'Usuario eliminado',
            lastname: '',
            phone: '',
            session_token: null,
            updated_at: new Date(),
          },
          'Usuario'
        );
        */
        return {
            success: true,
            message: 'Cuenta eliminada correctamente',
        };
    }
}
exports.AuthService = AuthService;
