import { Request, Response } from 'express';
import { PackageService } from './package.service';
import { CreatePackageDto, UpdatePackageDto } from './package.dto';
import { FileUploadService } from '../../utils/file-upload.util';

export class PackageController {
  private packageService: PackageService;

  constructor() {
    this.packageService = new PackageService();
  }

  createPackage = async (req: Request, res: Response): Promise<void> => {
    try {
      const packageData: CreatePackageDto = req.body;
      
      // Manejar carga de imagen si se proporciona
      if (packageData.image_base64) {
        try {
          const imageUrl = await FileUploadService.saveBase64Image(
            packageData.image_base64,
            'packages',
            undefined,
            `package_${packageData.package_name.replace(/\s+/g, '_').toLowerCase()}`
          );
          packageData.image_url = `/${imageUrl}`;
        } catch (imageError) {
          console.warn('Error al guardar imagen del paquete:', imageError);
          // Continuar sin imagen si hay error
        }
        // Remover el base64 del objeto antes de guardarlo
        delete packageData.image_base64;
      }
      
      const newPackage = await this.packageService.createPackage(packageData);
      res.status(201).json({
        success: true,
        message: 'Paquete creado exitosamente',
        data: newPackage
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear el paquete',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getPackages = async (req: Request, res: Response): Promise<void> => {
    try {
      const { is_active } = req.query;
      const packages = await this.packageService.getAllPackages(
        is_active ? is_active === 'true' : undefined
      );
      res.status(200).json({
        success: true,
        data: packages
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching packages',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getPackageById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const packageData = await this.packageService.getPackageById(parseInt(id));
      
      if (!packageData) {
        res.status(404).json({
          success: false,
          message: 'Package not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: packageData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching package',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  updatePackage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdatePackageDto = req.body;
      
      // Obtener el paquete actual para manejar la imagen anterior
      const currentPackage = await this.packageService.getPackageById(parseInt(id));
      if (!currentPackage) {
        res.status(404).json({
          success: false,
          message: 'Paquete no encontrado'
        });
        return;
      }
      
      // Manejar actualización de imagen si se proporciona
      if (updateData.image_base64) {
        try {
          // Eliminar imagen anterior si existe
          if (currentPackage.image_url) {
            await FileUploadService.deleteFile(currentPackage.image_url);
          }
          
          // Guardar nueva imagen
          const imageUrl = await FileUploadService.saveBase64Image(
            updateData.image_base64,
            'packages',
            undefined,
            `package_${updateData.package_name?.replace(/\s+/g, '_').toLowerCase() || currentPackage.package_name.replace(/\s+/g, '_').toLowerCase()}`
          );
          updateData.image_url = `/${imageUrl}`;
        } catch (imageError) {
          console.warn('Error al actualizar imagen del paquete:', imageError);
          // Continuar sin actualizar imagen si hay error
        }
        // Remover el base64 del objeto antes de guardarlo
        delete updateData.image_base64;
      }
      
      const updatedPackage = await this.packageService.updatePackage(parseInt(id), updateData);
      
      if (!updatedPackage) {
        res.status(404).json({
          success: false,
          message: 'Paquete no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Paquete actualizado exitosamente',
        data: updatedPackage
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el paquete',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  deletePackage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.packageService.deletePackage(parseInt(id));
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Package not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Package deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting package',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getUserPackages = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
        return;
      }

      const userPackages = await this.packageService.getUserPackages(userId);
      
      res.status(200).json({
        success: true,
        message: 'Paquetes del usuario obtenidos exitosamente',
        data: userPackages
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener los paquetes del usuario',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  togglePackageStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const packageId = parseInt(id);
      
      if (isNaN(packageId)) {
        res.status(400).json({
          success: false,
          message: 'ID de paquete inválido'
        });
        return;
      }

      const updatedPackage = await this.packageService.togglePackageStatus(packageId);
      
      if (!updatedPackage) {
        res.status(404).json({
          success: false,
          message: 'Paquete no encontrado'
        });
        return;
      }

      const statusMessage = updatedPackage.is_active ? 'activado' : 'desactivado';
      
      res.status(200).json({
        success: true,
        message: `Paquete ${statusMessage} exitosamente`,
        data: updatedPackage
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al cambiar el estado del paquete',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getAllPackagesAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      const packages = await this.packageService.getAllPackagesWithServices();
      
      res.status(200).json({
        success: true,
        message: 'Todos los paquetes con servicios obtenidos exitosamente',
        data: packages,
        total: packages.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener todos los paquetes con servicios',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}