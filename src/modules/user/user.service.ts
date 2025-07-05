import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../../utils/error-handler';
import { UserRepository } from './user.repository';
import {
  PaginatedResult,
  PaginationParams,
} from 'src/core/interfaces/response.interface';
import { UserCompleteInfo, UserFilterOptions } from './user.interface';
import { PasswordService } from '../../utils/password.util';
import { User } from '../../models/user.model';
import { FileUploadService } from '../../utils/file-upload.util';
import { Purchase } from '../../models/purchase.model';
import { UserSession } from '../../models/user-session.model';
import { Appointment } from '../../models/appointment.model';
import { AppDataSource } from '../../core/config/database';

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
      relations: ['user_roles', 'user_roles.role'],
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
  async updateUserWithProfileImage(
    userId: number,
    userData: Partial<User> & { imagebs64?: string }
  ): Promise<User> {
    // Comprobar si el usuario existe
    await this.getUserById(userId);

    // Extraer la imagen base64 si existe
    const imageBase64 = userData.imagebs64;

    // Crear una copia de los datos sin la imagen para actualizar primero la información básica
    const userDataToUpdate = { ...userData };
    delete userDataToUpdate.imagebs64;

    // Actualizar datos básicos del usuario
    let updatedUser = await this.userRepository.update(
      userId,
      {
        ...userDataToUpdate,
        updated_at: new Date(),
      },
      'Usuario'
    );

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
              updated_at: new Date(),
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
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<User> {
    // Buscar usuario incluyendo la contraseña
    const user = await this.userRepository.findByEmail(
      (
        await this.getUserById(userId)
      ).email,
      true
    );

    if (!user || !user.password_hash) {
      throw new NotFoundError(
        'Usuario no encontrado o sin contraseña configurada'
      );
    }

    // Verificar contraseña actual usando el sistema híbrido
    const isPasswordValid = PasswordService.verifyPassword(
      currentPassword,
      user.password_hash
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError('Contraseña actual incorrecta');
    }

    // Generar hash de la nueva contraseña usando el método seguro
    const hashedPassword = PasswordService.hashPassword(newPassword);

    // Actualizar contraseña
    return await this.userRepository.update(
      userId,
      {
        password_hash: hashedPassword,
        updated_at: new Date(),
      },
      'Usuario'
    );
  }

  /**
   * Actualizar avatar/imagen de perfil del usuario
   * @param userId ID del usuario
   * @param imageData Datos de la imagen (base64)
   * @param fileName Nombre del archivo
   * @returns Usuario actualizado
   */
  async updateProfileImage(
    userId: number,
    imageData: string,
    fileName: string
  ): Promise<User> {
    // Comprobar si el usuario existe
    await this.getUserById(userId);

    // Actualizar imagen
    return await this.userRepository.update(
      userId,
      {
        imagebs64: imageData,
        pubname: fileName,
        updated_at: new Date(),
      },
      'Usuario'
    );
  }

  /**
   * Asignar un rol a un usuario
   * @param userId ID del usuario
   * @param roleId ID del rol
   * @param currentUserId ID del usuario que realiza la acción
   * @returns Confirmación de asignación
   */
  async assignRole(
    userId: number,
    roleId: number,
    currentUserId?: number
  ): Promise<{ success: boolean; message: string }> {
    // Comprobar si el usuario existe
    await this.getUserById(userId);

    // Verificar que los administradores no puedan cambiar su propio rol
    if (currentUserId && currentUserId === userId) {
      // Verificar si el usuario actual es administrador
      const currentUser = await this.userRepository.findById(currentUserId, {
        relations: ['user_roles', 'user_roles.role']
      });
      
      const isAdmin = currentUser?.user_roles?.some(
        userRole => userRole.role?.role_name === 'admin' && userRole.is_active
      );
      
      if (isAdmin) {
        throw new BadRequestError('Los administradores no pueden cambiar su propio rol');
      }
    }

    // Actualizar rol del usuario (reemplazar rol existente)
    const result = await this.userRepository.updateUserRole(userId, roleId);
    
    return {
      success: true,
      message: result.isNewRole ? 'Rol asignado correctamente' : 'Rol actualizado correctamente',
    };
  }

  /**
   * Quitar el rol actual de un usuario
   * @param userId ID del usuario
   * @param currentUserId ID del usuario que realiza la acción
   * @returns Confirmación de eliminación
   */
  async removeRole(
    userId: number,
    currentUserId?: number
  ): Promise<{ success: boolean; message: string }> {
    // Comprobar si el usuario existe
    await this.getUserById(userId);

    // Verificar que los administradores no puedan eliminar su propio rol
    if (currentUserId && currentUserId === userId) {
      // Verificar si el usuario actual es administrador
      const currentUser = await this.userRepository.findById(currentUserId, {
        relations: ['user_roles', 'user_roles.role']
      });
      
      const isAdmin = currentUser?.user_roles?.some(
        userRole => userRole.role?.role_name === 'admin' && userRole.is_active
      );
      
      if (isAdmin) {
        throw new BadRequestError('Los administradores no pueden eliminar su propio rol');
      }
    }

    // Eliminar todos los roles activos del usuario
    const result = await this.userRepository.removeAllUserRoles(userId);

    if (!result) {
      throw new NotFoundError('No se encontraron roles activos para este usuario');
    }

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
  async deleteAccount(
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    await this.getUserById(userId);

    // Eliminar usuario
    const result = await this.userRepository.delete(userId, 'Usuario');

    if (!result) {
      throw new BadRequestError('No se pudo eliminar la cuenta de usuario');
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
  async getUserCompleteInfo(userId: number): Promise<any> {
    const user = await this.getUserById(userId);
    const purchases = await this.getUserPurchasesWithDetails(userId);
    const summary = await this.calculateUserSummary(userId, purchases);
    
    return {
      user: this.mapUserBasicInfo(user),
      purchases,
      summary
    };
  }

  private async getUserPurchasesWithDetails(userId: number) {
    const purchases = await this.getPurchasesWithRelations(userId);
    return Promise.all(purchases.map((purchase: any) => this.buildPurchaseWithSessions(purchase)));
  }

  private async getUserPurchasesOptimized(userId: number) {
    return await AppDataSource.getRepository(Purchase)
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

  private async buildPurchaseWithSessions(purchase: any) {
    const sessions = await this.getSessionsWithAppointments(purchase.purchase_id);
    return {
      ...this.mapPurchaseBasicInfo(purchase),
      sessions
    };
  }

  private async getPurchasesWithRelations(userId: number) {
    return await AppDataSource.getRepository(Purchase)
      .createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.package', 'package')
      .leftJoinAndSelect('purchase.payment_transactions', 'transactions')
      .where('purchase.user_id = :userId', { userId })
      .orderBy('purchase.purchase_date', 'DESC')
      .getMany();
  }

  private async getSessionsWithAppointments(purchaseId: number) {
    return await AppDataSource.getRepository(UserSession)
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

  private mapPurchaseBasicInfo(purchase: any) {
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

  private async calculateUserSummary(userId: number, purchases: any[]) {
    const totalPurchases = purchases.length;
    const totalAmountSpent = purchases.reduce((sum, purchase) => sum + (parseFloat(purchase.amount_paid) || 0), 0);
    
    // Count sessions and appointments
    let activeSessions = 0;
    let completedAppointments = 0;
    let pendingAppointments = 0;
    let cancelledAppointments = 0;
    let totalSessionsRemaining = 0;
    
    const serviceUsage: { [key: string]: number } = {};
    const professionalUsage: { [key: string]: number } = {};
    
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
    const mostUsedService = Object.keys(serviceUsage).reduce((a, b) => 
      serviceUsage[a] > serviceUsage[b] ? a : b, Object.keys(serviceUsage)[0]);
    
    const favoriteProfessional = Object.keys(professionalUsage).reduce((a, b) => 
      professionalUsage[a] > professionalUsage[b] ? a : b, Object.keys(professionalUsage)[0]);
    
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

  private mapUserBasicInfo(user: any) {
    const { id, email, first_name, last_name, identification_type, 
            identification_number, birth_date, address, phone, gender, 
            status, verified, created_at, updated_at, path, pubname, user_roles } = user;
    
    return { id, email, first_name, last_name, identification_type, 
             identification_number, birth_date, address, phone, gender, 
             status, verified, created_at, updated_at, path, pubname, user_roles };
  }

  private mapServiceInfo(service: any) {
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
   * Activar un usuario
   * @param userId ID del usuario a activar
   * @param currentUserId ID del usuario que realiza la acción
   * @returns Confirmación de activación
   */
  async activateUser(
    userId: number,
    currentUserId?: number
  ): Promise<{ success: boolean; message: string; user: User }> {
    // Comprobar si el usuario existe
    const user = await this.getUserById(userId);

    // Verificar que el usuario no esté ya activo
    if (user.status === 'active') {
      throw new BadRequestError('El usuario ya está activo');
    }

    // Activar usuario
    const updatedUser = await this.userRepository.activateUser(userId);

    return {
      success: true,
      message: 'Usuario activado correctamente',
      user: updatedUser,
    };
  }

  /**
   * Desactivar un usuario
   * @param userId ID del usuario a desactivar
   * @param currentUserId ID del usuario que realiza la acción
   * @returns Confirmación de desactivación
   */
  async deactivateUser(
    userId: number,
    currentUserId?: number
  ): Promise<{ success: boolean; message: string; user: User }> {
    // Comprobar si el usuario existe
    const user = await this.getUserById(userId);

    // Verificar que no sea el mismo usuario intentando desactivarse
    if (currentUserId && currentUserId === userId) {
      throw new BadRequestError('No puedes desactivar tu propia cuenta');
    }

    // Verificar que el usuario no esté ya inactivo
    if (user.status === 'inactive') {
      throw new BadRequestError('El usuario ya está inactivo');
    }

    // Desactivar usuario
    const updatedUser = await this.userRepository.deactivateUser(userId);

    return {
      success: true,
      message: 'Usuario desactivado correctamente',
      user: updatedUser,
    };
  }

  /**
   * Cambiar el estado de un usuario
   * @param userId ID del usuario
   * @param status Nuevo estado del usuario
   * @param currentUserId ID del usuario que realiza la acción
   * @returns Confirmación del cambio de estado
   */
  async updateUserStatus(
    userId: number,
    status: string,
    currentUserId?: number
  ): Promise<{ success: boolean; message: string; user: User }> {
    // Comprobar si el usuario existe
    const user = await this.getUserById(userId);

    // Validar que el estado sea válido
    const validStatuses = ['active', 'inactive', 'suspended', 'pending'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError(`Estado inválido. Estados válidos: ${validStatuses.join(', ')}`);
    }

    // Verificar que no sea el mismo usuario intentando cambiar su estado a inactivo o suspendido
    if (currentUserId && currentUserId === userId && ['inactive', 'suspended'].includes(status)) {
      throw new BadRequestError('No puedes cambiar tu propio estado a inactivo o suspendido');
    }

    // Verificar que el estado sea diferente al actual
    if (user.status === status) {
      throw new BadRequestError(`El usuario ya tiene el estado: ${status}`);
    }

    // Actualizar estado del usuario
    const updatedUser = await this.userRepository.updateUserStatus(userId, status);

    return {
      success: true,
      message: `Estado del usuario actualizado a: ${status}`,
      user: updatedUser,
    };
  }

/**
 * Obtener información completa de todos los usuarios con paginación
 * @param params Parámetros de paginación
 * @returns Resultado paginado con información completa de usuarios
 */
async getAllUsersCompleteInfo(params: PaginationParams): Promise<PaginatedResult<any>> {
  // Establecer valores por defecto para parámetros de paginación
  const page = params.page || 1;
  const limit = params.limit || 10;
  const sort = params.sort || 'id';
  const order = params.order || 'ASC';

  // Obtener usuarios con paginación usando el método existente
  const usersResult = await this.userRepository.findWithPagination(
    { page, limit, sort, order },
    {
      relations: ['user_roles', 'user_roles.role'],
    }
  );

  // Obtener información completa para cada usuario
  const usersWithCompleteInfo = await Promise.all(
    usersResult.items.map(async (user) => {
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
      } catch (error) {
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
    })
  );

  return {
    items: usersWithCompleteInfo,
    metadata: usersResult.metadata
  };
}


}
