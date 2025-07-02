import { Repository, MoreThan } from 'typeorm';
import { AppDataSource } from '../../core/config/database';
import { Purchase, PaymentStatus } from '../../models/purchase.model';
import { User } from '../../models/user.model';
import { Package } from '../../models/package.model';
import { CreatePurchaseDto, UpdatePurchaseDto, PurchaseResponseDto, CreateCashPurchaseDto } from './purchase.dto';
import { WompiPaymentMethod } from '../payment/payment.interface';

export class PurchaseService {
  private purchaseRepository: Repository<Purchase>;
  private userRepository: Repository<User>;
  private packageRepository: Repository<Package>;

  constructor() {
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.userRepository = AppDataSource.getRepository(User);
    this.packageRepository = AppDataSource.getRepository(Package);
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

    // Calculate expires_at based on package validity
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + packageData.validity_days);

    const newPurchase = this.purchaseRepository.create({
      user_id: purchaseData.user_id,
      package_id: purchaseData.package_id,
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

  private mapToResponseDto(purchase: Purchase): PurchaseResponseDto {
    return {
      purchase_id: purchase.purchase_id,
      user_id: purchase.user_id,
      package_id: purchase.package_id,
      amount_paid: purchase.amount_paid,
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
        price: purchase.package.price,
        total_sessions: purchase.package.total_sessions,
        validity_days: purchase.package.validity_days
      } : undefined
    };
  }
}