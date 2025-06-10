import { BaseRepository } from '../../core/repositories/base.repository';
import { Role } from '../../models/role.model';

export class RoleRepository extends BaseRepository<Role> {
  constructor() {
    super(Role);
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
   * Obtiene el rol por defecto para nuevos usuarios
   * @returns El rol por defecto (normalmente 'usuario')
   */
  async getDefaultRole(): Promise<Role | null> {
    return await this.findByName('usuario');
  }
}
