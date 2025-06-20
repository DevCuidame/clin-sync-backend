import { Request, Response } from 'express';
import { PurchaseService } from './purchase.service';
import { PurchaseSessionService } from './purchase-session.service';
import { CreatePurchaseDto, UpdatePurchaseDto } from './purchase.dto';

export class PurchaseController {
  private purchaseService: PurchaseService;
  private purchaseSessionService: PurchaseSessionService;

  constructor() {
    this.purchaseService = new PurchaseService();
    this.purchaseSessionService = new PurchaseSessionService();
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

  /**
   * Crear sesiones manualmente para una compra
   */
  createSessionsForPurchase = async (req: Request, res: Response): Promise<void> => {
    try {
      const { purchaseId } = req.params;
      const sessions = await this.purchaseSessionService.createSessionsForPurchase(parseInt(purchaseId));
      
      res.status(201).json({
        success: true,
        message: 'Sesiones creadas exitosamente',
        data: {
          purchaseId: parseInt(purchaseId),
          sessionsCreated: sessions.length,
          sessions
        }
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('no encontrada') ? 404 : 
                        error instanceof Error && error.message.includes('ya fueron creadas') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: 'Error creando sesiones',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Verificar si una compra tiene sesiones creadas
   */
  checkSessionsStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const purchaseId = parseInt(req.params.purchaseId);
      
      if (isNaN(purchaseId)) {
        res.status(400).json({
          success: false,
          message: 'ID de compra inválido'
        });
        return;
      }

      const hasSessionsCreated = await this.purchaseSessionService.hasSessionsCreated(purchaseId);
      
      if (!hasSessionsCreated) {
        res.status(200).json({
          success: true,
          message: 'No se han creado sesiones para esta compra',
          data: {
            purchaseId,
            hasSessionsCreated: false,
            sessions: [],
            stats: null
          }
        });
        return;
      }

      const sessions = await this.purchaseSessionService.getSessionsByPurchase(purchaseId);
      const stats = await this.purchaseSessionService.getSessionStats(purchaseId);

      res.status(200).json({
        success: true,
        message: 'Estado de sesiones obtenido exitosamente',
        data: {
          purchaseId,
          hasSessionsCreated: true,
          sessions,
          stats
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estado de sesiones',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Obtener datos completos de sesiones por paquete
   */
  getCompleteSessionsByPackage = async (req: Request, res: Response): Promise<void> => {
    try {
      const packageId = parseInt(req.params.packageId);
      
      if (isNaN(packageId)) {
        res.status(400).json({
          success: false,
          message: 'ID de paquete inválido'
        });
        return;
      }

      const completeData = await this.purchaseSessionService.getCompleteSessionsByPackage(packageId);

      res.status(200).json({
        success: true,
        message: 'Datos completos de sesiones obtenidos exitosamente',
        data: completeData
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Detecta y crea sesiones para compras completadas que no tienen sesiones
   * Útil para procesar compras que fallaron en la creación automática
   */
  detectAndCreateMissingSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.purchaseSessionService.detectAndCreateMissingSessions();

      res.status(200).json({
        success: true,
        message: 'Detección y creación de sesiones faltantes completada',
        data: result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}