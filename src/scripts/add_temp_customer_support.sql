-- Migración para agregar soporte de clientes temporales a las compras
-- Fecha: 2024
-- Descripción: Agrega el campo temp_customer_id para vincular compras con clientes temporales

-- Agregar columna para clientes temporales (opcional)
ALTER TABLE purchases 
ADD COLUMN temp_customer_id INTEGER NULL;

-- Agregar foreign key constraint
ALTER TABLE purchases 
ADD CONSTRAINT fk_purchases_temp_customer 
FOREIGN KEY (temp_customer_id) REFERENCES temporary_customers(temp_customer_id) ON DELETE SET NULL;

-- Crear índice para mejorar las consultas por temp_customer_id
CREATE INDEX idx_purchases_temp_customer_id 
ON purchases(temp_customer_id) 
WHERE temp_customer_id IS NOT NULL;

-- Agregar comentario a la columna
COMMENT ON COLUMN purchases.temp_customer_id IS 'ID del cliente temporal para compras realizadas por administradores';

-- Modificar el constraint existente para permitir compras con clientes temporales
-- Primero eliminar el constraint existente si existe
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS check_purchase_target;

-- Agregar nuevo constraint que permita:
-- 1. user_id con package_id o service_id (compras normales)
-- 2. temp_customer_id con service_id (compras admin para clientes temporales)
ALTER TABLE purchases 
ADD CONSTRAINT check_purchase_target_with_temp 
CHECK (
  -- Compra normal de usuario: user_id requerido, package_id O service_id
  (user_id IS NOT NULL AND temp_customer_id IS NULL AND 
   ((package_id IS NOT NULL AND service_id IS NULL) OR 
    (package_id IS NULL AND service_id IS NOT NULL))) OR
  -- Compra admin para cliente temporal: temp_customer_id requerido, solo service_id
  (temp_customer_id IS NOT NULL AND user_id IS NOT NULL AND 
   package_id IS NULL AND service_id IS NOT NULL)
);

-- Verificar que la migración se aplicó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchases' 
AND column_name = 'temp_customer_id';