# Implementación de Horarios de Descanso (Rest Schedules)

## Descripción

Se ha implementado un sistema básico de horarios de descanso que permite a los profesionales definir períodos de descanso dentro de sus horarios de trabajo. Durante estos períodos, no se generarán slots de tiempo disponibles para citas.

## Cambios Realizados

### 1. Modelo de Base de Datos

**Tabla: `schedules`**

Se agregaron las siguientes columnas:

- `has_break` (BOOLEAN): Indica si el horario incluye un período de descanso
- `break_start_time` (TIME): Hora de inicio del descanso
- `break_end_time` (TIME): Hora de fin del descanso
- `break_description` (VARCHAR(100)): Descripción opcional del período de descanso

**Constraints agregados:**
- Si `has_break` es `true`, tanto `break_start_time` como `break_end_time` deben estar presentes
- `break_end_time` debe ser posterior a `break_start_time`

### 2. Interfaces TypeScript

**Archivos modificados:**
- `src/modules/schedule/schedule.interface.ts`

**Interfaces actualizadas:**
- `CreateScheduleDto`
- `UpdateScheduleDto`
- `ScheduleResponseDto`

Todas incluyen los nuevos campos de descanso.

### 3. Servicio de Schedules

**Archivo:** `src/modules/schedule/schedule.service.ts`

**Cambios realizados:**
- Agregado método `validateBreakTimes()` para validar horarios de descanso
- Actualizado `createSchedule()` para validar descansos en nuevos horarios
- Actualizado `updateSchedule()` para validar descansos en actualizaciones
- Actualizado `mapToResponseDto()` para incluir campos de descanso

### 4. Generación de Slots Dinámicos

**Archivo:** `src/modules/time-slot/dynamic-slot.service.ts`

**Cambios realizados:**
- Modificado `generateSlotsFromSchedule()` para considerar períodos de descanso
- Los slots que se solapen con el período de descanso no se generarán

### 5. Migración de Base de Datos

**Archivo:** `src/scripts/add_break_schedule_fields.sql`

Script SQL para agregar las nuevas columnas y constraints a la tabla `schedules`.

## Uso de la API

### Crear un horario con descanso

```bash
POST /api/schedules
Content-Type: application/json
Authorization: Bearer <token>

{
  "professional_id": 1,
  "day_of_week": "monday",
  "start_time": "08:00",
  "end_time": "17:00",
  "has_break": true,
  "break_start_time": "12:00",
  "break_end_time": "13:00",
  "break_description": "Almuerzo",
  "is_active": true
}
```

### Actualizar un horario para agregar descanso

```bash
PUT /api/schedules/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "has_break": true,
  "break_start_time": "12:30",
  "break_end_time": "13:30",
  "break_description": "Descanso de almuerzo"
}
```

### Respuesta de la API

```json
{
  "success": true,
  "message": "Schedule created successfully",
  "data": {
    "schedule_id": 1,
    "professional_id": 1,
    "day_of_week": "monday",
    "start_time": "08:00",
    "end_time": "17:00",
    "has_break": true,
    "break_start_time": "12:00",
    "break_end_time": "13:00",
    "break_description": "Almuerzo",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

## Validaciones Implementadas

1. **Campos requeridos:** Si `has_break` es `true`, tanto `break_start_time` como `break_end_time` son obligatorios
2. **Formato de tiempo:** Los horarios deben estar en formato "HH:MM"
3. **Orden temporal:** `break_end_time` debe ser posterior a `break_start_time`
4. **Rango válido:** El período de descanso debe estar dentro del horario de trabajo (`start_time` a `end_time`)

## Comportamiento del Sistema

### Generación de Slots

Cuando se generan slots de tiempo disponibles:

1. El sistema verifica si el horario tiene `has_break = true`
2. Si hay un descanso configurado, los slots que se solapen con el período de descanso no se crearán
3. Los slots se generan normalmente antes y después del período de descanso

### Ejemplo de Generación de Slots

**Horario:** 08:00 - 17:00 con descanso de 12:00 - 13:00
**Duración de slot:** 30 minutos

**Slots generados:**
- 08:00 - 08:30
- 08:30 - 09:00
- ...
- 11:30 - 12:00
- ~~12:00 - 12:30~~ (bloqueado por descanso)
- ~~12:30 - 13:00~~ (bloqueado por descanso)
- 13:00 - 13:30
- 13:30 - 14:00
- ...
- 16:30 - 17:00

## Próximas Mejoras Sugeridas

1. **Múltiples descansos por día**
2. **Descansos recurrentes automáticos**
3. **Plantillas de descanso**
4. **Integración con notificaciones**
5. **Dashboard de gestión de descansos**
6. **Reportes de utilización de horarios**

## Instalación

1. Ejecutar la migración de base de datos:
   ```bash
   psql -d clin_sync -f src/scripts/add_break_schedule_fields.sql
   ```

2. Reiniciar el servidor para cargar los cambios en el modelo

3. La funcionalidad estará disponible inmediatamente a través de la API existente