-- Agregar columnas para soporte de compra de servicios
ALTER TABLE purchases 
ADD COLUMN service_id INTEGER REFERENCES services(service_id),
ADD COLUMN purchase_type VARCHAR(20) DEFAULT 'package' CHECK (purchase_type IN ('package', 'service'));

-- Hacer package_id opcional
ALTER TABLE purchases 
ALTER COLUMN package_id DROP NOT NULL;

-- Agregar constraint para asegurar que se especifique package_id O service_id
ALTER TABLE purchases 
ADD CONSTRAINT check_purchase_target 
CHECK (
  (package_id IS NOT NULL AND service_id IS NULL) OR 
  (package_id IS NULL AND service_id IS NOT NULL)
);

-- Actualizar user_sessions para soportar compras de servicios
ALTER TABLE user_sessions 
ALTER COLUMN purchase_id DROP NOT NULL;