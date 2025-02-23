-- Crear las tablas en orden debido a las relaciones

-- Tabla de Usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Tabla de Categorías
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resto de las tablas y triggers...

-- Insertar usuario admin por defecto
INSERT INTO users (username, password, full_name, role)
VALUES (
    'admin',
    '$2a$10$XgXB8FGJXXJ6KZGWt5q2beZutF4iJOPQqZHWTSI9FhXCr6vGZ7wCi', -- password: admin123
    'Administrador',
    'admin'
);
