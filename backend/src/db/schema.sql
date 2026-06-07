-- Meal Delivery Database Schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer', -- customer | admin | courier
  phone VARCHAR(20),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  weight_grams INTEGER,
  calories INTEGER,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  courier_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  -- pending | confirmed | preparing | ready | picked_up | delivered | cancelled
  total_price DECIMAL(10, 2) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_lat DECIMAL(10, 8),
  delivery_lng DECIMAL(11, 8),
  notes TEXT,
  estimated_delivery_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  price_at_time DECIMAL(10, 2) NOT NULL
);

-- All users and passwords are defined in src/db/credentials.js — run seed-data.js to load them.

-- Seed categories
INSERT INTO categories (name, sort_order) VALUES
  ('Первые блюда',  1),
  ('Вторые блюда',  2),
  ('Салаты',        3),
  ('Десерты',       4),
  ('Напитки',       5)
ON CONFLICT DO NOTHING;
