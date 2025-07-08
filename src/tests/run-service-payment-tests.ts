// run-service-payment-tests.ts
// Script para ejecutar las pruebas del sistema de pagos de servicios
import { runServicePaymentTests, cleanupTestData } from './test-service-payment-system';

console.log('🚀 Ejecutando pruebas del sistema de pagos de servicios...');
console.log('📋 Asegúrate de que:');
console.log('   - El servidor esté ejecutándose en http://localhost:4000');
console.log('   - La base de datos esté configurada correctamente');
console.log('   - Existan servicios activos en la base de datos');
console.log('   - Wompi esté configurado (modo sandbox)');
console.log('');

// Ejecutar las pruebas
runServicePaymentTests()
  .then(() => {
    console.log('\n✅ Todas las pruebas de servicios completadas exitosamente!');
    console.log('\n📊 Resumen de pruebas ejecutadas:');
    console.log('   ✓ Registro de usuario de prueba');
    console.log('   ✓ Inicio de sesión');
    console.log('   ✓ Obtención de servicio de prueba');
    console.log('   ✓ Creación de transacción de servicio');
    console.log('   ✓ Creación de link de pago de servicio');
    console.log('   ✓ Verificación de estado de transacción');
    console.log('   ✓ Obtención de tokens de aceptación');
    
    return cleanupTestData();
  })
  .then(() => {
    console.log('\n🎉 Pruebas finalizadas correctamente!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error ejecutando las pruebas:', error);
    console.log('\n🔍 Posibles causas:');
    console.log('   - El servidor no está ejecutándose');
    console.log('   - Error de conexión a la base de datos');
    console.log('   - No existen servicios activos');
    console.log('   - Configuración incorrecta de Wompi');
    console.log('   - Error en las validaciones de datos');
    
    process.exit(1);
  });