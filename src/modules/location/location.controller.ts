import { Request, Response, NextFunction } from 'express';
import { LocationService } from './location.service';
import { ApiResponse } from 'src/core/interfaces/response.interface';

export class LocationController {
  private locationService: LocationService;

  constructor() {
    this.locationService = new LocationService();
  }

  /**
   * Obtener todos los departamentos
   * @route GET /api/locations/departments
   */
  getDepartments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const departments = await this.locationService.getAllDepartments();
      
      const response: ApiResponse = {
        success: true,
        data: departments,
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtener ciudades por departamento
   * @route GET /api/locations/townships/:departmentId
   */
  getTownshipsByDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const departmentId = parseInt(req.params.departmentId);
      const townships = await this.locationService.getTownshipsByDepartment(departmentId);
      
      const response: ApiResponse = {
        success: true,
        data: townships,
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}