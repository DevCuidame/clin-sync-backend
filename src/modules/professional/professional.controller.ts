import { Request, Response } from 'express';
import { ProfessionalService } from './professional.service';
import { CreateProfessionalDto, UpdateProfessionalDto } from './professional.dto';

export class ProfessionalController {
  private professionalService: ProfessionalService;

  constructor() {
    this.professionalService = new ProfessionalService();
  }

  async createProfessional(req: Request, res: Response): Promise<void> {
    try {
      const professionalData: CreateProfessionalDto = req.body;
      const professional = await this.professionalService.createProfessional(professionalData);
      res.status(201).json({
        success: true,
        data: professional,
        message: 'Professional created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating professional',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getProfessionals(req: Request, res: Response): Promise<void> {
    try {
      const professionals = await this.professionalService.getAllProfessionals();
      res.status(200).json({
        success: true,
        data: professionals
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching professionals',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getProfessionalById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const professional = await this.professionalService.getProfessionalById(parseInt(id));
      
      if (!professional) {
        res.status(404).json({
          success: false,
          message: 'Professional not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: professional
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching professional',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateProfessional(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateProfessionalDto = req.body;
      const professional = await this.professionalService.updateProfessional(parseInt(id), updateData);
      
      res.status(200).json({
        success: true,
        data: professional,
        message: 'Professional updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating professional',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteProfessional(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.professionalService.deleteProfessional(parseInt(id));
      
      res.status(200).json({
        success: true,
        message: 'Professional deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting professional',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}