import { Repository, MoreThan } from 'typeorm';
import { AppDataSource } from '../../core/config/database';
import { Purchase, PaymentStatus } from '../../models/purchase.model';
import { User } from '../../models/user.model';
import { Package } from '../../models/package.model';
import { CreatePurchaseDto, UpdatePurchaseDto, PurchaseResponseDto, CreateCashPurchaseDto, CreateServicePurchaseDto } from './purchase.dto';
import { WompiPaymentMethod } from '../payment/payment.interface';
import { Service } from '../../models/service.model';
import { UserSession, UserSessionStatus } from '../../models/user-session.model';
import { PurchaseValidation } from './purchase.validation';

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

    const newPurchase = this.purchaseRepository.create({
      user_id: purchaseData.user_id,
      package_id: purchaseData.package_id,
      purchase_type: 'package',
      amount_paid: purchaseData.amount_paid,
      payment_status: purchaseData.payment_status || PaymentStatus.PENDING,
      payment_method: purchaseData.payment_method,
      transaction_id: purchaseData.transaction_id,
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

    // Generate a unique reference for cash payment
    const cashReference = `CASH-${Date.now()}-${purchaseData.user_id}`;

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
      .leftJoinAndSelect('purchase.package', 'package');
    
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
      relations: ['user', 'package']
    });

    if (!purchase) {
      return null;
    }

    return this.mapToResponseDto(purchase);
  }

  async getPurchasesByUserId(userId: number): Promise<PurchaseResponseDto[]> {
    const purchases = await this.purchaseRepository.find({
      where: { user_id: userId },
      relations: ['package'],
      order: { purchase_date: 'DESC' }
    });

    return purchases.map(purchase => this.mapToResponseDto(purchase));
  }

  async updatePurchase(purchaseId: number, updateData: UpdatePurchaseDto): Promise<PurchaseResponseDto | null> {
    const existingPurchase = await this.purchaseRepository.findOne({
      where: { purchase_id: purchaseId },
      relations: ['user', 'package']
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
      relations: ['user', 'package']
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
      relations: ['user', 'package']
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
      transaction_id: purchaseData.transaction_id,
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

  private async createSessionsForServicePurchase(purchase: Purchase, sessionsQuantity: number): Promise<void> {
    const userSessionRepository = AppDataSource.getRepository(UserSession);
    
    for (let i = 0; i < sessionsQuantity; i++) {
      const userSession = userSessionRepository.create({
        service_id: purchase.service_id,
        purchase_id: purchase.purchase_id,
        status: UserSessionStatus.ACTIVE,
        expires_at: purchase.expires_at
      });
      
      await userSessionRepository.save(userSession);
    }
  }

  // Actualizar método existente para manejar ambos tipos
  private mapToResponseDto(purchase: Purchase): PurchaseResponseDto {
    return {
      purchase_id: purchase.purchase_id,
      user_id: purchase.user_id,
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
      user: purchase.user ? {
        user_id: purchase.user.id,
        email: purchase.user.email,
        first_name: purchase.user.first_name,
        last_name: purchase.user.last_name
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
        category: purchase.service.category
      } : undefined
    };
  }
}