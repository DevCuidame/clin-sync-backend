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
    
    // Verificar si ya existe esta asignación (incluyendo inactivos)
    const existingAssignment = await userRoleRepository.findOne({
      where: { user_id: userId, role_id: roleId }
    });
    
    if (existingAssignment) {
      // Si existe pero está inactivo, reactivarlo
      if (!existingAssignment.is_active) {
        existingAssignment.is_active = true;
        existingAssignment.assigned_at = new Date();
        return await userRoleRepository.save(existingAssignment);
      }
      // Si ya existe y está activo, devolverlo
      return existingAssignment;
    }
    
    try {
      // Crear nueva asignación
      const userRole = userRoleRepository.create({
        user_id: userId,
        role_id: roleId
      });
      
      return await userRoleRepository.save(userRole);
    } catch (error: any) {
      // Si hay error de duplicado, intentar obtener el registro existente
      if (error.code === '23505') { // Código de error PostgreSQL para violación de restricción única
        const existingAssignment = await userRoleRepository.findOne({
          where: { user_id: userId, role_id: roleId }
        });
        if (existingAssignment) {
          return existingAssignment;
        }
      }
      throw error;
    }
  }

  /**
   * Elimina un rol de un usuario (desactivándolo en lugar de eliminarlo físicamente)
   * @param userId ID del usuario
   * @param roleId ID del rol
   * @returns True si se eliminó correctamente
   */
  async removeRole(userId: number, roleId: number): Promise<boolean> {
    const userRoleRepository = this.repository.manager.getRepository(UserRole);
    
    // Buscar la asignación activa
    const userRole = await userRoleRepository.findOne({
      where: { user_id: userId, role_id: roleId, is_active: true }
    });
    
    if (!userRole) {
      return false;
    }
    
    // Desactivar en lugar de eliminar físicamente
    userRole.is_active = false;
    await userRoleRepository.save(userRole);
    
    return true;
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

  /**
   * Actualiza el rol del usuario (reemplaza el rol existente)
   * @param userId ID del usuario
   * @param roleId ID del nuevo rol
   * @returns Información sobre si es un rol nuevo o actualizado
   */
  async updateUserRole(userId: number, roleId: number): Promise<{ isNewRole: boolean }> {
    const userRoleRepository = this.repository.manager.getRepository(UserRole);
    
    // Usar transacción para asegurar consistencia
    return await this.repository.manager.transaction(async (transactionalEntityManager) => {
      const transactionalUserRoleRepo = transactionalEntityManager.getRepository(UserRole);
      
      // Verificar si el usuario ya tiene este rol activo
      const existingRole = await transactionalUserRoleRepo.findOne({
        where: { user_id: userId, role_id: roleId, is_active: true }
      });
      
      if (existingRole) {
        // El usuario ya tiene este rol, no hacer nada
        return { isNewRole: false };
      }
      
      // Desactivar todos los roles existentes del usuario
      await transactionalUserRoleRepo.update(
        { user_id: userId, is_active: true },
        { is_active: false }
      );
      
      // Verificar si existe una asignación previa inactiva para reactivar
      const inactiveRole = await transactionalUserRoleRepo.findOne({
        where: { user_id: userId, role_id: roleId, is_active: false }
      });
      
      if (inactiveRole) {
        // Reactivar el rol existente
        inactiveRole.is_active = true;
        inactiveRole.assigned_at = new Date();
        await transactionalUserRoleRepo.save(inactiveRole);
        return { isNewRole: false };
      } else {
        // Crear nueva asignación de rol
        const newUserRole = transactionalUserRoleRepo.create({
          user_id: userId,
          role_id: roleId,
          is_active: true
        });
        await transactionalUserRoleRepo.save(newUserRole);
        return { isNewRole: true };
      }
    });
  }

  /**
   * Elimina todos los roles activos de un usuario
   * @param userId ID del usuario
   * @returns True si se eliminaron roles correctamente
   */
  async removeAllUserRoles(userId: number): Promise<boolean> {
    const userRoleRepository = this.repository.manager.getRepository(UserRole);
    
    // Buscar roles activos del usuario
    const activeRoles = await userRoleRepository.find({
      where: { user_id: userId, is_active: true }
    });
    
    if (activeRoles.length === 0) {
      return false;
    }
    
    // Desactivar todos los roles activos
    await userRoleRepository.update(
      { user_id: userId, is_active: true },
      { is_active: false }
    );
    
    return true;
  }

  /**
   * Activa un usuario cambiando su estado a ACTIVE
   * @param userId ID del usuario
   * @returns El usuario actualizado
   */
  async activateUser(userId: number): Promise<User> {
    await this.repository.update(userId, { status: 'active' as any });
    const user = await this.findById(userId);
    
    if (!user) {
      throw new NotFoundError(`Usuario con ID ${userId} no encontrado`);
    }
    
    return user;
  }

  /**
   * Desactiva un usuario cambiando su estado a INACTIVE
   * @param userId ID del usuario
   * @returns El usuario actualizado
   */
  async deactivateUser(userId: number): Promise<User> {
    await this.repository.update(userId, { status: 'inactive' as any });
    const user = await this.findById(userId);
    
    if (!user) {
      throw new NotFoundError(`Usuario con ID ${userId} no encontrado`);
    }
    
    return user;
  }

  /**
   * Actualiza el estado de un usuario
   * @param userId ID del usuario
   * @param status Nuevo estado del usuario
   * @returns El usuario actualizado
   */
  async updateUserStatus(userId: number, status: string): Promise<User> {
    await this.repository.update(userId, { status: status as any });
    const user = await this.findById(userId);
    
    if (!user) {
      throw new NotFoundError(`Usuario con ID ${userId} no encontrado`);
    }
    
    return user;
  }
}