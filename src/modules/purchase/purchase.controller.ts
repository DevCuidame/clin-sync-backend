import { Request, Response } from 'express';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseDto, UpdatePurchaseDto } from './purchase.dto';

export class PurchaseController {
  private purchaseService: PurchaseService;

  constructor() {
    this.purchaseService = new PurchaseService();
  }

  createPurchase = async (req: Request, res: Response): Promise<void> => {
    try {
      const purchaseData: CreatePurchaseDto = req.body;
      const newPurchase = await this.purchaseService.createPurchase(purchaseData);
      res.status(201).json({
        success: true,
        message: 'Purchase created successfully',
        data: newPurchase
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating purchase',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getPurchases = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id, payment_status } = req.query;
      const purchases = await this.purchaseService.getAllPurchases(
        user_id ? parseInt(user_id as string) : undefined,
        payment_status as string
      );
      res.status(200).json({
        success: true,
        data: purchases
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching purchases',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getPurchaseById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const purchase = await this.purchaseService.getPurchaseById(parseInt(id));
      
      if (!purchase) {
        res.status(404).json({
          success: false,
          message: 'Purchase not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: purchase
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching purchase',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getUserPurchases = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const purchases = await this.purchaseService.getPurchasesByUserId(parseInt(userId));
      res.status(200).json({
        success: true,
        data: purchases
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user purchases',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  updatePurchase = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdatePurchaseDto = req.body;
      const updatedPurchase = await this.purchaseService.updatePurchase(parseInt(id), updateData);
      
      if (!updatedPurchase) {
        res.status(404).json({
          success: false,
          message: 'Purchase not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Purchase updated successfully',
        data: updatedPurchase
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating purchase',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { payment_status } = req.body;
      const updatedPurchase = await this.purchaseService.updatePaymentStatus(parseInt(id), payment_status);
      
      if (!updatedPurchase) {
        res.status(404).json({
          success: false,
          message: 'Purchase not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Payment status updated successfully',
        data: updatedPurchase
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating payment status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getActivePurchases = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const activePurchases = await this.purchaseService.getActivePurchases(parseInt(userId));
      
      res.status(200).json({
        success: true,
        message: 'Active purchases retrieved successfully',
        data: activePurchases
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving active purchases',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}