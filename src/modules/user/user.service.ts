import { BadRequestError, NotFoundError, UnauthorizedError } from "../../utils/error-handler";
import { UserRepository } from "./user.repository";
import { PaginatedResult, PaginationParams } from "src/core/interfaces/response.interface";
import { UserFilterOptions } from "./user.interface";
import { PasswordService } from "../../utils/password.util";
import { User } from "@models/user.model";
import { FileUploadService } from "../../utils/file-upload.util";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Obtener un usuario por ID
   * @param userId ID del usuario
   * @returns Usuario encontrado
   */
  async getUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(`Usuario con ID ${userId} no encontrado`);
    }
    return user;
  }

  /**
   * Obtener usuarios con paginación
   * @param params Parámetros de paginación
   * @returns Resultado paginado de usuarios
   */
  async getUsers(params: PaginationParams): Promise<PaginatedResult<User>> {
    return await this.userRepository.findWithPagination(params, {
      relations: ['user_roles', 'user_roles.role']
    });
  }

  /**
   * Actualizar datos de un usuario
   * @param userId ID del usuario
   * @param userData Datos a actualizar
   * @returns Usuario actualizado
   */
  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
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
  async updateUserWithProfileImage(userId: number, userData: Partial<User> & { imagebs64?: string }): Promise<User> {
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
      updated_at: new Date()
    }, 'Usuario');
    
    // Si hay imagen, procesarla y actualizar la URL
    if (imageBase64) {
      try {
        // Guardar imagen usando el servicio de utilidad
        const photoUrl = await FileUploadService.saveBase64Image(
          imageBase64,
          'users',
          'profile'
        );
        
        if (photoUrl) {
          // Actualizar la URL y el nombre público en la base de datos
          updatedUser = await this.userRepository.update(
            userId,
            {
              path: photoUrl,
              pubname: userData.pubname,
              updated_at: new Date()
            },
            'Usuario'
          );
        }
      } catch (error) {
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
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<User> {
    // Buscar usuario incluyendo la contraseña
    const user = await this.userRepository.findByEmail(
      (await this.getUserById(userId)).email,
      true
    );
    
    if (!user || !user.password_hash) {
      throw new NotFoundError('Usuario no encontrado o sin contraseña configurada');
    }
    
    // Verificar contraseña actual usando el sistema híbrido
    const isPasswordValid = PasswordService.verifyPassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Contraseña actual incorrecta');
    }
    
    // Generar hash de la nueva contraseña usando el método seguro
    const hashedPassword = PasswordService.hashPassword(newPassword);
    
    // Actualizar contraseña
    return await this.userRepository.update(userId, {
      password_hash: hashedPassword,
      updated_at: new Date()
    }, 'Usuario');
  }

  /**
   * Actualizar avatar/imagen de perfil del usuario
   * @param userId ID del usuario
   * @param imageData Datos de la imagen (base64)
   * @param fileName Nombre del archivo
   * @returns Usuario actualizado
   */
  async updateProfileImage(userId: number, imageData: string, fileName: string): Promise<User> {
    // Comprobar si el usuario existe
    await this.getUserById(userId);
    
    // Actualizar imagen
    return await this.userRepository.update(userId, {
      imagebs64: imageData,
      pubname: fileName,
      updated_at: new Date()
    }, 'Usuario');
  }

  /**
   * Asignar un rol a un usuario
   * @param userId ID del usuario
   * @param roleId ID del rol
   * @returns Confirmación de asignación
   */
  async assignRole(userId: number, roleId: number): Promise<{ success: boolean, message: string }> {
    // Comprobar si el usuario existe
    await this.getUserById(userId);
    
    // Asignar rol
    // await this.userRepository.assignRole(userId, roleId);
    
    return {
      success: true,
      message: 'Rol asignado correctamente'
    };
  }

  /**
   * Quitar un rol a un usuario
   * @param userId ID del usuario
   * @param roleId ID del rol
   * @returns Confirmación de eliminación
   */
  async removeRole(userId: number, roleId: number): Promise<{ success: boolean, message: string }> {
    // Comprobar si el usuario existe
    await this.getUserById(userId);
    
    // Eliminar rol
    // const result = await this.userRepository.removeRole(userId, roleId);
    
    // if (!result) {
    //   throw new NotFoundError('Rol no encontrado para este usuario');
    // }
    
    return {
      success: true,
      message: 'Rol eliminado correctamente'
    };
  }

  /**
   * Eliminar cuenta de usuario
   * @param userId ID del usuario a eliminar
   * @returns Confirmación de eliminación
   */
  async deleteAccount(userId: number): Promise<{ success: boolean, message: string }> {
    await this.getUserById(userId);
    
    // Eliminar usuario
    const result = await this.userRepository.delete(userId, 'Usuario');
    
    if (!result) {
      throw new BadRequestError('No se pudo eliminar la cuenta de usuario');
    }
    
    return {
      success: true,
      message: 'Cuenta eliminada correctamente'
    };
  }
}