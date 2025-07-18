import { Request, Response } from 'express';
import { ServiceService } from './service.service';
import { CreateServiceDto, UpdateServiceDto } from './service.dto';
import { FileUploadService } from '../../utils/file-upload.util';

export class ServiceController {
  private serviceService: ServiceService;

  constructor() {
    this.serviceService = new ServiceService();
  }

  async createService(req: Request, res: Response): Promise<void> {
    try {
      const serviceData: CreateServiceDto = req.body;
      
      // Manejar carga de imagen si se proporciona
      if (serviceData.image_url) {
        try {
          const imageUrl = await FileUploadService.saveBase64Image(
            serviceData.image_url,
            'services',
            undefined,
            `service_${serviceData.service_name.replace(/\s+/g, '_').toLowerCase()}`
          );
          serviceData.image_url = `/${imageUrl}`;
        } catch (imageError) {
          console.warn('Error al guardar imagen del servicio:', imageError);
          // Continuar sin imagen si hay error
        }
        // Remover el base64 del objeto antes de guardarlo
        delete serviceData.image_url;
      }
      
      const service = await this.serviceService.createService(serviceData);
      res.status(201).json({
        success: true,
        data: service,
        message: 'Servicio creado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear el servicio',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getServices(req: Request, res: Response): Promise<void> {
    try {
      const { is_active } = req.query;
      const services = await this.serviceService.getServices({
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

  async getAllServices(req: Request, res: Response): Promise<void> {
    try {
      const services = await this.serviceService.getAllServices();
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

  async getServiceByIdComplete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const service = await this.serviceService.getServiceByIdComplete(parseInt(id), userId);
      
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
      
      // Obtener el servicio actual para manejar la imagen anterior
      const currentService = await this.serviceService.getServiceById(parseInt(id));
      if (!currentService) {
        res.status(404).json({
          success: false,
          message: 'Servicio no encontrado'
        });
        return;
      }
      
      // Manejar actualización de imagen si se proporciona
      if (updateData.image_base64) {
        try {
          // Eliminar imagen anterior si existe
          if (currentService.image_url) {
            await FileUploadService.deleteFile(currentService.image_url);
          }
          
          // Guardar nueva imagen
          const imageUrl = await FileUploadService.saveBase64Image(
            updateData.image_base64,
            'services',
            undefined,
            `service_${updateData.service_name?.replace(/\s+/g, '_').toLowerCase() || currentService.service_name.replace(/\s+/g, '_').toLowerCase()}`
          );
          updateData.image_url = `/${imageUrl}`;
        } catch (imageError) {
          console.warn('Error al actualizar imagen del servicio:', imageError);
          // Continuar sin actualizar imagen si hay error
        }
        // Remover el base64 del objeto antes de guardarlo
        delete updateData.image_base64;
      }
      
      const service = await this.serviceService.updateService(parseInt(id), updateData);
      
      res.status(200).json({
        success: true,
        data: service,
        message: 'Servicio actualizado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el servicio',
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

  async toggleServiceStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const service = await this.serviceService.toggleServiceStatus(parseInt(id));
      
      res.status(200).json({
        success: true,
        data: service,
        message: `Servicio ${service.is_active ? 'activado' : 'desactivado'} exitosamente`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al cambiar el estado del servicio',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}