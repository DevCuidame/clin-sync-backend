-- Migración para agregar soporte de Google Calendar a las citas
-- Fecha: 2024
-- Descripción: Agrega el campo google_calendar_event_id para vincular citas con eventos de Google Calendar

-- Agregar columna para almacenar el ID del evento de Google Calendar
ALTER TABLE appointments 
ADD COLUMN google_calendar_event_id VARCHAR(255) NULL;

-- Agregar comentario a la columna
COMMENT ON COLUMN appointments.google_calendar_event_id IS 'ID del evento correspondiente en Google Calendar';

-- Crear índice para mejorar las consultas por google_calendar_event_id
CREATE INDEX idx_appointments_google_calendar_event_id 
ON appointments(google_calendar_event_id) 
WHERE google_calendar_event_id IS NOT NULL;

-- Verificar que la migración se aplicó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name = 'google_calendar_event_id';