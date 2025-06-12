import { Request, Response, NextFunction } from 'express';
import { UserSessionService } from './user-session.service';
import { BadRequestError } from '../../utils/error-handler';
import {
  ApiResponse,
  PaginationParams
} from '../../core/interfaces/response.interface';
import {
  ICreateUserSessionData,
  IUpdateUserSessionData,
  IUseSessionData,
  UserSessionFilterOptions
} from './user-session.interface';
import { UserSessionStatus } from '../../models/user-session.model';

export class UserSessionController {
  private userSessionService: UserSessionService;

  constructor() {
    this.userSessionService = new UserSessionService();
  }

  /**
   * Crear una nueva sesión de usuario
   * @route POST /api/user-sessions
   */
  async createUserSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: ICreateUserSessionData = req.body;
      
      // Validaciones básicas
      if (!data.purchase_id || !data.service_id || !data.sessions_remaining || !data.expires_at) {
        throw new BadRequestError('Faltan campos requeridos: purchase_id, service_id, sessions_remaining, expires_at');
      }

      // Convertir expires_at a Date si es string
      if (typeof data.expires_at === 'string') {
        data.expires_at = new Date(data.expires_at);
      }

      const userSession = await this.userSessionService.createUserSession(data);
      
      const response: ApiResponse = {
        success: true,
        message: 'Sesión de usuario creada exitosamente',
        data: userSession
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener una sesión por ID
   * @route GET /api/user-sessions/:id
   */
  async getUserSessionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userSessionId = parseInt(req.params.id);
      
      if (isNaN(userSessionId)) {
        throw new BadRequestError('ID de sesión inválido');
      }

      const userSession = await this.userSessionService.getUserSessionById(userSessionId);
      
      const response: ApiResponse = {
        success: true,
        message: 'Sesión de usuario obtenida exitosamente',
        data: userSession
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener sesiones por compra
   * @route GET /api/user-sessions/purchase/:purchaseId
   */
  async getUserSessionsByPurchase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const purchaseId = parseInt(req.params.purchaseId);
      
      if (isNaN(purchaseId)) {
        throw new BadRequestError('ID de compra inválido');
      }

      const activeOnly = req.query.active_only === 'true';
      
      const userSessions = activeOnly 
        ? await this.userSessionService.getActiveUserSessionsByPurchase(purchaseId)
        : await this.userSessionService.getUserSessionsByPurchase(purchaseId);
      
      const response: ApiResponse = {
        success: true,
        message: 'Sesiones de usuario obtenidas exitosamente',
        data: userSessions
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener sesiones por servicio
   * @route GET /api/user-sessions/service/:serviceId
   */
  async getUserSessionsByService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceId = parseInt(req.params.serviceId);
      
      if (isNaN(serviceId)) {
        throw new BadRequestError('ID de servicio inválido');
      }

      const userSessions = await this.userSessionService.getUserSessionsByService(serviceId);
      
      const response: ApiResponse = {
        success: true,
        message: 'Sesiones de usuario obtenidas exitosamente',
        data: userSessions
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar sesiones con filtros
   * @route GET /api/user-sessions/search
   */
  async searchUserSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: UserSessionFilterOptions = {};
      
      // Construir filtros desde query parameters
      if (req.query.purchase_id) {
        filters.purchase_id = parseInt(req.query.purchase_id as string);
      }
      
      if (req.query.service_id) {
        filters.service_id = parseInt(req.query.service_id as string);
      }
      
      if (req.query.status) {
        filters.status = req.query.status as UserSessionStatus;
      }
      
      if (req.query.expires_before) {
        filters.expires_before = new Date(req.query.expires_before as string);
      }
      
      if (req.query.expires_after) {
        filters.expires_after = new Date(req.query.expires_after as string);
      }
      
      if (req.query.has_remaining_sessions !== undefined) {
        filters.has_remaining_sessions = req.query.has_remaining_sessions === 'true';
      }

      const withDetails = req.query.with_details === 'true';
      
      const userSessions = withDetails 
        ? await this.userSessionService.getUserSessionsWithDetails(filters)
        : await this.userSessionService.searchUserSessions(filters);
      
      const response: ApiResponse = {
        success: true,
        message: 'Búsqueda de sesiones completada exitosamente',
        data: userSessions
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Usar sesiones (reducir contador)
   * @route POST /api/user-sessions/:id/use
   */
  async useSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userSessionId = parseInt(req.params.id);
      
      if (isNaN(userSessionId)) {
        throw new BadRequestError('ID de sesión inválido');
      }

      const data: IUseSessionData = {
        user_session_id: userSessionId,
        sessions_to_use: req.body.sessions_to_use || 1
      };

      const userSession = await this.userSessionService.useSessions(data);
      
      const response: ApiResponse = {
        success: true,
        message: `${data.sessions_to_use} sesión(es) utilizada(s) exitosamente`,
        data: userSession
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar una sesión
   * @route PUT /api/user-sessions/:id
   */
  async updateUserSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userSessionId = parseInt(req.params.id);
      
      if (isNaN(userSessionId)) {
        throw new BadRequestError('ID de sesión inválido');
      }

      const data: IUpdateUserSessionData = req.body;
      
      // Convertir expires_at a Date si es string
      if (data.expires_at && typeof data.expires_at === 'string') {
        data.expires_at = new Date(data.expires_at);
      }

      const userSession = await this.userSessionService.updateUserSession(userSessionId, data);
      
      const response: ApiResponse = {
        success: true,
        message: 'Sesión de usuario actualizada exitosamente',
        data: userSession
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancelar una sesión
   * @route POST /api/user-sessions/:id/cancel
   */
  async cancelUserSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userSessionId = parseInt(req.params.id);
      
      if (isNaN(userSessionId)) {
        throw new BadRequestError('ID de sesión inválido');
      }

      const userSession = await this.userSessionService.cancelUserSession(userSessionId);
      
      const response: ApiResponse = {
        success: true,
        message: 'Sesión de usuario cancelada exitosamente',
        data: userSession
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reactivar una sesión cancelada
   * @route POST /api/user-sessions/:id/reactivate
   */
  async reactivateUserSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userSessionId = parseInt(req.params.id);
      
      if (isNaN(userSessionId)) {
        throw new BadRequestError('ID de sesión inválido');
      }

      const userSession = await this.userSessionService.reactivateUserSession(userSessionId);
      
      const response: ApiResponse = {
        success: true,
        message: 'Sesión de usuario reactivada exitosamente',
        data: userSession
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener estadísticas de sesiones por usuario
   * @route GET /api/user-sessions/stats/:userId
   */
  async getUserSessionStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        throw new BadRequestError('ID de usuario inválido');
      }

      const stats = await this.userSessionService.getUserSessionStats(userId);
      
      const response: ApiResponse = {
        success: true,
        message: 'Estadísticas de sesiones obtenidas exitosamente',
        data: stats
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Procesar sesiones expiradas (endpoint administrativo)
   * @route POST /api/user-sessions/admin/process-expired
   */
  async processExpiredSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatedCount = await this.userSessionService.processExpiredSessions();
      
      const response: ApiResponse = {
        success: true,
        message: `${updatedCount} sesiones marcadas como expiradas`,
        data: { updated_count: updatedCount }
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Procesar sesiones agotadas (endpoint administrativo)
   * @route POST /api/user-sessions/admin/process-exhausted
   */
  async processExhaustedSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatedCount = await this.userSessionService.processExhaustedSessions();
      
      const response: ApiResponse = {
        success: true,
        message: `${updatedCount} sesiones marcadas como agotadas`,
        data: { updated_count: updatedCount }
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar una sesión
   * @route DELETE /api/user-sessions/:id
   */
  async deleteUserSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userSessionId = parseInt(req.params.id);
      
      if (isNaN(userSessionId)) {
        throw new BadRequestError('ID de sesión inválido');
      }

      await this.userSessionService.deleteUserSession(userSessionId);
      
      const response: ApiResponse = {
        success: true,
        message: 'Sesión de usuario eliminada exitosamente'
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}