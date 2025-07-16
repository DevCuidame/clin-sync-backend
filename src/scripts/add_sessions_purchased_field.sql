-- Script para agregar el campo sessions_purchased a la tabla user_sessions
-- Este campo registrará las sesiones compradas inicialmente para llevar un mejor control

ALTER TABLE user_sessions 
ADD COLUMN sessions_purchased INTEGER NOT NULL DEFAULT 0;

-- Actualizar registros existentes: establecer sessions_purchased igual a sessions_remaining + sesiones ya utilizadas
-- Para registros existentes, asumimos que sessions_purchased = sessions_remaining (si no hay appointments)
-- o calculamos basado en appointments existentes

UPDATE user_sessions 
SET sessions_purchased = sessions_remaining 
WHERE sessions_purchased = 0;

-- Comentario: Para registros con appointments existentes, se podría ejecutar una consulta más compleja
-- para calcular las sesiones utilizadas y sumarlas a sessions_remaining para obtener sessions_purchased
-- Ejemplo:
-- UPDATE user_sessions 
-- SET sessions_purchased = sessions_remaining + (
--     SELECT COUNT(*) 
--     FROM appointments 
--     WHERE appointments.user_session_id = user_sessions.user_session_id 
--     AND appointments.status IN ('completed', 'confirmed', 'scheduled')
-- )
-- WHERE sessions_purchased = 0;