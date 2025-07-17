/**
 * DTOs para validación de pagos con Wompi
 * Usando class-validator para validaciones robustas
 */

import {
  IsString,
  IsNumber,
  IsEmail,
  IsOptional,
  IsEnum,
  IsPositive,
  IsInt,
  Min,
  Max,
  Length,
  Matches,
  IsUrl,
  IsDateString,
  ValidateNested,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  IsObject,
  IsNotEmpty
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { WompiCurrency, WompiPaymentMethod, WompiTransactionStatus } from '../payment.interface';

/**
 * DTO para información del cliente
 */
export class CustomerInfoDto {
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email!: string;

  @IsString({ message: 'El nombre completo es requerido' })
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
  fullName!: string;

  @IsOptional()
  @IsString({ message: 'El número de teléfono debe ser una cadena' })
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Formato de teléfono inválido' })
  phoneNumber?: string;

  @IsOptional()
  @IsString({ message: 'El tipo de documento debe ser una cadena' })
  @IsEnum(['CC', 'CE', 'NIT', 'PP'], { message: 'Tipo de documento inválido' })
  documentType?: string;

  @IsOptional()
  @IsString({ message: 'El número de documento debe ser una cadena' })
  @Length(5, 20, { message: 'El documento debe tener entre 5 y 20 caracteres' })
  documentNumber?: string;
}

/**
 * DTO para dirección de envío
 */
export class ShippingAddressDto {
  @IsString({ message: 'La dirección es requerida' })
  @Length(5, 200, { message: 'La dirección debe tener entre 5 y 200 caracteres' })
  addressLine!: string;

  @IsString({ message: 'La ciudad es requerida' })
  @Length(2, 50, { message: 'La ciudad debe tener entre 2 y 50 caracteres' })
  city!: string;

  @IsOptional()
  @IsString({ message: 'El estado/departamento debe ser una cadena' })
  @Length(2, 50, { message: 'El estado debe tener entre 2 y 50 caracteres' })
  state?: string;

  @IsString({ message: 'El país es requerido' })
  @Length(2, 3, { message: 'Código de país inválido' })
  country!: string;

  @IsOptional()
  @IsString({ message: 'El código postal debe ser una cadena' })
  @Length(3, 10, { message: 'El código postal debe tener entre 3 y 10 caracteres' })
  postalCode?: string;
}

/**
 * DTO para URLs de redirección
 */
export class RedirectUrlsDto {
  @IsUrl({}, { message: 'URL de éxito inválida' })
  success!: string;

  @IsUrl({}, { message: 'URL de rechazo inválida' })
  decline!: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL de cancelación inválida' })
  cancel?: string;
}

/**
 * DTO para crear una transacción
 */
export class CreateTransactionDto {
  @IsInt({ message: 'El ID de compra debe ser un número entero' })
  @IsPositive({ message: 'El ID de compra debe ser positivo' })
  purchaseId!: number;

  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsPositive({ message: 'El monto debe ser positivo' })
  @Min(1000, { message: 'El monto mínimo es $1,000 COP' })
  @Max(50000000, { message: 'El monto máximo es $50,000,000 COP' })
  @Transform(({ value }) => Math.round(value * 100) / 100) // Redondear a 2 decimales
  amount!: number;

  @IsEnum(WompiCurrency, { message: 'Moneda no soportada' })
  currency!: WompiCurrency;

  @IsEnum(WompiPaymentMethod, { message: 'Método de pago no soportado' })
  paymentMethod!: WompiPaymentMethod;

  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customerInfo!: CustomerInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena' })
  @Length(1, 255, { message: 'La descripción debe tener entre 1 y 255 caracteres' })
  description?: string;

  @IsOptional()
  @IsObject({ message: 'Los metadatos deben ser un objeto' })
  metadata?: Record<string, any>;

  @IsString({ message: 'El token de aceptación debe ser una cadena' })
  @IsNotEmpty({ message: 'El token de aceptación es obligatorio' })
  acceptanceToken!: string;

  @IsString({ message: 'El token de autorización de datos personales debe ser una cadena' })
  @IsNotEmpty({ message: 'El token de autorización de datos personales es obligatorio' })
  acceptPersonalAuth!: string;
}

/**
 * DTO para crear un enlace de pago
 */
export class CreatePaymentLinkDto {
  @IsInt({ message: 'El ID de compra debe ser un número entero' })
  @IsPositive({ message: 'El ID de compra debe ser positivo' })
  purchaseId!: number;

  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsPositive({ message: 'El monto debe ser positivo' })
  @Min(1000, { message: 'El monto mínimo es $1,000 COP' })
  @Max(50000000, { message: 'El monto máximo es $50,000,000 COP' })
  @Transform(({ value }) => Math.round(value * 100) / 100)
  amount!: number;

  @IsEnum(WompiCurrency, { message: 'Moneda no soportada' })
  currency!: WompiCurrency;

  @IsString({ message: 'La descripción es requerida' })
  @Length(5, 255, { message: 'La descripción debe tener entre 5 y 255 caracteres' })
  description!: string;

  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customerInfo!: CustomerInfoDto;

  @ValidateNested()
  @Type(() => RedirectUrlsDto)
  redirectUrls!: RedirectUrlsDto;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de expiración inválida' })
  expiresAt?: string;

  @IsOptional()
  @IsArray({ message: 'Los métodos de pago deben ser un array' })
  @ArrayMinSize(1, { message: 'Debe especificar al menos un método de pago' })
  @IsEnum(WompiPaymentMethod, { each: true, message: 'Método de pago inválido' })
  paymentMethods?: WompiPaymentMethod[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;

  @IsOptional()
  @IsObject({ message: 'Los metadatos deben ser un objeto' })
  metadata?: Record<string, any>;

  @IsString({ message: 'El token de aceptación debe ser una cadena' })
  @IsNotEmpty({ message: 'El token de aceptación es obligatorio' })
  acceptanceToken!: string;

  @IsString({ message: 'El token de autorización de datos personales debe ser una cadena' })
  @IsNotEmpty({ message: 'El token de autorización de datos personales es obligatorio' })
  acceptPersonalAuth!: string;
}

/**
 * DTO para confirmar una transacción
 */
export class ConfirmTransactionDto {
  @IsOptional()
  @IsString({ message: 'El token de la fuente de pago debe ser una cadena' })
  paymentSourceToken?: string;

  @IsOptional()
  @IsObject({ message: 'La información de la fuente de pago debe ser un objeto' })
  paymentSourceInfo?: Record<string, any>;

  @IsOptional()
  @IsString({ message: 'El código de verificación debe ser una cadena' })
  @Length(3, 10, { message: 'El código de verificación debe tener entre 3 y 10 caracteres' })
  verificationCode?: string;
}

/**
 * DTO para crear un reembolso
 */
export class CreateRefundDto {
  @IsString({ message: 'El ID de transacción es requerido' })
  @Length(5, 50, { message: 'ID de transacción inválido' })
  transactionId!: string;

  @IsOptional()
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsPositive({ message: 'El monto debe ser positivo' })
  @Min(1000, { message: 'El monto mínimo de reembolso es $1,000 COP' })
  @Transform(({ value }) => Math.round(value * 100) / 100)
  amount?: number;

  @IsString({ message: 'La razón del reembolso es requerida' })
  @Length(5, 255, { message: 'La razón debe tener entre 5 y 255 caracteres' })
  reason!: string;

  @IsOptional()
  @IsObject({ message: 'Los metadatos deben ser un objeto' })
  metadata?: Record<string, any>;
}

/**
 * DTO para filtros de historial de pagos
 */
export class PaymentHistoryFiltersDto {
  @IsOptional()
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser mayor a 0' })
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number = 1;

  @IsOptional()
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser mayor a 0' })
  @Max(100, { message: 'El límite máximo es 100' })
  @Transform(({ value }) => parseInt(value) || 10)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(WompiTransactionStatus, { message: 'Estado de transacción inválido' })
  status?: WompiTransactionStatus;

  @IsOptional()
  @IsEnum(WompiPaymentMethod, { message: 'Método de pago inválido' })
  paymentMethod?: WompiPaymentMethod;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de inicio inválida' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de fin inválida' })
  endDate?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El monto mínimo debe ser un número' })
  @IsPositive({ message: 'El monto mínimo debe ser positivo' })
  @Transform(({ value }) => parseFloat(value))
  minAmount?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El monto máximo debe ser un número' })
  @IsPositive({ message: 'El monto máximo debe ser positivo' })
  @Transform(({ value }) => parseFloat(value))
  maxAmount?: number;

  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser una cadena' })
  @Length(1, 100, { message: 'El término de búsqueda debe tener entre 1 y 100 caracteres' })
  searchTerm?: string;
}

/**
 * DTO para actualizar estado de transacción (solo admin)
 */
export class UpdateTransactionStatusDto {
  @IsEnum(WompiTransactionStatus, { message: 'Estado de transacción inválido' })
  status!: WompiTransactionStatus;

  @IsOptional()
  @IsString({ message: 'La razón debe ser una cadena' })
  @Length(5, 255, { message: 'La razón debe tener entre 5 y 255 caracteres' })
  reason?: string;

  @IsOptional()
  @IsObject({ message: 'Los metadatos deben ser un objeto' })
  metadata?: Record<string, any>;
}

/**
 * DTO para estadísticas de pagos
 */
export class PaymentStatisticsFiltersDto {
  @IsOptional()
  @IsDateString({}, { message: 'Fecha de inicio inválida' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de fin inválida' })
  endDate?: string;

  @IsOptional()
  @IsEnum(WompiPaymentMethod, { message: 'Método de pago inválido' })
  paymentMethod?: WompiPaymentMethod;

  @IsOptional()
  @IsEnum(WompiCurrency, { message: 'Moneda inválida' })
  currency?: WompiCurrency;

  @IsOptional()
  @IsBoolean({ message: 'El agrupamiento debe ser un booleano' })
  @Transform(({ value }) => value === 'true' || value === true)
  groupByDay?: boolean = false;

  @IsOptional()
  @IsBoolean({ message: 'El agrupamiento debe ser un booleano' })
  @Transform(({ value }) => value === 'true' || value === true)
  groupByMethod?: boolean = false;
}

/**
 * DTO para parámetros de ID
 */
export class TransactionIdParamDto {
  @IsString({ message: 'El ID de transacción es requerido' })
  @Length(5, 50, { message: 'ID de transacción inválido' })
  id!: string;
}

/**
 * DTO para parámetros de estado
 */
export class StatusParamDto {
  @IsEnum(WompiTransactionStatus, { message: 'Estado de transacción inválido' })
  status!: WompiTransactionStatus;
}

/**
 * DTO para webhook de Wompi
 */
export class WompiWebhookDto {
  @IsString({ message: 'El evento es requerido' })
  event!: string;

  @IsObject({ message: 'Los datos deben ser un objeto' })
  data!: Record<string, any>;

  @IsOptional()
  @IsDateString({}, { message: 'Timestamp inválido' })
  sent_at?: string;

  @IsOptional()
  @IsString({ message: 'El ID del evento debe ser una cadena' })
  event_id?: string;

  @IsOptional()
  @IsString({ message: 'La versión debe ser una cadena' })
  api_version?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El timestamp debe ser un número' })
  timestamp?: number;

  @IsOptional()
  @IsObject({ message: 'La firma debe ser un objeto' })
  signature?: {
    checksum: string;
    properties: string[];
  };

  @IsOptional()
  @IsString({ message: 'El ambiente debe ser una cadena' })
  environment?: string;
}

/**
 * DTO para validar headers de webhook
 */
export class WebhookHeadersDto {
  @IsString({ message: 'La firma es requerida' })
  'x-signature': string;

  @IsString({ message: 'El timestamp es requerido' })
  @Matches(/^\d+$/, { message: 'Timestamp inválido' })
  'x-timestamp': string;

  @IsOptional()
  @IsString({ message: 'El ID del evento debe ser una cadena' })
  'x-event-id'?: string;
}

/**
 * DTO para crear una transacción de servicio individual
 */
export class CreateServiceTransactionDto {
  @IsInt({ message: 'El ID del servicio debe ser un número entero' })
  @IsPositive({ message: 'El ID del servicio debe ser positivo' })
  serviceId!: number;

  @IsInt({ message: 'La cantidad de sesiones debe ser un número entero' })
  @IsPositive({ message: 'La cantidad de sesiones debe ser positiva' })
  @Min(1, { message: 'Debe especificar al menos 1 sesión' })
  @Max(50, { message: 'Máximo 50 sesiones por compra' })
  sessionsQuantity!: number;

  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsPositive({ message: 'El monto debe ser positivo' })
  @Min(1000, { message: 'El monto mínimo es $1,000 COP' })
  @Max(50000000, { message: 'El monto máximo es $50,000,000 COP' })
  @Transform(({ value }) => Math.round(value * 100) / 100)
  amount!: number;

  @IsEnum(WompiCurrency, { message: 'Moneda no soportada' })
  currency!: WompiCurrency;

  @IsEnum(WompiPaymentMethod, { message: 'Método de pago no soportado' })
  paymentMethod!: WompiPaymentMethod;

  @IsOptional()
  @IsNumber({}, { message: 'El porcentaje de descuento debe ser un número' })
  @Min(0, { message: 'El descuento no puede ser negativo' })
  @Max(100, { message: 'El descuento no puede ser mayor al 100%' })
  discountPercentage?: number;

  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customerInfo!: CustomerInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena' })
  @Length(1, 255, { message: 'La descripción debe tener entre 1 y 255 caracteres' })
  description?: string;

  @IsOptional()
  @IsObject({ message: 'Los metadatos deben ser un objeto' })
  metadata?: Record<string, any>;

  @IsString({ message: 'El token de aceptación debe ser una cadena' })
  @IsNotEmpty({ message: 'El token de aceptación es obligatorio' })
  acceptanceToken!: string;

  @IsString({ message: 'El token de autorización de datos personales debe ser una cadena' })
  @IsNotEmpty({ message: 'El token de autorización de datos personales es obligatorio' })
  acceptPersonalAuth!: string;
}

/**
 * DTO para crear un enlace de pago de servicio individual
 */
export class CreateServicePaymentLinkDto {
  @IsInt({ message: 'El ID del servicio debe ser un número entero' })
  @IsPositive({ message: 'El ID del servicio debe ser positivo' })
  serviceId!: number;

  @IsInt({ message: 'La cantidad de sesiones debe ser un número entero' })
  @IsPositive({ message: 'La cantidad de sesiones debe ser positiva' })
  @Min(1, { message: 'Debe especificar al menos 1 sesión' })
  @Max(50, { message: 'Máximo 50 sesiones por compra' })
  sessionsQuantity!: number;

  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsPositive({ message: 'El monto debe ser positivo' })
  @Min(1000, { message: 'El monto mínimo es $1,000 COP' })
  @Max(50000000, { message: 'El monto máximo es $50,000,000 COP' })
  @Transform(({ value }) => Math.round(value * 100) / 100)
  amount!: number;

  @IsEnum(WompiCurrency, { message: 'Moneda no soportada' })
  currency!: WompiCurrency;

  @IsOptional()
  @IsNumber({}, { message: 'El porcentaje de descuento debe ser un número' })
  @Min(0, { message: 'El descuento no puede ser negativo' })
  @Max(100, { message: 'El descuento no puede ser mayor al 100%' })
  discountPercentage?: number;

  @IsString({ message: 'La descripción es requerida' })
  @Length(5, 255, { message: 'La descripción debe tener entre 5 y 255 caracteres' })
  description!: string;

  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customerInfo!: CustomerInfoDto;

  @ValidateNested()
  @Type(() => RedirectUrlsDto)
  redirectUrls!: RedirectUrlsDto;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de expiración inválida' })
  expiresAt?: string;

  @IsOptional()
  @IsArray({ message: 'Los métodos de pago deben ser un array' })
  @ArrayMinSize(1, { message: 'Debe especificar al menos un método de pago' })
  @IsEnum(WompiPaymentMethod, { each: true, message: 'Método de pago inválido' })
  paymentMethods?: WompiPaymentMethod[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;

  @IsOptional()
  @IsObject({ message: 'Los metadatos deben ser un objeto' })
  metadata?: Record<string, any>;

  @IsString({ message: 'El token de aceptación debe ser una cadena' })
  @IsNotEmpty({ message: 'El token de aceptación es obligatorio' })
  acceptanceToken!: string;

  @IsString({ message: 'El token de autorización de datos personales debe ser una cadena' })
  @IsNotEmpty({ message: 'El token de autorización de datos personales es obligatorio' })
  acceptPersonalAuth!: string;
}