import { Repository, MoreThan } from 'typeorm';
import { AppDataSource } from '../../core/config/database';
import { Purchase, PaymentStatus } from '../../models/purchase.model';
import { User } from '../../models/user.model';
import { Package } from '../../models/package.model';
import { CreatePurchaseDto, UpdatePurchaseDto, PurchaseResponseDto, CreateCashPurchaseDto, CreateServicePurchaseDto, CreateAdminServicePurchaseDto } from './purchase.dto';
import { WompiPaymentMethod } from '../payment/payment.interface';
import { Service } from '../../models/service.model';
import { UserSession, UserSessionStatus } from '../../models/user-session.model';
import { PurchaseValidation } from './purchase.validation';
import { TemporaryCustomer } from '../../models/temporary-customer.model';
import { 
  generateCashPaymentTransactionId, 
  generateServicePurchaseTransactionId, 
  generatePackagePurchaseTransactionId,
  generateTransactionIdByType 
} from '../../utils/transaction-id.util';
// Removed logger import - using console.log instead

export class PurchaseService {
  private purchaseRepository: Repository<Purchase>;
  private userRepository: Repository<User>;
  private packageRepository: Repository<Package>;
  private serviceRepository: Repository<Service>;

  constructor() {
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.userRepository = AppDataSource.getRepository(User);
    this.packageRepository = AppDataSource.getRepository(Package);
    this.serviceRepository = AppDataSource.getRepository(Service);
  }

  async createPurchase(purchaseData: CreatePurchaseDto): Promise<PurchaseResponseDto> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: purchaseData.user_id }
    });
    if (!user) {
      throw new Error('User not found');
    }

    // Verify package exists
    const packageData = await this.packageRepository.findOne({
      where: { package_id: purchaseData.package_id }
    });
    if (!packageData) {
      throw new Error('Package not found');
    }

    // Validar datos de compra
    const validation = PurchaseValidation.validatePurchaseData(purchaseData, packageData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Calculate expires_at based on package validity
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + packageData.validity_days);

    // Generate unique transaction ID for package purchase
    const transactionId = generatePackagePurchaseTransactionId(purchaseData.package_id);

    const newPurchase = this.purchaseRepository.create({
      user_id: purchaseData.user_id,
      package_id: purchaseData.package_id,
      purchase_type: 'package',
      amount_paid: purchaseData.amount_paid,
      payment_status: purchaseData.payment_status || PaymentStatus.PENDING,
      payment_method: purchaseData.payment_method,
      transaction_id: transactionId,
      expires_at: expiresAt,
      payment_details: purchaseData.payment_details
    });

    const savedPurchase = await this.purchaseRepository.save(newPurchase);
    return this.mapToResponseDto(savedPurchase);
  }

  async createCashPurchase(purchaseData: CreateCashPurchaseDto): Promise<PurchaseResponseDto> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: purchaseData.user_id }
    });
    if (!user) {
      throw new Error('User not found');
    }

    // Verify package exists
    const packageData = await this.packageRepository.findOne({
      where: { package_id: purchaseData.package_id }
    });
    if (!packageData) {
      throw new Error('Package not found');
    }

    // Calculate expires_at based on package validity
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + packageData.validity_days);

    // Generate a unique reference for cash payment using the new utility
    const cashReference = generateCashPaymentTransactionId();

    // Prepare payment details with customer info and reference
    const paymentDetails = {
      customer_info: purchaseData.customer_info,
      payment_reference: cashReference,
      payment_type: 'cash',
      created_at: new Date().toISOString(),
      ...purchaseData.payment_details
    };

    const newPurchase = this.purchaseRepository.create({
      user_id: purchaseData.user_id,
      package_id: purchaseData.package_id,
      amount_paid: purchaseData.amount_paid,
      payment_status: PaymentStatus.PENDING, // Always pending for cash payments
      payment_method: WompiPaymentMethod.CASH,
      transaction_id: cashReference,
      expires_at: expiresAt,
      payment_details: paymentDetails
    });

    const savedPurchase = await this.purchaseRepository.save(newPurchase);
    return this.mapToResponseDto(savedPurchase);
  }

  async getAllPurchases(userId?: number, paymentStatus?: string): Promise<PurchaseResponseDto[]> {
    const queryBuilder = this.purchaseRepository
      .createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.user', 'user')
      .leftJoinAndSelect('purchase.package', 'package')
      .leftJoinAndSelect('purchase.service', 'service')
      .leftJoinAndSelect('purchase.temporaryCustomer', 'temporaryCustomer');
    
    if (userId) {
      queryBuilder.andWhere('purchase.user_id = :userId', { userId });
    }
    
    if (paymentStatus) {
      queryBuilder.andWhere('purchase.payment_status = :paymentStatus', { paymentStatus });
    }
    
    queryBuilder.orderBy('purchase.purchase_date', 'DESC');
    
    const purchases = await queryBuilder.getMany();
    return purchases.map(purchase => this.mapToResponseDto(purchase));
  }

  async getPurchaseById(purchaseId: number): Promise<PurchaseResponseDto | null> {
    const purchase = await this.purchaseRepository.findOne({
      where: { purchase_id: purchaseId },
      relations: ['user', 'package', 'service', 'temporaryCustomer']
    });

    if (!purchase) {
      return null;
    }

    return this.mapToResponseDto(purchase);
  }

  async getPurchaseWithCompleteDetails(purchaseId: number): Promise<any | null> {
    const purchase = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.user', 'user')
      .leftJoinAndSelect('purchase.package', 'package')
      .leftJoinAndSelect('purchase.service', 'service')
      .leftJoinAndSelect('purchase.userSessions', 'sessions')
      .leftJoinAndSelect('sessions.service', 'sessionService')
      .leftJoinAndSelect('purchase.payment_transactions', 'transactions')
      .where('purchase.purchase_id = :purchaseId', { purchaseId })
      .getOne();

    if (!purchase) {
      return null;
    }

    // Mapear a un formato más completo
    return {
      purchase_id: purchase.purchase_id,
      user_id: purchase.user_id,
      package_id: purchase.package_id,
      service_id: purchase.service_id,
      amount_paid: purchase.amount_paid,
      purchase_type: purchase.purchase_type,
      payment_status: purchase.payment_status,
      payment_method: purchase.payment_method,
      transaction_id: purchase.transaction_id,
      purchase_date: purchase.purchase_date,
      updated_at: purchase.updated_at,
      expires_at: purchase.expires_at,
      payment_details: purchase.payment_details,
      user: purchase.user ? {
        id: purchase.user.id,
        email: purchase.user.email,
        first_name: purchase.user.first_name,
        last_name: purchase.user.last_name,
        phone: purchase.user.phone
      } : null,
      package: purchase.package ? {
        package_id: purchase.package.package_id,
        package_name: purchase.package.package_name,
        description: purchase.package.description,
        price: purchase.package.price,
        total_sessions: purchase.package.total_sessions,
        validity_days: purchase.package.validity_days,
        discount_percentage: purchase.package.discount_percentage,
        is_active: purchase.package.is_active,
        terms_conditions: purchase.package.terms_conditions,
        image_url: purchase.package.image_url
      } : null,
      service: purchase.service ? {
        service_id: purchase.service.service_id,
        service_name: purchase.service.service_name,
        description: purchase.service.description,
        base_price: purchase.service.base_price,
        duration_minutes: purchase.service.duration_minutes,
        is_active: purchase.service.is_active
      } : null,
      sessions: purchase.userSessions ? purchase.userSessions.map(session => ({
        session_id: session.user_session_id,
        purchase_id: session.purchase_id,
        service_id: session.service_id,
        status: session.status,
        created_at: session.created_at,
        expires_at: session.expires_at,
        service: session.service ? {
          service_id: session.service.service_id,
          service_name: session.service.service_name,
          description: session.service.description,
          base_price: session.service.base_price,
          duration_minutes: session.service.duration_minutes
        } : null
      })) : [],
      payment_transactions: purchase.payment_transactions ? purchase.payment_transactions.map(transaction => ({
        transaction_id: transaction.transaction_id,
        gateway_transaction_id: transaction.gateway_transaction_id,
        gateway_provider: transaction.gateway_provider,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at
      })) : []
    };
  }

  async getPurchasesByUserId(userId: number): Promise<PurchaseResponseDto[]> {
    const purchases = await this.purchaseRepository.find({
      where: { user_id: userId },
      relations: ['package', 'service', 'temporaryCustomer', 'user'],
      order: { purchase_date: 'DESC' }
    });

    return purchases.map(purchase => this.mapToResponseDto(purchase));
  }

  async getServicePurchasesByUserId(userId: number): Promise<PurchaseResponseDto[]> {
    const purchases = await this.purchaseRepository.find({
      where: { 
        user_id: userId,
        purchase_type: 'service'
      },
      relations: ['service', 'temporaryCustomer', 'user'],
      order: { purchase_date: 'DESC' }
    });

    return purchases.map(purchase => this.mapToResponseDto(purchase));
  }

  async updatePurchase(purchaseId: number, updateData: UpdatePurchaseDto): Promise<PurchaseResponseDto | null> {
    const existingPurchase = await this.purchaseRepository.findOne({
      where: { purchase_id: purchaseId },
      relations: ['user', 'package', 'service', 'temporaryCustomer']
    });

    if (!existingPurchase) {
      return null;
    }

    // Update only provided fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdatePurchaseDto] !== undefined) {
        (existingPurchase as any)[key] = updateData[key as keyof UpdatePurchaseDto];
      }
    });

    const updatedPurchase = await this.purchaseRepository.save(existingPurchase);
    return this.mapToResponseDto(updatedPurchase);
  }

  async updatePaymentStatus(purchaseId: number, paymentStatus: PaymentStatus): Promise<PurchaseResponseDto | null> {
    const purchase = await this.purchaseRepository.findOne({
      where: { purchase_id: purchaseId },
      relations: ['user', 'package', 'service', 'temporaryCustomer']
    });

    if (!purchase) {
      return null;
    }

    purchase.payment_status = paymentStatus;
    const updatedPurchase = await this.purchaseRepository.save(purchase);
    return this.mapToResponseDto(updatedPurchase);
  }

  /**
   * Confirmar pago en efectivo - Actualiza estado a 'completed' y agrega notas del administrador
   */
  async confirmCashPayment(purchaseId: number, adminNotes?: string): Promise<PurchaseResponseDto | null> {
    const purchase = await this.purchaseRepository.findOne({
      where: { purchase_id: purchaseId },
      relations: ['user', 'package', 'service', 'temporaryCustomer']
    });

    if (!purchase) {
      return null;
    }

    // Actualizar estado y agregar información de confirmación
    purchase.payment_status = PaymentStatus.COMPLETED;
    
    // Agregar información de confirmación a payment_details
    const currentDetails = purchase.payment_details || {};
    purchase.payment_details = {
      ...currentDetails,
      confirmed_at: new Date().toISOString(),
      confirmed_by: 'admin', // En el futuro se puede agregar el ID del admin
      admin_notes: adminNotes || 'Pago en efectivo confirmado por administrador',
      confirmation_method: 'manual_admin_confirmation'
    };

    const updatedPurchase = await this.purchaseRepository.save(purchase);
    return this.mapToResponseDto(updatedPurchase);
  }

  /**
   * Rechazar pago en efectivo - Actualiza estado a 'failed' y agrega razón del rechazo
   */
  async rejectCashPayment(purchaseId: number, rejectionReason?: string): Promise<PurchaseResponseDto | null> {
    const purchase = await this.purchaseRepository.findOne({
      where: { purchase_id: purchaseId },
      relations: ['user', 'package']
    });

    if (!purchase) {
      return null;
    }

    // Actualizar estado y agregar información de rechazo
    purchase.payment_status = PaymentStatus.FAILED;
    
    // Agregar información de rechazo a payment_details
    const currentDetails = purchase.payment_details || {};
    purchase.payment_details = {
      ...currentDetails,
      rejected_at: new Date().toISOString(),
      rejected_by: 'admin', // En el futuro se puede agregar el ID del admin
      rejection_reason: rejectionReason || 'Pago en efectivo rechazado por administrador',
      rejection_method: 'manual_admin_rejection'
    };

    const updatedPurchase = await this.purchaseRepository.save(purchase);
    return this.mapToResponseDto(updatedPurchase);
  }

  /**
   * Obtener pagos en efectivo pendientes de confirmación
   */
  async getPendingCashPayments(): Promise<PurchaseResponseDto[]> {
    const purchases = await this.purchaseRepository.find({
      where: { 
        payment_status: PaymentStatus.PENDING,
        payment_method: WompiPaymentMethod.CASH
      },
      relations: ['user', 'package'],
      order: { purchase_date: 'ASC' } // Los más antiguos primero
    });

    return purchases.map(purchase => this.mapToResponseDto(purchase));
  }

  async getPurchasesByStatus(paymentStatus: PaymentStatus): Promise<PurchaseResponseDto[]> {
    const purchases = await this.purchaseRepository.find({
      where: { payment_status: paymentStatus },
      relations: ['user', 'package'],
      order: { purchase_date: 'DESC' }
    });

    return purchases.map(purchase => this.mapToResponseDto(purchase));
  }

  async getExpiredPurchases(): Promise<PurchaseResponseDto[]> {
    const now = new Date();
    const purchases = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.user', 'user')
      .leftJoinAndSelect('purchase.package', 'package')
      .where('purchase.expires_at < :now', { now })
      .andWhere('purchase.payment_status = :status', { status: PaymentStatus.COMPLETED })
      .orderBy('purchase.expires_at', 'ASC')
      .getMany();

    return purchases.map(purchase => this.mapToResponseDto(purchase));
  }

  async getActivePurchases(userId: number): Promise<PurchaseResponseDto[]> {
    const now = new Date();
    const purchases = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.package', 'package')
      .where('purchase.user_id = :userId', { userId })
      .andWhere('purchase.expires_at > :now', { now })
      .andWhere('purchase.payment_status = :status', { status: PaymentStatus.COMPLETED })
      .orderBy('purchase.expires_at', 'ASC')
      .getMany();

    return purchases.map(purchase => this.mapToResponseDto(purchase));
  }

    async createServicePurchase(purchaseData: CreateServicePurchaseDto, discountPercentage?: number): Promise<PurchaseResponseDto> {
    // Verificar que el usuario existe
    const user = await this.userRepository.findOne({
      where: { id: purchaseData.user_id }
    });
    if (!user) {
      throw new Error('User not found');
    }

    // Verificar que el servicio existe
    const service = await this.serviceRepository.findOne({
      where: { service_id: purchaseData.service_id }
    });
    if (!service) {
      throw new Error('Service not found');
    }

    // Validar datos de compra de servicio
    const validation = PurchaseValidation.validateServicePurchaseData(purchaseData, service, discountPercentage);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Calcular fecha de expiración (por ejemplo, 30 días por defecto)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Generate unique transaction ID for service purchase
    const transactionId = generateServicePurchaseTransactionId(purchaseData.service_id);

    // Preparar detalles de pago con información de descuento si aplica
    const paymentDetails = {
      ...purchaseData.payment_details,
      original_price: Number(service.base_price),
      discount_percentage: discountPercentage || 0,
      final_price: purchaseData.amount_paid
    };

    const purchase = this.purchaseRepository.create({
      user_id: purchaseData.user_id,
      service_id: purchaseData.service_id,
      purchase_type: 'service',
      amount_paid: purchaseData.amount_paid,
      payment_status: purchaseData.payment_status || PaymentStatus.PENDING,
      payment_method: purchaseData.payment_method,
      transaction_id: transactionId,
      expires_at: expiresAt,
      payment_details: paymentDetails
    });

    const savedPurchase = await this.purchaseRepository.save(purchase);

    // Crear sesiones de usuario para el servicio comprado
    if (savedPurchase.payment_status === PaymentStatus.COMPLETED) {
      await this.createSessionsForServicePurchase(savedPurchase, purchaseData.sessions_quantity || 1);
    }

    return this.mapToResponseDto(savedPurchase);
  }

  async createAdminServicePurchase(
    purchaseData: CreateAdminServicePurchaseDto, 
    adminUserId: number
  ): Promise<PurchaseResponseDto> {
    console.log('🛒 Iniciando creación de compra de servicio para cliente temporal', {
      adminUserId,
      serviceId: purchaseData.service_id,
      amount: purchaseData.amount_paid,
      paymentMethod: purchaseData.payment_method,
      paymentStatus: purchaseData.payment_status,
      sessionsQuantity: purchaseData.sessions_quantity,
      customerEmail: purchaseData.customer_data.email
    });

    try {
      // Buscar o crear cliente temporal
      console.log('🔍 Verificando si existe cliente temporal', {
        identificationType: purchaseData.customer_data.identification_type,
        identificationNumber: purchaseData.customer_data.identification_number
      });

      const tempCustomerRepository = AppDataSource.getRepository(TemporaryCustomer);
      
      let savedTempCustomer = await this.findTemporaryCustomerByIdentification(
        purchaseData.customer_data.identification_type!,
        purchaseData.customer_data.identification_number!
      );

      if (savedTempCustomer) {
        console.log('✅ Cliente temporal existente encontrado', {
          tempCustomerId: savedTempCustomer.temp_customer_id,
          customerName: `${savedTempCustomer.first_name} ${savedTempCustomer.last_name}`,
          identificationType: savedTempCustomer.identification_type,
          identificationNumber: savedTempCustomer.identification_number
        });
      } else {
        console.log('📝 Creando nuevo cliente temporal', {
          customerData: {
            name: `${purchaseData.customer_data.first_name} ${purchaseData.customer_data.last_name}`,
            email: purchaseData.customer_data.email,
            phone: purchaseData.customer_data.phone,
            identificationType: purchaseData.customer_data.identification_type,
            identificationNumber: purchaseData.customer_data.identification_number
          }
        });

        const tempCustomer = tempCustomerRepository.create({
          ...purchaseData.customer_data,
          created_by: adminUserId
        });
        savedTempCustomer = await tempCustomerRepository.save(tempCustomer);
        
        console.log('✅ Nuevo cliente temporal creado exitosamente', {
          tempCustomerId: savedTempCustomer.temp_customer_id,
          customerName: `${savedTempCustomer.first_name} ${savedTempCustomer.last_name}`
        });
      }
  
      // Verificar que el servicio existe
      console.log('🔍 Verificando existencia del servicio', {
        serviceId: purchaseData.service_id
      });
  
      const service = await this.serviceRepository.findOne({
        where: { service_id: purchaseData.service_id }
      });
      if (!service) {
        console.error('❌ Servicio no encontrado', {
          serviceId: purchaseData.service_id
        });
        throw new Error('Service not found');
      }
  
      console.log('✅ Servicio encontrado', {
        serviceId: service.service_id,
        serviceName: service.service_name,
        basePrice: service.base_price
      });
  
      // Calcular fecha de expiración
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
  
      console.log('📅 Fecha de expiración calculada', {
        expiresAt: expiresAt.toISOString()
      });
  
      // Generate unique transaction ID for admin service purchase
      const transactionId = generateServicePurchaseTransactionId(purchaseData.service_id);
      
      // Crear compra
      console.log('💳 Creando registro de compra', {
        userId: adminUserId,
        tempCustomerId: savedTempCustomer.temp_customer_id,
        serviceId: purchaseData.service_id,
        amount: purchaseData.amount_paid,
        paymentStatus: purchaseData.payment_status.toLowerCase(),
        paymentMethod: purchaseData.payment_method,
        transactionId: transactionId
      });
  
      const purchase = this.purchaseRepository.create({
        user_id: adminUserId,
        temp_customer_id: savedTempCustomer.temp_customer_id,
        service_id: purchaseData.service_id,
        purchase_type: 'service',
        amount_paid: purchaseData.amount_paid,
        payment_status: purchaseData.payment_status.toLowerCase() as PaymentStatus,
        payment_method: purchaseData.payment_method,
        transaction_id: transactionId,
        expires_at: expiresAt,
        payment_details: {
          created_by_admin: adminUserId,
          admin_notes: purchaseData.admin_notes,
          original_price: Number(service.base_price),
          discount_percentage: purchaseData.discount_percentage || 0,
          final_price: purchaseData.amount_paid
        }
      });
  
      const savedPurchase = await this.purchaseRepository.save(purchase);
      
      console.log('✅ Compra creada exitosamente', {
        purchaseId: savedPurchase.purchase_id,
        amount: savedPurchase.amount_paid,
        paymentStatus: savedPurchase.payment_status
      });
  
      // Crear sesiones si el pago está completado
      if (savedPurchase.payment_status === PaymentStatus.COMPLETED) {
        console.log('🎯 Creando sesiones de usuario (pago completado)', {
          purchaseId: savedPurchase.purchase_id,
          sessionsQuantity: purchaseData.sessions_quantity || 1
        });
        
        await this.createSessionsForServicePurchase(
          savedPurchase, 
          purchaseData.sessions_quantity || 1
        );
        
        console.log('✅ Sesiones creadas exitosamente', {
          purchaseId: savedPurchase.purchase_id,
          sessionsCreated: purchaseData.sessions_quantity || 1
        });
      } else {
        console.log('⏳ Sesiones no creadas (pago pendiente)', {
          purchaseId: savedPurchase.purchase_id,
          paymentStatus: savedPurchase.payment_status
        });
      }
  
      // Cargar la compra con todas las relaciones para la respuesta completa
      console.log('📋 Cargando compra con relaciones completas para respuesta', {
        purchaseId: savedPurchase.purchase_id
      });
      
      const purchaseWithRelations = await this.purchaseRepository.findOne({
        where: { purchase_id: savedPurchase.purchase_id },
        relations: ['user', 'service', 'temporaryCustomer', 'userSessions']
      });
      
      if (!purchaseWithRelations) {
        throw new Error('Error loading purchase with relations');
      }
      
      const result = this.mapToResponseDto(purchaseWithRelations);
      
      console.log('🎉 Compra de servicio para cliente temporal completada exitosamente', {
        purchaseId: savedPurchase.purchase_id,
        tempCustomerId: savedTempCustomer.temp_customer_id,
        serviceId: purchaseData.service_id,
        totalAmount: purchaseData.amount_paid,
        sessionsQuantity: purchaseData.sessions_quantity || 1,
        responseData: {
          hasTemporaryCustomer: !!result.temporary_customer,
          hasService: !!result.service,
          hasSessions: result.sessions?.length || 0
        }
      });
  
      return result;
      
    } catch (error) {
      console.error('❌ Error en createAdminServicePurchase', {
        adminUserId,
        serviceId: purchaseData.service_id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        purchaseData: {
          amount: purchaseData.amount_paid,
          paymentMethod: purchaseData.payment_method,
          paymentStatus: purchaseData.payment_status,
          customerEmail: purchaseData.customer_data.email
        }
      });
      throw error;
    }
  }

  /**
   * Busca un cliente temporal por tipo y número de identificación
   * @param identificationType Tipo de identificación (CC, CE, TI, PP, NIT)
   * @param identificationNumber Número de identificación
   * @returns Cliente temporal encontrado o null si no existe
   */
  async findTemporaryCustomerByIdentification(
    identificationType: string,
    identificationNumber: string
  ): Promise<TemporaryCustomer | null> {
    if (!identificationNumber || !identificationType) {
      return null;
    }

    console.log('🔍 Buscando cliente temporal por identificación', {
      identificationType,
      identificationNumber
    });

    try {
      const tempCustomerRepository = AppDataSource.getRepository(TemporaryCustomer);
      
      const tempCustomer = await tempCustomerRepository.findOne({
        where: {
          identification_type: identificationType as any,
          identification_number: identificationNumber
        }
      });
      console.log("🚀 ~ PurchaseService ~ tempCustomer:", tempCustomer)

      if (tempCustomer) {
        console.log('✅ Cliente temporal encontrado', {
          tempCustomerId: tempCustomer.temp_customer_id,
          customerName: `${tempCustomer.first_name} ${tempCustomer.last_name}`,
          createdAt: tempCustomer.created_at
        });
      } else {
        console.log('❌ Cliente temporal no encontrado', {
          identificationType,
          identificationNumber
        });
      }

      return tempCustomer;
    } catch (error) {
      console.error('❌ Error buscando cliente temporal', {
        identificationType,
        identificationNumber,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  private async createSessionsForServicePurchase(purchase: Purchase, sessionsQuantity: number): Promise<void> {
    console.log('🔄 Iniciando creación de sesiones', {
      purchaseId: purchase.purchase_id,
      serviceId: purchase.service_id,
      sessionsQuantity
    });
  
    const userSessionRepository = AppDataSource.getRepository(UserSession);
    
    for (let i = 0; i < sessionsQuantity; i++) {
      console.log(`📝 Creando sesión ${i + 1}/${sessionsQuantity}`, {
        purchaseId: purchase.purchase_id,
        serviceId: purchase.service_id,
        sessionNumber: i + 1
      });
  
      const userSession = userSessionRepository.create({
        service_id: purchase.service_id,
        purchase_id: purchase.purchase_id,
        sessions_remaining: 1, 
        status: UserSessionStatus.ACTIVE,
        expires_at: purchase.expires_at
      });
      
      await userSessionRepository.save(userSession);
    }
  
    console.log('✅ Todas las sesiones creadas exitosamente', {
      purchaseId: purchase.purchase_id,
      totalSessionsCreated: sessionsQuantity
    });
  }

  // Actualizar método existente para manejar ambos tipos
  private mapToResponseDto(purchase: Purchase): PurchaseResponseDto {
    // Si existe cliente temporal, usar sus datos en lugar del usuario
    const customerData = purchase.temporaryCustomer ? {
      user_id: purchase.temporaryCustomer.temp_customer_id,
      email: purchase.temporaryCustomer.email || '',
      first_name: purchase.temporaryCustomer.first_name,
      last_name: purchase.temporaryCustomer.last_name,
      phone: purchase.temporaryCustomer.phone,
      identification_type: purchase.temporaryCustomer.identification_type,
      identification_number: purchase.temporaryCustomer.identification_number
    } : purchase.user ? {
      user_id: purchase.user.id,
      email: purchase.user.email,
      first_name: purchase.user.first_name,
      last_name: purchase.user.last_name
    } : undefined;

    return {
      purchase_id: purchase.purchase_id,
      user_id: purchase.user_id,
      temp_customer_id: purchase.temp_customer_id,
      package_id: purchase.package_id,
      service_id: purchase.service_id,
      purchase_type: purchase.purchase_type,
      amount_paid: Number(purchase.amount_paid),
      payment_status: purchase.payment_status,
      payment_method: purchase.payment_method || '',
      transaction_id: purchase.transaction_id,
      purchase_date: purchase.purchase_date,
      expires_at: purchase.expires_at,
      payment_details: purchase.payment_details,
      user: customerData,
      temporary_customer: purchase.temporaryCustomer ? {
        temp_customer_id: purchase.temporaryCustomer.temp_customer_id,
        first_name: purchase.temporaryCustomer.first_name,
        last_name: purchase.temporaryCustomer.last_name,
        email: purchase.temporaryCustomer.email,
        phone: purchase.temporaryCustomer.phone,
        identification_type: purchase.temporaryCustomer.identification_type,
        identification_number: purchase.temporaryCustomer.identification_number,
        notes: purchase.temporaryCustomer.notes,
        created_at: purchase.temporaryCustomer.created_at
      } : undefined,
      package: purchase.package ? {
        package_id: purchase.package.package_id,
        package_name: purchase.package.package_name,
        description: purchase.package.description,
        price: Number(purchase.package.price),
        total_sessions: purchase.package.total_sessions,
        validity_days: purchase.package.validity_days,
      } : undefined,
      service: purchase.service ? {
        service_id: purchase.service.service_id,
        service_name: purchase.service.service_name,
        description: purchase.service.description,
        base_price: Number(purchase.service.base_price),
        duration_minutes: purchase.service.duration_minutes,
        category: purchase.service.category,
        image_url: purchase.service.image_url,
        is_active: purchase.service.is_active,
        metadata: purchase.service.metadata,
      } : undefined,
      sessions: purchase.userSessions ? purchase.userSessions.map(session => ({
        session_id: session.user_session_id,
        purchase_id: session.purchase_id,
        service_id: session.service_id,
        status: session.status,
        sessions_remaining: session.sessions_remaining,
        created_at: session.created_at,
        expires_at: session.expires_at
      })) : []
    };
  }
}