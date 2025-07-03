-- Migración para agregar campos de horarios de descanso a los schedules
-- Fecha: 2024
-- Descripción: Agrega campos para manejar descansos en los horarios de los profesionales

-- Agregar columna para indicar si el horario tiene descanso
ALTER TABLE schedules 
ADD COLUMN has_break BOOLEAN DEFAULT FALSE;

-- Agregar columna para la hora de inicio del descanso
ALTER TABLE schedules 
ADD COLUMN break_start_time TIME NULL;

-- Agregar columna para la hora de fin del descanso
ALTER TABLE schedules 
ADD COLUMN break_end_time TIME NULL;

-- Agregar columna para descripción del descanso
ALTER TABLE schedules 
ADD COLUMN break_description VARCHAR(100) NULL;

-- Agregar comentarios a las columnas
COMMENT ON COLUMN schedules.has_break IS 'Indica si el horario incluye un período de descanso';
COMMENT ON COLUMN schedules.break_start_time IS 'Hora de inicio del descanso';
COMMENT ON COLUMN schedules.break_end_time IS 'Hora de fin del descanso';
COMMENT ON COLUMN schedules.break_description IS 'Descripción opcional del período de descanso';

-- Crear índice para mejorar las consultas por horarios con descanso
CREATE INDEX idx_schedules_has_break 
ON schedules(has_break) 
WHERE has_break = TRUE;

-- Agregar constraint para validar que si has_break es true, ambas horas de descanso deben estar presentes
ALTER TABLE schedules 
ADD CONSTRAINT chk_break_times 
CHECK (
    (has_break = FALSE) OR 
    (has_break = TRUE AND break_start_time IS NOT NULL AND break_end_time IS NOT NULL)
);

-- Agregar constraint para validar que la hora de fin sea posterior a la hora de inicio
ALTER TABLE schedules 
ADD CONSTRAINT chk_break_time_order 
CHECK (
    (break_start_time IS NULL AND break_end_time IS NULL) OR 
    (break_start_time < break_end_time)
);

-- Verificar que la migración se aplicó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'schedules' 
AND column_name IN ('has_break', 'break_start_time', 'break_end_time', 'break_description')
ORDER BY column_name;