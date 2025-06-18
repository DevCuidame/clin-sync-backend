import { AppointmentStatus } from "../../models/appointment.model";
import { TransactionStatus } from "../../models/payment-transaction.model";
import { ProfessionalStatus } from "../../models/professional.model";
import { PaymentStatus } from "../../models/purchase.model";
import { ServiceCategory } from "../../models/service.model";
import { UserSessionStatus } from "../../models/user-session.model";
import { UserStatus } from "../../models/user.model";

export interface UserCompleteInfo {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    identification_type: string;
    identification_number?: string;
    birth_date?: Date;
    address?: string;
    gender: string;
    city_id?: number;
    phone: string;
    status: UserStatus; // UserStatus enum
    session_token?: string;
    verified: boolean;
    pubname?: string;
    privname?: string;
    imagebs64?: string;
    path?: string;
    created_at: Date;
    updated_at: Date;
    user_roles?: {
      role: {
        role_id: number;
        role_name: string;
        description?: string;
      };
    }[];
  };
  purchases: {
    purchase_id: number;
    package: {
      package_id: number;
      package_name: string;
      description?: string;
      price: number;
      total_sessions: number;
      validity_days: number;
      discount_percentage: number;
      is_active: boolean;
      terms_conditions?: any;
      image_url?: string | null;
      created_at: Date;
      updated_at: Date;
    };
    amount_paid: number;
    payment_status: PaymentStatus; // PaymentStatus enum
    payment_method?: string;
    transaction_id?: string;
    purchase_date: Date;
    expires_at: Date;
    payment_details?: any;
    payment_transactions?: {
      transaction_id: number;
      gateway_provider: string;
      gateway_transaction_id?: string;
      payment_intent_id?: string;
      amount: number;
      currency: string;
      status: TransactionStatus; // TransactionStatus enum
      gateway_response?: any;
      webhook_data?: any;
      created_at: Date;
      updated_at: Date;
    }[];
    sessions: {
      user_session_id: number;
      service: {
        service_id: number;
        service_name: string;
        description?: string;
        base_price: number;
        duration_minutes: number;
        category: ServiceCategory; // ServiceCategory enum
        is_active: boolean;
        metadata?: any;
        created_at: Date;
        updated_at: Date;
      };
      sessions_remaining: number;
      expires_at: Date;
      status: UserSessionStatus; // UserSessionStatus enum
      created_at: Date;
      updated_at: Date;
      appointments: {
        appointment_id: number;
        user_id: number;
        professional_id: number;
        service_id: number;
        user_session_id?: number;
        scheduled_at: Date;
        duration_minutes: number;
        status: AppointmentStatus; // AppointmentStatus enum
        amount?: number;
        notes?: string;
        cancellation_reason?: string;
        reminder_sent?: boolean;
        google_calendar_event_id?: string;
        created_at?: Date;
        updated_at?: Date;
        professional: {
          professional_id: number;
          license_number: string;
          specialization?: string;
          bio?: string;
          hourly_rate?: number;
          experience_years?: number;
          status: ProfessionalStatus; // ProfessionalStatus enum
          availability_config?: any;
          created_at: Date;
          updated_at: Date;
          user: {
            id: number;
            email: string;
            first_name: string;
            last_name: string;
            identification_type: string;
            identification_number?: string;
            birth_date?: Date;
            address?: string;
            gender: string;
            city_id?: number;
            phone: string;
            status: string;
            verified: boolean;
            pubname?: string;
            privname?: string;
            imagebs64?: string;
            path?: string;
            created_at: Date;
            updated_at: Date;
          };
        };
      }[];
    }[];
  }[];
  summary: {
    total_purchases: number;
    total_amount_spent: number;
    active_sessions: number;
    completed_appointments: number;
    pending_appointments: number;
    cancelled_appointments: number;
    total_sessions_remaining: number;
    most_used_service?: string;
    favorite_professional?: string;
  };
}
export interface IUser {
    id: number;
    code?: string;
    hashcode?: string;
    name: string;
    lastname: string;
    typeperson?: string;
    typeid: string;
    numberid?: string;
    address?: string;
    city_id?: number;
    phone: string;
    email: string;
    parentesco?: string;
    notificationid?: string;
    password?: string;
    session_token?: string;
    verificado: boolean;
    created_at: Date;
    updated_at: Date;
    pubname?: string;
    privname?: string;
    imagebs64?: string;
    path?: string;
    roles?: string[];
  }
  
  /**
   * Interfaz para filtros de usuario
   */
  export interface UserFilterOptions {
    id?: number;
    code?: string;
    email?: string;
    name?: string;
    lastname?: string;
    typeid?: string;
    numberid?: string;
    verificado?: boolean;
    city_id?: number;
    role_id?: number;
  }
  
  /**
   * Interfaz para representar un departamento
   */
  export interface IDepartment {
    id: number;
    name: string;
  }
  
  /**
   * Interfaz para representar un municipio/ciudad
   */
  export interface ITownship {
    id: number;
    department_id: number;
    code: string;
    name: string;
  }
  
  /**
   * Interfaz para representar un rol
   */
  export interface IRole {
    id: number;
    name: string;
    status: boolean;
  }
  
  /**
   * Interfaz para representar la relación usuario-rol
   */
  export interface IUserRole {
    id: number;
    user_id: number;
    role_id: number;
    user?: IUser;
    role?: IRole;
  }

