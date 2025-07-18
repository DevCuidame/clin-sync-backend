# Guía para Crear Plantillas de WhatsApp en Meta Business

## Introducción

Este documento explica cómo crear y configurar las plantillas de WhatsApp necesarias para el sistema de notificaciones de citas en Meta Business Manager.

## Plantillas Requeridas

El sistema utiliza las siguientes plantillas de WhatsApp:

### 1. Cita Cancelada
- **Nombre de plantilla:** `appointment_cancelled`
- **Categoría:** UTILITY
- **Idioma:** Español (es)

### 2. Cita Reprogramada
- **Nombre de plantilla:** `appointment_rescheduled`
- **Categoría:** UTILITY
- **Idioma:** Español (es)

### 3. Cita Confirmada
- **Nombre de plantilla:** `appointment_confirmed`
- **Categoría:** UTILITY
- **Idioma:** Español (es)

### 4. Cita Completada
- **Nombre de plantilla:** `appointment_completed`
- **Categoría:** UTILITY
- **Idioma:** Español (es)

### 5. Recordatorio 24 horas
- **Nombre de plantilla:** `appointment_reminder_24h`
- **Categoría:** UTILITY
- **Idioma:** Español (es)

### 6. Recordatorio 2 horas
- **Nombre de plantilla:** `appointment_reminder_2h`
- **Categoría:** UTILITY
- **Idioma:** Español (es)

## Estructura de las Plantillas

Todas las plantillas siguen esta estructura:

### Componentes:
1. **Header (Opcional):** Logo o imagen de la empresa
2. **Body:** Mensaje principal con variables
3. **Footer (Opcional):** Información de contacto
4. **Button:** Botón para ver ubicación en Google Maps

### Variables del Body:
- `{{1}}` - Nombre del usuario/cliente
- `{{2}}` - Nombre del servicio
- `{{3}}` - Información de fecha/hora

### Variables del Button:
- `{{1}}` - URL de Google Maps con coordenadas

## Ejemplos de Plantillas

### 1. Plantilla: Cita Cancelada

```
**HEADER:** [Logo de Esencia y Cuerpo]

**BODY:**
Hola {{1}}, 

Tu cita para {{2}} programada para {{3}} ha sido cancelada.

Si tienes alguna pregunta, no dudes en contactarnos.

**FOOTER:**
Esencia y Cuerpo
soporte@esenciaycuerpo.com

**BUTTON:**
Tipo: URL
Texto: "Ver Ubicación"
URL: {{1}}
```

### 2. Plantilla: Cita Confirmada

```
**HEADER:** [Logo de Esencia y Cuerpo]

**BODY:**
¡Hola {{1}}! 

Tu cita para {{2}} está confirmada para {{3}}.

¡Te esperamos!

**FOOTER:**
Esencia y Cuerpo
soporte@esenciaycuerpo.com

**BUTTON:**
Tipo: URL
Texto: "Ver Ubicación"
URL: {{1}}
```

### 3. Plantilla: Recordatorio 24h

```
**HEADER:** [Logo de Esencia y Cuerpo]

**BODY:**
¡Hola {{1}}! 

Te recordamos que tienes una cita para {{2}} programada para {{3}}.

No olvides asistir.

**FOOTER:**
Esencia y Cuerpo
soporte@esenciaycuerpo.com

**BUTTON:**
Tipo: URL
Texto: "Ver Ubicación"
URL: {{1}}
```

### 4. Plantilla: Recordatorio 2h

```
**HEADER:** [Logo de Esencia y Cuerpo]

**BODY:**
¡Hola {{1}}! 

Tu cita para {{2}} es {{3}}.

¡Te esperamos pronto!

**FOOTER:**
Esencia y Cuerpo
soporte@esenciaycuerpo.com

**BUTTON:**
Tipo: URL
Texto: "Ver Ubicación"
URL: {{1}}
```

### 5. Plantilla: Cita Reprogramada

```
**HEADER:** [Logo de Esencia y Cuerpo]

**BODY:**
Hola {{1}}, 

Tu cita para {{2}} ha sido reprogramada. {{3}}

Gracias por tu comprensión.

**FOOTER:**
Esencia y Cuerpo
soporte@esenciaycuerpo.com

**BUTTON:**
Tipo: URL
Texto: "Ver Ubicación"
URL: {{1}}
```

### 6. Plantilla: Cita Completada

```
**HEADER:** [Logo de Esencia y Cuerpo]

**BODY:**
¡Gracias {{1}}! 

Tu cita para {{2}} realizada {{3}} ha sido completada.

¡Esperamos verte pronto!

**FOOTER:**
Esencia y Cuerpo
soporte@esenciaycuerpo.com

**BUTTON:**
Tipo: URL
Texto: "Ver Ubicación"
URL: {{1}}
```

## Pasos para Crear las Plantillas

### 1. Acceder a Meta Business Manager
1. Ve a [business.facebook.com](https://business.facebook.com)
2. Selecciona tu cuenta de negocio
3. Ve a "WhatsApp Manager"

### 2. Crear Nueva Plantilla
1. En WhatsApp Manager, ve a "Message Templates"
2. Haz clic en "Create Template"
3. Selecciona el número de teléfono de WhatsApp Business

### 3. Configurar la Plantilla
1. **Template Name:** Usa los nombres exactos listados arriba
2. **Category:** Selecciona "UTILITY"
3. **Language:** Selecciona "Spanish"

### 4. Agregar Componentes

#### Header (Opcional):
- Tipo: "Media"
- Sube el logo de Esencia y Cuerpo

#### Body:
- Escribe el mensaje usando las variables `{{1}}`, `{{2}}`, `{{3}}`
- Asegúrate de que el texto sea claro y profesional

#### Footer (Opcional):
- Agrega información de contacto
- Ejemplo: "Esencia y Cuerpo - soporte@esenciaycuerpo.com"

#### Button:
- Tipo: "URL"
- Texto: "Ver Ubicación"
- URL: `{{1}}` (variable dinámica)

### 5. Enviar para Aprobación
1. Revisa toda la información
2. Haz clic en "Submit"
3. Espera la aprobación de Meta (puede tomar 24-48 horas)

## Variables que Envía el Sistema

El backend envía las siguientes variables a cada plantilla:

- **userName ({{1}}):** Nombre del cliente
- **patientName ({{2}}):** Nombre del servicio
- **time ({{3}}):** Información de fecha y hora formateada
- **Button URL ({{1}}):** URL de Google Maps con coordenadas

## Configuración en el Backend

Asegúrate de que las siguientes variables de entorno estén configuradas:

```env
# WhatsApp Configuration
WHATSAPP_ACCESS_TOKEN=tu_access_token
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
```

## Uso en el Código

Para enviar notificaciones completas (email + WhatsApp):

```typescript
import { AppointmentNotificationService } from './appointment-notification.service';

const notificationService = new AppointmentNotificationService();

// Enviar notificación completa (email + WhatsApp)
await notificationService.sendReminderNotificationComplete({
  appointment: appointmentData,
  recipientEmail: 'cliente@email.com',
  recipientPhone: '5551234567', // Opcional
  recipientName: 'Juan Pérez',
  serviceName: 'Masaje Relajante',
  professionalName: 'María García',
  locationLatitude: 19.4326,
  locationLongitude: -99.1332
}, '24h');
```

## Solución de Problemas

### Plantilla Rechazada
- Revisa que el contenido cumpla con las políticas de WhatsApp
- Asegúrate de que las variables estén correctamente formateadas
- Evita contenido promocional en plantillas UTILITY

### Error al Enviar Mensajes
- Verifica que las plantillas estén aprobadas
- Confirma que los nombres de plantilla coincidan exactamente
- Revisa los logs del servidor para errores específicos

### Formato de Teléfono
- El sistema formatea automáticamente los números
- Usa formato internacional sin el símbolo +
- Ejemplo: 5551234567 (para México)

## Notas Importantes

1. **Aprobación:** Todas las plantillas deben ser aprobadas por Meta antes de usarse
2. **Límites:** WhatsApp tiene límites en el número de mensajes por día
3. **Costos:** Cada mensaje de plantilla tiene un costo asociado
4. **Políticas:** Cumple siempre con las políticas de WhatsApp Business

## Contacto

Para soporte técnico, contacta al equipo de desarrollo.