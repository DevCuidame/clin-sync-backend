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