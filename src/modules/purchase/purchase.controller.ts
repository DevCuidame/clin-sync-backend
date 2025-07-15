import { NextFunction, Request, Response } from 'express';
import { PurchaseService } from './purchase.service';
import { PurchaseSessionService } from './purchase-session.service';
import { CreatePurchaseDto, UpdatePurchaseDto, CreateCashPurchaseDto, CreateServicePurchaseDto, CreateAdminServicePurchaseDto, CreateServiceCashPurchaseDto } from './purchase.dto';
import { PaymentStatus } from '../../models/purchase.model';
import { validateCashPurchase, sanitizeCashPurchaseData } from './validation/cash-purchase.validation';
import { WompiCurrency } from '../payment/payment.interface';
import { BadRequestError } from '../../utils/error-handler';

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

  createCashPurchase = async (req: Request, res: Response): Promise<void> => {
    try {
      let purchaseData: CreateCashPurchaseDto = req.body;
      const userId = (req as any).user?.id;
      const currency = (req.body.currency as WompiCurrency) || WompiCurrency.COP;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
        return;
      }

      // Override user_id with authenticated user
      purchaseData.user_id = userId;

      // Sanitizar datos de entrada
      purchaseData = sanitizeCashPurchaseData(purchaseData);

      // Validar datos de compra en efectivo
      const validation = validateCashPurchase(purchaseData, currency);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Datos de compra inválidos',
          errors: validation.errors
        });
        return;
      }

      const newPurchase = await this.purchaseService.createCashPurchase(purchaseData);
      res.status(201).json({
        success: true,
        message: 'Compra en efectivo creada exitosamente. Estado: Pendiente de confirmación por administrador.',
        data: newPurchase
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creando compra en efectivo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getPurchases = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        page, 
        limit, 
        sort, 
        order, 
        user_id, 
        payment_status, 
        purchase_type, 
        payment_method, 
        start_date, 
        end_date 
      } = req.query;

      // Si se proporcionan parámetros de paginación, usar el método paginado
      if (page || limit) {
        const filters = {
           page: page ? parseInt(page as string) : 1,
           limit: limit ? parseInt(limit as string) : 10,
           sort: sort as string,
           order: (order as 'ASC' | 'DESC') || 'DESC',
           user_id: user_id ? parseInt(user_id as string) : undefined,
           payment_status: payment_status as PaymentStatus,
           purchase_type: purchase_type as 'package' | 'service',
           payment_method: payment_method as string,
           start_date: start_date as string,
           end_date: end_date as string
         };

        const result = await this.purchaseService.getPaginatedPurchases(filters);
        res.status(200).json({
          success: true,
          data: result.items,
          metadata: result.metadata,
          filters: result.filters
        });
      } else {
        // Mantener compatibilidad con la implementación anterior
        const purchases = await this.purchaseService.getAllPurchases(
          user_id ? parseInt(user_id as string) : undefined,
          payment_status as string
        );
        res.status(200).json({
          success: true,
          data: purchases
        });
      }
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

  /**
   * Busca un cliente temporal por tipo y número de identificación
   */
  findTemporaryCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { identification_type, identification_number } = req.query;

      if (!identification_type || !identification_number) {
        res.status(400).json({
          success: false,
          message: 'Se requieren identification_type e identification_number como parámetros de consulta'
        });
        return;
      }

      const tempCustomer = await this.purchaseService.findTemporaryCustomerByIdentification(
        identification_type as string,
        identification_number as string
      );

      if (!tempCustomer) {
        res.status(404).json({
          success: false,
          message: 'Cliente temporal no encontrado',
          data: null
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Cliente temporal encontrado',
        data: {
          temp_customer_id: tempCustomer.temp_customer_id,
          first_name: tempCustomer.first_name,
          last_name: tempCustomer.last_name,
          phone: tempCustomer.phone,
          email: tempCustomer.email,
          identification_type: tempCustomer.identification_type,
          identification_number: tempCustomer.identification_number,
          created_at: tempCustomer.created_at
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error buscando cliente temporal',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getUserServicePurchases = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'No autorizado',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Ensure userId is a number
      const userIdNumber = typeof userId === 'string' ? parseInt(userId) : userId;
      
      if (isNaN(userIdNumber)) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const servicePurchases = await this.purchaseService.getServicePurchasesByUserId(userIdNumber);
      res.status(200).json({
        success: true,
        data: servicePurchases
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user service purchases',
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

  /**
   * Confirmar pago en efectivo - Método específico para administradores
   */
  confirmCashPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { admin_notes } = req.body;
      
      // Verificar que la compra existe y es un pago en efectivo
      const purchase = await this.purchaseService.getPurchaseById(parseInt(id));
      
      if (!purchase) {
        res.status(404).json({
          success: false,
          message: 'Compra no encontrada'
        });
        return;
      }
      
      if (purchase.payment_method !== 'CASH') {
        res.status(400).json({
          success: false,
          message: 'Esta compra no es un pago en efectivo'
        });
        return;
      }
      
      if (purchase.payment_status === 'completed') {
        res.status(400).json({
          success: false,
          message: 'Este pago ya ha sido confirmado'
        });
        return;
      }
      
      // Confirmar el pago actualizando el estado a 'completed'
      const confirmedPurchase = await this.purchaseService.confirmCashPayment(parseInt(id), admin_notes);
      
      if (!confirmedPurchase) {
        res.status(400).json({
          success: false,
          message: 'Error al confirmar el pago en efectivo'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Pago en efectivo confirmado exitosamente',
        data: confirmedPurchase
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error confirmando pago en efectivo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Rechazar pago en efectivo - Método específico para administradores
   */
  rejectCashPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;
      
      // Verificar que la compra existe y es un pago en efectivo
      const purchase = await this.purchaseService.getPurchaseById(parseInt(id));
      
      if (!purchase) {
        res.status(404).json({
          success: false,
          message: 'Compra no encontrada'
        });
        return;
      }
      
      if (purchase.payment_method !== 'CASH') {
        res.status(400).json({
          success: false,
          message: 'Esta compra no es un pago en efectivo'
        });
        return;
      }
      
      if (purchase.payment_status !== 'pending') {
        res.status(400).json({
          success: false,
          message: 'Solo se pueden rechazar pagos pendientes'
        });
        return;
      }
      
      // Rechazar el pago actualizando el estado a 'failed'
      const rejectedPurchase = await this.purchaseService.rejectCashPayment(parseInt(id), rejection_reason);
      
      if (!rejectedPurchase) {
        res.status(500).json({
          success: false,
          message: 'Error al rechazar el pago en efectivo'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Pago en efectivo rechazado',
        data: rejectedPurchase
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error rechazando pago en efectivo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Obtener pagos en efectivo pendientes de confirmación
   */
  getPendingCashPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const pendingCashPayments = await this.purchaseService.getPendingCashPayments();
      
      res.status(200).json({
        success: true,
        message: 'Pagos en efectivo pendientes obtenidos exitosamente',
        data: pendingCashPayments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo pagos en efectivo pendientes',
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

  createAdminServicePurchase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const purchaseData: CreateAdminServicePurchaseDto = req.body;
      const adminUserId = (req as any).user?.id;
  
      if (!adminUserId) {
        throw new BadRequestError('Usuario administrador no autenticado');
      }
  
      const purchase = await this.purchaseService.createAdminServicePurchase(
        purchaseData,
        adminUserId
      );
      
      res.status(201).json({
        success: true,
        message: 'Compra de servicio para cliente temporal creada exitosamente',
        data: purchase
      });
    } catch (error) {
      next(error);
    }
  };

   createServicePurchase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const purchaseData: CreateServicePurchaseDto = req.body;
      const purchase = await this.purchaseService.createServicePurchase(purchaseData);
      
      res.status(201).json({
        success: true,
        message: 'Compra de servicio creada exitosamente',
        data: purchase
      });
    } catch (error) {
      next(error);
    }
  };

  createServiceCashPurchase = async (req: Request, res: Response): Promise<void> => {
    try {
      let purchaseData: CreateServiceCashPurchaseDto = req.body;
      const userId = (req as any).user?.id;
      const currency = (req.body.currency as WompiCurrency) || WompiCurrency.COP;

      console.log('💰 Procesando compra de servicio en efectivo:', {
        service_id: purchaseData.service_id,
        customer_info: purchaseData.customer_info,
        amount_in_cents: purchaseData.amount_paid,
        currency: currency,
        payment_method: 'CASH',
        sessions_quantity: purchaseData.sessions_quantity || 1
      });

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
        return;
      }

      // Override user_id with authenticated user
      purchaseData.user_id = userId;

      const newPurchase = await this.purchaseService.createServiceCashPurchase(purchaseData);
      res.status(201).json({
        success: true,
        message: 'Compra de servicio en efectivo creada exitosamente. Estado: Pendiente de confirmación por administrador.',
        data: newPurchase
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creando compra de servicio en efectivo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Obtener información completa de una compra específica con todas sus relaciones
   */
  getUserPurchaseDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'No autorizado',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const purchaseId = parseInt(id);
      if (isNaN(purchaseId)) {
        res.status(400).json({
          success: false,
          message: 'ID de compra inválido'
        });
        return;
      }

      const purchaseDetails = await this.purchaseService.getPurchaseWithCompleteDetails(purchaseId);
      
      if (!purchaseDetails) {
        res.status(404).json({
          success: false,
          message: 'Compra no encontrada'
        });
        return;
      }

      // Verificar que la compra pertenece al usuario autenticado
      const userIdNumber = typeof userId === 'string' ? parseInt(userId) : userId;
      if (purchaseDetails.user_id !== userIdNumber) {
        res.status(403).json({
          success: false,
          message: 'No tiene permisos para acceder a esta compra'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Detalles de compra obtenidos exitosamente',
        data: purchaseDetails
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo detalles de la compra',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
