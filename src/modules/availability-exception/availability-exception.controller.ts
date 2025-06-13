import { Request, Response } from 'express';
import { AvailabilityExceptionService } from './availability-exception.service';
import { 
  CreateAvailabilityExceptionDto, 
  UpdateAvailabilityExceptionDto, 
  AvailabilityExceptionFilterDto,
  BulkCreateAvailabilityExceptionDto
} from './availability-exception.interface';
import { ExceptionType } from '../../models/availability-exception.model';

export class AvailabilityExceptionController {
  private availabilityExceptionService: AvailabilityExceptionService;

  constructor() {
    this.availabilityExceptionService = new AvailabilityExceptionService();
  }

  async createAvailabilityException(req: Request, res: Response): Promise<void> {
    try {
      const exceptionData: CreateAvailabilityExceptionDto = req.body;
      
      // Validate required fields
      if (!exceptionData.professional_id || !exceptionData.exception_date || !exceptionData.type) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: professional_id, exception_date, type'
        });
        return;
      }

      // Validate exception type enum
      if (!Object.values(ExceptionType).includes(exceptionData.type)) {
        res.status(400).json({
          success: false,
          message: 'Invalid type. Must be one of: ' + Object.values(ExceptionType).join(', ')
        });
        return;
      }

      const exception = await this.availabilityExceptionService.createAvailabilityException(exceptionData);
      
      res.status(201).json({
        success: true,
        message: 'Availability exception created successfully',
        data: exception
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error creating availability exception'
      });
    }
  }

  async bulkCreateAvailabilityExceptions(req: Request, res: Response): Promise<void> {
    try {
      const bulkData: BulkCreateAvailabilityExceptionDto = req.body;
      
      // Validate required fields
      if (!bulkData.professional_id || !bulkData.exceptions || !Array.isArray(bulkData.exceptions)) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: professional_id, exceptions (array)'
        });
        return;
      }

      if (bulkData.exceptions.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Exceptions array cannot be empty'
        });
        return;
      }

      // Validate each exception in the array
      for (let i = 0; i < bulkData.exceptions.length; i++) {
        const exception = bulkData.exceptions[i];
        if (!exception.exception_date || !exception.type) {
          res.status(400).json({
            success: false,
            message: `Exception at index ${i} is missing required fields: exception_date, type`
          });
          return;
        }

        if (!Object.values(ExceptionType).includes(exception.type)) {
          res.status(400).json({
            success: false,
            message: `Exception at index ${i} has invalid type. Must be one of: ${Object.values(ExceptionType).join(', ')}`
          });
          return;
        }
      }

      const exceptions = await this.availabilityExceptionService.bulkCreateAvailabilityExceptions(bulkData);
      
      res.status(201).json({
        success: true,
        message: `${exceptions.length} availability exceptions created successfully`,
        data: exceptions,
        count: exceptions.length
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error creating availability exceptions'
      });
    }
  }

  async getAllAvailabilityExceptions(req: Request, res: Response): Promise<void> {
    try {
      const exceptions = await this.availabilityExceptionService.getAllAvailabilityExceptions();
      
      res.status(200).json({
        success: true,
        message: 'Availability exceptions retrieved successfully',
        data: exceptions,
        count: exceptions.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving availability exceptions'
      });
    }
  }

  async getAvailabilityExceptionById(req: Request, res: Response): Promise<void> {
    try {
      const exceptionId = parseInt(req.params.id);
      
      if (isNaN(exceptionId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid exception ID'
        });
        return;
      }

      const exception = await this.availabilityExceptionService.getAvailabilityExceptionById(exceptionId);
      
      if (!exception) {
        res.status(404).json({
          success: false,
          message: 'Availability exception not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Availability exception retrieved successfully',
        data: exception
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving availability exception'
      });
    }
  }

  async getAvailabilityExceptionsByProfessional(req: Request, res: Response): Promise<void> {
    try {
      const professionalId = parseInt(req.params.professionalId);
      
      if (isNaN(professionalId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid professional ID'
        });
        return;
      }

      const exceptions = await this.availabilityExceptionService.getAvailabilityExceptionsByProfessional(professionalId);
      
      res.status(200).json({
        success: true,
        message: 'Availability exceptions retrieved successfully',
        data: exceptions,
        count: exceptions.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving availability exceptions'
      });
    }
  }

  async getAvailabilityExceptionsByType(req: Request, res: Response): Promise<void> {
    try {
      const type = req.params.type as ExceptionType;
      
      if (!Object.values(ExceptionType).includes(type)) {
        res.status(400).json({
          success: false,
          message: 'Invalid exception type. Must be one of: ' + Object.values(ExceptionType).join(', ')
        });
        return;
      }

      const exceptions = await this.availabilityExceptionService.getAvailabilityExceptionsByType(type);
      
      res.status(200).json({
        success: true,
        message: 'Availability exceptions retrieved successfully',
        data: exceptions,
        count: exceptions.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving availability exceptions'
      });
    }
  }

  async getAvailabilityExceptionsByDateRange(req: Request, res: Response): Promise<void> {
    try {
      const professionalId = parseInt(req.params.professionalId);
      const { start_date, end_date } = req.query;
      
      if (isNaN(professionalId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid professional ID'
        });
        return;
      }

      if (!start_date || !end_date) {
        res.status(400).json({
          success: false,
          message: 'Missing required query parameters: start_date, end_date'
        });
        return;
      }

      const exceptions = await this.availabilityExceptionService.getAvailabilityExceptionsByDateRange(
        professionalId,
        start_date as string,
        end_date as string
      );
      
      res.status(200).json({
        success: true,
        message: 'Availability exceptions retrieved successfully',
        data: exceptions,
        count: exceptions.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving availability exceptions'
      });
    }
  }

  async getAvailabilityExceptionsWithFilters(req: Request, res: Response): Promise<void> {
    try {
      const filters: AvailabilityExceptionFilterDto = {};
      
      if (req.query.professional_id) {
        const professionalId = parseInt(req.query.professional_id as string);
        if (isNaN(professionalId)) {
          res.status(400).json({
            success: false,
            message: 'Invalid professional_id parameter'
          });
          return;
        }
        filters.professional_id = professionalId;
      }
      
      if (req.query.type) {
        const type = req.query.type as ExceptionType;
        if (!Object.values(ExceptionType).includes(type)) {
          res.status(400).json({
            success: false,
            message: 'Invalid type parameter'
          });
          return;
        }
        filters.type = type;
      }
      
      if (req.query.date_from) {
        filters.date_from = req.query.date_from as string;
      }
      
      if (req.query.date_to) {
        filters.date_to = req.query.date_to as string;
      }
      
      if (req.query.specific_date) {
        filters.specific_date = req.query.specific_date as string;
      }

      const exceptions = await this.availabilityExceptionService.getAvailabilityExceptionsWithFilters(filters);
      
      res.status(200).json({
        success: true,
        message: 'Availability exceptions retrieved successfully',
        data: exceptions,
        count: exceptions.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving availability exceptions'
      });
    }
  }

  async updateAvailabilityException(req: Request, res: Response): Promise<void> {
    try {
      const exceptionId = parseInt(req.params.id);
      const updateData: UpdateAvailabilityExceptionDto = req.body;
      
      if (isNaN(exceptionId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid exception ID'
        });
        return;
      }

      // Validate exception type if provided
      if (updateData.type && !Object.values(ExceptionType).includes(updateData.type)) {
        res.status(400).json({
          success: false,
          message: 'Invalid type. Must be one of: ' + Object.values(ExceptionType).join(', ')
        });
        return;
      }

      const updatedException = await this.availabilityExceptionService.updateAvailabilityException(exceptionId, updateData);
      
      if (!updatedException) {
        res.status(404).json({
          success: false,
          message: 'Availability exception not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Availability exception updated successfully',
        data: updatedException
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error updating availability exception'
      });
    }
  }

  async deleteAvailabilityException(req: Request, res: Response): Promise<void> {
    try {
      const exceptionId = parseInt(req.params.id);
      
      if (isNaN(exceptionId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid exception ID'
        });
        return;
      }

      const deleted = await this.availabilityExceptionService.deleteAvailabilityException(exceptionId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Availability exception not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Availability exception deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error deleting availability exception'
      });
    }
  }

  async deleteAvailabilityExceptionsByProfessional(req: Request, res: Response): Promise<void> {
    try {
      const professionalId = parseInt(req.params.professionalId);
      
      if (isNaN(professionalId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid professional ID'
        });
        return;
      }

      const deletedCount = await this.availabilityExceptionService.deleteAvailabilityExceptionsByProfessional(professionalId);
      
      res.status(200).json({
        success: true,
        message: `${deletedCount} availability exceptions deleted successfully`,
        deletedCount
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error deleting availability exceptions'
      });
    }
  }

  async deleteAvailabilityExceptionsByDateRange(req: Request, res: Response): Promise<void> {
    try {
      const professionalId = parseInt(req.params.professionalId);
      const { start_date, end_date } = req.query;
      
      if (isNaN(professionalId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid professional ID'
        });
        return;
      }

      if (!start_date || !end_date) {
        res.status(400).json({
          success: false,
          message: 'Missing required query parameters: start_date, end_date'
        });
        return;
      }

      const deletedCount = await this.availabilityExceptionService.deleteAvailabilityExceptionsByDateRange(
        professionalId,
        start_date as string,
        end_date as string
      );
      
      res.status(200).json({
        success: true,
        message: `${deletedCount} availability exceptions deleted successfully`,
        deletedCount
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error deleting availability exceptions'
      });
    }
  }
}