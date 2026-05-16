const db = require('../config/database');
const bcrypt = require('bcryptjs');

exports.getStats = async (req, res) => {
  try {
    const [orders, revenue, users, pendingOrders] = await Promise.all([
      db.query("SELECT COUNT(*) FROM orders WHERE status != 'cancelled'"),
      db.query("SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status = 'delivered'"),
      db.query("SELECT COUNT(*) FROM users WHERE role = 'customer'"),
      db.query("SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'confirmed', 'preparing', 'ready')"),
    ]);
    res.json({
      total_orders: parseInt(orders.rows[0].count),
      total_revenue: parseFloat(revenue.rows[0].total),
      total_customers: parseInt(users.rows[0].count),
      pending_orders: parseInt(pendingOrders.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUsers = async (req, res) => {
  const { role } = req.query;
  try {
    let query = 'SELECT id, name, email, role, phone, address, is_active, created_at FROM users';
    const params = [];
    if (role) {
      params.push(role);
      query += ` WHERE role = $1`;
    }
    query += ' ORDER BY created_at DESC';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createCourier = async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length) return res.status(409).json({ message: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, 'courier', $4) RETURNING id, name, email, role, phone`,
      [name, email, password_hash, phone]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, name, email, role, is_active',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM categories ORDER BY sort_order, name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllMenuItems = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT m.*, c.name as category_name
       FROM menu_items m LEFT JOIN categories c ON m.category_id = c.id
       ORDER BY c.sort_order, m.name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
