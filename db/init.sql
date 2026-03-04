-- Crear base de datos (ejecutar como superusuario)
CREATE DATABASE compuconta_db;

\c compuconta_db

-- Tabla de clientes
CREATE TABLE clients (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  nit        VARCHAR(20)  NOT NULL UNIQUE,
  email      VARCHAR(100) NOT NULL UNIQUE,
  active     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Catálogo de módulos
CREATE TABLE modules (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(10)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  price       INTEGER      NOT NULL,
  description TEXT
);

-- Insertar módulos iniciales
INSERT INTO modules (code, name, price, description) VALUES
  ('CONT', 'Contabilidad', 150000, 'Libro diario, mayor y balances'),
  ('FACT', 'Facturación',  120000, 'Factura electrónica DIAN'),
  ('NOM',  'Nómina',       180000, 'Liquidación de nómina y parafiscales'),
  ('INV',  'Inventario',   100000, 'Control de entradas y salidas'),
  ('REP',  'Reportes',      80000, 'Reportes financieros y exportación');

-- Tabla de pagos
CREATE TABLE payments (
  id             SERIAL PRIMARY KEY,
  client_id      INTEGER REFERENCES clients(id),
  onboarding_id  INTEGER,
  amount         INTEGER NOT NULL,
  method         VARCHAR(30) NOT NULL,
  status         VARCHAR(20) NOT NULL,
  transaction_id VARCHAR(50),
  processed_at   TIMESTAMP DEFAULT NOW()
);

-- Tabla de sesiones de onboarding
CREATE TABLE onboarding_sessions (
  id         SERIAL PRIMARY KEY,
  client_id  INTEGER REFERENCES clients(id),
  status     VARCHAR(30) DEFAULT 'in_progress',
  steps      JSONB DEFAULT '[]',
  started_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de notificaciones
CREATE TABLE notifications (
  id        SERIAL PRIMARY KEY,
  recipient VARCHAR(100) NOT NULL,
  type      VARCHAR(50)  NOT NULL,
  subject   VARCHAR(200),
  body      TEXT,
  sent_at   TIMESTAMP DEFAULT NOW()
);