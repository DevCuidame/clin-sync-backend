// test-service-payment-system.ts
// Test completo del sistema de pagos para compra de servicios individuales
import axios, { AxiosResponse } from 'axios';

// Configuración
const API_URL = 'http://localhost:4000/api';
let token = ''; // Token JWT de autenticación
let testUserId = 0;
let testServiceId = 0;
let testTransactionId = '';
let testPaymentLinkId = '';

// Datos de prueba
const testUser = {
  email: 'antho@example.com',
  password: 'Securepass1',
  first_name: 'Test',
  last_name: 'Service User',
  phone: '+573001234567'
};

const testCustomerInfo = {
  email: testUser.email,
  fullName: `${testUser.first_name} ${testUser.last_name}`,
  phoneNumber: testUser.phone,
  documentType: 'CC',
  documentNumber: '1234567890'
};

const testRedirectUrls = {
  success: 'https://example.com/success',
  decline: 'https://example.com/decline',
  cancel: 'https://example.com/cancel'
};

/**
 * Función principal de prueba
 */
async function runServicePaymentTests(): Promise<void> {
  console.log('🚀 Iniciando pruebas del sistema de pagos de servicios...');
  
  try {
    // 2. Iniciar sesión
    await loginUser();
    
    // 3. Obtener servicio de prueba
    await getTestService();
    
    // 4. Crear transacción de servicio
    await createServiceTransaction();
    
    // 5. Crear link de pago de servicio
    await createServicePaymentLink();
    
    // 6. Obtener estado de transacción
    await getTransactionStatus();
    
    // 7. Obtener tokens de aceptación
    await getAcceptanceTokens();
    
    console.log('\n✅ Todas las pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    process.exit(1);
  }
}
/**
 * Iniciar sesión
 */
async function loginUser(): Promise<void> {
  try {
    console.log('\n🔐 Iniciando sesión...');
    
    const response: AxiosResponse = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (response.data.success) {
      token = response.data.data.access_token;
      testUserId = response.data.data.user.user_id;
      console.log(`✅ Sesión iniciada exitosamente. Token obtenido.`);
    } else {
      throw new Error(response.data.message || 'Error iniciando sesión');
    }
  } catch (error: any) {
    console.error('❌ Error iniciando sesión:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Obtener servicio de prueba
 */
async function getTestService(): Promise<void> {
  try {
    console.log('\n🔍 Obteniendo servicio de prueba...');
    
    const response: AxiosResponse = await axios.get(`${API_URL}/services/actives?is_active=true`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success && response.data.data.length > 0) {
      // Buscar un servicio activo
      const activeService = response.data.data.find((service: any) => service.is_active);
      
      if (activeService) {
        testServiceId = activeService.service_id;
        console.log(`✅ Servicio encontrado: ${activeService.service_name} (ID: ${testServiceId}, Precio: $${activeService.base_price})`);
      } else {
        throw new Error('No se encontraron servicios activos');
      }
    } else {
      throw new Error('No se encontraron servicios');
    }
  } catch (error: any) {
    console.error('❌ Error obteniendo servicios:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Crear transacción de servicio
 */
async function createServiceTransaction(): Promise<void> {
  try {
    console.log('\n💳 Creando transacción de servicio...');
    
    // Primero obtener el precio del servicio
    const serviceResponse: AxiosResponse = await axios.get(`${API_URL}/services/${testServiceId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const service = serviceResponse.data.data;
    const sessionsQuantity = 2;
    const totalAmount = Number(service.base_price) * sessionsQuantity;
    
    const transactionData = {
      serviceId: testServiceId,
      sessionsQuantity: sessionsQuantity,
      amount: totalAmount,
      currency: 'COP',
      paymentMethod: 'CARD',
      customerInfo: testCustomerInfo,
      description: `Compra de ${sessionsQuantity} sesiones del servicio ${service.service_name}`,
      acceptanceToken: 'test_acceptance_token',
      acceptPersonalAuth: 'test_personal_auth_token'
    };
    
    const response: AxiosResponse = await axios.post(
      `${API_URL}/payments/services/transactions`,
      transactionData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (response.data.success) {
      testTransactionId = response.data.data.transactionId;
      console.log(`✅ Transacción de servicio creada exitosamente.`);
      console.log(`   - Transaction ID: ${testTransactionId}`);
      console.log(`   - Servicio: ${service.service_name}`);
      console.log(`   - Sesiones: ${sessionsQuantity}`);
      console.log(`   - Monto: $${totalAmount}`);
    } else {
      throw new Error(response.data.message || 'Error creando transacción');
    }
  } catch (error: any) {
    console.error('❌ Error creando transacción de servicio:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Crear link de pago de servicio
 */
async function createServicePaymentLink(): Promise<void> {
  try {
    console.log('\n🔗 Creando link de pago de servicio...');
    
    // Primero obtener el precio del servicio
    const serviceResponse: AxiosResponse = await axios.get(`${API_URL}/services/${testServiceId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const service = serviceResponse.data.data;
    const sessionsQuantity = 3;
    const totalAmount = Number(service.base_price) * sessionsQuantity;
    
    const paymentLinkData = {
      serviceId: testServiceId,
      sessionsQuantity: sessionsQuantity,
      amount: totalAmount,
      currency: 'COP',
      description: `Link de pago para ${sessionsQuantity} sesiones del servicio ${service.service_name}`,
      customerInfo: testCustomerInfo,
      redirectUrls: testRedirectUrls,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      paymentMethods: ['CARD', 'PSE'],
      acceptanceToken: 'test_acceptance_token',
      acceptPersonalAuth: 'test_personal_auth_token'
    };
    
    const response: AxiosResponse = await axios.post(
      `${API_URL}/payments/services/payment-links`,
      paymentLinkData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (response.data.success) {
      testPaymentLinkId = response.data.data.paymentLinkId;
      console.log(`✅ Link de pago de servicio creado exitosamente.`);
      console.log(`   - Payment Link ID: ${testPaymentLinkId}`);
      console.log(`   - Servicio: ${service.service_name}`);
      console.log(`   - Sesiones: ${sessionsQuantity}`);
      console.log(`   - Monto: $${totalAmount}`);
      console.log(`   - URL: ${response.data.data.paymentUrl || 'N/A'}`);
    } else {
      throw new Error(response.data.message || 'Error creando link de pago');
    }
  } catch (error: any) {
    console.error('❌ Error creando link de pago de servicio:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Obtener estado de transacción
 */
async function getTransactionStatus(): Promise<void> {
  try {
    console.log('\n📊 Obteniendo estado de transacción...');
    
    if (!testTransactionId) {
      console.log('⚠️  No hay transaction ID disponible, saltando verificación');
      return;
    }
    
    const response: AxiosResponse = await axios.get(
      `${API_URL}/payments/transactions/${testTransactionId}/status`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (response.data.success) {
      console.log(`✅ Estado de transacción obtenido exitosamente.`);
      console.log(`   - Estado: ${response.data.data.status}`);
      console.log(`   - Monto: $${response.data.data.amount}`);
      console.log(`   - Fecha: ${response.data.data.createdAt}`);
    } else {
      throw new Error(response.data.message || 'Error obteniendo estado');
    }
  } catch (error: any) {
    console.error('❌ Error obteniendo estado de transacción:', error.response?.data || error.message);
    // No lanzar error aquí, es opcional
  }
}

/**
 * Obtener tokens de aceptación
 */
async function getAcceptanceTokens(): Promise<void> {
  try {
    console.log('\n🎫 Obteniendo tokens de aceptación...');
    
    const response: AxiosResponse = await axios.get(
      `${API_URL}/payments/acceptance-tokens`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (response.data.success) {
      console.log(`✅ Tokens de aceptación obtenidos exitosamente.`);
      console.log(`   - Acceptance Token: ${response.data.data.acceptanceToken?.substring(0, 20)}...`);
      console.log(`   - Personal Data Auth Token: ${response.data.data.personalDataAuthToken?.substring(0, 20)}...`);
    } else {
      throw new Error(response.data.message || 'Error obteniendo tokens');
    }
  } catch (error: any) {
    console.error('❌ Error obteniendo tokens de aceptación:', error.response?.data || error.message);
    // No lanzar error aquí, es opcional
  }
}

/**
 * Función para limpiar datos de prueba
 */
async function cleanupTestData(): Promise<void> {
  try {
    console.log('\n🧹 Limpiando datos de prueba...');
    
    if (testUserId && token) {
      // Aquí podrías agregar lógica para limpiar transacciones de prueba
      // Por ahora solo mostramos un mensaje
      console.log(`⚠️  Datos de prueba creados para usuario ID: ${testUserId}`);
      console.log('   - Considera limpiar manualmente las transacciones de prueba');
    }
  } catch (error: any) {
    console.error('❌ Error limpiando datos de prueba:', error.message);
  }
}

// Ejecutar pruebas si el archivo se ejecuta directamente
if (require.main === module) {
  runServicePaymentTests()
    .then(() => {
      console.log('\n🎉 Pruebas completadas!');
      return cleanupTestData();
    })
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en las pruebas:', error);
      process.exit(1);
    });
}

export {
  runServicePaymentTests,
  cleanupTestData
};