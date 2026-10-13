const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // لخدمة ملفات الواجهة الأمامية

// إعداد اتصال قاعدة بيانات PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432
});

// إنشاء جدول reviews تلقائياً إذا لم يكن موجوداً
async function initReviewsTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                rating INTEGER NOT NULL,
                comment TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Reviews table ready.");
    } catch (err) {
        console.error("Error creating reviews table:", err);
    }
}
initReviewsTable();

// 🛒 API استقبال وتسجيل الطلب والزبون معاً
app.post('/api/order', async (req, res) => {
    const { phone, items, total_price } = req.body;

    if (!phone || !items || !total_price) {
        return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
    }

    try {
        let customerResult = await pool.query(
            `SELECT id FROM customers WHERE phone = $1`,
            [phone]
        );

        let customerId;

        if (customerResult.rows.length > 0) {
            customerId = customerResult.rows[0].id;
        } else {
            const newCustomer = await pool.query(
                `INSERT INTO customers (phone) VALUES ($1) RETURNING id`,
                [phone]
            );
            customerId = newCustomer.rows[0].id;
        }

        await pool.query(
            `INSERT INTO orders (customer_id, items, total_price) VALUES ($1, $2, $3)`,
            [customerId, items, total_price]
        );

        console.log("تم حفظ الزبون والطلب في قاعدة البيانات بنجاح!");
        res.json({
            success: true,
            message: 'تم تسجيل الطلب في قاعدة البيانات بنجاح'
        });

    } catch (err) {
        console.error("خطأ في قاعدة البيانات:", err);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
});

// ⭐ API استقبال وحفظ رأي الزبون
app.post('/api/reviews', async (req, res) => {
    const { name, rating, comment } = req.body;
    
    if (!name || !comment) {
        return res.status(400).json({ success: false, message: 'الاسم والتعليق مطلوبان' });
    }

    try {
        const query = `INSERT INTO reviews (name, rating, comment) VALUES ($1, $2, $3) RETURNING id`;
        const values = [name, rating, comment];
        const result = await pool.query(query, values);
        
        res.json({ success: true, id: result.rows[0].id });
    } catch (err) {
        console.error("خطأ في حفظ الرأي:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ⭐ API جلب جميع آراء الزبائن لعرضها في الموقع
app.get('/api/reviews', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM reviews ORDER BY id DESC`);
        res.json(result.rows);
    } catch (err) {
        console.error("خطأ في جلب الآراء:", err);
        res.status(500).json({ error: err.message });
    }
});

// تشغيل السيرفر
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
});