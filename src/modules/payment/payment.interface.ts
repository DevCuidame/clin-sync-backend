/**
 * Interfaces y DTOs para el módulo de pagos con Wompi
 * Implementación modular y escalable siguiendo clean code
 */

// Enums para tipos de datos
export enum WompiCurrency {
  COP = 'COP',
  USD = 'USD'
}

export enum WompiPaymentMethod {
  CARD = 'CARD',
  NEQUI = 'NEQUI',
  PSE = 'PSE',
  BANCOLOMBIA_TRANSFER = 'BANCOLOMBIA_TRANSFER',
  BANCOLOMBIA_COLLECT = 'BANCOLOMBIA_COLLECT',
  CASH = 'CASH'
}

export enum WompiTransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  VOIDED = 'VOIDED',
  ERROR = 'ERROR'
}

export enum WompiEventType {
  TRANSACTION_UPDATED = 'transaction.updated',
  PAYMENT_LINK_PAID = 'payment_link.paid'
}

// Interfaces base
export interface WompiConfig {
  publicKey: string;
  privateKey: string;
  environment: 'sandbox' | 'production';
  baseUrl: string;
  webhookSecret?: string;
}

export interface WompiCustomerInfo {
  email: string;
  fullName: string;
  phoneNumber?: string;
  legalId?: string;
  legalIdType?: 'CC' | 'CE' | 'NIT' | 'PP';
}

export interface WompiShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  country: string;
  region: string;
  city: string;
  name: string;
  phoneNumber: string;
}

export interface WompiPaymentSource {
  type: WompiPaymentMethod;
  token?: string;
  customerEmail?: string;
  acceptanceToken?: string;
  paymentDescription?: string;
}

// DTOs para requests
export interface CreateWompiTransactionDto {
  userId: number;
  packageId: number;
  amountInCents: number;
  currency: WompiCurrency;
  customerInfo: WompiCustomerInfo;
  paymentMethod: WompiPaymentMethod;
  reference: string;
  redirectUrl?: string;
  paymentDescription?: string;
  shippingAddress?: WompiShippingAddress;
  acceptanceToken: string;
  acceptPersonalAuth: string;
}

export interface CreatePaymentLinkDto {
  userId: number;
  packageId: number;
  amountInCents: number;
  currency: WompiCurrency;
  customerInfo: WompiCustomerInfo;
  description: string;
  redirectUrl?: string;
  expiresAt?: Date;
  collectShipping?: boolean;
  acceptanceToken: string;
  acceptPersonalAuth: string;
}

export interface ConfirmTransactionDto {
  transactionId: string;
  paymentSourceId?: string;
  customerEmail?: string;
  acceptanceToken?: string;
}

export interface RefundTransactionDto {
  transactionId: string;
  amountInCents?: number;
  reason?: string;
}

// DTOs para responses
export interface WompiTransactionResponse {
  id: string;
  amountInCents: number;
  currency: WompiCurrency;
  customerEmail: string;
  paymentMethod: WompiPaymentMethod;
  reference: string;
  status: WompiTransactionStatus;
  createdAt: string;
  finalizedAt?: string;
  paymentLinkId?: string;
  redirectUrl?: string;
  paymentSourceId?: string;
  paymentMethodType?: string;
  taxes?: any[];
  shippingAddress?: WompiShippingAddress;
}

export interface WompiPaymentLinkResponse {
  id: string;
  name: string;
  description: string;
  singleUse: boolean;
  collectShipping: boolean;
  currency: WompiCurrency;
  amountInCents: number;
  expiresAt?: string;
  permalink: string;
  createdAt: string;
}

export interface WompiWebhookEvent {
  event: WompiEventType;
  data: {
    transaction: WompiTransactionResponse;
  };
  sentAt: string;
  timestamp: number;
  signature: {
    properties: string[];
    checksum: string;
  };
}

export interface PaymentResponseDto {
  success: boolean;
  transactionId?: string;
  paymentLinkId?: string;
  status: WompiTransactionStatus;
  amountInCents: number;
  amount?: number;
  currency: WompiCurrency;
  reference: string;
  redirectUrl?: string;
  permalink?: string;
  purchaseId: number;
  message?: string;
  validationErrors?: any;
}

export interface RefundResponseDto {
  success: boolean;
  refundId?: string;
  transactionId: string;
  amountInCents: number;
  status: string;
  message?: string;
}

// DTOs para consultas
export interface PaymentHistoryFilterDto {
  userId?: number;
  status?: WompiTransactionStatus;
  paymentMethod?: WompiPaymentMethod;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface PaymentStatsDto {
  totalTransactions: number;
  approvedTransactions: number;
  declinedTransactions: number;
  totalAmountInCents: number;
  currency: WompiCurrency;
  successRate: number;
  period: {
    startDate?: Date;
    endDate?: Date;
  };
}

// Interfaces para validación
export interface WompiValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface WompiAmountValidation {
  isValid: boolean;
  minAmount: number;
  maxAmount: number;
  error?: string;
}

// Interface para configuración de entorno
export interface WompiEnvironmentConfig {
  publicKey: string;
  privateKey: string;
  webhookSecret: string;
  environment: 'sandbox' | 'production';
  baseUrl: string;
}

// Tipos para métodos de pago específicos
export interface WompiCardInfo {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}

export interface WompiPSEInfo {
  userType: 'NATURAL' | 'JURIDICA';
  userLegalIdType: 'CC' | 'CE' | 'NIT';
  userLegalId: string;
  financialInstitutionCode: string;
}

export interface WompiNequiInfo {
  phoneNumber: string;
}

// Interface para manejo de errores
export interface WompiError {
  type: string;
  code: string;
  message: string;
  reason?: string;
  payment_method?: string;
}

export interface WompiErrorResponse {
  error: WompiError;
}

// Constantes para configuración
export const WOMPI_CONSTANTS = {
  SANDBOX_URL: 'https://sandbox.wompi.co/v1',
  PRODUCTION_URL: 'https://production.wompi.co/v1',
  MIN_AMOUNT_COP: 100, // $1 COP
  MAX_AMOUNT_COP: 200000000, // $500,000 COP
  MIN_AMOUNT_USD: 1, // $0.01 USD
  MAX_AMOUNT_USD: 15000, // $150 USD
  SUPPORTED_CURRENCIES: [WompiCurrency.COP, WompiCurrency.USD],
  WEBHOOK_TOLERANCE_SECONDS: 300, // 5 minutos
  DEFAULT_EXPIRATION_HOURS: 24
} as const;