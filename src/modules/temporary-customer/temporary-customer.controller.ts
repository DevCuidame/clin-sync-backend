import { NextFunction, Request, Response } from 'express';
import { TemporaryCustomerService } from './temporary-customer.service';
import { BadRequestError, NotFoundError } from '../../utils/error-handler';
import { IdentificationType } from '../../models/temporary-customer.model';

export class TemporaryCustomerController {
  private temporaryCustomerService: TemporaryCustomerService;

  constructor() {
    this.temporaryCustomerService = new TemporaryCustomerService();
  }

  /**
   * Buscar cliente temporal por identificación
   * GET /api/temporary-customers/search
   * Query params: identification_type, identification_number
   */
  searchByIdentification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { identification_type, identification_number } = req.query;

      if (!identification_type || !identification_number) {
        throw new BadRequestError('identification_type and identification_number are required');
      }

      const customer = await this.temporaryCustomerService.findByIdentification(
        identification_type as IdentificationType,
        identification_number as string
      );

      if (!customer) {
        throw new NotFoundError('Cliente temporal no encontrado');
      }

      res.status(200).json({
        success: true,
        message: 'Cliente temporal encontrado',
        data: customer
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtener sesiones de un cliente temporal con estadísticas
   * GET /api/temporary-customers/:customerId/sessions
   */
  getCustomerSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = parseInt(req.params.customerId);

      if (isNaN(customerId)) {
        throw new BadRequestError('Invalid customer ID');
      }

      const sessionData = await this.temporaryCustomerService.getCustomerSessionsWithStats(customerId);

      res.status(200).json({
        success: true,
        message: 'Sesiones del cliente obtenidas exitosamente',
        data: sessionData
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Buscar clientes temporales por múltiples criterios
   * GET /api/temporary-customers/search-multiple
   * Query params: q (búsqueda general), identification_type, identification_number, phone, email
   */
  searchMultiple = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, identification_type, identification_number, phone, email } = req.query;

      const customers = await this.temporaryCustomerService.searchCustomers({
        generalSearch: q as string,
        identificationType: identification_type as IdentificationType,
        identificationNumber: identification_number as string,
        phone: phone as string,
        email: email as string
      });

      res.status(200).json({
        success: true,
        message: 'Búsqueda completada',
        data: customers
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtener información completa del cliente con sesiones y estadísticas
   * GET /api/temporary-customers/:customerId/complete
   */
  getCompleteCustomerInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = parseInt(req.params.customerId);

      if (isNaN(customerId)) {
        throw new BadRequestError('Invalid customer ID');
      }

      const completeInfo = await this.temporaryCustomerService.getCompleteCustomerInfo(customerId);

      res.status(200).json({
        success: true,
        message: 'Información completa del cliente obtenida',
        data: completeInfo
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtener historial completo de sesiones de un cliente temporal
   * GET /api/temporary-customers/:customerId/history
   * Query params: startDate, endDate, page, limit, status
   */
  getCustomerHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = parseInt(req.params.customerId);
      const { startDate, endDate, page = '1', limit = '10', status } = req.query;

      if (isNaN(customerId)) {
        throw new BadRequestError('Invalid customer ID');
      }

      // Validar parámetros de paginación
      const pageNumber = parseInt(page as string);
      const limitNumber = parseInt(limit as string);

      if (isNaN(pageNumber) || pageNumber < 1) {
        throw new BadRequestError('Page must be a positive number');
      }

      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
        throw new BadRequestError('Limit must be between 1 and 100');
      }

      // Validar fechas si se proporcionan
      let startDateObj: Date | undefined;
      let endDateObj: Date | undefined;

      if (startDate) {
        startDateObj = new Date(startDate as string);
        if (isNaN(startDateObj.getTime())) {
          throw new BadRequestError('Invalid start date format');
        }
      }

      if (endDate) {
        endDateObj = new Date(endDate as string);
        if (isNaN(endDateObj.getTime())) {
          throw new BadRequestError('Invalid end date format');
        }
      }

      if (startDateObj && endDateObj && startDateObj > endDateObj) {
        throw new BadRequestError('Start date cannot be after end date');
      }

      const historyData = await this.temporaryCustomerService.getCustomerSessionHistory(
        customerId,
        {
          startDate: startDateObj,
          endDate: endDateObj,
          page: pageNumber,
          limit: limitNumber,
          status: status as string
        }
      );

      res.status(200).json({
        success: true,
        message: 'Historial del cliente obtenido exitosamente',
        data: historyData
      });
    } catch (error) {
      next(error);
    }
  };
}