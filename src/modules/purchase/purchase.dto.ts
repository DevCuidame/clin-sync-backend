import { ServiceCategory } from '@models/service.model';
import { PaymentStatus } from '../../models/purchase.model';
import { WompiPaymentMethod } from '../payment/payment.interface';
import { IdentificationType } from '@models/temporary-customer.model';
import { PaginationParams, PaginatedResult } from '../../core/interfaces/response.interface';

export interface CreatePurchaseDto {
  user_id: number;
  package_id: number;
  amount_paid: number;
  payment_status?: PaymentStatus;
  payment_method: string;
  transaction_id?: string;
  payment_details?: any;
}

export interface UpdatePurchaseDto {
  amount_paid?: number;
  payment_status?: PaymentStatus;
  payment_method?: string;
  transaction_id?: string;
  expires_at?: Date;
  payment_details?: any;
}

export interface CreateServicePurchaseDto {
  user_id: number;
  service_id: number;
  amount_paid: number;
  payment_status?: PaymentStatus;
  payment_method: string;
  transaction_id?: string;
  payment_details?: any;
  sessions_quantity?: number; // Para servicios que permiten múltiples sesiones
}

export interface PurchaseResponseDto {
  purchase_id: number;
  user_id: number;
  temp_customer_id?: number;
  package_id?: number;
  service_id?: number;
  purchase_type: 'package' | 'service';
  amount_paid: number;
  payment_status: PaymentStatus;
  payment_method: string;
  transaction_id?: string;
  reference?: string;
  purchase_date: Date;
  expires_at: Date;
  payment_details?: any;
  user?: {
    user_id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  temporary_customer?: {
    temp_customer_id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    identification_type?: IdentificationType;
    identification_number?: string;
    notes?: string;
    created_at: Date;
  };
  package?: {
    package_id: number;
    package_name: string;
    description?: string;
    price: number;
    total_sessions: number;
    validity_days: number;
  };
  service?: {
    service_id: number;
    service_name: string;
    description?: string;
    base_price: number;
    duration_minutes: number;
    category: ServiceCategory;
    image_url?: string;
    is_active: boolean;
    metadata?: any;
  };
  sessions?: {
    session_id: number;
    purchase_id: number;
    service_id: number;
    status: string;
    sessions_remaining: number;
    created_at: Date;
    expires_at: Date;
  }[];
}

export interface CreateCashPurchaseDto {
  user_id: number;
  package_id: number;
  amount_paid: number;
  customer_info: {
    email: string;
    full_name: string;
    phone_number?: string;
  };
  payment_details?: {
    notes?: string;
    reference?: string;
  };
}

export interface CreateServiceCashPurchaseDto {
  user_id: number;
  service_id: number;
  amount_paid: number;
  customer_info: {
    email: string;
    full_name: string;
    phone_number?: string;
  };
  payment_details?: {
    notes?: string;
    reference?: string;
  };
  sessions_quantity?: number;
}

export interface CreateAdminServicePurchaseDto {
  // Datos del cliente temporal
  customer_data: {
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
    identification_number?: string;
    identification_type?: IdentificationType;
    notes?: string;
  };
  
  // Datos de la compra
  service_id: number;
  amount_paid: number;
  payment_method: string; // 'CASH', 'CARD', 'TRANSFER'
  payment_status: PaymentStatus;
  sessions_quantity?: number;
  discount_percentage?: number;
  admin_notes?: string;
}

export interface PurchaseFiltersDto extends PaginationParams {
  user_id?: number;
  payment_status?: PaymentStatus;
  purchase_type?: 'package' | 'service';
  payment_method?: string;
  start_date?: string;
  end_date?: string;
  buyer_name?: string; // Filtro por nombre del comprador (user o temp_customer)
}

export interface PaginatedPurchasesResponseDto extends PaginatedResult<PurchaseResponseDto> {
  filters?: PurchaseFiltersDto;
}
