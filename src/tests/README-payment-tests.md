# Test del Sistema de Pagos - Clin Sync

Este documento explica cómo usar el test completo del sistema de pagos para verificar que un usuario pueda comprar un paquete exitosamente.

## 📋 Descripción

El test `test-payment-system.ts` es una suite completa que verifica todo el flujo de compra de paquetes, desde la autenticación hasta la confirmación del pago y verificación de la compra.

## 🧪 Funcionalidades Probadas

### 1. **Autenticación**
- Login del usuario
- Obtención del token JWT
- Validación de credenciales

### 2. **Gestión de Paquetes**
- Obtención de paquetes disponibles
- Creación automática de paquete de prueba si no existe
- Validación de información del paquete

### 3. **Sistema de Pagos**
- Creación de transacciones con Wompi
- Validación de datos de pago
- Confirmación de transacciones
- Verificación de estado de transacciones

### 4. **Gestión de Compras**
- Creación de registros de compra
- Verificación de compras del usuario
- Consulta de compras activas
- Historial de pagos

## 🚀 Cómo Ejecutar el Test

### Prerrequisitos

1. **Servidor en funcionamiento**:
   ```bash
   npm run dev
   ```
   El servidor debe estar corriendo en `http://localhost:3000`

2. **Base de datos configurada**:
   - PostgreSQL funcionando
   - Tablas creadas (users, packages, purchases, payment_transactions)

3. **Usuario de prueba**:
   - Email: `d@g.com`
   - Password: `00000000`
   - (Puedes modificar estas credenciales en el archivo de test)

4. **Configuración de Wompi**:
   - Variables de entorno configuradas
   - API keys válidas (para testing usar sandbox)

### Ejecución

#### Opción 1: Ejecutar directamente con Node.js
```bash
cd src/tests
npx ts-node test-payment-system.ts
```

#### Opción 2: Compilar y ejecutar
```bash
npm run build
node dist/tests/test-payment-system.js
```

#### Opción 3: Usar desde otro archivo
```typescript
import { runPaymentSystemTests } from './test-payment-system';

// Ejecutar todos los tests
runPaymentSystemTests();

// O ejecutar tests individuales
import { login, createPaymentTransaction } from './test-payment-system';

async function customTest() {
  await login();
  await createPaymentTransaction();
}
```

## 📊 Salida del Test

El test proporciona una salida detallada con:

- ✅ **Tests exitosos**: Funcionalidades que pasaron
- ❌ **Tests fallidos**: Funcionalidades con errores
- 📈 **Porcentaje de éxito**: Estadística general
- 🔍 **Detalles de cada operación**: IDs, montos, estados, etc.

### Ejemplo de Salida
```
🚀 INICIANDO TESTS DEL SISTEMA DE PAGOS
==========================================

🧪 Ejecutando: Login
--------------------------------------------------
🔐 Iniciando sesión...
✅ Login exitoso
   Usuario ID: 123
   Token obtenido: eyJhbGciOiJIUzI1NiIs...
✅ Login - PASÓ

🧪 Ejecutando: Obtener Paquetes
--------------------------------------------------
📦 Obteniendo paquetes disponibles...
✅ Paquetes obtenidos exitosamente
   Paquete seleccionado: Paquete Básico
   ID: 1
   Precio: $50000
   Sesiones: 5
   Validez: 30 días
✅ Obtener Paquetes - PASÓ

...

==========================================
📊 RESUMEN DE TESTS
==========================================
✅ Tests exitosos: 9
❌ Tests fallidos: 0
📈 Porcentaje de éxito: 100.0%

🎉 ¡TODOS LOS TESTS PASARON! El sistema de pagos funciona correctamente.
```

## 🔧 Configuración y Personalización

### Modificar Credenciales de Prueba

En el archivo `test-payment-system.ts`, línea ~60:
```typescript
const response: AxiosResponse<LoginResponse> = await axios.post(`${API_URL}/auth/login`, {
  email: 'tu-email@ejemplo.com',  // Cambiar aquí
  password: 'tu-password'         // Cambiar aquí
});
```

### Modificar URL del API

En el archivo `test-payment-system.ts`, línea ~4:
```typescript
const API_URL = 'http://localhost:3000/api'; // Cambiar si usas otro puerto
```

### Personalizar Datos de Pago

En la función `createPaymentTransaction()`, líneas ~150-170:
```typescript
const transactionData = {
  purchaseId: testPackageId,
  amount: 75000,              // Cambiar monto
  currency: "COP",
  paymentMethod: "CARD",
  customerInfo: {
    email: "cliente@ejemplo.com",     // Cambiar email
    fullName: "Cliente de Prueba",    // Cambiar nombre
    phoneNumber: "+573001234567",     // Cambiar teléfono
    documentType: "CC",
    documentNumber: "87654321"        // Cambiar documento
  },
  description: "Compra personalizada", // Cambiar descripción
};
```

## 🐛 Solución de Problemas

### Error: "Usuario no autenticado"
- Verificar que las credenciales sean correctas
- Asegurar que el usuario existe en la base de datos
- Verificar que el endpoint de login funcione

### Error: "No hay paquetes disponibles"
- El test creará automáticamente un paquete de prueba
- Verificar que la tabla `packages` exista
- Verificar permisos de creación de paquetes

### Error: "Wompi API Error"
- Verificar configuración de variables de entorno
- Asegurar que las API keys sean válidas
- Verificar conectividad a internet
- Usar sandbox de Wompi para testing

### Error: "Database connection"
- Verificar que PostgreSQL esté corriendo
- Verificar cadena de conexión en `.env`
- Asegurar que las tablas existan

## 📝 Notas Importantes

1. **Entorno de Prueba**: Este test está diseñado para entornos de desarrollo/testing
2. **Datos Reales**: No usar en producción con datos reales
3. **Limpieza**: El test no limpia automáticamente los datos creados
4. **Wompi Sandbox**: Usar siempre el sandbox de Wompi para testing
5. **Rate Limiting**: Respetar los límites de la API de Wompi

## 🔄 Extensiones Posibles

- Agregar tests para diferentes métodos de pago
- Probar escenarios de error (pagos fallidos, timeouts)
- Agregar tests de reembolsos
- Implementar cleanup automático de datos de prueba
- Agregar tests de concurrencia
- Integrar con framework de testing (Jest, Mocha)

## 📞 Soporte

Si encuentras problemas con el test:
1. Verificar los logs del servidor
2. Revisar la configuración de Wompi
3. Validar la estructura de la base de datos
4. Consultar la documentación de la API de Wompi

---

**Desarrollado por**: Opieka SAS Team | Anthony López  
**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024