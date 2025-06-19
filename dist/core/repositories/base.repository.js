"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const database_1 = require("../config/database");
const error_handler_1 = require("../../utils/error-handler");
/**
 * Repositorio base genérico para operaciones comunes de acceso a datos
 */
class BaseRepository {
    repository;
    constructor(entity) {
        this.repository = database_1.AppDataSource.getRepository(entity);
    }
    /**
     * Crea una nueva entidad
     * @param data Datos para crear la entidad
     * @returns La entidad creada
     */
    async create(data) {
        const entity = this.repository.create(data);
        return await this.repository.save(entity);
    }
    /**
     * Encuentra una entidad por su ID
     * @param id ID de la entidad
     * @param options Opciones de búsqueda
     * @returns La entidad encontrada o null
     */
    async findById(id, options) {
        const whereOptions = { id };
        return await this.repository.findOne({
            where: whereOptions,
            ...options
        });
    }
    /**
     * Encuentra una entidad por su ID o lanza un error si no la encuentra
     * @param id ID de la entidad
     * @param entityName Nombre de la entidad para el mensaje de error
     * @param options Opciones de búsqueda
     * @returns La entidad encontrada
     * @throws NotFoundError si no encuentra la entidad
     */
    async findByIdOrFail(id, entityName, options) {
        const entity = await this.findById(id, options);
        if (!entity) {
            throw new error_handler_1.NotFoundError(`${entityName} con ID ${id} no encontrado`);
        }
        return entity;
    }
    /**
     * Encuentra todas las entidades
     * @param options Opciones de búsqueda
     * @returns Lista de entidades
     */
    async findAll(options) {
        return await this.repository.find(options);
    }
    /**
     * Encuentra entidades con paginación
     * @param params Parámetros de paginación
     * @param options Opciones de búsqueda
     * @returns Resultado paginado
     */
    async findWithPagination(params, options) {
        const page = params.page || 1;
        const limit = params.limit || 10;
        const skip = (page - 1) * limit;
        const sort = params.sort || 'id';
        const order = params.order || 'ASC';
        const [items, total] = await this.repository.findAndCount({
            ...options,
            skip,
            take: limit,
            order: { [sort]: order }
        });
        return {
            items,
            metadata: {
                totalItems: total,
                itemCount: items.length,
                itemsPerPage: limit,
                totalPages: Math.ceil(total / limit),
                currentPage: page
            }
        };
    }
    /**
     * Actualiza una entidad
     * @param id ID de la entidad
     * @param data Datos para actualizar
     * @returns La entidad actualizada
     * @throws NotFoundError si no encuentra la entidad
     */
    async update(id, data, entityName) {
        await this.findByIdOrFail(id, entityName);
        await this.repository.update(id, data);
        return await this.findByIdOrFail(id, entityName);
    }
    /**
     * Elimina una entidad
     * @param id ID de la entidad
     * @param entityName Nombre de la entidad para el mensaje de error
     * @returns True si se eliminó correctamente
     * @throws NotFoundError si no encuentra la entidad
     */
    async delete(id, entityName) {
        await this.findByIdOrFail(id, entityName);
        const result = await this.repository.delete(id);
        return result.affected !== undefined && result.affected !== null && result.affected > 0;
    }
    /**
     * Cuenta el número de entidades que coinciden con las condiciones
     * @param conditions Condiciones de búsqueda
     * @returns Número de entidades que coinciden
     */
    async count(conditions) {
        return await this.repository.count(conditions);
    }
    /**
     * Verifica si existe una entidad con las condiciones dadas
     * @param conditions Condiciones de búsqueda
     * @returns True si existe al menos una entidad que coincide
     */
    async exists(conditions) {
        const count = await this.repository.count({ where: conditions });
        return count > 0;
    }
}
exports.BaseRepository = BaseRepository;
