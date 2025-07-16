// test-purchase-buyer-filter.ts
// Test para verificar el filtro por nombre del comprador en purchases
import axios from 'axios';

// Configuración
const API_URL = 'http://localhost:4000/api';
let token = ''; // Token JWT de autenticación

// Función para iniciar sesión y obtener token
async function login() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'd@g.com', // Cambiar por credenciales válidas
      password: '00000000'
    });
    
    token = response.data.data.access_token;
    console.log('✅ Login exitoso, token obtenido');
    return true;
  } catch (error: any) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    return false;
  }
}

// Función para probar el filtro por nombre del comprador
async function testBuyerNameFilter() {
  try {
    console.log('\n🔍 Probando filtro por nombre del comprador...');
    
    // Prueba 1: Obtener todas las compras sin filtro
    console.log('\n📋 Obteniendo todas las compras (sin filtro):');
    const allPurchasesResponse = await axios.get(
      `${API_URL}/purchases?page=1&limit=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log(`   Total de compras: ${allPurchasesResponse.data.data.length}`);
    
    // Mostrar algunos nombres de compradores para referencia
    if (allPurchasesResponse.data.data.length > 0) {
      console.log('\n👥 Compradores encontrados:');
      allPurchasesResponse.data.data.forEach((purchase: any, index: number) => {
        const buyerName = purchase.user 
          ? `${purchase.user.first_name} ${purchase.user.last_name}` 
          : purchase.temporary_customer 
            ? `${purchase.temporary_customer.first_name} ${purchase.temporary_customer.last_name}` 
            : 'Sin nombre';
        console.log(`   ${index + 1}. ${buyerName} (ID: ${purchase.purchase_id})`);
      });
    }
    
    // Prueba 2: Filtrar por un nombre específico
    const testName = 'Test'; // Cambiar por un nombre que exista en los datos
    console.log(`\n🔍 Filtrando por nombre: "${testName}"`);
    const filteredResponse = await axios.get(
      `${API_URL}/purchases?page=1&limit=10&buyer_name=${encodeURIComponent(testName)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log(`   Compras filtradas: ${filteredResponse.data.data.length}`);
    
    if (filteredResponse.data.data.length > 0) {
      console.log('\n✅ Resultados del filtro:');
      filteredResponse.data.data.forEach((purchase: any, index: number) => {
        const buyerName = purchase.user 
          ? `${purchase.user.first_name} ${purchase.user.last_name}` 
          : purchase.temporary_customer 
            ? `${purchase.temporary_customer.first_name} ${purchase.temporary_customer.last_name}` 
            : 'Sin nombre';
        console.log(`   ${index + 1}. ${buyerName} (ID: ${purchase.purchase_id})`);
      });
    } else {
      console.log('   ⚠️  No se encontraron compras con ese nombre');
    }
    
    // Prueba 3: Filtrar por nombre parcial
    const partialName = 'a'; // Buscar nombres que contengan 'a'
    console.log(`\n🔍 Filtrando por nombre parcial: "${partialName}"`);
    const partialFilterResponse = await axios.get(
      `${API_URL}/purchases?page=1&limit=5&buyer_name=${encodeURIComponent(partialName)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log(`   Compras con nombre parcial: ${partialFilterResponse.data.data.length}`);
    
    // Prueba 4: Probar sin paginación (método getAllPurchases)
    console.log(`\n🔍 Probando filtro sin paginación:`);
    const noPaginationResponse = await axios.get(
      `${API_URL}/purchases?buyer_name=${encodeURIComponent(testName)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log(`   Compras sin paginación: ${noPaginationResponse.data.data.length}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ Error probando filtro por nombre:', error.response?.data || error.message);
    return false;
  }
}

// Función para probar combinación de filtros
async function testCombinedFilters() {
  try {
    console.log('\n🔄 Probando combinación de filtros...');
    
    // Combinar filtro de nombre con estado de pago
    const response = await axios.get(
      `${API_URL}/purchases?page=1&limit=10&buyer_name=Test&payment_status=completed`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log(`   Compras con nombre 'Test' y estado 'completed': ${response.data.data.length}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ Error probando filtros combinados:', error.response?.data || error.message);
    return false;
  }
}

// Función principal para ejecutar todas las pruebas
async function runBuyerFilterTests() {
  console.log('🚀 Iniciando pruebas del filtro por nombre del comprador...');
  console.log('📋 Asegúrate de que:');
  console.log('   - El servidor esté ejecutándose en http://localhost:4000');
  console.log('   - La base de datos tenga compras con usuarios y clientes temporales');
  console.log('   - Las credenciales de login sean correctas');
  console.log('');
  
  // Iniciar sesión
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ No se pudo iniciar sesión. Abortando pruebas.');
    return;
  }
  
  // Ejecutar pruebas
  let passed = 0;
  let total = 3;
  
  if (await testBuyerNameFilter()) passed++;
  if (await testCombinedFilters()) passed++;
  
  // Resumen
  console.log('\n📊 Resumen de pruebas:');
  console.log(`   ✅ Pruebas exitosas: ${passed}/${total}`);
  console.log(`   ❌ Pruebas fallidas: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 ¡Todas las pruebas del filtro por nombre pasaron exitosamente!');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisa los errores arriba.');
  }
}

// Ejecutar las pruebas si el archivo se ejecuta directamente
if (require.main === module) {
  runBuyerFilterTests().catch(console.error);
}

export {
  runBuyerFilterTests,
  testBuyerNameFilter,
  testCombinedFilters
};