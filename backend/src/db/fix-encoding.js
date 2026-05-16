require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  const client = await pool.connect();
  try {
    // Fix categories
    await client.query(`UPDATE categories SET name = 'Первые блюда' WHERE sort_order = 1`);
    await client.query(`UPDATE categories SET name = 'Вторые блюда' WHERE sort_order = 2`);
    await client.query(`UPDATE categories SET name = 'Салаты' WHERE sort_order = 3`);
    await client.query(`UPDATE categories SET name = 'Десерты' WHERE sort_order = 4`);
    await client.query(`UPDATE categories SET name = 'Напитки' WHERE sort_order = 5`);
    // Fix admin user
    await client.query(`UPDATE users SET name = 'Администратор' WHERE email = 'admin@mealdelivery.com'`);
    console.log('Encoding fixed successfully');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fix();
