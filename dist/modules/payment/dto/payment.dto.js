"use strict";
/**
 * DTOs para validación de pagos con Wompi
 * Usando class-validator para validaciones robustas
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookHeadersDto = exports.WompiWebhookDto = exports.StatusParamDto = exports.TransactionIdParamDto = exports.PaymentStatisticsFiltersDto = exports.UpdateTransactionStatusDto = exports.PaymentHistoryFiltersDto = exports.CreateRefundDto = exports.ConfirmTransactionDto = exports.CreatePaymentLinkDto = exports.CreateTransactionDto = exports.RedirectUrlsDto = exports.ShippingAddressDto = exports.CustomerInfoDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const payment_interface_1 = require("../payment.interface");
/**
 * DTO para información del cliente
 */
class CustomerInfoDto {
    email;
    fullName;
    phoneNumber;
    documentType;
    documentNumber;
}
exports.CustomerInfoDto = CustomerInfoDto;
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'El email debe tener un formato válido' }),
    __metadata("design:type", String)
], CustomerInfoDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El nombre completo es requerido' }),
    (0, class_validator_1.Length)(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' }),
    __metadata("design:type", String)
], CustomerInfoDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El número de teléfono debe ser una cadena' }),
    (0, class_validator_1.Matches)(/^\+?[1-9]\d{1,14}$/, { message: 'Formato de teléfono inválido' }),
    __metadata("design:type", String)
], CustomerInfoDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El tipo de documento debe ser una cadena' }),
    (0, class_validator_1.IsEnum)(['CC', 'CE', 'NIT', 'PP'], { message: 'Tipo de documento inválido' }),
    __metadata("design:type", String)
], CustomerInfoDto.prototype, "documentType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El número de documento debe ser una cadena' }),
    (0, class_validator_1.Length)(5, 20, { message: 'El documento debe tener entre 5 y 20 caracteres' }),
    __metadata("design:type", String)
], CustomerInfoDto.prototype, "documentNumber", void 0);
/**
 * DTO para dirección de envío
 */
class ShippingAddressDto {
    addressLine;
    city;
    state;
    country;
    postalCode;
}
exports.ShippingAddressDto = ShippingAddressDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'La dirección es requerida' }),
    (0, class_validator_1.Length)(5, 200, { message: 'La dirección debe tener entre 5 y 200 caracteres' }),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "addressLine", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La ciudad es requerida' }),
    (0, class_validator_1.Length)(2, 50, { message: 'La ciudad debe tener entre 2 y 50 caracteres' }),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El estado/departamento debe ser una cadena' }),
    (0, class_validator_1.Length)(2, 50, { message: 'El estado debe tener entre 2 y 50 caracteres' }),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El país es requerido' }),
    (0, class_validator_1.Length)(2, 3, { message: 'Código de país inválido' }),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El código postal debe ser una cadena' }),
    (0, class_validator_1.Length)(3, 10, { message: 'El código postal debe tener entre 3 y 10 caracteres' }),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "postalCode", void 0);
/**
 * DTO para URLs de redirección
 */
class RedirectUrlsDto {
    success;
    decline;
    cancel;
}
exports.RedirectUrlsDto = RedirectUrlsDto;
__decorate([
    (0, class_validator_1.IsUrl)({}, { message: 'URL de éxito inválida' }),
    __metadata("design:type", String)
], RedirectUrlsDto.prototype, "success", void 0);
__decorate([
    (0, class_validator_1.IsUrl)({}, { message: 'URL de rechazo inválida' }),
    __metadata("design:type", String)
], RedirectUrlsDto.prototype, "decline", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({}, { message: 'URL de cancelación inválida' }),
    __metadata("design:type", String)
], RedirectUrlsDto.prototype, "cancel", void 0);
/**
 * DTO para crear una transacción
 */
class CreateTransactionDto {
    purchaseId;
    amount;
    currency;
    paymentMethod;
    customerInfo;
    shippingAddress;
    description;
    metadata;
    acceptanceToken;
    acceptPersonalAuth;
}
exports.CreateTransactionDto = CreateTransactionDto;
__decorate([
    (0, class_validator_1.IsInt)({ message: 'El ID de compra debe ser un número entero' }),
    (0, class_validator_1.IsPositive)({ message: 'El ID de compra debe ser positivo' }),
    __metadata("design:type", Number)
], CreateTransactionDto.prototype, "purchaseId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'El monto debe ser un número' }),
    (0, class_validator_1.IsPositive)({ message: 'El monto debe ser positivo' }),
    (0, class_validator_1.Min)(1000, { message: 'El monto mínimo es $1,000 COP' }),
    (0, class_validator_1.Max)(50000000, { message: 'El monto máximo es $50,000,000 COP' }),
    (0, class_transformer_1.Transform)(({ value }) => Math.round(value * 100) / 100) // Redondear a 2 decimales
    ,
    __metadata("design:type", Number)
], CreateTransactionDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(payment_interface_1.WompiCurrency, { message: 'Moneda no soportada' }),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(payment_interface_1.WompiPaymentMethod, { message: 'Método de pago no soportado' }),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CustomerInfoDto),
    __metadata("design:type", CustomerInfoDto)
], CreateTransactionDto.prototype, "customerInfo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ShippingAddressDto),
    __metadata("design:type", ShippingAddressDto)
], CreateTransactionDto.prototype, "shippingAddress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La descripción debe ser una cadena' }),
    (0, class_validator_1.Length)(1, 255, { message: 'La descripción debe tener entre 1 y 255 caracteres' }),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Los metadatos deben ser un objeto' }),
    __metadata("design:type", Object)
], CreateTransactionDto.prototype, "metadata", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El token de aceptación debe ser una cadena' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El token de aceptación es obligatorio' }),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "acceptanceToken", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El token de autorización de datos personales debe ser una cadena' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El token de autorización de datos personales es obligatorio' }),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "acceptPersonalAuth", void 0);
/**
 * DTO para crear un enlace de pago
 */
class CreatePaymentLinkDto {
    purchaseId;
    amount;
    currency;
    description;
    customerInfo;
    redirectUrls;
    expiresAt;
    paymentMethods;
    shippingAddress;
    metadata;
    acceptanceToken;
    acceptPersonalAuth;
}
exports.CreatePaymentLinkDto = CreatePaymentLinkDto;
__decorate([
    (0, class_validator_1.IsInt)({ message: 'El ID de compra debe ser un número entero' }),
    (0, class_validator_1.IsPositive)({ message: 'El ID de compra debe ser positivo' }),
    __metadata("design:type", Number)
], CreatePaymentLinkDto.prototype, "purchaseId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'El monto debe ser un número' }),
    (0, class_validator_1.IsPositive)({ message: 'El monto debe ser positivo' }),
    (0, class_validator_1.Min)(1000, { message: 'El monto mínimo es $1,000 COP' }),
    (0, class_validator_1.Max)(50000000, { message: 'El monto máximo es $50,000,000 COP' }),
    (0, class_transformer_1.Transform)(({ value }) => Math.round(value * 100) / 100),
    __metadata("design:type", Number)
], CreatePaymentLinkDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(payment_interface_1.WompiCurrency, { message: 'Moneda no soportada' }),
    __metadata("design:type", String)
], CreatePaymentLinkDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La descripción es requerida' }),
    (0, class_validator_1.Length)(5, 255, { message: 'La descripción debe tener entre 5 y 255 caracteres' }),
    __metadata("design:type", String)
], CreatePaymentLinkDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CustomerInfoDto),
    __metadata("design:type", CustomerInfoDto)
], CreatePaymentLinkDto.prototype, "customerInfo", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RedirectUrlsDto),
    __metadata("design:type", RedirectUrlsDto)
], CreatePaymentLinkDto.prototype, "redirectUrls", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Fecha de expiración inválida' }),
    __metadata("design:type", String)
], CreatePaymentLinkDto.prototype, "expiresAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Los métodos de pago deben ser un array' }),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Debe especificar al menos un método de pago' }),
    (0, class_validator_1.IsEnum)(payment_interface_1.WompiPaymentMethod, { each: true, message: 'Método de pago inválido' }),
    __metadata("design:type", Array)
], CreatePaymentLinkDto.prototype, "paymentMethods", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ShippingAddressDto),
    __metadata("design:type", ShippingAddressDto)
], CreatePaymentLinkDto.prototype, "shippingAddress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Los metadatos deben ser un objeto' }),
    __metadata("design:type", Object)
], CreatePaymentLinkDto.prototype, "metadata", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El token de aceptación debe ser una cadena' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El token de aceptación es obligatorio' }),
    __metadata("design:type", String)
], CreatePaymentLinkDto.prototype, "acceptanceToken", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El token de autorización de datos personales debe ser una cadena' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El token de autorización de datos personales es obligatorio' }),
    __metadata("design:type", String)
], CreatePaymentLinkDto.prototype, "acceptPersonalAuth", void 0);
/**
 * DTO para confirmar una transacción
 */
class ConfirmTransactionDto {
    paymentSourceToken;
    paymentSourceInfo;
    verificationCode;
}
exports.ConfirmTransactionDto = ConfirmTransactionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El token de la fuente de pago debe ser una cadena' }),
    __metadata("design:type", String)
], ConfirmTransactionDto.prototype, "paymentSourceToken", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'La información de la fuente de pago debe ser un objeto' }),
    __metadata("design:type", Object)
], ConfirmTransactionDto.prototype, "paymentSourceInfo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El código de verificación debe ser una cadena' }),
    (0, class_validator_1.Length)(3, 10, { message: 'El código de verificación debe tener entre 3 y 10 caracteres' }),
    __metadata("design:type", String)
], ConfirmTransactionDto.prototype, "verificationCode", void 0);
/**
 * DTO para crear un reembolso
 */
class CreateRefundDto {
    transactionId;
    amount;
    reason;
    metadata;
}
exports.CreateRefundDto = CreateRefundDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'El ID de transacción es requerido' }),
    (0, class_validator_1.Length)(5, 50, { message: 'ID de transacción inválido' }),
    __metadata("design:type", String)
], CreateRefundDto.prototype, "transactionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'El monto debe ser un número' }),
    (0, class_validator_1.IsPositive)({ message: 'El monto debe ser positivo' }),
    (0, class_validator_1.Min)(1000, { message: 'El monto mínimo de reembolso es $1,000 COP' }),
    (0, class_transformer_1.Transform)(({ value }) => Math.round(value * 100) / 100),
    __metadata("design:type", Number)
], CreateRefundDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La razón del reembolso es requerida' }),
    (0, class_validator_1.Length)(5, 255, { message: 'La razón debe tener entre 5 y 255 caracteres' }),
    __metadata("design:type", String)
], CreateRefundDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Los metadatos deben ser un objeto' }),
    __metadata("design:type", Object)
], CreateRefundDto.prototype, "metadata", void 0);
/**
 * DTO para filtros de historial de pagos
 */
class PaymentHistoryFiltersDto {
    page = 1;
    limit = 10;
    status;
    paymentMethod;
    startDate;
    endDate;
    minAmount;
    maxAmount;
    searchTerm;
}
exports.PaymentHistoryFiltersDto = PaymentHistoryFiltersDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'La página debe ser un número entero' }),
    (0, class_validator_1.Min)(1, { message: 'La página debe ser mayor a 0' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value) || 1),
    __metadata("design:type", Number)
], PaymentHistoryFiltersDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'El límite debe ser un número entero' }),
    (0, class_validator_1.Min)(1, { message: 'El límite debe ser mayor a 0' }),
    (0, class_validator_1.Max)(100, { message: 'El límite máximo es 100' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value) || 10),
    __metadata("design:type", Number)
], PaymentHistoryFiltersDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(payment_interface_1.WompiTransactionStatus, { message: 'Estado de transacción inválido' }),
    __metadata("design:type", String)
], PaymentHistoryFiltersDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(payment_interface_1.WompiPaymentMethod, { message: 'Método de pago inválido' }),
    __metadata("design:type", String)
], PaymentHistoryFiltersDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Fecha de inicio inválida' }),
    __metadata("design:type", String)
], PaymentHistoryFiltersDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Fecha de fin inválida' }),
    __metadata("design:type", String)
], PaymentHistoryFiltersDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'El monto mínimo debe ser un número' }),
    (0, class_validator_1.IsPositive)({ message: 'El monto mínimo debe ser positivo' }),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    __metadata("design:type", Number)
], PaymentHistoryFiltersDto.prototype, "minAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'El monto máximo debe ser un número' }),
    (0, class_validator_1.IsPositive)({ message: 'El monto máximo debe ser positivo' }),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    __metadata("design:type", Number)
], PaymentHistoryFiltersDto.prototype, "maxAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El término de búsqueda debe ser una cadena' }),
    (0, class_validator_1.Length)(1, 100, { message: 'El término de búsqueda debe tener entre 1 y 100 caracteres' }),
    __metadata("design:type", String)
], PaymentHistoryFiltersDto.prototype, "searchTerm", void 0);
/**
 * DTO para actualizar estado de transacción (solo admin)
 */
class UpdateTransactionStatusDto {
    status;
    reason;
    metadata;
}
exports.UpdateTransactionStatusDto = UpdateTransactionStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(payment_interface_1.WompiTransactionStatus, { message: 'Estado de transacción inválido' }),
    __metadata("design:type", String)
], UpdateTransactionStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La razón debe ser una cadena' }),
    (0, class_validator_1.Length)(5, 255, { message: 'La razón debe tener entre 5 y 255 caracteres' }),
    __metadata("design:type", String)
], UpdateTransactionStatusDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Los metadatos deben ser un objeto' }),
    __metadata("design:type", Object)
], UpdateTransactionStatusDto.prototype, "metadata", void 0);
/**
 * DTO para estadísticas de pagos
 */
class PaymentStatisticsFiltersDto {
    startDate;
    endDate;
    paymentMethod;
    currency;
    groupByDay = false;
    groupByMethod = false;
}
exports.PaymentStatisticsFiltersDto = PaymentStatisticsFiltersDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Fecha de inicio inválida' }),
    __metadata("design:type", String)
], PaymentStatisticsFiltersDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Fecha de fin inválida' }),
    __metadata("design:type", String)
], PaymentStatisticsFiltersDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(payment_interface_1.WompiPaymentMethod, { message: 'Método de pago inválido' }),
    __metadata("design:type", String)
], PaymentStatisticsFiltersDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(payment_interface_1.WompiCurrency, { message: 'Moneda inválida' }),
    __metadata("design:type", String)
], PaymentStatisticsFiltersDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'El agrupamiento debe ser un booleano' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], PaymentStatisticsFiltersDto.prototype, "groupByDay", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'El agrupamiento debe ser un booleano' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], PaymentStatisticsFiltersDto.prototype, "groupByMethod", void 0);
/**
 * DTO para parámetros de ID
 */
class TransactionIdParamDto {
    id;
}
exports.TransactionIdParamDto = TransactionIdParamDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'El ID de transacción es requerido' }),
    (0, class_validator_1.Length)(5, 50, { message: 'ID de transacción inválido' }),
    __metadata("design:type", String)
], TransactionIdParamDto.prototype, "id", void 0);
/**
 * DTO para parámetros de estado
 */
class StatusParamDto {
    status;
}
exports.StatusParamDto = StatusParamDto;
__decorate([
    (0, class_validator_1.IsEnum)(payment_interface_1.WompiTransactionStatus, { message: 'Estado de transacción inválido' }),
    __metadata("design:type", String)
], StatusParamDto.prototype, "status", void 0);
/**
 * DTO para webhook de Wompi
 */
class WompiWebhookDto {
    event;
    data;
    sent_at;
    event_id;
    api_version;
}
exports.WompiWebhookDto = WompiWebhookDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'El evento es requerido' }),
    __metadata("design:type", String)
], WompiWebhookDto.prototype, "event", void 0);
__decorate([
    (0, class_validator_1.IsObject)({ message: 'Los datos deben ser un objeto' }),
    __metadata("design:type", Object)
], WompiWebhookDto.prototype, "data", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Timestamp inválido' }),
    __metadata("design:type", String)
], WompiWebhookDto.prototype, "sent_at", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El ID del evento debe ser una cadena' }),
    __metadata("design:type", String)
], WompiWebhookDto.prototype, "event_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La versión debe ser una cadena' }),
    __metadata("design:type", String)
], WompiWebhookDto.prototype, "api_version", void 0);
/**
 * DTO para validar headers de webhook
 */
class WebhookHeadersDto {
    'x-signature';
    'x-timestamp';
    'x-event-id';
}
exports.WebhookHeadersDto = WebhookHeadersDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'La firma es requerida' }),
    __metadata("design:type", String)
], WebhookHeadersDto.prototype, "x-signature", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El timestamp es requerido' }),
    (0, class_validator_1.Matches)(/^\d+$/, { message: 'Timestamp inválido' }),
    __metadata("design:type", String)
], WebhookHeadersDto.prototype, "x-timestamp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El ID del evento debe ser una cadena' }),
    __metadata("design:type", String)
], WebhookHeadersDto.prototype, "x-event-id", void 0);
