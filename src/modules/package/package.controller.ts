import { Request, Response } from 'express';
import { PackageService } from './package.service';
import { CreatePackageDto, UpdatePackageDto } from './package.dto';

export class PackageController {
  private packageService: PackageService;

  constructor() {
    this.packageService = new PackageService();
  }

  createPackage = async (req: Request, res: Response): Promise<void> => {
    try {
      const packageData: CreatePackageDto = req.body;
      const newPackage = await this.packageService.createPackage(packageData);
      res.status(201).json({
        success: true,
        message: 'Package created successfully',
        data: newPackage
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating package',
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
      const updatedPackage = await this.packageService.updatePackage(parseInt(id), updateData);
      
      if (!updatedPackage) {
        res.status(404).json({
          success: false,
          message: 'Package not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Package updated successfully',
        data: updatedPackage
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating package',
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
}