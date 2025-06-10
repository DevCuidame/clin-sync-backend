import { FindOneOptions, FindOptionsWhere, ILike, In } from 'typeorm';
import { BaseRepository } from '../../core/repositories/base.repository';
import { UserFilterOptions } from './user.interface';
import { NotFoundError } from '../../utils/error-handler';
import { User } from '../../models/user.model';
import { UserRole } from '../../models/user-role.model';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  /**
   * Encuentra un usuario por email
   * @param email Email del usuario
   * @param includePassword Si se debe incluir la contraseña en el resultado
   * @returns El usuario encontrado o null
   */
  async findByEmail(email: string, includePassword: boolean = false): Promise<User | null> {
    const options: FindOneOptions<User> = {
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
  async findByIdentification(identification_number: string, includePassword: boolean = false): Promise<User | null> {
    const options: FindOneOptions<User> = {
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
  async assignRole(userId: number, roleId: number): Promise<UserRole> {
    const userRoleRepository = this.repository.manager.getRepository(UserRole);
    
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
  async removeRole(userId: number, roleId: number): Promise<boolean> {
    const userRoleRepository = this.repository.manager.getRepository(UserRole);
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
  async updateSessionToken(userId: number, token: string | null): Promise<User> {
    await this.repository.update(userId, { session_token: token } as any);
    const user = await this.findById(userId);
    
    if (!user) {
      throw new NotFoundError(`Usuario con ID ${userId} no encontrado`);
    }
    
    return user;
  }
  
  /**
   * Actualiza el estado de verificación del usuario
   * @param userId ID del usuario
   * @param verified Estado de verificación
   * @returns El usuario actualizado
   */
  async updateVerificationStatus(userId: number, verified: boolean): Promise<User> {
    await this.repository.update(userId, { verified: verified });
    const user = await this.findById(userId);
    
    if (!user) {
      throw new NotFoundError(`Usuario con ID ${userId} no encontrado`);
    }
    
    return user;
  }
}