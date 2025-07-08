import { CreatePurchaseDto, CreateServicePurchaseDto } from './purchase.dto';
import { Package } from '../../models/package.model';
import { Service } from '../../models/service.model';

export interface PurchaseValidationResult {
  isValid: boolean;
  errors: string[];
}

export class PurchaseValidation {
  /**
   * Valida que solo se especifique package_id O service_id, no ambos
   */
  static validateExclusiveIds(packageId?: number, serviceId?: number): PurchaseValidationResult {
    const errors: string[] = [];
    
    // Verificar que se especifique al menos uno
    if (!packageId && !serviceId) {
      errors.push('Debe especificar package_id o service_id');
    }
    
    // Verificar que no se especifiquen ambos
    if (packageId && serviceId) {
      errors.push('No se puede especificar package_id y service_id al mismo tiempo');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida que el precio de la compra coincida con el precio del paquete
   */
  static validatePackagePrice(packageData: Package, amountPaid: number): PurchaseValidationResult {
    const errors: string[] = [];
    
    const packagePrice = Number(packageData.price);
    const discountedPrice = packageData.discount_percentage 
      ? packagePrice * (1 - packageData.discount_percentage / 100)
      : packagePrice;
    
    // Permitir una pequeña diferencia por redondeo (0.01)
    const tolerance = 0.01;
    const priceDifference = Math.abs(amountPaid - discountedPrice);
    
    if (priceDifference > tolerance) {
      errors.push(
        `El precio pagado (${amountPaid}) no coincide con el precio del paquete ` +
        `(${discountedPrice}${packageData.discount_percentage ? ` con descuento del ${packageData.discount_percentage}%` : ''})`
      );
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida que el precio de la compra coincida con el precio del servicio
   */
  static validateServicePrice(serviceData: Service, amountPaid: number, discountPercentage?: number): PurchaseValidationResult {
    const errors: string[] = [];
    
    const servicePrice = Number(serviceData.base_price);
    const discountedPrice = discountPercentage 
      ? servicePrice * (1 - discountPercentage / 100)
      : servicePrice;
    
    // Permitir una pequeña diferencia por redondeo (0.01)
    const tolerance = 0.01;
    const priceDifference = Math.abs(amountPaid - discountedPrice);
    
    if (priceDifference > tolerance) {
      errors.push(
        `El precio pagado (${amountPaid}) no coincide con el precio del servicio ` +
        `(${discountedPrice}${discountPercentage ? ` con descuento del ${discountPercentage}%` : ''})`
      );
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Aplica descuento a un precio base
   */
  static applyDiscount(basePrice: number, discountPercentage: number): number {
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error('El porcentaje de descuento debe estar entre 0 y 100');
    }
    
    return basePrice * (1 - discountPercentage / 100);
  }

  /**
   * Valida los datos de compra de paquete
   */
  static validatePurchaseData(purchaseData: CreatePurchaseDto, packageData: Package): PurchaseValidationResult {
    const errors: string[] = [];
    
    // Validar exclusividad de IDs
    const exclusiveValidation = this.validateExclusiveIds(purchaseData.package_id, undefined);
    if (!exclusiveValidation.isValid) {
      errors.push(...exclusiveValidation.errors);
    }
    
    // Validar precio del paquete
    const priceValidation = this.validatePackagePrice(packageData, purchaseData.amount_paid);
    if (!priceValidation.isValid) {
      errors.push(...priceValidation.errors);
    }
    
    // Validar que el paquete esté activo
    if (!packageData.is_active) {
      errors.push('El paquete no está disponible para compra');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida los datos de compra de servicio
   */
  static validateServicePurchaseData(
    purchaseData: CreateServicePurchaseDto, 
    serviceData: Service, 
    discountPercentage?: number
  ): PurchaseValidationResult {
    const errors: string[] = [];
    
    // Validar exclusividad de IDs
    const exclusiveValidation = this.validateExclusiveIds(undefined, purchaseData.service_id);
    if (!exclusiveValidation.isValid) {
      errors.push(...exclusiveValidation.errors);
    }
    
    // Validar precio del servicio
    const priceValidation = this.validateServicePrice(serviceData, purchaseData.amount_paid, discountPercentage);
    if (!priceValidation.isValid) {
      errors.push(...priceValidation.errors);
    }
    
    // Validar que el servicio esté activo
    if (!serviceData.is_active) {
      errors.push('El servicio no está disponible para compra');
    }
    
    // Validar cantidad de sesiones
    if (purchaseData.sessions_quantity && purchaseData.sessions_quantity < 1) {
      errors.push('La cantidad de sesiones debe ser mayor a 0');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}