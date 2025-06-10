// test-sync-endpoints.ts
import axios from 'axios';

// Configuración
const API_URL = 'http://localhost:3000/api';
let token = ''; // Token JWT de autenticación
const PATIENT_ID = 9; // Cambia por un ID de paciente válido

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

// Fase 1: Agregar datos iniciales
// Función para sincronizar vacunas - Fase 1: Datos iniciales
async function testSyncVaccinesPhase1() {
  try {
    console.log('===== VACUNAS - FASE 1: Datos iniciales =====');
    const data = {
      id_paciente: PATIENT_ID,
      vacunas: [
        { vacuna: "COVID-19" },
        { vacuna: "Influenza" },
        { vacuna: "Tétanos" }
      ]
    };
    
    const response = await axios.post(
      `${API_URL}/medical-info/sync/vaccines`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Respuesta:', response.data);
    return true;
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Función para sincronizar alergias - Fase 1: Datos iniciales
async function testSyncAllergiesPhase1() {
  try {
    console.log('===== ALERGIAS - FASE 1: Datos iniciales =====');
    const data = {
      id_paciente: PATIENT_ID,
      alergias: [
        { tipo_alergia: "Medicamento", descripcion: "Alergia a la penicilina" },
        { tipo_alergia: "Alimento", descripcion: "Alergia a los frutos secos" }
      ]
    };
    
    const response = await axios.post(
      `${API_URL}/medical-info/sync/allergies`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Respuesta:', response.data);
    return true;
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Fase 2: Modificar datos (agregar nuevos, mantener algunos, eliminar otros)
// Función para sincronizar vacunas - Fase 2: Cambios
async function testSyncVaccinesPhase2() {
  try {
    console.log('===== VACUNAS - FASE 2: Cambios =====');
    // Mantenemos Influenza, eliminamos COVID-19 y Tétanos, y agregamos Hepatitis B
    const data = {
      id_paciente: PATIENT_ID,
      vacunas: [
        { vacuna: "Influenza" },        // Se mantiene
        { vacuna: "Hepatitis B" },      // Se agrega
        { vacuna: "Fiebre Amarilla" }   // Se agrega
      ]
    };
    
    const response = await axios.post(
      `${API_URL}/medical-info/sync/vaccines`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Respuesta:', response.data);
    return true;
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Función para sincronizar alergias - Fase 2: Cambios
async function testSyncAllergiesPhase2() {
  try {
    console.log('===== ALERGIAS - FASE 2: Cambios =====');
    // Mantenemos Medicamento, eliminamos Alimento, y agregamos Ambiental
    const data = {
      id_paciente: PATIENT_ID,
      alergias: [
        { tipo_alergia: "Medicamento", descripcion: "Alergia a la penicilina" },  // Se mantiene
        { tipo_alergia: "Ambiental", descripcion: "Alergia al polen" }            // Se agrega
      ]
    };
    
    const response = await axios.post(
      `${API_URL}/medical-info/sync/allergies`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Respuesta:', response.data);
    return true;
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Función para sincronizar antecedentes médicos - Fase 1: Datos iniciales
async function testSyncBackgroundsPhase1() {
  try {
    console.log('===== ANTECEDENTES MÉDICOS - FASE 1: Datos iniciales =====');
    const data = {
      id_paciente: PATIENT_ID,
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
      `${API_URL}/medical-info/sync/backgrounds`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Respuesta:', response.data);
    return true;
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Función para sincronizar antecedentes médicos - Fase 2: Cambios
async function testSyncBackgroundsPhase2() {
  try {
    console.log('===== ANTECEDENTES MÉDICOS - FASE 2: Cambios =====');
    // Mantenemos Cirugía, eliminamos Enfermedad crónica, y agregamos Hospitalización
    const data = {
      id_paciente: PATIENT_ID,
      antecedentes: [
        { 
          tipo_antecedente: "Cirugía", 
          descripcion_antecedente: "Apendicectomía", 
          fecha_antecedente: "2020-03-15" 
        },
        { 
          tipo_antecedente: "Hospitalización", 
          descripcion_antecedente: "Neumonía", 
          fecha_antecedente: "2019-11-22" 
        }
      ]
    };
    
    const response = await axios.post(
      `${API_URL}/medical-info/sync/backgrounds`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Respuesta:', response.data);
    return true;
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Función para sincronizar antecedentes familiares - Fase 1: Datos iniciales
async function testSyncFamilyBackgroundsPhase1() {
  try {
    console.log('===== ANTECEDENTES FAMILIARES - FASE 1: Datos iniciales =====');
    const data = {
      id_paciente: PATIENT_ID,
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
      `${API_URL}/medical-info/sync/family-backgrounds`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Respuesta:', response.data);
    return true;
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Función para sincronizar antecedentes familiares - Fase 2: Cambios
async function testSyncFamilyBackgroundsPhase2() {
  try {
    console.log('===== ANTECEDENTES FAMILIARES - FASE 2: Cambios =====');
    // Mantenemos Diabetes, eliminamos Cáncer, y agregamos Enfermedad cardiovascular
    const data = {
      id_paciente: PATIENT_ID,
      antecedentes_familiares: [
        { 
          tipo_antecedente: "Diabetes", 
          parentesco: "Padre", 
          descripcion_antecedente: "Diabetes tipo 2" 
        },
        { 
          tipo_antecedente: "Enfermedad cardiovascular", 
          parentesco: "Madre", 
          descripcion_antecedente: "Infarto de miocardio" 
        }
      ]
    };
    
    const response = await axios.post(
      `${API_URL}/medical-info/sync/family-backgrounds`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Respuesta:', response.data);
    return true;
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('Iniciando pruebas de sincronización de datos médicos...');
  
  // Iniciar sesión primero
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('No se pudo iniciar sesión. Abortando pruebas.');
    return;
  }
  
  console.log('\n*** FASE 1: CARGA INICIAL DE DATOS ***\n');
  
  // Ejecutar pruebas de carga inicial
  await testSyncVaccinesPhase1();
  await testSyncAllergiesPhase1();
  await testSyncBackgroundsPhase1();
  await testSyncFamilyBackgroundsPhase1();
  
  // Pausa para simular el paso del tiempo
  console.log('\nEsperando 3 segundos antes de ejecutar la fase 2...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\n*** FASE 2: MODIFICACIÓN DE DATOS (AGREGAR, MANTENER, ELIMINAR) ***\n');
  
  // Ejecutar pruebas de modificación
  await testSyncVaccinesPhase2();
  await testSyncAllergiesPhase2();
  await testSyncBackgroundsPhase2();
  await testSyncFamilyBackgroundsPhase2();
  
  console.log('\nPruebas finalizadas.');
}

// Ejecutar el script
runAllTests().catch(error => {
  console.error('Error al ejecutar pruebas:', error);
});

// Si deseas probar solo las fases individuales, puedes descomentar estas líneas
// y comentar la llamada a runAllTests()

// Fase 1: Solo carga inicial
// async function runPhase1() {
//   await login();
//   await testSyncVaccinesPhase1();
//   await testSyncAllergiesPhase1();
//   await testSyncBackgroundsPhase1();
//   await testSyncFamilyBackgroundsPhase1();
// }

// Fase 2: Solo modificaciones
// async function runPhase2() {
//   await login();
//   await testSyncVaccinesPhase2();
//   await testSyncAllergiesPhase2();
//   await testSyncBackgroundsPhase2();
//   await testSyncFamilyBackgroundsPhase2();
// }

// runPhase1().catch(error => console.error(error));
// runPhase2().catch(error => console.error(error));