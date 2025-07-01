import { BaseRepository } from '../../core/repositories/base.repository';
import { Role } from '../../models/role.model';
import { FindManyOptions } from 'typeorm';

export class RoleRepository extends BaseRepository<Role> {
  constructor() {
    super(Role);
  }

  /**
   * Encuentra un rol por su ID
   * @param id ID del rol
   * @returns El rol encontrado o null
   */
  async findById(id: number): Promise<Role | null> {
    return await this.repository.findOne({
      where: { role_id: id },
    });
  }

  /**
   * Encuentra un rol por su nombre
   * @param name Nombre del rol
   * @returns El rol encontrado o null
   */
  async findByName(name: string): Promise<Role | null> {
    return await this.repository.findOne({
      where: { role_name: name },
    });
  }

  /**
   * Obtiene todos los roles con opciones de filtrado
   * @param options Opciones de búsqueda
   * @returns Lista de roles
   */
  async findAll(options?: FindManyOptions<Role>): Promise<Role[]> {
    return await this.repository.find(options);
  }

  /**
   * Obtiene el rol por defecto para nuevos usuarios
   * @returns El rol por defecto (normalmente 'usuario')
   */
  async getDefaultRole(): Promise<Role | null> {
    return await this.findByName('usuario');
  }
}
