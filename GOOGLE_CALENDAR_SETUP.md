# Integración de Google Calendar - Guía de Configuración

## Descripción

Esta integración permite que las citas médicas se sincronicen automáticamente con Google Calendar, proporcionando:

- ✅ Creación automática de eventos en Google Calendar al programar citas
- ✅ Actualización de eventos cuando se modifican las citas
- ✅ Eliminación de eventos cuando se cancelan las citas
- ✅ Recordatorios automáticos (24 horas, 1 hora y 15 minutos antes)
- ✅ Invitación automática a pacientes y profesionales

## Configuración Inicial

### 1. Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google Calendar API**:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Calendar API"
   - Haz clic en "Enable"

### 2. Configurar OAuth 2.0

1. Ve a "APIs & Services" > "Credentials"
2. Haz clic en "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configura la pantalla de consentimiento OAuth si es necesario
4. Selecciona "Web application" como tipo de aplicación
5. Agrega las siguientes URIs de redirección:
   ```
   http://localhost:4000/api/appointments/google-calendar/callback
   https://tu-dominio.com/api/appointments/google-calendar/callback
   ```
6. Guarda el **Client ID** y **Client Secret**

### 3. Configurar Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
GOOGLE_REDIRECT_URI=http://localhost:4000/api/appointments/google-calendar/callback
```

### 4. Instalar Dependencias

```bash
npm install googleapis google-auth-library
```

### 5. Ejecutar Migración de Base de Datos

Ejecuta el script SQL para agregar el campo necesario:

```sql
-- Ejecutar en tu base de datos PostgreSQL
\i src/scripts/add_google_calendar_field.sql
```

O manualmente:

```sql
ALTER TABLE appointments 
ADD COLUMN google_calendar_event_id VARCHAR(255) NULL;
```

## Uso de la API

### Endpoints Disponibles

#### 1. Verificar Estado de Integración
```http
GET /api/appointments/google-calendar/status
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "hasCredentials": true,
    "serviceStatus": "configured",
    "features": {
      "automaticEventCreation": true,
      "eventUpdates": true,
      "eventDeletion": true,
      "reminders": true
    }
  }
}
```

#### 2. Obtener URL de Autorización
```http
GET /api/appointments/google-calendar/auth-url
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/oauth2/auth?...",
    "instructions": "Visit this URL to authorize the application"
  }
}
```

#### 3. Callback de Autorización
```http
GET /api/appointments/google-calendar/callback?code=AUTHORIZATION_CODE
```

#### 4. Probar Conexión
```http
GET /api/appointments/google-calendar/test
```

### Funcionamiento Automático

Una vez configurado, la integración funciona automáticamente:

#### Al Crear una Cita
```http
POST /api/appointments
{
  "user_id": 1,
  "professional_id": 1,
  "service_id": 1,
  "scheduled_at": "2024-12-20T10:00:00Z",
  "duration_minutes": 60
}
```

- ✅ Se crea la cita en la base de datos
- ✅ Se crea automáticamente un evento en Google Calendar
- ✅ Se envían invitaciones al paciente y profesional
- ✅ Se configuran recordatorios automáticos

#### Al Actualizar una Cita
```http
PUT /api/appointments/123
{
  "scheduled_at": "2024-12-20T11:00:00Z"
}
```

- ✅ Se actualiza la cita en la base de datos
- ✅ Se actualiza automáticamente el evento en Google Calendar

#### Al Cancelar una Cita
```http
PATCH /api/appointments/123/cancel
{
  "cancellation_reason": "Paciente no puede asistir"
}
```

- ✅ Se marca la cita como cancelada
- ✅ Se elimina automáticamente el evento de Google Calendar

## Características del Evento de Calendar

### Información Incluida
- **Título:** "Cita médica - [Nombre del Servicio]"
- **Descripción:** Detalles del profesional, paciente, servicio y notas
- **Duración:** Basada en `duration_minutes` de la cita
- **Asistentes:** Email del paciente y profesional
- **Zona Horaria:** America/Bogota (configurable)

### Recordatorios Configurados
- 📧 **Email:** 24 horas antes
- 🔔 **Popup:** 1 hora antes
- 🔔 **Popup:** 15 minutos antes

## Solución de Problemas

### Error: "Google Calendar service not initialized"
**Causa:** Credenciales no configuradas o incorrectas
**Solución:** Verificar variables de entorno `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`

### Error: "Failed to create calendar event"
**Causa:** Token de acceso expirado o permisos insuficientes
**Solución:** Reautorizar la aplicación usando `/auth-url`

### Error: "Professional is not available"
**Causa:** Conflicto de horarios
**Solución:** La integración también verifica disponibilidad en Google Calendar

### Verificar Logs
```bash
# Ver logs de la aplicación
tail -f logs/app.log | grep "Google Calendar"
```

## Consideraciones de Seguridad

1. **Tokens de Acceso:** Se manejan de forma segura y se refrescan automáticamente
2. **Datos Sensibles:** Solo se incluye información necesaria en los eventos
3. **Permisos:** La aplicación solo solicita permisos de calendario
4. **HTTPS:** Usar HTTPS en producción para las URLs de callback

## Desarrollo y Testing

### Probar Localmente
1. Configurar variables de entorno
2. Ejecutar `npm run dev`
3. Visitar `http://localhost:4000/api/appointments/google-calendar/status`
4. Usar `/auth-url` para autorizar
5. Crear una cita de prueba

### Variables de Entorno para Testing
```env
NODE_ENV=development
GOOGLE_CLIENT_ID=tu_client_id_de_desarrollo
GOOGLE_CLIENT_SECRET=tu_client_secret_de_desarrollo
GOOGLE_REDIRECT_URI=http://localhost:4000/api/appointments/google-calendar/callback
```

## Próximas Mejoras

- [ ] Soporte para múltiples calendarios
- [ ] Configuración de zona horaria por usuario
- [ ] Sincronización bidireccional (cambios en Google Calendar → base de datos)
- [ ] Integración con Google Meet para citas virtuales
- [ ] Personalización de plantillas de eventos
- [ ] Dashboard de estadísticas de sincronización

## Soporte

Para problemas o preguntas sobre la integración de Google Calendar:

1. Revisar los logs de la aplicación
2. Verificar la configuración de variables de entorno
3. Probar la conexión usando `/test`
4. Consultar la documentación de Google Calendar API

---

**Nota:** Esta integración está diseñada para ser robusta y no afectar el funcionamiento principal de la aplicación si Google Calendar no está disponible.