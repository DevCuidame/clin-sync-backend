-- Migración para agregar campos de recordatorios a la tabla appointments
-- Fecha: 2024
-- Descripción: Agrega campos reminder_24h_sent y reminder_2h_sent para el sistema de recordatorios automáticos

-- Agregar campos de recordatorios
ALTER TABLE appointments 
ADD COLUMN reminder_24h_sent BOOLEAN DEFAULT TRUE,
ADD COLUMN reminder_2h_sent BOOLEAN DEFAULT TRUE;

-- Actualizar registros existentes para establecer valores por defecto
UPDATE appointments 
SET reminder_24h_sent = TRUE, reminder_2h_sent = TRUE 
WHERE reminder_24h_sent IS NULL OR reminder_2h_sent IS NULL;

-- Opcional: Eliminar el campo reminder_sent si existe y ya no se usa
-- ALTER TABLE appointments DROP COLUMN IF EXISTS reminder_sent;

-- Crear índices para mejorar el rendimiento de las consultas de recordatorios
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_24h 
ON appointments(scheduled_at, status, reminder_24h_sent) 
WHERE status IN ('scheduled', 'confirmed') AND reminder_24h_sent = TRUE;

CREATE INDEX IF NOT EXISTS idx_appointments_reminder_2h 
ON appointments(scheduled_at, status, reminder_2h_sent) 
WHERE status IN ('scheduled', 'confirmed') AND reminder_2h_sent = TRUE;

-- Comentarios sobre los nuevos campos
COMMENT ON COLUMN appointments.reminder_24h_sent IS 'Indica si los recordatorios de 24 horas están habilitados (TRUE por defecto - obligatorios)';
COMMENT ON COLUMN appointments.reminder_2h_sent IS 'Indica si los recordatorios de 2 horas están habilitados (TRUE por defecto - obligatorios)';