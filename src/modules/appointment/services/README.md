# Sistema de Recordatorios de Citas

Este módulo implementa un sistema completo de recordatorios automáticos para citas médicas.

## Características

### 🔔 Recordatorios Automáticos
- **Recordatorio de 24 horas**: Se envía 24 horas antes de la cita
- **Recordatorio de 2 horas**: Se envía 2 horas antes de la cita
- **Procesamiento automático**: Cron job que se ejecuta cada hora

### 📧 Notificaciones por Email
- Template HTML personalizado con diseño profesional
- Información completa de la cita (fecha, hora, servicio, profesional)
- Botones de acción para confirmar o reprogramar
- Instrucciones de preparación para la cita

### 🗄️ Gestión de Estado
- Campos `reminder_24h_sent` y `reminder_2h_sent` en la base de datos
- Prevención de envío duplicado de recordatorios
- Seguimiento del estado de cada recordatorio

## Componentes

### AppointmentReminderService
**Ubicación**: `appointment-reminder.service.ts`

**Funcionalidades**:
- `scheduleReminder()`: Programa recordatorios para una cita específica
- `cancelReminders()`: Cancela recordatorios programados
- `processReminders()`: Procesa recordatorios pendientes (ejecutado por cron)
- `getReminderStats()`: Obtiene estadísticas de recordatorios

### AppointmentReminderController
**Ubicación**: `appointment-reminder.controller.ts`

**Endpoints**:
- `GET /api/appointments/reminders/stats` - Estadísticas de recordatorios
- `POST /api/appointments/reminders/process` - Procesar recordatorios manualmente
- `POST /api/appointments/reminders/:appointmentId/schedule` - Programar recordatorios
- `DELETE /api/appointments/reminders/:appointmentId` - Cancelar recordatorios
- `GET /api/appointments/reminders/health` - Health check

### Template de Email
**Ubicación**: `../../../templates/appointment-reminder.html`

**Variables disponibles**:
- `{{userName}}` - Nombre del usuario
- `{{reminderType}}` - Tipo de recordatorio ("24 horas" o "2 horas")
- `{{scheduledDate}}` - Fecha de la cita
- `{{scheduledTime}}` - Hora de la cita
- `{{appointmentId}}` - ID de la cita
- `{{serviceName}}` - Nombre del servicio
- `{{professionalName}}` - Nombre del profesional
- `{{duration}}` - Duración en minutos
- `{{amount}}` - Valor del servicio
- `{{websiteUrl}}` - URL del sitio web
- `{{supportEmail}}` - Email de soporte

## Migración de Base de Datos

**Archivo**: `../../../migrations/add-reminder-fields-to-appointments.sql`

```sql
-- Agregar campos de recordatorios
ALTER TABLE appointments 
ADD COLUMN reminder_24h_sent BOOLEAN DEFAULT TRUE,
ADD COLUMN reminder_2h_sent BOOLEAN DEFAULT TRUE;

-- Crear índices para optimizar consultas
CREATE INDEX idx_appointments_reminder_24h ON appointments(reminder_24h_sent, scheduled_date);
CREATE INDEX idx_appointments_reminder_2h ON appointments(reminder_2h_sent, scheduled_date);
```

## Integración Automática

### Al Crear una Cita
Cuando se crea una nueva cita, automáticamente se programan los recordatorios:

```typescript
// En appointment.service.ts - createAppointment()
try {
  await this.reminderService.scheduleReminder(newAppointment.appointment_id, '24h');
  await this.reminderService.scheduleReminder(newAppointment.appointment_id, '2h');
} catch (error) {
  logger.error('Error scheduling reminders:', error);
}
```

### Al Cancelar una Cita
Se cancelan automáticamente los recordatorios programados:

```typescript
// En appointment.service.ts - cancelAppointment()
try {
  await this.reminderService.cancelReminders(appointmentId);
} catch (error) {
  logger.error('Error canceling reminders:', error);
}
```

### Al Reprogramar una Cita
Se cancelan los recordatorios antiguos y se programan nuevos:

```typescript
// En appointment.service.ts - rescheduleAppointment()
try {
  await this.reminderService.cancelReminders(appointmentId);
  await this.reminderService.scheduleReminder(appointmentId, '24h');
  await this.reminderService.scheduleReminder(appointmentId, '2h');
} catch (error) {
  logger.error('Error rescheduling reminders:', error);
}
```

## Configuración del Cron Job

El sistema utiliza `node-cron` para ejecutar automáticamente el procesamiento de recordatorios:

```typescript
// Ejecutar cada hora para verificar recordatorios pendientes
cron.schedule('0 * * * *', async () => {
  await this.processReminders();
});
```

## Monitoreo y Logs

El sistema incluye logging detallado para monitoreo:

- ✅ Recordatorios enviados exitosamente
- ❌ Errores en el envío de recordatorios
- 📊 Estadísticas de procesamiento
- 🔄 Estado de trabajos cron

## Seguridad y Permisos

- Todos los endpoints requieren autenticación
- Acceso restringido a roles `admin` y `professional`
- Validación de datos de entrada
- Manejo seguro de errores

## Dependencias

- `node-cron`: Programación de tareas
- `nodemailer`: Envío de emails
- `typeorm`: ORM para base de datos
- `winston`: Sistema de logging

## Uso

### Programar Recordatorios Manualmente

```bash
POST /api/appointments/reminders/123/schedule
{
  "reminderType": "24h"
}
```

### Obtener Estadísticas

```bash
GET /api/appointments/reminders/stats
```

### Procesar Recordatorios Manualmente

```bash
POST /api/appointments/reminders/process
```

## Consideraciones de Rendimiento

- Los recordatorios se procesan en lotes para optimizar el rendimiento
- Se utilizan índices de base de datos para consultas eficientes
- El cron job se ejecuta cada hora para balancear precisión y recursos
- Se implementa throttling para evitar sobrecarga del servidor de email

## Mantenimiento

- Revisar logs regularmente para detectar problemas
- Monitorear estadísticas de entrega de emails
- Actualizar templates según necesidades del negocio
- Ajustar horarios de cron según volumen de citas