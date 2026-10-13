CREATE DATABASE alsaro_db;

-- جدول الزبائن ونقاط الولاء
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الطلبات
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(id),
    total_price DECIMAL(5,2),
    items TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);