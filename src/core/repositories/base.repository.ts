import { Repository, EntityTarget, FindManyOptions, FindOneOptions, DeepPartial, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { AppDataSource } from '../config/database';
import { PaginationParams, PaginatedResult } from '../interfaces/response.interface';
import { NotFoundError } from '../../utils/error-handler';

/**
 * Repositorio base genérico para operaciones comunes de acceso a datos
 */
export abstract class BaseRepository<T extends ObjectLiteral> {
  protected repository: Repository<T>;

  constructor(entity: EntityTarget<T>) {
    this.repository = AppDataSource.getRepository(entity);
  }

  /**
   * Crea una nueva entidad
   * @param data Datos para crear la entidad
   * @returns La entidad creada
   */
  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity as any);
  }

  /**
   * Encuentra una entidad por su ID
   * @param id ID de la entidad
   * @param options Opciones de búsqueda
   * @returns La entidad encontrada o null
   */
  async findById(id: number | string, options?: FindOneOptions<T>): Promise<T | null> {
    const whereOptions: FindOptionsWhere<T> = { id } as any;
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
  async findByIdOrFail(id: number | string, entityName: string, options?: FindOneOptions<T>): Promise<T> {
    const entity = await this.findById(id, options);
    
    if (!entity) {
      throw new NotFoundError(`${entityName} con ID ${id} no encontrado`);
    }
    
    return entity;
  }

  /**
   * Encuentra todas las entidades
   * @param options Opciones de búsqueda
   * @returns Lista de entidades
   */
  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return await this.repository.find(options);
  }

  /**
   * Encuentra entidades con paginación
   * @param params Parámetros de paginación
   * @param options Opciones de búsqueda
   * @returns Resultado paginado
   */
  async findWithPagination(
    params: PaginationParams,
    options?: FindManyOptions<T>
  ): Promise<PaginatedResult<T>> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;
    const sort = params.sort || 'id';
    const order = params.order || 'ASC';

    const [items, total] = await this.repository.findAndCount({
      ...options,
      skip,
      take: limit,
      order: { [sort]: order } as any
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
  async update(id: number | string, data: DeepPartial<T>, entityName: string): Promise<T> {
    await this.findByIdOrFail(id, entityName);
    await this.repository.update(id, data as any);
    return await this.findByIdOrFail(id, entityName);
  }

  /**
   * Elimina una entidad
   * @param id ID de la entidad
   * @param entityName Nombre de la entidad para el mensaje de error
   * @returns True si se eliminó correctamente
   * @throws NotFoundError si no encuentra la entidad
   */
  async delete(id: number | string, entityName: string): Promise<boolean> {
    await this.findByIdOrFail(id, entityName);
    const result = await this.repository.delete(id);
    return result.affected !== undefined && result.affected !== null && result.affected > 0;
  }
  /**
   * Cuenta el número de entidades que coinciden con las condiciones
   * @param conditions Condiciones de búsqueda
   * @returns Número de entidades que coinciden
   */
  async count(conditions?: FindManyOptions<T>): Promise<number> {
    return await this.repository.count(conditions);
  }

  /**
   * Verifica si existe una entidad con las condiciones dadas
   * @param conditions Condiciones de búsqueda
   * @returns True si existe al menos una entidad que coincide
   */
  async exists(conditions: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.count({ where: conditions });
    return count > 0;
  }
}