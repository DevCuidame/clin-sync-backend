-- Script para agregar restricción única a la tabla user_roles
-- Este script debe ejecutarse en la base de datos existente

-- Primero, eliminar cualquier duplicado existente manteniendo solo el más reciente
WITH duplicates AS (
    SELECT user_role_id,
           ROW_NUMBER() OVER (
               PARTITION BY user_id, role_id 
               ORDER BY assigned_at DESC, user_role_id DESC
           ) as rn
    FROM user_roles
)
DELETE FROM user_roles 
WHERE user_role_id IN (
    SELECT user_role_id 
    FROM duplicates 
    WHERE rn > 1
);

-- Agregar la restricción única compuesta
ALTER TABLE user_roles 
ADD CONSTRAINT uk_user_roles_user_id_role_id 
UNIQUE (user_id, role_id);

-- Verificar que la restricción se agregó correctamente
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'user_roles'::regclass 
AND contype = 'u';