-- Knauf Karaj — SQLite schema (idempotent).
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  username             TEXT NOT NULL UNIQUE,
  password_hash        TEXT NOT NULL,
  role                 TEXT NOT NULL DEFAULT 'admin',
  must_change_password INTEGER NOT NULL DEFAULT 0,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  image         TEXT,
  image_alt     TEXT,
  is_published  INTEGER NOT NULL DEFAULT 1,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT,
  category_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  images          TEXT NOT NULL DEFAULT '[]',   -- [{url, alt}]
  price           INTEGER,                      -- تومان, NULL = قیمت ثبت نشده
  sale_price      INTEGER,
  unit            TEXT,
  stock_quantity  INTEGER,                      -- NULL = موجودی ثبت نشده
  is_published    INTEGER NOT NULL DEFAULT 0,
  is_featured     INTEGER NOT NULL DEFAULT 0,
  seo_title       TEXT,
  seo_description TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

CREATE TABLE IF NOT EXISTS services (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  description  TEXT,
  benefits     TEXT NOT NULL DEFAULT '[]',      -- [string]
  image        TEXT,
  image_alt    TEXT,
  is_published INTEGER NOT NULL DEFAULT 1,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT
);

CREATE TABLE IF NOT EXISTS portfolio_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  description  TEXT,
  category     TEXT,                            -- مسکونی / تجاری / اداری / بازسازی
  images       TEXT NOT NULL DEFAULT '[]',
  area         TEXT,
  specs        TEXT,
  is_sample    INTEGER NOT NULL DEFAULT 0,      -- 1 = تصویر نمایشی (نمونه طراحی)
  is_published INTEGER NOT NULL DEFAULT 1,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number   TEXT NOT NULL UNIQUE,
  tracking_code  TEXT NOT NULL UNIQUE,
  customer_name  TEXT NOT NULL,
  phone          TEXT NOT NULL,
  email          TEXT,
  city           TEXT,
  address        TEXT,
  postal_code    TEXT,
  note           TEXT,
  items          TEXT NOT NULL DEFAULT '[]',    -- snapshot: [{product_id,name,unit,unit_price,quantity,line_total}]
  subtotal       INTEGER NOT NULL DEFAULT 0,
  discount       INTEGER NOT NULL DEFAULT 0,
  shipping_cost  INTEGER NOT NULL DEFAULT 0,
  total          INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'offline',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',   -- unpaid | awaiting_gateway | paid
  order_status   TEXT NOT NULL DEFAULT 'new',      -- new | confirmed | processing | shipped | completed | cancelled
  is_test        INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  note       TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_requests (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  tracking_code     TEXT NOT NULL UNIQUE,
  customer_name     TEXT NOT NULL,
  phone             TEXT NOT NULL,
  project_type      TEXT,
  service_type      TEXT,
  estimated_area    TEXT,
  location          TEXT,
  description       TEXT,
  attachments       TEXT NOT NULL DEFAULT '[]',
  preferred_contact TEXT,
  status            TEXT NOT NULL DEFAULT 'new',  -- new | reviewing | need_info | quoted | completed | cancelled
  admin_note        TEXT,
  is_test           INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT
);

CREATE TABLE IF NOT EXISTS wholesale_requests (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  tracking_code       TEXT NOT NULL UNIQUE,
  full_name           TEXT NOT NULL,
  phone               TEXT NOT NULL,
  company             TEXT,
  product_type        TEXT,
  estimated_quantity  TEXT,
  city                TEXT,
  description         TEXT,
  status              TEXT NOT NULL DEFAULT 'new',
  admin_note          TEXT,
  is_test             INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  rating       INTEGER NOT NULL DEFAULT 5,
  text         TEXT NOT NULL,
  product_id   INTEGER REFERENCES products(id) ON DELETE SET NULL,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS faqs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  question     TEXT NOT NULL,
  answer       TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 1,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pages (
  slug            TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  seo_title       TEXT,
  seo_description TEXT,
  body            TEXT NOT NULL DEFAULT '',
  updated_at      TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS activity_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  actor      TEXT,
  action     TEXT NOT NULL,
  entity     TEXT,
  entity_id  TEXT,
  details    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
