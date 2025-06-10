import { Request, Response } from 'express';
import { ServiceService } from './service.service';
import { CreateServiceDto, UpdateServiceDto } from './service.dto';

export class ServiceController {
  private serviceService: ServiceService;

  constructor() {
    this.serviceService = new ServiceService();
  }

  async createService(req: Request, res: Response): Promise<void> {
    try {
      const serviceData: CreateServiceDto = req.body;
      const service = await this.serviceService.createService(serviceData);
      res.status(201).json({
        success: true,
        data: service,
        message: 'Service created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating service',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getServices(req: Request, res: Response): Promise<void> {
    try {
      const { category, is_active } = req.query;
      const services = await this.serviceService.getAllServices({
        category: category as string,
        is_active: is_active === 'true'
      });
      res.status(200).json({
        success: true,
        data: services
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching services',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getServiceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const service = await this.serviceService.getServiceById(parseInt(id));
      
      if (!service) {
        res.status(404).json({
          success: false,
          message: 'Service not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: service
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching service',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateService(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateServiceDto = req.body;
      const service = await this.serviceService.updateService(parseInt(id), updateData);
      
      res.status(200).json({
        success: true,
        data: service,
        message: 'Service updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating service',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteService(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.serviceService.deleteService(parseInt(id));
      
      res.status(200).json({
        success: true,
        message: 'Service deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting service',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}