/**
 * Script de diagnóstico para WompiService
 * Verifica si el servicio se puede instanciar correctamente
 */

import { WompiService } from './modules/payment/wompi.service';
import { PaymentTransactionService } from './modules/payment/payment-transaction.service';
import { AcceptanceTokensService } from './modules/payment/acceptance-tokens.service';
import { PaymentController } from './modules/payment/payment.controller';
import logger from './utils/logger';

async function debugWompiServices() {
  try {
    console.log('🔍 Iniciando diagnóstico de servicios de Wompi...');
    
    // Verificar variables de entorno
    console.log('📋 Verificando variables de entorno:');
    console.log('WOMPI_PUBLIC_KEY:', process.env.WOMPI_PUBLIC_KEY ? '✅ Configurada' : '❌ No configurada');
    console.log('WOMPI_PRIVATE_KEY:', process.env.WOMPI_PRIVATE_KEY ? '✅ Configurada' : '❌ No configurada');
    console.log('WOMPI_ENVIRONMENT:', process.env.WOMPI_ENVIRONMENT || 'sandbox (default)');
    
    // Intentar crear WompiService
    console.log('\n🔧 Intentando crear WompiService...');
    const wompiService = new WompiService();
    console.log('✅ WompiService creado exitosamente');
    
    // Intentar crear PaymentTransactionService
    console.log('\n🔧 Intentando crear PaymentTransactionService...');
    const paymentTransactionService = new PaymentTransactionService();
    console.log('✅ PaymentTransactionService creado exitosamente');
    
    // Intentar crear AcceptanceTokensService
    console.log('\n🔧 Intentando crear AcceptanceTokensService...');
    const acceptanceTokensService = new AcceptanceTokensService();
    console.log('✅ AcceptanceTokensService creado exitosamente');
    
    // Intentar crear PaymentController
    console.log('\n🔧 Intentando crear PaymentController...');
    const paymentController = new PaymentController(wompiService, paymentTransactionService, acceptanceTokensService);
    console.log('✅ PaymentController creado exitosamente');
    
    // Verificar que wompiService no sea undefined
    console.log('\n🔍 Verificando propiedades del PaymentController:');
    console.log('wompiService:', (paymentController as any).wompiService ? '✅ Definido' : '❌ Undefined');
    console.log('paymentTransactionService:', (paymentController as any).paymentTransactionService ? '✅ Definido' : '❌ Undefined');
    console.log('acceptanceTokensService:', (paymentController as any).acceptanceTokensService ? '✅ Definido' : '❌ Undefined');
    
    console.log('\n🎉 Todos los servicios se crearon correctamente!');
    
  } catch (error: any) {
    console.error('❌ Error durante el diagnóstico:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Ejecutar diagnóstico
debugWompiServices();