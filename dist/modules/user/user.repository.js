"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const base_repository_1 = require("../../core/repositories/base.repository");
const error_handler_1 = require("../../utils/error-handler");
const user_model_1 = require("../../models/user.model");
const user_role_model_1 = require("../../models/user-role.model");
class UserRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(user_model_1.User);
    }
    /**
     * Encuentra un usuario por email
     * @param email Email del usuario
     * @param includePassword Si se debe incluir la contraseña en el resultado
     * @returns El usuario encontrado o null
     */
    async findByEmail(email, includePassword = false) {
        const options = {
            where: { email }
        };
        if (includePassword) {
            options.select = {
                id: true,
                email: true,
                password_hash: true,
                first_name: true,
                last_name: true,
                verified: true,
                phone: true,
                gender: true,
                birth_date: true,
                identification_type: true,
                identification_number: true,
                address: true,
                city_id: true,
                pubname: true,
                privname: true,
                imagebs64: true,
                path: true,
            };
        }
        return await this.repository.findOne(options);
    }
    /**
     * Encuentra un usuario por email
     * @param email Email del usuario
     * @param includePassword Si se debe incluir la contraseña en el resultado
     * @returns El usuario encontrado o null
     */
    async findByIdentification(identification_number, includePassword = false) {
        const options = {
            where: { identification_number }
        };
        if (includePassword) {
            options.select = {
                id: true,
                email: true,
                password_hash: true,
                first_name: true,
                last_name: true,
                verified: true,
                phone: true,
                identification_type: true,
                identification_number: true,
                address: true,
                city_id: true,
                pubname: true,
                privname: true,
                imagebs64: true,
            };
        }
        return await this.repository.findOne(options);
    }
    /**
     * Asigna un rol a un usuario
     * @param userId ID del usuario
     * @param roleId ID del rol
     * @returns El registro UserRole creado
     */
    async assignRole(userId, roleId) {
        const userRoleRepository = this.repository.manager.getRepository(user_role_model_1.UserRole);
        // Verificar si ya existe esta asignación
        const existingAssignment = await userRoleRepository.findOne({
            where: { user_id: userId, role_id: roleId }
        });
        if (existingAssignment) {
            return existingAssignment;
        }
        // Crear nueva asignación
        const userRole = userRoleRepository.create({
            user_id: userId,
            role_id: roleId
        });
        return await userRoleRepository.save(userRole);
    }
    /**
     * Elimina un rol de un usuario
     * @param userId ID del usuario
     * @param roleId ID del rol
     * @returns True si se eliminó correctamente
     */
    async removeRole(userId, roleId) {
        const userRoleRepository = this.repository.manager.getRepository(user_role_model_1.UserRole);
        const result = await userRoleRepository.delete({
            user_id: userId,
            role_id: roleId
        });
        return result.affected !== undefined && result.affected !== null && result.affected > 0;
    }
    /**
     * Actualiza el token de sesión del usuario
     * @param userId ID del usuario
     * @param token Nuevo token de sesión
     * @returns El usuario actualizado
     */
    async updateSessionToken(userId, token) {
        await this.repository.update(userId, { session_token: token });
        const user = await this.findById(userId);
        if (!user) {
            throw new error_handler_1.NotFoundError(`Usuario con ID ${userId} no encontrado`);
        }
        return user;
    }
    /**
     * Actualiza el estado de verificación del usuario
     * @param userId ID del usuario
     * @param verified Estado de verificación
     * @returns El usuario actualizado
     */
    async updateVerificationStatus(userId, verified) {
        await this.repository.update(userId, { verified: verified });
        const user = await this.findById(userId);
        if (!user) {
            throw new error_handler_1.NotFoundError(`Usuario con ID ${userId} no encontrado`);
        }
        return user;
    }
}
exports.UserRepository = UserRepository;
