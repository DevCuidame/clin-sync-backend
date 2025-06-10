// test-batch-endpoints.ts
import axios from 'axios';

// Configuración
const API_URL = 'http://localhost:3000/api';
let token = ''; // Token JWT de autenticación

// Función para iniciar sesión y obtener token
async function login() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'd@g.com',
      password: '00000000'
    });
    
    token = response.data.data.access_token;
    console.log('Login exitoso, token obtenido');
    
    return true;
  } catch (error: any) {
    console.error('Error al iniciar sesión:', error.response?.data || error);
    return false;
  }
}

// Función para probar creación de múltiples vacunas
async function testBatchVaccines() {
  try {
    const data = {
      id_paciente: 9, // Cambiar por un ID de paciente válido
      vacunas: [
        { vacuna: "COVID-19" },
        { vacuna: "Influenza" },
        { vacuna: "Tétanos" },
        { vacuna: "Hepatitis B" }
      ]
    };
    
    const response = await axios.post(
      `${API_URL}/medical-info/batch/vaccines`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Prueba de vacunas exitosa:', response.data);
    return true;
  } catch (error: any) {
    console.error('Error en prueba de vacunas:', error.response?.data || error.message);
    return false;
  }
}

// Función para probar creación de múltiples alergias
async function testBatchAllergies() {
  try {
    const data = {
      id_paciente: 9, // Cambiar por un ID de paciente válido
      alergias: [
        { tipo_alergia: "Medicamento", descripcion: "Alergia a la penicilina" },
        { tipo_alergia: "Alimento", descripcion: "Alergia a los frutos secos" },
        { tipo_alergia: "Ambiental", descripcion: "Alergia al polen" }
      ]
    };
    
    const response = await axios.post(
      `${API_URL}/medical-info/batch/allergies`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Prueba de alergias exitosa:', response.data);
    return true;
  } catch (error: any) {
    console.error('Error en prueba de alergias:', error.response?.data || error.message);
    return false;
  }
}

// Función para probar creación de múltiples antecedentes
async function testBatchBackgrounds() {
  try {
    const data = {
      id_paciente: 9, // Cambiar por un ID de paciente válido
      antecedentes: [
        { 
          tipo_antecedente: "Cirugía", 
          descripcion_antecedente: "Apendicectomía", 
          fecha_antecedente: "2020-03-15" 
        },
        { 
          tipo_antecedente: "Enfermedad crónica", 
          descripcion_antecedente: "Hipertensión arterial", 
          fecha_antecedente: "2018-07-10" 
        }
      ]
    };
    
    const response = await axios.post(
      `${API_URL}/medical-info/batch/backgrounds`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Prueba de antecedentes exitosa:', response.data);
    return true;
  } catch (error: any) {
    console.error('Error en prueba de antecedentes:', error.response?.data || error.message);
    return false;
  }
}

// Función para probar creación de múltiples antecedentes familiares
async function testBatchFamilyBackgrounds() {
  try {
    const data = {
      id_paciente: 9, // Cambiar por un ID de paciente válido
      antecedentes_familiares: [
        { 
          tipo_antecedente: "Diabetes", 
          parentesco: "Padre", 
          descripcion_antecedente: "Diabetes tipo 2" 
        },
        { 
          tipo_antecedente: "Cáncer", 
          parentesco: "Abuelo materno", 
          descripcion_antecedente: "Cáncer de pulmón" 
        }
      ]
    };
    
    const response = await axios.post(
      `${API_URL}/medical-info/batch/family-backgrounds`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Prueba de antecedentes familiares exitosa:', response.data);
    return true;
  } catch (error: any) {
    console.error('Error en prueba de antecedentes familiares:', error.response?.data || error.message);
    return false;
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('Iniciando pruebas de endpoints de carga por lotes...');
  
  // Iniciar sesión primero
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('No se pudo iniciar sesión. Abortando pruebas.');
    return;
  }
  
  // Ejecutar pruebas de endpoints
  await testBatchVaccines();
  await testBatchAllergies();
  await testBatchBackgrounds();
  await testBatchFamilyBackgrounds();
  
  console.log('Pruebas finalizadas.');
}

// Ejecutar el script
runAllTests().catch(error => {
  console.error('Error al ejecutar pruebas:', error);
});