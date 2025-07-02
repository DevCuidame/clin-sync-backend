import { WompiCurrency, WompiPaymentMethod } from '../../payment/payment.interface';
import { getPaymentMethodLimits, validateWompiCurrency } from '../../../config/wompi.config';
import { CreateCashPurchaseDto } from '../purchase.dto';

export interface CashPurchaseValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valida los datos de una compra en efectivo
 */
export function validateCashPurchase(data: CreateCashPurchaseDto, currency: WompiCurrency = WompiCurrency.COP): CashPurchaseValidationResult {
  const errors: string[] = [];

  // Validar campos requeridos
  if (!data.package_id || data.package_id <= 0) {
    errors.push('ID del paquete es requerido y debe ser mayor a 0');
  }

  if (!data.amount_paid || data.amount_paid <= 0) {
    errors.push('El monto pagado es requerido y debe ser mayor a 0');
  }

  // Validar información del cliente
  if (!data.customer_info) {
    errors.push('Información del cliente es requerida');
  } else {
    if (!data.customer_info.email || !isValidEmail(data.customer_info.email)) {
      errors.push('Email del cliente es requerido y debe ser válido');
    }

    if (!data.customer_info.full_name || data.customer_info.full_name.trim().length < 2) {
      errors.push('Nombre completo del cliente es requerido (mínimo 2 caracteres)');
    }

    if (data.customer_info.phone_number && !isValidPhoneNumber(data.customer_info.phone_number)) {
      errors.push('Número de teléfono debe tener un formato válido');
    }
  }

  // Validar moneda
  const currencyValidation = validateWompiCurrency(currency);
  if (!currencyValidation.isValid) {
    errors.push(...currencyValidation.errors);
  }

  // Validar límites de monto para pagos en efectivo
  if (data.amount_paid) {
    const limits = getPaymentMethodLimits(WompiPaymentMethod.CASH, currency);
    
    if (data.amount_paid < limits.minAmount) {
      errors.push(`El monto mínimo para pagos en efectivo es ${limits.minAmount} ${currency}`);
    }

    if (data.amount_paid > limits.maxAmount) {
      errors.push(`El monto máximo para pagos en efectivo es ${limits.maxAmount} ${currency}`);
    }
  }

  // Validar detalles de pago si están presentes
  if (data.payment_details) {
    if (data.payment_details.reference && data.payment_details.reference.length > 100) {
      errors.push('La referencia de pago no puede exceder 100 caracteres');
    }

    if (data.payment_details.notes && data.payment_details.notes.length > 500) {
      errors.push('Las notas de pago no pueden exceder 500 caracteres');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida formato de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida formato de número de teléfono (formato colombiano e internacional)
 */
function isValidPhoneNumber(phone: string): boolean {
  // Remover espacios y caracteres especiales
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  
  // Validar que solo contenga números
  if (!/^\d+$/.test(cleanPhone)) {
    return false;
  }

  // Validar longitud (7-15 dígitos)
  if (cleanPhone.length < 7 || cleanPhone.length > 15) {
    return false;
  }

  return true;
}

/**
 * Sanitiza los datos de entrada para una compra en efectivo
 */
export function sanitizeCashPurchaseData(data: CreateCashPurchaseDto): CreateCashPurchaseDto {
  return {
    ...data,
    customer_info: {
      email: data.customer_info.email.toLowerCase().trim(),
      full_name: data.customer_info.full_name.trim(),
      phone_number: data.customer_info.phone_number?.replace(/[\s\-\(\)]/g, '') || undefined
    },
    payment_details: data.payment_details ? {
      notes: data.payment_details.notes?.trim() || undefined,
      reference: data.payment_details.reference?.trim() || undefined
    } : undefined
  };
}