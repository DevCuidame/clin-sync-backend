import { PaymentStatus } from '../../models/purchase.model';
import { WompiPaymentMethod } from '../payment/payment.interface';

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

export interface PurchaseResponseDto {
  purchase_id: number;
  user_id: number;
  package_id: number;
  amount_paid: number;
  payment_status: PaymentStatus;
  payment_method: string;
  transaction_id?: string;
  purchase_date: Date;
  expires_at: Date;
  payment_details?: any;
  user?: {
    user_id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  package?: {
    package_id: number;
    package_name: string;
    price: number;
    total_sessions: number;
    validity_days: number;
  };
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