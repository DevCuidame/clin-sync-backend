import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import config from '../../core/config/environment';
import {
  ILoginCredentials,
  JwtPayload,
  IRegisterData,
  RefreshTokenPayload,
  IRefreshTokenData,
  IAccountDeletionInfo,
  IDeleteAccountData,
} from '../auth/auth.interface';
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from '../../utils/error-handler';
import { IAuthResponse } from '../auth/auth.interface';
import logger from '../../utils/logger';
import { PasswordService } from '../../utils/password.util';
// import { PatientRepository } from '../patient/patient.repository'; // Temporarily commented - needs migration
import { UserRepository } from '../user/user.repository';
import { User } from '@models/user.model';

import { FileUploadService } from '../../utils/file-upload.util';
import { AppDataSource } from '../../core/config/database';
import { RoleRepository } from '../role/role.repository';
import { UserRole } from '../../models/user-role.model';
import { Township } from '../../models/location.model';
import { EmailService } from '../notification/services/email.service';
import { formatBirthDate } from '../../utils/date-format';
import { NotificationTemplateService } from '../notification/services/notification-template.service';
import { TemplateFileService } from '../notification/services/template-file.service';

export class AuthService {
  private userRepository: UserRepository;
  private roleRepository: RoleRepository;
  private emailService: EmailService;
  private notificationTemplateService: NotificationTemplateService;
  private templateFileService: TemplateFileService;

  constructor() {
    this.userRepository = new UserRepository();
    this.roleRepository = new RoleRepository();
    this.emailService = EmailService.getInstance();
    this.notificationTemplateService = new NotificationTemplateService();
    this.templateFileService = new TemplateFileService();
  }

  /**
   * Iniciar sesión de usuario
   * @param credentials Credenciales de inicio de sesión
   * @returns Respuesta de autenticación con token y datos de usuario
   */

  async login(credentials: ILoginCredentials): Promise<IAuthResponse> {
    const { email, password } = credentials;

    const normalizedEmail = email.toLowerCase();

    // Buscar usuario por email incluyendo el campo password
    const user = await this.userRepository.findByEmail(normalizedEmail, false);
    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Verificar contraseña
    if (!user.password_hash) {
      throw new UnauthorizedError(
        'Este usuario no tiene contraseña configurada'
      );
    }

    // Verificar contraseña (compatible con MD5 y PBKDF2)
    const isPasswordValid = PasswordService.verifyPassword(
      password,
      user.password_hash
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Verificar que el correo electrónico esté verificado
    if (!user.verified) {
      throw new UnauthorizedError(
        'Debe verificar su correo electrónico antes de iniciar sesión'
      );
    }

    // Verificar que el usuario esté activo
    if (user.status !== 'active') {
      const statusMessages = {
        inactive: 'Su cuenta ha sido desactivada. Contacte al administrador.',
        suspended: 'Su cuenta ha sido suspendida. Contacte al administrador.',
        pending:
          'Su cuenta está pendiente de activación. Contacte al administrador.',
      };
      const message =
        statusMessages[user.status as keyof typeof statusMessages] ||
        'Su cuenta no está disponible para iniciar sesión.';
      throw new UnauthorizedError(message);
    }

    const message = 'Sesión iniciada exitosamente';

    // Generar token JWT
    const token = await this.generateToken(user);

    // Generar refresh token
    const refreshToken = this.generateRefreshToken(user);

    // Actualizar token de sesión en la base de datos
    await this.userRepository.updateSessionToken(user.id, token);

    // Obtener el rol del usuario para incluirlo en la respuesta
    const userRoleRepository = AppDataSource.getRepository(UserRole);
    const userRole = await userRoleRepository.findOne({
      where: { user_id: user.id },
      relations: ['role'],
    });
    const roleName = userRole?.role?.role_name || 'usuario';

    // Crear objeto de respuesta (exclude imagebs64 from user data as well)
    const userData = {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        verified: user.verified,
        phone: user.phone,
        identification_type: user.identification_type,
        identification_number: user.identification_number,
        address: user.address,
        gender: user.gender,
        birth_date: formatBirthDate(user.birth_date),
        city_id: user.city_id,
        department: null as number | null,
        pubname: user.pubname,
        privname: user.privname,
        imagebs64: user.imagebs64,
        path: user.path,
        role: roleName,
      },
      access_token: token,
      refresh_token: refreshToken,
    };

    const locationRepository = AppDataSource.getRepository(Township);
    const cityData = await locationRepository.findOne({
      where: { id: user.city_id },
      relations: ['department'],
    });

    if (cityData!.department) {
      userData.user.department = cityData!.department.id;
    }

    return {
      success: true,
      message,
      data: userData,
      token,
      refresh_token: refreshToken,
    };
  }

  /**
   * Refrescar token de acceso usando un refresh token
   * @param refreshTokenData Datos del refresh token
   * @returns Nuevo token de acceso
   */
  async refreshToken(
    refreshTokenData: IRefreshTokenData
  ): Promise<IAuthResponse> {
    const { refresh_token } = refreshTokenData;

    try {
      // Verificar refresh token
      const decoded = jwt.verify(
        refresh_token,
        config.jwt.secret
      ) as RefreshTokenPayload;

      // Validar que sea un refresh token
      if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Token inválido');
      }

      // Buscar usuario
      const user = await this.userRepository.findById(decoded.id);

      if (!user) {
        throw new UnauthorizedError('Usuario no encontrado');
      }

      // Generar nuevo token de acceso
      const newAccessToken = await this.generateToken(user);

      // Generar nuevo refresh token (opcional, para implementar rotación de tokens)
      const newRefreshToken = this.generateRefreshToken(user);

      // Actualizar token de sesión en la base de datos (opcional)
      await this.userRepository.updateSessionToken(user.id, newAccessToken);

      // Obtener el rol del usuario para incluirlo en la respuesta
      const userRoleRepository = AppDataSource.getRepository(UserRole);
      const userRole = await userRoleRepository.findOne({
        where: { user_id: user.id },
        relations: ['role'],
      });
      const roleName = userRole?.role?.role_name || 'User';

      return {
        success: true,
        message: 'Token renovado exitosamente',
        data: {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          role: roleName, // Incluir el rol del usuario en la respuesta
        },
        token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Refresh token inválido o expirado');
      }
      throw error;
    }
  }

  /**
   * Generar refresh token JWT
   * @param user Usuario
   * @returns Refresh token JWT
   */
  private generateRefreshToken(user: User): string {
    const payload: RefreshTokenPayload = {
      id: user.id,
      email: user.email,
      name: user.first_name,
      type: 'refresh',
      token_version: 1, // Versión del token para invalidación masiva si es necesario
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: '30d', // El refresh token dura más tiempo
    });
  }

  /**
   * Registrar un nuevo usuario
   * @param userData Datos del nuevo usuario
   * @returns Respuesta de autenticación
   */
  async register(userData: IRegisterData): Promise<IAuthResponse> {
    const normalizedUserData = {
      ...userData,
      email: userData.email.toLowerCase(),
    };

    const { email, password } = normalizedUserData;

    // Verificar si el email ya está registrado
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestError('No logramos registrar tu correo electrónico.');
    }

    // Verificar si el numero de identificación ya está registrado
    const existingUserIdentification =
      await this.userRepository.findByIdentification(
        normalizedUserData.identification_number
      );
    if (existingUserIdentification) {
      throw new BadRequestError(
        'No logramos registrar tu número de documento.'
      );
    }

    // Generar hash de la contraseña
    const hashedPassword = PasswordService.hashPassword(password);

    const imageBase64 = normalizedUserData.imagebs64;

    const userDataToSave = { ...normalizedUserData };
    delete userDataToSave.imagebs64;

    const newUser = await this.userRepository.create({
      ...userDataToSave,
      password_hash: hashedPassword,
      verified: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Asignar rol por defecto al usuario
    try {
      // Obtener el rol por defecto (normalmente 'User')
      const defaultRole = await this.roleRepository.getDefaultRole();

      if (defaultRole) {
        // Verificar si el usuario ya tiene este rol
        const userRoleRepository = AppDataSource.getRepository(UserRole);
        const existingUserRole = await userRoleRepository.findOne({
          where: {
            user_id: newUser.id,
            role_id: defaultRole.role_id,
          },
        });

        if (!existingUserRole) {
          // Crear la relación usuario-rol solo si no existe
          const userRole = userRoleRepository.create({
            user_id: newUser.id,
            role_id: defaultRole.role_id,
          });

          await userRoleRepository.save(userRole);
        }
      } else {
        logger.warn(
          `No se pudo asignar rol por defecto al usuario ${newUser.id} porque no existe el rol 'usuario'`
        );
      }
    } catch (error) {
      logger.error(`Error al asignar rol al usuario ${newUser.id}:`, error);
      // No fallamos el proceso completo si hay error en la asignación de rol
    }

    // Si hay imagen, guardarla y actualizar la URL de la foto
    let photoUrl = '';
    if (imageBase64) {
      try {
        // Guardar imagen usando el servicio de utilidad
        photoUrl = await FileUploadService.saveBase64Image(
          imageBase64,
          'users',
          'profile'
        );

        if (photoUrl) {
          // Actualizar la URL en la base de datos
          await this.userRepository.update(
            newUser.id,
            {
              path: photoUrl,
              updated_at: new Date(),
            },
            'User'
          );

          // Actualizar el objeto del paciente antes de devolverlo
          newUser.path = photoUrl;
        }
      } catch (error) {
        console.error('Error al guardar imagen de paciente:', error);
        // No fallamos el proceso completo si hay error en la imagen
      }
    }

    // Generar token de verificación
    const verificationToken = jwt.sign(
      { id: newUser.id, email: newUser.email },
      config.jwt.secret,
      { expiresIn: '24h' }
    );

    // Actualizar token en la base de datos
    await this.userRepository.updateSessionToken(newUser.id, verificationToken);

    // Construir la URL de verificación
    const verificationUrl = `${config.server.production_url}/verify-email?token=${verificationToken}`;

    // Enviar email de verificación
    try {
      let emailHtml = '';
      let emailSubject = 'Verificación de correo electrónico - Esencia y Cuerpo';

      try {
        // Intentar obtener la plantilla desde archivo
        emailHtml = await this.templateFileService.renderTemplate(
          'email-verification',
          {
            userName: newUser.first_name,
            verificationUrl: verificationUrl,
            expirationTime: '24 horas',
          }
        );
      } catch (templateError) {
        // Si no se puede leer la plantilla desde archivo, usar plantilla por defecto
        logger.warn(
          'No se pudo leer la plantilla de verificación desde archivo, usando plantilla por defecto'
        );
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #0E6766 0%, #8DD4AA 100%); color: #FFFFFF; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px; color: #FFFFFF;">🏥 Esencia y Cuerpo</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; color: #FFFFFF;">Verificación de Correo Electrónico</p>
            </div>
            <div style="padding: 40px 30px;">
              <div style="font-size: 18px; color: #0E6766; margin-bottom: 20px; font-weight: 600;">
                ¡Hola ${newUser.first_name}! 👋
              </div>
              <p style="font-size: 16px; color: #555; margin-bottom: 30px; line-height: 1.7;">¡Bienvenido/a a <strong>Esencia y Cuerpo</strong>! Para completar tu registro, por favor verifica tu correo electrónico haciendo clic en el siguiente botón:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #8DD4AA 0%, #0E6766 100%); color: #FFFFFF !important; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px;">✅ Verificar mi correo electrónico</a>
              </div>
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <h4 style="color: #856404; margin: 0 0 8px 0; font-size: 14px;">🔒 Aviso de Seguridad</h4>
                <p style="color: #856404; margin: 0; font-size: 13px;">Este enlace expirará en 24 horas. Si no solicitaste esta cuenta, puedes ignorar este correo.</p>
              </div>
              <p style="font-size: 14px; color: #666;">Si tienes problemas con el botón, copia y pega este enlace en tu navegador: ${verificationUrl}</p>
            </div>
            <div style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef; border-radius: 0 0 10px 10px;">
              <p style="margin: 5px 0; color: #0E6766; font-weight: 600;">Esencia y Cuerpo</p>
              <p style="margin: 5px 0; color: #6c757d; font-size: 14px;">Sistema de Gestión Clínica Digital</p>
            </div>
          </div>
        `;
      }

      // Enviar el correo
      await this.emailService.sendEmail({
        to: newUser.email,
        subject: emailSubject,
        html: emailHtml,
      });

      logger.info(`Email de verificación enviado a ${newUser.email}`);
    } catch (error) {
      logger.error('Error al enviar email de verificación:', error);
      // No fallamos el registro si hay error en el email, pero lo registramos
    }

    return {
      success: true,
      message:
        'Usuario registrado exitosamente. Por favor, verifica tu correo electrónico.',
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.first_name,
        lastname: newUser.last_name,
      },
    };
  }

  /**
   * Solicitar restablecimiento de contraseña
   * @param email Email del usuario
   * @returns Respuesta de autenticación
   */
  async forgotPassword(email: string): Promise<IAuthResponse> {
    // Verificar si el usuario existe
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Por seguridad, no informar si el email existe o no
      return {
        success: true,
        message:
          'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.',
      };
    }

    // Generar token de restablecimiento
    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // Actualizar token en la base de datos
    await this.userRepository.updateSessionToken(user.id, resetToken);

    // Construir la URL de restablecimiento
    const resetUrl = `${config.server.production_url}/reset-password?token=${resetToken}`;

    // Enviar email con instrucciones
    try {
      // Intentar usar la plantilla desde archivo
      let emailHtml = '';
      let emailSubject = 'Restablecimiento de contraseña';

      try {
        // Intentar obtener la plantilla desde archivo
        emailHtml = await this.templateFileService.renderTemplate(
          'password_reset',
          {
            userName: user.first_name,
            resetUrl: resetUrl,
            expirationTime: '1 hora',
          }
        );
      } catch (templateError) {
        // Si no se puede leer la plantilla desde archivo, intentar usar la plantilla de la base de datos
        logger.warn(
          'No se pudo leer la plantilla desde archivo, intentando usar plantilla de la base de datos'
        );

        try {
          // Intentar obtener la plantilla por código desde la base de datos
          const { subject, body } =
            await this.notificationTemplateService.renderTemplate(
              'password_reset',
              {
                userName: user.first_name,
                resetUrl: resetUrl,
                expirationTime: '1 hora',
              }
            );
          emailHtml = body;
          emailSubject = subject;
        } catch (dbTemplateError) {
          // Si no existe la plantilla en la base de datos, usar la plantilla en línea
          logger.warn(
            'Plantilla de restablecimiento de contraseña no encontrada, usando plantilla por defecto'
          );
          emailHtml = `
            <h1>Restablecimiento de contraseña</h1>
            <p>Hola ${user.first_name},</p>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
            <p><a href="${resetUrl}">Restablecer contraseña</a></p>
            <p>Este enlace expirará en 1 hora.</p>
            <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
            <p>Saludos,<br>El equipo de Cuidame Health</p>
          `;
        }
      }

      // Enviar el correo
      await this.emailService.sendEmail({
        to: user.email,
        subject: emailSubject,
        html: emailHtml,
      });

      logger.info(`Email de restablecimiento enviado a ${user.email}`);
    } catch (error) {
      logger.error('Error al enviar email de restablecimiento:', error);
      // No devolvemos el error al usuario por seguridad
    }

    return {
      success: true,
      message:
        'Se han enviado instrucciones para restablecer tu contraseña a tu correo.',
    };
  }

  /**
   * Restablecer contraseña de usuario
   * @param token Token de restablecimiento
   * @param newPassword Nueva contraseña
   * @returns Respuesta de autenticación
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<IAuthResponse> {
    try {
      // Verificar token
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

      // Buscar usuario
      const user = await this.userRepository.findById(decoded.id);
      if (!user || user.session_token !== token) {
        throw new UnauthorizedError('Token inválido o expirado');
      }

      // Generar hash de la nueva contraseña
      const hashedPassword = PasswordService.hashPasswordMD5(newPassword);

      // Actualizar contraseña y limpiar token
      await this.userRepository.update(
        user.id,
        {
          password_hash: hashedPassword,
          session_token: null as any,
        },
        'Usuario'
      );

      return {
        success: true,
        message: 'Contraseña actualizada correctamente',
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Token inválido o expirado');
      }
      throw error;
    }
  }

  /**
   * Verificar email de usuario
   * @param token Token de verificación
   * @returns Respuesta de autenticación
   */
  async verifyEmail(token: string): Promise<IAuthResponse> {
    try {
      // Verificar token
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

      // Buscar usuario
      const user = await this.userRepository.findById(decoded.id);
      if (!user || user.session_token !== token) {
        throw new UnauthorizedError('Token inválido o expirado');
      }

      // Actualizar estado de verificación y limpiar token
      await this.userRepository.updateVerificationStatus(user.id, true);
      await this.userRepository.updateSessionToken(user.id, null);

      return {
        success: true,
        message: 'Correo electrónico verificado correctamente',
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Token inválido o expirado');
      }
      throw error;
    }
  }

  /**
   * Cambiar contraseña de usuario
   * @param userId ID del usuario
   * @param currentPassword Contraseña actual
   * @param newPassword Nueva contraseña
   * @returns Respuesta de autenticación
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<IAuthResponse> {
    // Buscar usuario por ID
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Buscar usuario por email para incluir la contraseña
    const userWithPassword = await this.userRepository.findByEmail(
      user.email,
      true
    );

    if (!userWithPassword || !userWithPassword.password_hash) {
      throw new UnauthorizedError(
        'Este usuario no tiene contraseña configurada'
      );
    }

    // Verificar contraseña actual (compatible con MD5 y PBKDF2)
    const isPasswordValid = PasswordService.verifyPassword(
      currentPassword,
      userWithPassword.password_hash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError('La contraseña actual es incorrecta');
    }

    // Generar hash de la nueva contraseña
    const hashedPassword = PasswordService.hashPasswordMD5(newPassword);

    // Actualizar contraseña
    await this.userRepository.update(
      user.id,
      {
        password_hash: hashedPassword,
        updated_at: new Date(),
      },
      'Usuario'
    );

    return {
      success: true,
      message: 'Contraseña actualizada correctamente',
    };
  }

  /**
   * Cerrar sesión de usuario
   * @param userId ID del usuario
   * @returns Respuesta de autenticación
   */
  async logout(userId: number): Promise<IAuthResponse> {
    // Limpiar token de sesión
    await this.userRepository.updateSessionToken(userId, null);

    return {
      success: true,
      message: 'Sesión cerrada correctamente',
    };
  }

  /**
   * Generar token JWT
   * @param user Usuario
   * @returns Token JWT
   */
  private async generateToken(user: User): Promise<string> {
    // Obtener el rol activo del usuario
    const userRoleRepository = AppDataSource.getRepository(UserRole);
    const userRole = await userRoleRepository.findOne({
      where: { user_id: user.id, is_active: true },
      relations: ['role'],
    });

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      name: user.first_name,
      role: userRole?.role?.role_name || 'usuario',
    };

    // @ts-ignore - Forzar a TypeScript a ignorar este error específico
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  /**
   * Verificar contraseña del usuario para eliminación de cuenta
   * @param userId ID del usuario
   * @param password Contraseña a verificar
   * @returns Respuesta de autenticación
   */
  async verifyPasswordForDeletion(
    userId: number,
    password: string
  ): Promise<IAuthResponse> {
    // Buscar usuario por ID
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Buscar usuario por email para incluir la contraseña
    const userWithPassword = await this.userRepository.findByEmail(
      user.email,
      true
    );

    if (!userWithPassword || !userWithPassword.password_hash) {
      throw new UnauthorizedError(
        'Este usuario no tiene contraseña configurada'
      );
    }

    // Verificar contraseña (compatible con MD5 y PBKDF2)
    const isPasswordValid = PasswordService.verifyPassword(
      password,
      userWithPassword.password_hash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError('Contraseña incorrecta');
    }

    return {
      success: true,
      message: 'Contraseña verificada correctamente',
    };
  }

  /**
   * Obtener información para eliminación de cuenta
   * @returns Información para eliminación de cuenta
   */
  async getAccountDeletionInfo(): Promise<IAccountDeletionInfo> {
    // Lista de razones predefinidas para eliminación de cuenta
    const reasons = [
      'Ya no necesito el servicio',
      'Preocupaciones de privacidad',
      'Problemas técnicos',
      'Servicio al cliente',
      'Otro motivo',
    ];

    // Texto de confirmación que el usuario debe escribir
    const confirmationText = 'ELIMINAR';

    return {
      reasons,
      confirmationText,
    };
  }

  /**
   * Eliminar cuenta de usuario
   * @param userId ID del usuario
   * @param deleteData Datos para eliminación de cuenta
   * @returns Respuesta de autenticación
   */
  async deleteAccount(
    userId: number,
    deleteData: IDeleteAccountData
  ): Promise<IAuthResponse> {
    const { password, confirmation, reason, otherReason } = deleteData;

    // Verificar que la confirmación sea correcta
    const accountInfo = await this.getAccountDeletionInfo();
    if (confirmation !== accountInfo.confirmationText) {
      throw new BadRequestError('El texto de confirmación no es correcto');
    }

    // Verificar contraseña y obtener usuario
    await this.verifyPasswordForDeletion(userId, password);

    // Registrar la razón de eliminación (esto podría guardarse en una tabla de auditoría)
    logger.info(
      `Usuario ${userId} eliminó su cuenta. Razón: ${
        reason || 'No especificada'
      } ${otherReason ? `- ${otherReason}` : ''}`
    );

    // Eliminar usuario (o marcar como inactivo, dependiendo de la política de la aplicación)
    // Opción 1: Eliminar completamente
    await this.userRepository.delete(userId, 'Usuario');

    // Opción 2: Marcar como inactivo y anonimizar datos (descomentar si se prefiere esta opción)
    /*
    await this.userRepository.update(
      userId,
      {
        active: false,
        email: `deleted_${userId}_${Date.now()}@deleted.com`,
        name: 'Usuario eliminado',
        lastname: '',
        phone: '',
        session_token: null,
        updated_at: new Date(),
      },
      'Usuario'
    );
    */

    return {
      success: true,
      message: 'Cuenta eliminada correctamente',
    };
  }
}
