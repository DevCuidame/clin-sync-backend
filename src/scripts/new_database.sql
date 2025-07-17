-- Tabla de usuarios
CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(255) NOT NULL,
    code integer NOT NULL
);

CREATE TABLE townships (
    id bigint NOT NULL,
    department_id bigint NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    CONSTRAINT townships_pkey PRIMARY KEY (id)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    identification_type character varying(100) NOT NULL,
    identification_number character varying(80),
    birth_date DATE,
    gender VARCHAR(10) NOT NULL,
    address character varying(100),
    city_id bigint,
    phone character varying(80) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'suspended', 'pending')) DEFAULT 'active',
    session_token character varying(255),
    verified boolean NOT NULL,
    pubname character varying(100),
    privname character varying(100),
    imagebs64 text,
    path character varying(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES townships(id) ON DELETE SET NULL
);

-- Tabla de roles
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación usuarios-roles
CREATE TABLE user_roles (
    user_role_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

-- Tabla de profesionales
CREATE TABLE professionals (
    professional_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    specialization VARCHAR(200),
    bio TEXT,
    hourly_rate DECIMAL(10, 2),
    experience_years INT,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'suspended', 'pending_approval')) DEFAULT 'pending_approval',
    availability_config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de servicios
CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    service_name VARCHAR(200) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    duration_minutes INT NOT NULL,
    category VARCHAR(50) CHECK (category IN ('consultation', 'therapy', 'assessment', 'workshop', 'other')) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500) NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de servicios por profesional
CREATE TABLE professional_services (
    prof_service_id SERIAL PRIMARY KEY,
    professional_id INT NOT NULL,
    service_id INT NOT NULL,
    custom_price DECIMAL(10, 2),
    custom_duration INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professional_id) REFERENCES professionals(professional_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- Tabla de paquetes
CREATE TABLE packages (
    package_id SERIAL PRIMARY KEY,
    package_name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    total_sessions INT NOT NULL,
    validity_days INT NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500) NULL,
    terms_conditions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de servicios incluidos en paquetes
CREATE TABLE package_services (
    package_service_id SERIAL PRIMARY KEY,
    package_id INT NOT NULL,
    service_id INT NOT NULL,
    sessions_included INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES packages(package_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- Tabla de compras
CREATE TABLE purchases (
    purchase_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    package_id INT,
    service_id INT,
    purchase_type VARCHAR(20) CHECK (purchase_type IN ('package', 'service')) DEFAULT 'package',
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')) DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    payment_details JSONB,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES packages(package_id) ON DELETE RESTRICT,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE RESTRICT
);

-- Tabla de transacciones de pago
CREATE TABLE payment_transactions (
    transaction_id SERIAL PRIMARY KEY,
    purchase_id INT NOT NULL,
    gateway_provider VARCHAR(100) NOT NULL,
    gateway_transaction_id VARCHAR(255),
    payment_intent_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')) DEFAULT 'pending',
    gateway_response JSONB,
    webhook_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (purchase_id) REFERENCES purchases(purchase_id) ON DELETE CASCADE
);

-- Tabla de webhooks de pago
CREATE TABLE payment_webhooks (
    webhook_id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL,
    provider VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) CHECK (status IN ('received', 'processing', 'processed', 'failed')) DEFAULT 'received',
    signature VARCHAR(500),
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    error_message TEXT,
    FOREIGN KEY (transaction_id) REFERENCES payment_transactions(transaction_id) ON DELETE CASCADE
);

-- Tabla de sesiones de usuario
CREATE TABLE user_sessions (
    user_session_id SERIAL PRIMARY KEY,
    purchase_id INT,
    service_id INT NOT NULL,
    sessions_remaining INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'expired', 'exhausted', 'cancelled')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES purchases(purchase_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE RESTRICT
);

-- Tabla de citas
CREATE TABLE appointments (
    appointment_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    professional_id INT NOT NULL,
    service_id INT NOT NULL,
    user_session_id INT,
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
    amount DECIMAL(10, 2),
    notes TEXT,
    cancellation_reason TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (professional_id) REFERENCES professionals(professional_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE RESTRICT,
    FOREIGN KEY (user_session_id) REFERENCES user_sessions(user_session_id) ON DELETE SET NULL
);

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

-- Tabla de horarios de profesionales
CREATE TABLE schedules (
    schedule_id SERIAL PRIMARY KEY,
    professional_id INT NOT NULL,
    day_of_week VARCHAR(10) CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    valid_from DATE,
    valid_until DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professional_id) REFERENCES professionals(professional_id) ON DELETE CASCADE
);

-- Tabla de excepciones de disponibilidad
CREATE TABLE availability_exceptions (
    exception_id SERIAL PRIMARY KEY,
    professional_id INT NOT NULL,
    exception_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    type VARCHAR(15) CHECK (type IN ('unavailable', 'available', 'break', 'vacation')) NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professional_id) REFERENCES professionals(professional_id) ON DELETE CASCADE
);

-- Tabla de slots de tiempo
CREATE TABLE time_slots (
    slot_id SERIAL PRIMARY KEY,
    professional_id INT NOT NULL,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    status VARCHAR(15) CHECK (status IN ('available', 'booked', 'blocked', 'cancelled')) DEFAULT 'available',
    price_override DECIMAL(10, 2),
    max_bookings INT DEFAULT 1,
    current_bookings INT DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professional_id) REFERENCES professionals(professional_id) ON DELETE CASCADE
);

-- Tabla de slots recurrentes
CREATE TABLE recurring_slots (
    recurring_slot_id SERIAL PRIMARY KEY,
    professional_id INT NOT NULL,
    day_of_week VARCHAR(10) CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')) NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    interval_minutes INT NOT NULL,
    valid_from DATE NOT NULL,
    valid_until DATE,
    status VARCHAR(10) CHECK (status IN ('active', 'inactive', 'paused')) DEFAULT 'active',
    exclusion_dates JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professional_id) REFERENCES professionals(professional_id) ON DELETE CASCADE
);

-- Tabla de reservas de slots
CREATE TABLE slot_bookings (
    booking_id SERIAL PRIMARY KEY,
    slot_id INT NOT NULL,
    appointment_id INT NOT NULL,
    booking_status VARCHAR(15) CHECK (booking_status IN ('reserved', 'confirmed', 'cancelled', 'completed')) DEFAULT 'reserved',
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason VARCHAR(255),
    FOREIGN KEY (slot_id) REFERENCES time_slots(slot_id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE
);

-- Tabla de notificaciones
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    appointment_id INT,
    type VARCHAR(30) CHECK (type IN ('appointment_reminder', 'appointment_confirmation', 'appointment_cancellation', 'payment_confirmation', 'system_notification')) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(10) CHECK (status IN ('pending', 'sent', 'failed', 'read')) DEFAULT 'pending',
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE
);

-- Tabla de reseñas
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    appointment_id INT NOT NULL,
    user_id INT NOT NULL,
    professional_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status VARCHAR(10) CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (professional_id) REFERENCES professionals(professional_id) ON DELETE CASCADE
);

-- Tabla de métodos de pago
CREATE TABLE payment_methods (
    payment_method_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'digital_wallet')) NOT NULL,
    provider VARCHAR(100),
    token VARCHAR(500),
    details JSONB,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de auditoría
CREATE TABLE audit_log (
    log_id SERIAL PRIMARY KEY,
    user_id INT,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INT NOT NULL,
    action_type VARCHAR(10) CHECK (action_type IN ('create', 'update', 'delete', 'login', 'logout', 'view', 'export')) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices adicionales para mejorar el rendimiento
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_professionals_status ON professionals(status);

CREATE INDEX idx_professionals_specialization ON professionals(specialization);

CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);

CREATE INDEX idx_appointments_status ON appointments(status);

CREATE INDEX idx_appointments_user_professional ON appointments(user_id, professional_id);

CREATE INDEX idx_time_slots_date_professional ON time_slots(slot_date, professional_id);

CREATE INDEX idx_time_slots_status ON time_slots(status);

CREATE INDEX idx_purchases_user_status ON purchases(user_id, payment_status);

CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);

CREATE INDEX idx_reviews_professional_rating ON reviews(professional_id, rating);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

CREATE INDEX idx_audit_log_user_action ON audit_log(user_id, action_type);

-- Insertar roles básicos
INSERT INTO
    roles (role_name, description, permissions, is_active)
VALUES
    (
        'admin',
        'Administrador del sistema',
        '{"all": true}',
        TRUE
    ),
    (
        'professional',
        'Profesional que ofrece servicios',
        '{"manage_schedule": true, "view_appointments": true, "manage_services": true}',
        TRUE
    ),
    (
        'client',
        'Cliente que reserva servicios',
        '{"book_appointments": true, "view_appointments": true, "make_payments": true}',
        TRUE
    ),
    (
        'moderator',
        'Moderador de contenido',
        '{"manage_reviews": true, "manage_content": true}',
        TRUE
    );

 CREATE TYPE identification_type_enum AS ENUM ('CC', 'CE', 'TI', 'PP', 'NIT');

CREATE TABLE temporary_customers (
  temp_customer_id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  identification_number VARCHAR(50),
  identification_type identification_type_enum DEFAULT 'CC',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT, -- ID del administrador que creó el registro
  FOREIGN KEY (created_by) REFERENCES users(id)
);


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



-- Migration: Make transaction_id nullable in payment_webhooks table
-- This allows webhooks to be saved even when the corresponding transaction hasn't been created yet
-- (for cases where webhooks arrive before transactions are recorded)

BEGIN;

-- Make transaction_id column nullable
ALTER TABLE payment_webhooks 
ALTER COLUMN transaction_id DROP NOT NULL;

-- Add a comment to document the change
COMMENT ON COLUMN payment_webhooks.transaction_id IS 'Foreign key to payment_transactions. Can be null for orphaned webhooks that arrive before transaction creation.';

COMMIT;

-- Verify the change
-- SELECT column_name, is_nullable, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'payment_webhooks' AND column_name = 'transaction_id';



-- Migration: Add reference field to purchases table
-- Date: 2024
-- Description: Adds a reference field to the purchases table for tracking purchase references

ALTER TABLE purchases 
ADD COLUMN reference VARCHAR(255);

-- Add index for better query performance on reference field
CREATE INDEX idx_purchases_reference ON purchases(reference);

-- Update existing records with generated references
UPDATE purchases 
SET reference = CASE 
    WHEN purchase_type = 'package' AND package_id IS NOT NULL THEN 
        'PACKAGE-' || package_id || '-' || EXTRACT(EPOCH FROM purchase_date)::bigint || '-' || substr(md5(random()::text), 1, 9)
    WHEN purchase_type = 'service' AND service_id IS NOT NULL THEN 
        'SERVICE-' || service_id || '-' || EXTRACT(EPOCH FROM purchase_date)::bigint || '-' || substr(md5(random()::text), 1, 9)
    ELSE 
        'PURCHASE-' || purchase_id || '-' || EXTRACT(EPOCH FROM purchase_date)::bigint || '-' || substr(md5(random()::text), 1, 9)
END
WHERE reference IS NULL;

-- Verify the migration
SELECT 
    COUNT(*) as total_purchases,
    COUNT(reference) as purchases_with_reference,
    COUNT(*) - COUNT(reference) as purchases_without_reference
FROM purchases;

-- Show sample of updated records
SELECT 
    purchase_id,
    purchase_type,
    package_id,
    service_id,
    reference,
    purchase_date
FROM purchases 
ORDER BY purchase_id 
LIMIT 10;