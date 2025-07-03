# Módulo de Limpieza de Base de Datos

Este módulo se encarga de limpiar automáticamente la base de datos eliminando registros obsoletos como time slots y appointments que ya están en el pasado.

## Características

- ✅ **Limpieza automática programada**: Ejecuta limpieza todos los días a las 2:00 AM
- ✅ **Limpieza manual**: Endpoints para ejecutar limpieza bajo demanda
- ✅ **Modo simulación (dry-run)**: Permite ver qué se eliminaría sin hacer cambios reales
- ✅ **Procesamiento por lotes**: Evita sobrecargar la base de datos
- ✅ **Configuración flexible**: Personalizable mediante variables de entorno
- ✅ **Logging detallado**: Registra todas las operaciones para auditoría
- ✅ **Seguridad**: Solo administradores pueden ejecutar limpieza manual

## Instalación de Dependencias

Antes de usar el módulo, instala las dependencias necesarias:

```bash
npm install node-cron @types/node-cron
```

## Configuración

### Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
# Configuración del scheduler
CLEANUP_SCHEDULER_ENABLED=true
CLEANUP_CRON_EXPRESSION="0 2 * * *"  # 2:00 AM todos los días
CLEANUP_TIMEZONE="America/Bogota"

# Configuración de limpieza
CLEANUP_DAYS_BACK=0                 # Solo eliminar del día actual hacia atrás
CLEANUP_BATCH_SIZE=200              # Tamaño del lote para procesamiento nocturno
CLEANUP_MAX_RETRIES=3               # Máximo número de reintentos

# Configuración de seguridad
CLEANUP_MAX_DELETION_PER_BATCH=1000
CLEANUP_REQUIRE_CONFIRMATION=true
CLEANUP_LARGE_DELETION_THRESHOLD=500

# Configuración de logging
CLEANUP_LOG_LEVEL=info
CLEANUP_LOG_TO_FILE=true
CLEANUP_RETAIN_LOG_DAYS=30
```

## Endpoints de la API

### 1. Obtener Estadísticas

```http
GET /api/database-cleanup/stats?daysBack=0
Authorization: Bearer <admin_token>
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Estadísticas obtenidas exitosamente",
  "data": {
    "timeSlotsToDelete": 150,
    "appointmentsToDelete": 75,
    "totalToDelete": 225,
    "daysBack": 0,
    "cutoffDate": "2024-01-15T23:59:59.999Z"
  }
}
```

### 2. Simulación de Limpieza (Dry Run)

```http
POST /api/database-cleanup/dry-run
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "daysBack": 0,
  "batchSize": 100
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Simulación de limpieza completada",
  "data": {
    "wouldDeleteTimeSlots": 150,
    "wouldDeleteAppointments": 75,
    "totalWouldDelete": 225,
    "errors": [],
    "options": {
      "daysBack": 0,
      "dryRun": true,
      "batchSize": 100
    }
  }
}
```

### 3. Ejecutar Limpieza Real

```http
POST /api/database-cleanup/execute
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "daysBack": 0,
  "dryRun": false,
  "batchSize": 200
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Limpieza completada exitosamente",
  "data": {
    "deletedTimeSlots": 150,
    "deletedAppointments": 75,
    "totalDeleted": 225,
    "errors": [],
    "options": {
      "daysBack": 0,
      "dryRun": false,
      "batchSize": 200
    }
  }
}
```

## Lógica de Limpieza

### Time Slots

Se eliminan time slots que cumplan **TODAS** estas condiciones:
- `slot_date` anterior a la fecha de corte
- Estado en: `AVAILABLE`, `BLOCKED`, `CANCELLED`
- **NO se eliminan** slots con estado `BOOKED`

### Appointments

Se eliminan appointments que cumplan **TODAS** estas condiciones:
- `scheduled_at` anterior a la fecha de corte
- Estado en: `COMPLETED`, `CANCELLED`, `NO_SHOW`
- **NO se eliminan** appointments con estado `SCHEDULED`, `CONFIRMED`, `IN_PROGRESS`

## Programación Automática

El módulo incluye un scheduler que ejecuta limpieza automática:

- **Horario por defecto**: 2:00 AM todos los días
- **Zona horaria**: America/Bogota (configurable)
- **Configuración**: Mediante expresiones cron
- **Logging**: Registra cada ejecución automática

### Expresiones Cron Comunes

```bash
"0 2 * * *"     # Todos los días a las 2:00 AM
"0 3 * * 0"     # Domingos a las 3:00 AM
"0 1 1 * *"     # Primer día de cada mes a la 1:00 AM
"0 2 * * 1-5"   # Lunes a viernes a las 2:00 AM
```

## Uso Programático

```typescript
import { 
  DatabaseCleanupService, 
  getCleanupScheduler,
  initializeDatabaseCleanup 
} from './modules/database-cleanup';

// Usar el servicio directamente
const cleanupService = new DatabaseCleanupService();

// Ejecutar limpieza manual
const result = await cleanupService.performCleanup({
  daysBack: 7,
  dryRun: false,
  batchSize: 100
});

// Obtener estadísticas
const stats = await cleanupService.getCleanupStats(7);

// Usar el scheduler
const scheduler = getCleanupScheduler();
const status = scheduler.getStatus();
```

## Seguridad

- **Autenticación requerida**: Todos los endpoints requieren token JWT válido
- **Autorización**: Solo usuarios con rol `admin` pueden acceder
- **Validaciones**: Parámetros validados para prevenir operaciones peligrosas
- **Límites**: Configuración de límites máximos de eliminación

## Monitoreo y Logs

El módulo genera logs detallados:

```
[2024-01-15 02:00:00] INFO: Iniciando limpieza programada de base de datos
[2024-01-15 02:00:01] INFO: Limpiando time slots anteriores a: 2024-01-15T23:59:59.999Z
[2024-01-15 02:00:02] INFO: Eliminados 50 time slots en este lote
[2024-01-15 02:00:03] INFO: Limpiando appointments anteriores a: 2024-01-15T23:59:59.999Z
[2024-01-15 02:00:04] INFO: Eliminadas 25 appointments en este lote
[2024-01-15 02:00:05] INFO: Limpieza programada completada en 5000ms
```

## Estructura de Archivos

```
src/modules/database-cleanup/
├── database-cleanup.service.ts      # Lógica principal de limpieza
├── database-cleanup.controller.ts   # Controladores HTTP
├── database-cleanup.routes.ts       # Definición de rutas
├── database-cleanup.scheduler.ts    # Programación automática
├── database-cleanup.config.ts       # Configuración del módulo
└── index.ts                         # Exportaciones y inicialización
```

## Consideraciones de Rendimiento

- **Procesamiento por lotes**: Evita cargar toda la base de datos en memoria
- **Ejecución nocturna**: Minimiza impacto en horarios de alta demanda
- **Índices de base de datos**: Asegúrate de tener índices en `slot_date` y `scheduled_at`
- **Monitoreo**: Supervisa el tiempo de ejecución y ajusta `batchSize` si es necesario

## Troubleshooting

### El scheduler no se inicia
- Verifica que `CLEANUP_SCHEDULER_ENABLED=true`
- Revisa la expresión cron en `CLEANUP_CRON_EXPRESSION`
- Consulta los logs para errores de inicialización

### Limpieza muy lenta
- Reduce el `batchSize`
- Verifica índices en las tablas
- Considera ejecutar en horarios de menor carga

### Errores de permisos
- Verifica que el usuario tenga rol `admin`
- Confirma que el token JWT sea válido
- Revisa la configuración de middleware de autenticación

## Futuras Mejoras

- [ ] Limpieza de otros tipos de registros (logs, sesiones expiradas)
- [ ] Métricas de rendimiento y dashboard
- [ ] Notificaciones por email de resultados de limpieza
- [ ] Configuración de retención por tipo de registro
- [ ] Integración con sistemas de monitoreo externos