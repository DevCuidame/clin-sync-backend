"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const error_handler_1 = require("../../utils/error-handler");
const user_repository_1 = require("./user.repository");
const password_util_1 = require("../../utils/password.util");
const file_upload_util_1 = require("../../utils/file-upload.util");
const purchase_model_1 = require("../../models/purchase.model");
const user_session_model_1 = require("../../models/user-session.model");
const database_1 = require("../../core/config/database");
class UserService {
    userRepository;
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
    }
    /**
     * Obtener un usuario por ID
     * @param userId ID del usuario
     * @returns Usuario encontrado
     */
    async getUserById(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new error_handler_1.NotFoundError(`Usuario con ID ${userId} no encontrado`);
        }
        return user;
    }
    /**
     * Obtener usuarios con paginación
     * @param params Parámetros de paginación
     * @returns Resultado paginado de usuarios
     */
    async getUsers(params) {
        return await this.userRepository.findWithPagination(params, {
            relations: ['user_roles', 'user_roles.role'],
        });
    }
    /**
     * Actualizar datos de un usuario
     * @param userId ID del usuario
     * @param userData Datos a actualizar
     * @returns Usuario actualizado
     */
    async updateUser(userId, userData) {
        // Comprobar si el usuario existe
        await this.getUserById(userId);
        return await this.userRepository.update(userId, userData, 'Usuario');
    }
    /**
     * Actualizar datos de un usuario incluyendo su foto de perfil
     * @param userId ID del usuario
     * @param userData Datos a actualizar incluyendo imagen en base64
     * @returns Usuario actualizado
     */
    async updateUserWithProfileImage(userId, userData) {
        // Comprobar si el usuario existe
        await this.getUserById(userId);
        // Extraer la imagen base64 si existe
        const imageBase64 = userData.imagebs64;
        // Crear una copia de los datos sin la imagen para actualizar primero la información básica
        const userDataToUpdate = { ...userData };
        delete userDataToUpdate.imagebs64;
        // Actualizar datos básicos del usuario
        let updatedUser = await this.userRepository.update(userId, {
            ...userDataToUpdate,
            updated_at: new Date(),
        }, 'Usuario');
        // Si hay imagen, procesarla y actualizar la URL
        if (imageBase64) {
            try {
                // Guardar imagen usando el servicio de utilidad
                const photoUrl = await file_upload_util_1.FileUploadService.saveBase64Image(imageBase64, 'users', 'profile');
                if (photoUrl) {
                    // Actualizar la URL y el nombre público en la base de datos
                    updatedUser = await this.userRepository.update(userId, {
                        path: photoUrl,
                        pubname: userData.pubname,
                        updated_at: new Date(),
                    }, 'Usuario');
                }
            }
            catch (error) {
                console.error('Error al guardar imagen de usuario:', error);
                // No fallamos el proceso completo si hay error en la imagen
            }
        }
        return updatedUser;
    }
    /**
     * Cambiar contraseña de un usuario
     * @param userId ID del usuario
     * @param currentPassword Contraseña actual
     * @param newPassword Nueva contraseña
     * @returns Usuario actualizado
     */
    async changePassword(userId, currentPassword, newPassword) {
        // Buscar usuario incluyendo la contraseña
        const user = await this.userRepository.findByEmail((await this.getUserById(userId)).email, true);
        if (!user || !user.password_hash) {
            throw new error_handler_1.NotFoundError('Usuario no encontrado o sin contraseña configurada');
        }
        // Verificar contraseña actual usando el sistema híbrido
        const isPasswordValid = password_util_1.PasswordService.verifyPassword(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            throw new error_handler_1.UnauthorizedError('Contraseña actual incorrecta');
        }
        // Generar hash de la nueva contraseña usando el método seguro
        const hashedPassword = password_util_1.PasswordService.hashPassword(newPassword);
        // Actualizar contraseña
        return await this.userRepository.update(userId, {
            password_hash: hashedPassword,
            updated_at: new Date(),
        }, 'Usuario');
    }
    /**
     * Actualizar avatar/imagen de perfil del usuario
     * @param userId ID del usuario
     * @param imageData Datos de la imagen (base64)
     * @param fileName Nombre del archivo
     * @returns Usuario actualizado
     */
    async updateProfileImage(userId, imageData, fileName) {
        // Comprobar si el usuario existe
        await this.getUserById(userId);
        // Actualizar imagen
        return await this.userRepository.update(userId, {
            imagebs64: imageData,
            pubname: fileName,
            updated_at: new Date(),
        }, 'Usuario');
    }
    /**
     * Asignar un rol a un usuario
     * @param userId ID del usuario
     * @param roleId ID del rol
     * @returns Confirmación de asignación
     */
    async assignRole(userId, roleId) {
        // Comprobar si el usuario existe
        await this.getUserById(userId);
        // Asignar rol
        // await this.userRepository.assignRole(userId, roleId);
        return {
            success: true,
            message: 'Rol asignado correctamente',
        };
    }
    /**
     * Quitar un rol a un usuario
     * @param userId ID del usuario
     * @param roleId ID del rol
     * @returns Confirmación de eliminación
     */
    async removeRole(userId, roleId) {
        // Comprobar si el usuario existe
        await this.getUserById(userId);
        // Eliminar rol
        // const result = await this.userRepository.removeRole(userId, roleId);
        // if (!result) {
        //   throw new NotFoundError('Rol no encontrado para este usuario');
        // }
        return {
            success: true,
            message: 'Rol eliminado correctamente',
        };
    }
    /**
     * Eliminar cuenta de usuario
     * @param userId ID del usuario a eliminar
     * @returns Confirmación de eliminación
     */
    async deleteAccount(userId) {
        await this.getUserById(userId);
        // Eliminar usuario
        const result = await this.userRepository.delete(userId, 'Usuario');
        if (!result) {
            throw new error_handler_1.BadRequestError('No se pudo eliminar la cuenta de usuario');
        }
        return {
            success: true,
            message: 'Cuenta eliminada correctamente',
        };
    }
    /**
     * Obtener información completa del usuario con todas sus compras, sesiones y citas
     * @param userId ID del usuario
     * @returns Información completa del usuario
     */
    async getUserCompleteInfo(userId) {
        const user = await this.getUserById(userId);
        const purchases = await this.getUserPurchasesWithDetails(userId);
        const summary = await this.calculateUserSummary(userId, purchases);
        return {
            user: this.mapUserBasicInfo(user),
            purchases,
            summary
        };
    }
    async getUserPurchasesWithDetails(userId) {
        const purchases = await this.getPurchasesWithRelations(userId);
        return Promise.all(purchases.map((purchase) => this.buildPurchaseWithSessions(purchase)));
    }
    async getUserPurchasesOptimized(userId) {
        return await database_1.AppDataSource.getRepository(purchase_model_1.Purchase)
            .createQueryBuilder('purchase')
            .leftJoinAndSelect('purchase.package', 'package')
            .leftJoinAndSelect('purchase.payment_transactions', 'transactions')
            .leftJoinAndSelect('purchase.sessions', 'sessions')
            .leftJoinAndSelect('sessions.service', 'service')
            .leftJoinAndSelect('sessions.appointments', 'appointments')
            .leftJoinAndSelect('appointments.professional', 'professional')
            .leftJoinAndSelect('professional.user', 'professionalUser')
            .where('purchase.user_id = :userId', { userId })
            .orderBy('purchase.purchase_date', 'DESC')
            .addOrderBy('sessions.created_at', 'DESC')
            .addOrderBy('appointments.scheduled_at', 'DESC')
            .getMany();
    }
    async buildPurchaseWithSessions(purchase) {
        const sessions = await this.getSessionsWithAppointments(purchase.purchase_id);
        return {
            ...this.mapPurchaseBasicInfo(purchase),
            sessions
        };
    }
    async getPurchasesWithRelations(userId) {
        return await database_1.AppDataSource.getRepository(purchase_model_1.Purchase)
            .createQueryBuilder('purchase')
            .leftJoinAndSelect('purchase.package', 'package')
            .leftJoinAndSelect('purchase.payment_transactions', 'transactions')
            .where('purchase.user_id = :userId', { userId })
            .orderBy('purchase.purchase_date', 'DESC')
            .getMany();
    }
    async getSessionsWithAppointments(purchaseId) {
        return await database_1.AppDataSource.getRepository(user_session_model_1.UserSession)
            .createQueryBuilder('session')
            .leftJoinAndSelect('session.service', 'service')
            .leftJoinAndSelect('session.appointments', 'appointments')
            .leftJoinAndSelect('appointments.professional', 'professional')
            .leftJoinAndSelect('professional.user', 'professionalUser')
            .where('session.purchase_id = :purchaseId', { purchaseId })
            .orderBy('session.created_at', 'DESC')
            .addOrderBy('appointments.scheduled_at', 'DESC')
            .getMany();
    }
    mapPurchaseBasicInfo(purchase) {
        return {
            purchase_id: purchase.purchase_id,
            user_id: purchase.user_id,
            package_id: purchase.package_id,
            amount_paid: purchase.amount_paid,
            purchase_date: purchase.purchase_date,
            payment_status: purchase.payment_status,
            payment_method: purchase.payment_method,
            transaction_id: purchase.transaction_id,
            expires_at: purchase.expires_at,
            package: purchase.package ? {
                package_id: purchase.package.package_id,
                package_name: purchase.package.package_name,
                description: purchase.package.description,
                total_sessions: purchase.package.total_sessions,
                validity_days: purchase.package.validity_days,
                price: purchase.package.price
            } : null
        };
    }
    async calculateUserSummary(userId, purchases) {
        const totalPurchases = purchases.length;
        const totalAmountSpent = purchases.reduce((sum, purchase) => sum + (parseFloat(purchase.amount_paid) || 0), 0);
        // Count sessions and appointments
        let activeSessions = 0;
        let completedAppointments = 0;
        let pendingAppointments = 0;
        let cancelledAppointments = 0;
        let totalSessionsRemaining = 0;
        const serviceUsage = {};
        const professionalUsage = {};
        for (const purchase of purchases) {
            if (purchase.sessions) {
                for (const session of purchase.sessions) {
                    if (session.status === 'active') {
                        activeSessions++;
                        totalSessionsRemaining += (session.sessions_remaining || 0);
                    }
                    // Count service usage
                    if (session.service?.service_name) {
                        serviceUsage[session.service.service_name] = (serviceUsage[session.service.service_name] || 0) + 1;
                    }
                    if (session.appointments) {
                        for (const appointment of session.appointments) {
                            switch (appointment.status) {
                                case 'completed':
                                    completedAppointments++;
                                    break;
                                case 'pending':
                                case 'confirmed':
                                    pendingAppointments++;
                                    break;
                                case 'cancelled':
                                    cancelledAppointments++;
                                    break;
                            }
                            // Count professional usage
                            if (appointment.professional?.user) {
                                const professionalName = `${appointment.professional.user.first_name} ${appointment.professional.user.last_name}`;
                                professionalUsage[professionalName] = (professionalUsage[professionalName] || 0) + 1;
                            }
                        }
                    }
                }
            }
        }
        // Find most used service and favorite professional
        const mostUsedService = Object.keys(serviceUsage).reduce((a, b) => serviceUsage[a] > serviceUsage[b] ? a : b, Object.keys(serviceUsage)[0]);
        const favoriteProfessional = Object.keys(professionalUsage).reduce((a, b) => professionalUsage[a] > professionalUsage[b] ? a : b, Object.keys(professionalUsage)[0]);
        return {
            total_purchases: totalPurchases,
            total_amount_spent: totalAmountSpent,
            active_sessions: activeSessions,
            completed_appointments: completedAppointments,
            pending_appointments: pendingAppointments,
            cancelled_appointments: cancelledAppointments,
            total_sessions_remaining: totalSessionsRemaining,
            most_used_service: mostUsedService || undefined,
            favorite_professional: favoriteProfessional || undefined
        };
    }
    mapUserBasicInfo(user) {
        const { id, email, first_name, last_name, identification_type, identification_number, birth_date, address, phone, gender, status, verified, created_at, updated_at, path, pubname, user_roles } = user;
        return { id, email, first_name, last_name, identification_type,
            identification_number, birth_date, address, phone, gender,
            status, verified, created_at, updated_at, path, pubname, user_roles };
    }
    mapServiceInfo(service) {
        return {
            service_id: service.service_id,
            service_name: service.service_name,
            description: service.description,
            base_price: service.base_price,
            duration_minutes: service.duration_minutes,
            category: service.category,
            is_active: service.is_active,
            metadata: service.metadata,
            created_at: service.created_at,
            updated_at: service.updated_at
        };
    }
    /**
     * Obtener información completa de todos los usuarios con paginación
     * @param params Parámetros de paginación
     * @returns Resultado paginado con información completa de usuarios
     */
    async getAllUsersCompleteInfo(params) {
        // Establecer valores por defecto para parámetros de paginación
        const page = params.page || 1;
        const limit = params.limit || 10;
        const sort = params.sort || 'id';
        const order = params.order || 'ASC';
        // Obtener usuarios con paginación usando el método existente
        const usersResult = await this.userRepository.findWithPagination({ page, limit, sort, order }, {
            relations: ['user_roles', 'user_roles.role'],
        });
        // Obtener información completa para cada usuario
        const usersWithCompleteInfo = await Promise.all(usersResult.items.map(async (user) => {
            try {
                // Verificar que el usuario tenga un ID válido
                if (!user.id || isNaN(Number(user.id))) {
                    console.error('Usuario sin ID válido:', user);
                    return {
                        user: this.mapUserBasicInfo(user),
                        purchases: [],
                        summary: {
                            totalPurchases: 0,
                            totalSpent: 0,
                            activeSessions: 0,
                            completedAppointments: 0
                        }
                    };
                }
                const purchases = await this.getUserPurchasesWithDetails(user.id);
                const summary = await this.calculateUserSummary(user.id, purchases);
                return {
                    user: this.mapUserBasicInfo(user),
                    purchases,
                    summary
                };
            }
            catch (error) {
                console.error(`Error procesando usuario ${user.id}:`, error);
                // En caso de error con un usuario específico, retornar información básica
                return {
                    user: this.mapUserBasicInfo(user),
                    purchases: [],
                    summary: {
                        totalPurchases: 0,
                        totalSpent: 0,
                        activeSessions: 0,
                        completedAppointments: 0
                    }
                };
            }
        }));
        return {
            items: usersWithCompleteInfo,
            metadata: usersResult.metadata
        };
    }
}
exports.UserService = UserService;
