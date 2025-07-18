export interface PurchaseSessionInfo {
  user_session_id: number;
  purchase_id: number;
  service_id: number;
  sessions_purchased: number;
  sessions_remaining: number;
  sessions_used: number;
  status: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
  purchase_info: {
    amount_paid: number;
    purchase_date: Date;
    payment_status: string;
    purchase_type: string;
  };
}

export interface PurchaseAppointmentInfo {
  appointment_id: number;
  user_id: number;
  professional_id: number;
  service_id: number;
  scheduled_at: Date;
  status: string;
  amount: number;
  cancellation_reason?: string;
  user_session_id?: number;
  created_at: Date;
  professional?: {
    professional_id: number;
    user_id: number;
    specialization?: string;
    license_number?: string;
    user?: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

export interface ServicePurchaseWithSessions {
  purchase_id: number;
  user_id?: number;
  temp_customer_id?: number;
  package_id?: number;
  service_id?: number;
  purchase_type: string;
  amount_paid: number;
  payment_status: string;
  payment_method: string;
  transaction_id?: string;
  reference?: string;
  purchase_date: Date;
  expires_at?: Date;
  payment_details?: any;
  user?: {
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    identification_type?: string;
    identification_number?: string;
  };
  temporary_customer?: {
    temp_customer_id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    identification_type: string;
    identification_number: string;
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
    category?: string;
    image_url?: string;
    is_active: boolean;
    metadata?: any;
  };
  sessions: PurchaseSessionInfo[];
  appointments: PurchaseAppointmentInfo[];
}

export interface GetUserServicePurchasesResponse {
  success: boolean;
  data: ServicePurchaseWithSessions[];
}