# Sistema de Pruebas de Correo Electrónico - ClinSync

## Descripción

El sistema ClinSync incluye un módulo completo de correos electrónicos con funcionalidades de prueba para verificar que el sistema está funcionando correctamente. Este documento explica cómo usar las herramientas de prueba disponibles.

## 🚀 Funcionalidades Disponibles

### 1. Verificación del Estado del Sistema
- Verificación de conexión SMTP
- Estado operacional del servicio de correos
- Información del sistema y configuración

### 2. Envío de Correos de Prueba
- Correos simples de verificación
- Correos personalizados
- Envío múltiple a varias direcciones
- Correos de verificación del sistema con información detallada

### 3. Logging y Monitoreo
- Registro detallado de todas las operaciones
- URLs de vista previa en modo desarrollo
- Manejo de errores y reintentos

## 📡 Endpoints de API Disponibles

> **Nota:** Los endpoints de prueba solo están disponibles en entornos de desarrollo (`NODE_ENV !== 'production'`)

### GET `/api/email-test/status`
Verifica el estado del sistema de correos.

**Respuesta:**
```json
{
  "success": true,
  "message": "Sistema de correos operativo",
  "data": {
    "emailSystemStatus": "operational",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "environment": "development"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET `/api/email-test/info`
Obtiene información detallada del sistema de correos.

**Respuesta:**
```json
{
  "success": true,
  "message": "Información del sistema de correos obtenida exitosamente",
  "data": {
    "emailSystem": {
      "status": "operational",
      "service": "NodeMailer",
      "environment": "development"
    },
    "server": {
      "timestamp": "2024-01-15T10:30:00.000Z",
      "version": "1.0.0",
      "nodeVersion": "v18.17.0",
      "platform": "win32"
    },
    "features": {
      "htmlEmails": true,
      "templates": true,
      "attachments": true,
      "multipleRecipients": true,
      "testMode": true
    }
  }
}
```

### POST `/api/email-test/send-test`
Envía un correo de prueba simple.

**Body (opcional):**
```json
{
  "to": "test@ejemplo.com",
  "subject": "Correo de prueba personalizado",
  "message": "<h1>Mensaje personalizado</h1>"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Correo de prueba enviado exitosamente",
  "data": {
    "messageId": "<message-id@ethereal.email>",
    "previewUrl": "https://ethereal.email/message/..."
  }
}
```

### POST `/api/email-test/system-verification`
Envía un correo completo de verificación del sistema.

**Body:**
```json
{
  "to": "admin@cuidamehealth.com"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Correo de verificación del sistema enviado exitosamente",
  "data": {
    "messageId": "<message-id@ethereal.email>",
    "previewUrl": "https://ethereal.email/message/...",
    "systemInfo": {
      "timestamp": "15/1/2024, 10:30:00",
      "environment": "development",
      "version": "1.0.0",
      "nodeVersion": "v18.17.0"
    }
  }
}
```

### POST `/api/email-test/send-multiple`
Envía correos de prueba a múltiples direcciones.

**Body:**
```json
{
  "emails": [
    "test1@ejemplo.com",
    "test2@ejemplo.com",
    "admin@cuidamehealth.com"
  ]
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Enviados 3 de 3 correos exitosamente",
  "data": {
    "totalSent": 3,
    "successful": 3,
    "failed": 0,
    "results": [
      {
        "email": "test1@ejemplo.com",
        "success": true,
        "previewUrl": "https://ethereal.email/message/..."
      }
    ]
  }
}
```

## 🛠️ Uso del Script de Pruebas

También puedes ejecutar las pruebas directamente usando el script:

```bash
# Ejecutar todas las pruebas
npx ts-node src/scripts/test-email-system.ts

# O desde el código TypeScript
import { runEmailSystemTest, sendTestEmail } from './src/scripts/test-email-system';

// Ejecutar pruebas completas
await runEmailSystemTest();

// Enviar un correo de prueba específico
const result = await sendTestEmail({
  to: 'test@ejemplo.com',
  subject: 'Mi correo de prueba',
  message: '<h1>Hola mundo!</h1>'
});
```

## 🔧 Configuración del Sistema

### Entorno de Desarrollo
En desarrollo, el sistema usa **Ethereal Email** (servicio de prueba) que:
- No envía correos reales
- Genera URLs de vista previa
- Es perfecto para pruebas

### Entorno de Producción
En producción, el sistema usa la configuración SMTP real definida en las variables de entorno:
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `EMAIL_FROM`

## 📋 Ejemplos de Uso

### 1. Verificación Rápida del Sistema
```bash
curl -X GET http://localhost:3000/api/email-test/status
```

### 2. Enviar Correo de Prueba Simple
```bash
curl -X POST http://localhost:3000/api/email-test/send-test \
  -H "Content-Type: application/json" \
  -d '{"to": "test@ejemplo.com"}'
```

### 3. Verificación Completa del Sistema
```bash
curl -X POST http://localhost:3000/api/email-test/system-verification \
  -H "Content-Type: application/json" \
  -d '{"to": "admin@cuidamehealth.com"}'
```

### 4. Prueba con Múltiples Correos
```bash
curl -X POST http://localhost:3000/api/email-test/send-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "emails": [
      "test1@ejemplo.com",
      "test2@ejemplo.com"
    ]
  }'
```

## 🚨 Consideraciones de Seguridad

1. **Solo en Desarrollo**: Los endpoints de prueba solo están disponibles cuando `NODE_ENV !== 'production'`
2. **Validación**: Todos los endpoints incluyen validación de entrada
3. **Rate Limiting**: Se incluye una pausa entre envíos múltiples para evitar spam
4. **Logging**: Todas las operaciones se registran para auditoría

## 🐛 Solución de Problemas

### Error de Conexión SMTP
- Verificar configuración de variables de entorno
- Comprobar conectividad de red
- Revisar logs del sistema

### Correos No Enviados
- Verificar formato de direcciones de correo
- Comprobar límites del servidor SMTP
- Revisar logs de errores

### Vista Previa No Disponible
- Solo disponible en modo desarrollo
- Verificar que Ethereal Email esté funcionando
- Comprobar logs de configuración

## 📞 Soporte

Para problemas o preguntas sobre el sistema de correos:
1. Revisar los logs del sistema
2. Verificar la configuración de variables de entorno
3. Usar los endpoints de diagnóstico
4. Contactar al equipo de desarrollo

---

**Nota**: Este sistema está diseñado para ser robusto y fácil de usar, proporcionando todas las herramientas necesarias para verificar que el módulo de correos electrónicos funciona correctamente en el sistema ClinSync.