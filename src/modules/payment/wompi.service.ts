/**
 * Servicio de Wompi - Implementación modular y escalable
 * Maneja todas las operaciones de pago con Wompi API
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import crypto from 'crypto';
import {
  WompiConfig,
  WompiTransactionResponse,
  WompiPaymentLinkResponse,
  WompiWebhookEvent,
  CreateWompiTransactionDto,
  CreatePaymentLinkDto,
  ConfirmTransactionDto,
  RefundTransactionDto,
  PaymentResponseDto,
  RefundResponseDto,
  WompiTransactionStatus,
  WompiCurrency,
  WompiPaymentMethod,
  WompiEventType,
  WompiError,
  WompiErrorResponse,
  WOMPI_CONSTANTS,
  CreateWompiServiceTransactionDto
} from './payment.interface';
import { getWompiConfig, validateWompiAmount, convertToWompiCurrency } from '../../config/wompi.config';
import logger from '../../utils/logger';
import { AppDataSource } from '../../core/config/database';
import { Purchase, PaymentStatus } from '../../models/purchase.model';
import { PaymentTransaction, TransactionStatus } from '../../models/payment-transaction.model';
import { PaymentWebhook, WebhookStatus } from '../../models/payment-webhook.model';
import { Package } from '../../models/package.model';
import { Service } from '../../models/service.model';
import { User } from '../../models/user.model';
import { PackageService } from '../../models/package-service.model';
import { UserSession, UserSessionStatus } from '../../models/user-session.model';

export class WompiService {
  private axiosInstance!: AxiosInstance;
  private config: WompiConfig;

  constructor() {
    this.config = getWompiConfig();
    this.initializeAxiosInstance();
  }

  /**
   * Inicializa la instancia de Axios con configuración base
   */
  private initializeAxiosInstance(): void {
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${this.config.privateKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Interceptor para logging de requests
    this.axiosInstance.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para logging de responses
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        const errorDetails = {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        };
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Crea una transacción de pago en Wompi
   */
  async createTransaction(dto: CreateWompiTransactionDto | CreateWompiServiceTransactionDto, isRetry: boolean = false): Promise<PaymentResponseDto> {
    // Validar monto
    const amountValidation = validateWompiAmount(dto.amountInCents, dto.currency);
    if (!amountValidation.isValid) {
      throw new Error(amountValidation.error);
    }

    // Preparar datos para Wompi
    const transactionData = {
      amount_in_cents: dto.amountInCents,
      currency: dto.currency,
      customer_email: dto.customerInfo.email,
      payment_method: {
        type: dto.paymentMethod
      },
      reference: dto.reference,
      customer_data: {
        phone_number: dto.customerInfo.phoneNumber,
        full_name: dto.customerInfo.fullName,
        legal_id: dto.customerInfo.legalId,
        legal_id_type: dto.customerInfo.legalIdType
      },
      redirect_url: dto.redirectUrl,
      payment_description: dto.paymentDescription,
      shipping_address: dto.shippingAddress,
      acceptance_token: dto.acceptanceToken,
      accept_personal_auth: dto.acceptPersonalAuth
    };

    // Crear purchase en la base de datos
    const purchase = await this.createPurchaseRecord(dto);

    try {
      const response: AxiosResponse<WompiTransactionResponse> = await this.axiosInstance.post(
        '/transactions',
        transactionData
      );

      // Crear registro de transacción
      await this.createTransactionRecord(response.data, purchase.purchase_id);

      return {
        success: true,
        transactionId: response.data.id,
        status: response.data.status,
        amountInCents: response.data.amountInCents,
        amount: response.data.amountInCents / 100,
        currency: response.data.currency,
        reference: response.data.reference,
        redirectUrl: response.data.redirectUrl,
        purchaseId: purchase.purchase_id
      };

    } catch (error: any) {

      
      // Si es error 422 (validación), intentar una vez más con nueva referencia
      if (error.response?.status === 422 && !isRetry) {

        
        // Generar nueva referencia única
        const newReference = `TXN-${Date.now()}-${dto.userId}-${Math.random().toString(36).substr(2, 9)}`;
        const retryTransactionData = {
          ...transactionData,
          reference: newReference,
          acceptance_token: dto.acceptanceToken,
          accept_personal_auth: dto.acceptPersonalAuth
        };
        
        try {
          const retryResponse = await this.axiosInstance.post('/transactions', retryTransactionData);
          
          // Crear registro de transacción con la nueva referencia
           await this.createTransactionRecord(retryResponse.data.data, purchase.purchase_id);
           
           return {
             success: true,
             transactionId: retryResponse.data.data.id,
             status: retryResponse.data.data.status,
             amountInCents: retryResponse.data.data.amount_in_cents,
             amount: retryResponse.data.data.amount_in_cents / 100,
             currency: retryResponse.data.data.currency,
             reference: newReference,
             redirectUrl: retryResponse.data.data.payment_link?.permalink,
             purchaseId: purchase.purchase_id,
             message: 'Transacción creada exitosamente (reintento)'
           };
        } catch (retryError: any) {

          return this.handleWompiError(retryError);
        }
      }
      
      return this.handleWompiError(error);
    }
  }

  /**
   * Crea un link de pago en Wompi
   */
  async createPaymentLink(dto: CreatePaymentLinkDto | CreateWompiServiceTransactionDto): Promise<PaymentResponseDto> {
    try {
      // Validar monto
      const amountValidation = validateWompiAmount(dto.amountInCents, dto.currency);
      if (!amountValidation.isValid) {
        throw new Error(amountValidation.error);
      }

      // Crear purchase en la base de datos
      const purchase = await this.createPurchaseRecord({
        ...dto,
        paymentMethod: WompiPaymentMethod.CARD, // Default para payment links
        reference: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        acceptanceToken: dto.acceptanceToken,
        acceptPersonalAuth: dto.acceptPersonalAuth
      });

      // Type guard to check if it's CreatePaymentLinkDto
      const isPaymentLinkDto = 'description' in dto;
      
      const paymentLinkData = {
        name: isPaymentLinkDto ? `Pago - ${(dto as CreatePaymentLinkDto).description}` : `Pago de Servicio`,
        description: isPaymentLinkDto ? (dto as CreatePaymentLinkDto).description : 'Pago de servicio individual',
        single_use: true,
        collect_shipping: isPaymentLinkDto ? ((dto as CreatePaymentLinkDto).collectShipping || false) : false,
        currency: dto.currency,
        amount_in_cents: dto.amountInCents,
        expires_at: isPaymentLinkDto ? (dto as CreatePaymentLinkDto).expiresAt?.toISOString() : undefined,
        redirect_url: dto.redirectUrl,
        customer_data: {
          email: dto.customerInfo.email,
          phone_number: dto.customerInfo.phoneNumber,
          full_name: dto.customerInfo.fullName,
          legal_id: dto.customerInfo.legalId,
          legal_id_type: dto.customerInfo.legalIdType
        },
        acceptance_token: dto.acceptanceToken,
        accept_personal_auth: dto.acceptPersonalAuth
      };

      const response: AxiosResponse<WompiPaymentLinkResponse> = await this.axiosInstance.post(
        '/payment_links',
        paymentLinkData
      );

      return {
        success: true,
        paymentLinkId: response.data.id,
        status: WompiTransactionStatus.PENDING,
        amountInCents: response.data.amountInCents,
        currency: response.data.currency,
        reference: `payment_link_${response.data.id}`,
        permalink: response.data.permalink,
        purchaseId: purchase.purchase_id
      };

    } catch (error) {

      return this.handleWompiError(error);
    }
  }

  /**
   * Confirma una transacción de pago
   */
  async confirmTransaction(dto: ConfirmTransactionDto): Promise<PaymentResponseDto> {
    try {
      const response: AxiosResponse<WompiTransactionResponse> = await this.axiosInstance.post(
        `/transactions/${dto.transactionId}/confirm`,
        {
          payment_source_id: dto.paymentSourceId,
          customer_email: dto.customerEmail,
          acceptance_token: dto.acceptanceToken
        }
      );

      // Actualizar registro de transacción
      await this.updateTransactionStatus(dto.transactionId, response.data.status);

      return {
        success: true,
        transactionId: response.data.id,
        status: response.data.status,
        amountInCents: response.data.amountInCents,
        currency: response.data.currency,
        reference: response.data.reference,
        purchaseId: 0 // Se actualizará desde la base de datos
      };

    } catch (error) {

      return this.handleWompiError(error);
    }
  }

  /**
   * Obtiene el estado de una transacción
   */
  async getTransactionStatus(transactionId: string): Promise<WompiTransactionResponse> {
    try {
      const response: AxiosResponse<WompiTransactionResponse> = await this.axiosInstance.get(
        `/transactions/${transactionId}`
      );
      
      // Si la transacción está aprobada, actualizar la compra correspondiente
      if (response.data.data.status === 'APPROVED') {
        await this.updatePurchaseFromTransaction(response.data.data);
      }
      
      return response.data;
    } catch (error) {

      throw error;
    }
  }

  /**
   * Procesa un webhook de Wompi
   */
  async processWebhook(payload: any, signature: string): Promise<void> {
    try {
      // Verificar firma del webhook
      if (!this.verifyWebhookSignature(payload, signature)) {
        throw new Error('Invalid webhook signature');
      }

      const webhookEvent: WompiWebhookEvent = payload;
      
      // Guardar webhook en la base de datos
      await this.saveWebhookEvent(webhookEvent);

      // Procesar evento según el tipo
      switch (webhookEvent.event) {
        case WompiEventType.TRANSACTION_UPDATED:
          await this.handleTransactionUpdated(webhookEvent.data.transaction);
          break;
        case WompiEventType.PAYMENT_LINK_PAID:
          await this.handlePaymentLinkPaid(webhookEvent.data.transaction);
          break;
        default:
  
      }

    } catch (error) {

      throw error;
    }
  }

  /**
   * Crea un reembolso
   */
  async createRefund(dto: RefundTransactionDto): Promise<RefundResponseDto> {
    try {
      const refundData = {
        amount_in_cents: dto.amountInCents,
        reason: dto.reason || 'Solicitud del cliente'
      };

      const response = await this.axiosInstance.post(
        `/transactions/${dto.transactionId}/void`,
        refundData
      );

      return {
        success: true,
        refundId: response.data.id,
        transactionId: dto.transactionId,
        amountInCents: dto.amountInCents || 0,
        status: 'VOIDED'
      };

    } catch (error) {

      return {
        success: false,
        transactionId: dto.transactionId,
        amountInCents: dto.amountInCents || 0,
        status: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Crea una compra con transacción en un solo paso
   */
  async createPurchaseWithTransaction(dto: any): Promise<PaymentResponseDto> {
    const userRepository = AppDataSource.getRepository(User);
    const packageRepository = AppDataSource.getRepository(Package);
    const serviceRepository = AppDataSource.getRepository(Service);
    const purchaseRepository = AppDataSource.getRepository(Purchase);
    
    // Verificar que el usuario existe
    const user = await userRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Determinar el tipo de item desde los metadatos
    const itemType = dto.metadata?.itemType;
    const itemId = dto.metadata?.itemId || dto.packageId;
    
    let purchase: Purchase;
    let expiresAt = new Date();

    if (itemType === 'service') {
      // Compra de servicio
      const serviceEntity = await serviceRepository.findOne({ where: { service_id: itemId } });
      if (!serviceEntity) {
        throw new Error('Servicio no encontrado');
      }

      expiresAt.setDate(expiresAt.getDate() + 30); // 30 días por defecto para servicios

      purchase = purchaseRepository.create({
        user,
        service: serviceEntity,
        service_id: itemId,
        purchase_type: 'service',
        amount_paid: dto.amountInCents / 100,
        payment_status: PaymentStatus.PENDING,
        payment_method: dto.paymentMethod.type,
        expires_at: expiresAt,
        reference: dto.reference || `SERVICE-${itemId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        payment_details: {
          customer_info: dto.customerInfo,
          metadata: dto.metadata
        }
      });
    } else {
      // Compra de paquete (por defecto)
      const packageEntity = await packageRepository.findOne({ where: { package_id: itemId } });
      if (!packageEntity) {
        throw new Error('Paquete no encontrado');
      }

      expiresAt.setDate(expiresAt.getDate() + packageEntity.validity_days);

      purchase = purchaseRepository.create({
        user,
        package: packageEntity,
        package_id: itemId,
        purchase_type: 'package',
        amount_paid: dto.amountInCents / 100,
        payment_status: PaymentStatus.PENDING,
        payment_method: dto.paymentMethod.type,
        expires_at: expiresAt,
        reference: dto.reference || `PACKAGE-${itemId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        payment_details: {
          customer_info: dto.customerInfo,
          metadata: dto.metadata
        }
      });
    }

    const savedPurchase = await purchaseRepository.save(purchase);

    // Solo guardar en base de datos, sin crear transacción en Wompi


    return {
      success: true,
      transactionId: undefined, // No hay transacción de Wompi
      status: WompiTransactionStatus.PENDING, // Estado pendiente por defecto
      amountInCents: dto.amountInCents,
      amount: dto.amountInCents / 100,
      currency: dto.currency,
      reference: dto.reference || `PURCHASE-${savedPurchase.purchase_id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      redirectUrl: dto.redirectUrl || 'http://localhost:4200/home/payments/callback',
      purchaseId: savedPurchase.purchase_id
    };
  }

  /**
   * Obtiene la configuración pública de Wompi
   */
  getPublicConfig() {
    return {
      publicKey: this.config.publicKey,
      environment: this.config.environment,
      supportedCurrencies: WOMPI_CONSTANTS.SUPPORTED_CURRENCIES,
      supportedPaymentMethods: Object.values(WompiPaymentMethod),
      minAmounts: {
        COP: WOMPI_CONSTANTS.MIN_AMOUNT_COP,
        USD: WOMPI_CONSTANTS.MIN_AMOUNT_USD
      },
      maxAmounts: {
        COP: WOMPI_CONSTANTS.MAX_AMOUNT_COP,
        USD: WOMPI_CONSTANTS.MAX_AMOUNT_USD
      }
    };
  }

  // Métodos privados

  private async createPurchaseRecord(dto: CreateWompiTransactionDto | CreateWompiServiceTransactionDto | any): Promise<Purchase> {
    const purchaseRepository = AppDataSource.getRepository(Purchase);
    const packageRepository = AppDataSource.getRepository(Package);
    const serviceRepository = AppDataSource.getRepository(Service);
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    let purchase: Purchase;
    
    // Verificar si es compra de paquete o servicio
    if (dto.packageId) {
      // Compra de paquete
      const packageEntity = await packageRepository.findOne({ where: { package_id: dto.packageId } });
      if (!packageEntity) {
        throw new Error('Paquete no encontrado');
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + packageEntity.validity_days);

      purchase = purchaseRepository.create({
        user,
        package: packageEntity,
        package_id: dto.packageId,
        purchase_type: 'package',
        amount_paid: dto.amountInCents / 100,
        payment_status: PaymentStatus.PENDING,
        payment_method: dto.paymentMethod,
        expires_at: expiresAt,
        reference: dto.reference || `PURCHASE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });
    } else if (dto.serviceId) {
      // Compra de servicio
      const serviceEntity = await serviceRepository.findOne({ where: { service_id: dto.serviceId } });
      if (!serviceEntity) {
        throw new Error('Servicio no encontrado');
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 días por defecto para servicios

      purchase = purchaseRepository.create({
        user,
        service: serviceEntity,
        service_id: dto.serviceId,
        purchase_type: 'service',
        amount_paid: dto.amountInCents / 100,
        payment_status: PaymentStatus.PENDING,
        payment_method: dto.paymentMethod,
        expires_at: expiresAt,
        reference: dto.reference || `PURCHASE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });
    } else {
      throw new Error('Debe especificar packageId o serviceId');
    }

    return await purchaseRepository.save(purchase);
  }

  private async createTransactionRecord(transaction: WompiTransactionResponse, purchaseId: number): Promise<void> {
    const transactionRepository = AppDataSource.getRepository(PaymentTransaction);
    const purchaseRepository = AppDataSource.getRepository(Purchase);

    const purchase = await purchaseRepository.findOne({ where: { purchase_id: purchaseId } });
    if (!purchase) {
      throw new Error('Purchase not found');
    }

    const paymentTransaction = transactionRepository.create({
      purchase_id: purchase.purchase_id,
      gateway_transaction_id: transaction.id,
      amount: transaction.amountInCents / 100,
      currency: transaction.currency,
      status: this.mapWompiStatusToTransactionStatus(transaction.status),
      gateway_provider: 'wompi',
      gateway_response: JSON.stringify(transaction)
    });

    const savedTransaction = await transactionRepository.save(paymentTransaction);
    
    // Procesar webhooks huérfanos que puedan haber llegado antes que esta transacción
    await this.processOrphanedWebhooks(transaction.id, savedTransaction.transaction_id);
  }

  private async updateTransactionStatus(transactionId: string, status: WompiTransactionStatus): Promise<void> {
    const transactionRepository = AppDataSource.getRepository(PaymentTransaction);
    const purchaseRepository = AppDataSource.getRepository(Purchase);

    const transaction = await transactionRepository.findOne({
      where: { gateway_transaction_id: transactionId },
      relations: ['purchase']
    });

    if (transaction) {
      transaction.status = this.mapWompiStatusToTransactionStatus(status);
      transaction.updated_at = new Date();
      await transactionRepository.save(transaction);

      // Actualizar estado de la compra
      if (transaction.purchase) {
        const purchaseStatus = this.mapWompiStatusToPurchaseStatus(status);
        transaction.purchase.payment_status = purchaseStatus;
        await purchaseRepository.save(transaction.purchase);
      }
    }
  }

  private async handleTransactionUpdated(transaction: WompiTransactionResponse): Promise<void> {
    await this.updateTransactionStatus(transaction.id, transaction.status);
    
    // Si la transacción se completó, crear sesiones automáticamente
    if (transaction.status === WompiTransactionStatus.APPROVED) {
      const purchase = await this.getPurchaseByTransactionId(transaction.id);
      if (purchase && purchase.payment_status === PaymentStatus.COMPLETED) {
        await this.createSessionsForPurchase(purchase);
      }
    }
    

  }

  private async handlePaymentLinkPaid(transaction: WompiTransactionResponse): Promise<void> {
    await this.updateTransactionStatus(transaction.id, transaction.status);
    
    // Obtener la compra asociada y crear sesiones automáticamente
    const purchase = await this.getPurchaseByTransactionId(transaction.id);
    if (purchase && purchase.payment_status === PaymentStatus.COMPLETED) {
      await this.createSessionsForPurchase(purchase);
    }
    

  }

  private async saveWebhookEvent(event: WompiWebhookEvent): Promise<void> {
    // Validar estructura del webhook antes de procesarlo
    if (!this.validateWompiWebhookStructure(event)) {
      return;
    }

    const webhookRepository = AppDataSource.getRepository(PaymentWebhook);
    const transactionRepository = AppDataSource.getRepository(PaymentTransaction);
    
    // Extraer el gateway transaction ID del evento
    // Wompi siempre envía el ID en event.data.transaction.id
    const gatewayTransactionId = event.data.transaction.id;
    
    // Buscar la transacción en nuestra base de datos
    const paymentTransaction = await transactionRepository.findOne({
      where: { gateway_transaction_id: gatewayTransactionId }
    });
    
    if (!paymentTransaction) {
      // Para compras nuevas, crear un webhook sin transaction_id y marcarlo como pendiente
      // Esto permite procesar el webhook aunque la transacción no esté en nuestra BD aún
      const webhook = webhookRepository.create({
        // transaction_id se omite para que sea undefined (nullable)
        provider: 'wompi',
        event_type: event.event,
        payload: JSON.stringify(event),
        status: WebhookStatus.RECEIVED,
        signature: event.signature?.checksum || undefined,
        error_message: `Transaction not found: ${gatewayTransactionId}`,
        processed_at: new Date()
      });
      
      await webhookRepository.save(webhook);
      
      return; // Salir sin procesar el evento
    }
    
    const webhook = webhookRepository.create({
      transaction_id: paymentTransaction.transaction_id,
      provider: 'wompi',
      event_type: event.event,
      payload: JSON.stringify(event),
      status: WebhookStatus.RECEIVED,
      signature: event.signature?.checksum || undefined,
      processed_at: new Date()
    });

    await webhookRepository.save(webhook);
  }

  /**
   * Procesa webhooks huérfanos (sin transaction_id) cuando se crea una nueva transacción
   * 
   * Este método maneja el escenario de race condition donde:
   * 1. Wompi envía un webhook inmediatamente después de procesar el pago
   * 2. El webhook llega antes de que nuestra aplicación haya guardado la transacción
   * 3. El webhook se guarda como "huérfano" con transaction_id = null
   * 4. Cuando finalmente se crea la transacción, este método los vincula y procesa
   * 
   * @param gatewayTransactionId - ID de transacción de Wompi (ej: "157817-1752769493-72064")
   * @param transactionId - ID interno de nuestra tabla payment_transactions
   */
  async processOrphanedWebhooks(gatewayTransactionId: string, transactionId: number): Promise<void> {
    try {
      const webhookRepository = AppDataSource.getRepository(PaymentWebhook);
      
      // Buscar webhooks sin transaction_id para este gateway transaction ID
      // Usar el campo específico transaction.id que siempre está presente en webhooks de Wompi
      const orphanedWebhooks = await webhookRepository
        .createQueryBuilder('webhook')
        .where('webhook.transaction_id IS NULL')
        .andWhere('JSON_EXTRACT(webhook.payload, "$.data.transaction.id") = :gatewayTransactionId', {
          gatewayTransactionId
        })
        .getMany();
      
      if (orphanedWebhooks.length > 0) {
        // Actualizar webhooks huérfanos con el transaction_id correcto
        await webhookRepository
          .createQueryBuilder()
          .update(PaymentWebhook)
          .set({ 
            transaction_id: transactionId,
            status: WebhookStatus.PROCESSING,
            error_message: undefined
          })
          .where('webhook_id IN (:...webhookIds)', {
            webhookIds: orphanedWebhooks.map(w => w.webhook_id)
          })
          .execute();
        

        
        // Procesar los eventos de los webhooks ahora que están vinculados
        for (const webhook of orphanedWebhooks) {
          try {
            const webhookEvent = JSON.parse(webhook.payload);
            await this.processWebhookEvent(webhookEvent);
            
            // Marcar como procesado
            await webhookRepository.update(webhook.webhook_id, {
              status: WebhookStatus.PROCESSED
            });
          } catch (error) {

            
            // Marcar como fallido
            await webhookRepository.update(webhook.webhook_id, {
              status: WebhookStatus.FAILED,
              error_message: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }
    } catch (error) {

    }
  }

  /**
   * Valida la estructura básica de un webhook de Wompi
   * @param event - Evento de webhook a validar
   * @returns true si la estructura es válida
   */
  private validateWompiWebhookStructure(event: any): boolean {
    if (!event || typeof event !== 'object') {

      return false;
    }

    if (!event.event || typeof event.event !== 'string') {

      return false;
    }

    if (!event.data || !event.data.transaction) {

      return false;
    }

    if (!event.data.transaction.id) {

      return false;
    }

    return true;
  }

  /**
   * Procesa solo el evento del webhook (sin guardar)
   * Usado para procesar webhooks huérfanos que ya fueron guardados
   */
  private async processWebhookEvent(webhookEvent: WompiWebhookEvent): Promise<void> {
    if (!this.validateWompiWebhookStructure(webhookEvent)) {
      throw new Error('Invalid webhook structure');
    }

    switch (webhookEvent.event) {
      case WompiEventType.TRANSACTION_UPDATED:
        await this.handleTransactionUpdated(webhookEvent.data.transaction);
        break;
      case WompiEventType.PAYMENT_LINK_PAID:
        await this.handlePaymentLinkPaid(webhookEvent.data.transaction);
        break;
      default:

    }
   }

   /**
    * Limpia webhooks huérfanos que tienen más de X días sin ser vinculados
    * Este método debe ejecutarse periódicamente para mantener la base de datos limpia
    * 
    * @param daysOld - Número de días después de los cuales considerar un webhook como abandonado
    * @returns Número de webhooks eliminados
    */
   async cleanupOrphanedWebhooks(daysOld: number = 7): Promise<number> {
     try {
       const webhookRepository = AppDataSource.getRepository(PaymentWebhook);
       
       const cutoffDate = new Date();
       cutoffDate.setDate(cutoffDate.getDate() - daysOld);
       
       const result = await webhookRepository
         .createQueryBuilder()
         .delete()
         .from(PaymentWebhook)
         .where('transaction_id IS NULL')
         .andWhere('received_at < :cutoffDate', { cutoffDate })
         .execute();
       
       const deletedCount = result.affected || 0;
       
       if (deletedCount > 0) {

       }
       
       return deletedCount;
     } catch (error) {

       return 0;
     }
   }

  private verifyWebhookSignature(payload: any, signature: string): boolean {
    // Wompi no usa webhook secrets tradicionales
    // La verificación se hace con el checksum del evento
    if (!signature) {

      return false;
    }

    try {
      // Para Wompi, verificamos que el signature coincida con el checksum del payload
      // El signature viene del header x-event-checksum
      if (payload.signature && payload.signature.checksum) {
        // Verificar que el checksum del payload coincida con el signature del header
        return payload.signature.checksum === signature;
      }
      
      // Si no hay checksum en el payload, aceptar el webhook
      // (para compatibilidad con diferentes tipos de eventos de Wompi)
      return true;
      
    } catch (error) {

      return false;
    }
  }

  private mapWompiStatusToPurchaseStatus(wompiStatus: WompiTransactionStatus): PaymentStatus {
    switch (wompiStatus) {
      case WompiTransactionStatus.APPROVED:
        return PaymentStatus.COMPLETED;
      case WompiTransactionStatus.DECLINED:
      case WompiTransactionStatus.ERROR:
        return PaymentStatus.FAILED;
      case WompiTransactionStatus.VOIDED:
        return PaymentStatus.REFUNDED;
      case WompiTransactionStatus.PENDING:
      default:
        return PaymentStatus.PENDING;
    }
  }

  private mapWompiStatusToTransactionStatus(wompiStatus: WompiTransactionStatus): TransactionStatus {
    switch (wompiStatus) {
      case WompiTransactionStatus.APPROVED:
        return TransactionStatus.COMPLETED;
      case WompiTransactionStatus.DECLINED:
      case WompiTransactionStatus.ERROR:
        return TransactionStatus.FAILED;
      case WompiTransactionStatus.VOIDED:
        return TransactionStatus.REFUNDED;
      case WompiTransactionStatus.PENDING:
      default:
        return TransactionStatus.PENDING;
    }
  }

  private handleWompiError(error: any): PaymentResponseDto {
    let message = 'Error procesando el pago';
    let validationErrors: any = {};
    
    if (error.response?.data?.error) {
      const errorResponse: WompiErrorResponse = error.response.data;
      message = errorResponse.error?.message || message;
      
      // Include specific validation errors
      if (errorResponse.error.type === 'INPUT_VALIDATION_ERROR') {
        validationErrors = (errorResponse.error as any).messages || {};
      }
    }
  
    return {
      success: false,
      transactionId: undefined,
      status: WompiTransactionStatus.ERROR,
      amountInCents: 0,
      amount: 0,
      currency: WompiCurrency.COP,
      reference: '',
      purchaseId: 0,
      message,
      validationErrors // Add this field
    };
  }

  /**
   * Obtiene una compra por ID de transacción
   */
  private async getPurchaseByTransactionId(transactionId: string): Promise<Purchase | null> {
    const transactionRepository = AppDataSource.getRepository(PaymentTransaction);
    
    const transaction = await transactionRepository.findOne({
      where: { gateway_transaction_id: transactionId },
      relations: ['purchase', 'purchase.package', 'purchase.user']
    });
    
    return transaction?.purchase || null;
  }

  /**
   * Actualiza una compra basándose en los datos de la transacción de Wompi
   */
  private async updatePurchaseFromTransaction(transactionData: any): Promise<void> {
    try {
      const purchaseRepository = AppDataSource.getRepository(Purchase);
      
      // Buscar la compra por referencia
      const purchase = await purchaseRepository.findOne({
        where: { reference: transactionData.reference },
        relations: ['package', 'user']
      });
      
      if (!purchase) {

        return;
      }
      
      // Actualizar el estado de la compra, transaction_id y payment_method
       purchase.payment_status = PaymentStatus.COMPLETED;
       purchase.transaction_id = transactionData.id;
       purchase.payment_method = transactionData.payment_method_type;
      
      // Actualizar detalles del pago con información de la transacción
      purchase.payment_details = {
        ...purchase.payment_details,
        wompi_transaction: {
          id: transactionData.id,
          status: transactionData.status,
          payment_method_type: transactionData.payment_method_type,
          finalized_at: transactionData.finalized_at,
          amount_in_cents: transactionData.amount_in_cents
        }
      };
      
      await purchaseRepository.save(purchase);
      
      // Crear sesiones automáticamente para la compra completada
      await this.createSessionsForPurchase(purchase);
      

      
    } catch (error) {

      throw error;
    }
  }

  /**
    * Crea sesiones automáticamente para una compra completada
    */
   private async createSessionsForPurchase(purchase: Purchase): Promise<void> {
     try {
       const packageServiceRepository = AppDataSource.getRepository(PackageService);
       const userSessionRepository = AppDataSource.getRepository(UserSession);
       
       // Verificar si ya existen sesiones para esta compra
       const existingSessions = await userSessionRepository.find({
         where: { purchase_id: purchase.purchase_id }
       });
       
       if (existingSessions.length > 0) {

         return;
       }
       
       if (purchase.purchase_type === 'package' && purchase.package_id) {
         // Compra de paquete - crear sesiones basadas en los servicios del paquete
         const packageServices = await packageServiceRepository.find({
           where: { package_id: purchase.package_id },
           relations: ['service']
         });
         
         // Crear una sesión por cada servicio del paquete
         for (const packageService of packageServices) {
           const session = userSessionRepository.create({
             purchase_id: purchase.purchase_id,
             service_id: packageService.service_id,
             sessions_remaining: packageService.sessions_included,
             sessions_purchased: packageService.sessions_included,
             expires_at: purchase.expires_at,
             status: UserSessionStatus.ACTIVE
           });
           
           await userSessionRepository.save(session);
         }
         

         
       } else if (purchase.purchase_type === 'service' && purchase.service_id) {
         // Compra de servicio individual - crear una sesión para el servicio
         const sessionsQuantity = (purchase.payment_details?.sessions_quantity as number) || 1;
         
         for (let i = 0; i < sessionsQuantity; i++) {
           const session = userSessionRepository.create({
             purchase_id: purchase.purchase_id,
             service_id: purchase.service_id,
             sessions_remaining: 1, // Una sesión por cada registro
             sessions_purchased: 1,
             expires_at: purchase.expires_at,
             status: UserSessionStatus.ACTIVE
           });
           
           await userSessionRepository.save(session);
         }
         

       } else {

       }
       
     } catch (error) {

       throw error;
     }
   }
}