# Clin-Sync Backend

Backend para el sistema de gestión clínica Clin-Sync.

## Módulos Implementados

### Módulo de Notificaciones (`/src/modules/notification`)

Gestiona las notificaciones del sistema para usuarios y citas.

#### Características:
- Creación de notificaciones
- Consulta de notificaciones por usuario, tipo y estado
- Marcado de notificaciones como leídas
- Conteo de notificaciones no leídas
- Eliminación de notificaciones

#### Endpoints:
- `POST /api/notifications` - Crear notificación
- `GET /api/notifications` - Obtener notificaciones (con filtros)
- `GET /api/notifications/unread-count/:userId` - Obtener conteo de no leídas
- `GET /api/notifications/:id` - Obtener notificación por ID
- `PUT /api/notifications/:id` - Actualizar notificación
- `PATCH /api/notifications/:id/read` - Marcar como leída
- `DELETE /api/notifications/:id` - Eliminar notificación

#### Tipos de Notificación:
- `appointment_reminder` - Recordatorio de cita
- `appointment_confirmation` - Confirmación de cita
- `appointment_cancellation` - Cancelación de cita
- `payment_confirmation` - Confirmación de pago
- `system_notification` - Notificación del sistema

### Módulo de Citas (`/src/modules/appointment`)

Gestiona las citas médicas entre usuarios y profesionales.

#### Características:
- Creación de citas con verificación de disponibilidad
- Consulta de citas con filtros avanzados
- Actualización y reprogramación de citas
- Cancelación de citas con razón
- Confirmación y completado de citas
- Obtención de citas próximas

#### Endpoints:
- `POST /api/appointments` - Crear cita
- `GET /api/appointments` - Obtener citas (con filtros)
- `GET /api/appointments/upcoming/:userId` - Obtener citas próximas
- `GET /api/appointments/:id` - Obtener cita por ID
- `PUT /api/appointments/:id` - Actualizar cita
- `PATCH /api/appointments/:id/cancel` - Cancelar cita
- `PATCH /api/appointments/:id/reschedule` - Reprogramar cita
- `PATCH /api/appointments/:id/confirm` - Confirmar cita
- `PATCH /api/appointments/:id/complete` - Completar cita
- `DELETE /api/appointments/:id` - Eliminar cita

#### Estados de Cita:
- `scheduled` - Programada
- `confirmed` - Confirmada
- `in_progress` - En progreso
- `completed` - Completada
- `cancelled` - Cancelada
- `no_show` - No se presentó

## Estructura de Base de Datos

Los módulos están basados en las siguientes tablas de la base de datos:

### Tabla `notifications`
- `notification_id` (PK)
- `user_id` (FK a users)
- `appointment_id` (FK a appointments, opcional)
- `type` (enum)
- `title`
- `message`
- `status` (enum)
- `scheduled_for`
- `sent_at`
- `metadata` (JSON)
- `created_at`

### Tabla `appointments`
- `appointment_id` (PK)
- `user_id` (FK a users)
- `professional_id` (FK a professionals)
- `service_id` (FK a services)
- `user_session_id` (FK a user_sessions, opcional)
- `scheduled_at`
- `duration_minutes`
- `status` (enum)
- `amount`
- `notes`
- `cancellation_reason`
- `reminder_sent`
- `specialty_id`
- `location`
- `modified_by_id`
- `recurring_appointment_id`
- `created_at`
- `updated_at`

## Instalación y Configuración

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno en `.env`

3. Ejecutar migraciones de base de datos:
```bash
npm run migration:run
```

4. Compilar TypeScript:
```bash
npm run build
```

5. Iniciar servidor:
```bash
npm start
```

## Desarrollo

Para desarrollo con recarga automática:
```bash
npm run dev
```

## Validación

Todos los endpoints utilizan validación con `class-validator` para asegurar la integridad de los datos.

## Autenticación

Todos los endpoints requieren autenticación mediante el middleware `authMiddleware`.

## Manejo de Errores

Se utiliza la clase `ErrorHandler` para el manejo consistente de errores en toda la aplicación.