"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleRepository = void 0;
const base_repository_1 = require("../../core/repositories/base.repository");
const role_model_1 = require("../../models/role.model");
class RoleRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(role_model_1.Role);
    }
    /**
     * Encuentra un rol por su nombre
     * @param name Nombre del rol
     * @returns El rol encontrado o null
     */
    async findByName(name) {
        return await this.repository.findOne({
            where: { role_name: name },
        });
    }
    /**
     * Obtiene el rol por defecto para nuevos usuarios
     * @returns El rol por defecto (normalmente 'usuario')
     */
    async getDefaultRole() {
        return await this.findByName('usuario');
    }
}
exports.RoleRepository = RoleRepository;
