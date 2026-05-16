const db = require('../config/database');

exports.getCategories = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM categories WHERE is_active = true ORDER BY sort_order, name'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMenuItems = async (req, res) => {
  const { category_id } = req.query;
  try {
    let query = `SELECT m.*, c.name as category_name
                 FROM menu_items m LEFT JOIN categories c ON m.category_id = c.id
                 WHERE m.is_available = true`;
    const params = [];
    if (category_id) {
      params.push(category_id);
      query += ` AND m.category_id = $${params.length}`;
    }
    query += ' ORDER BY m.name';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMenuItem = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT m.*, c.name as category_name
       FROM menu_items m LEFT JOIN categories c ON m.category_id = c.id
       WHERE m.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Item not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin only
exports.createCategory = async (req, res) => {
  const { name, image_url, sort_order } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO categories (name, image_url, sort_order) VALUES ($1, $2, $3) RETURNING *',
      [name, image_url, sort_order || 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCategory = async (req, res) => {
  const { name, image_url, sort_order, is_active } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE categories SET
        name = COALESCE($1, name),
        image_url = COALESCE($2, image_url),
        sort_order = COALESCE($3, sort_order),
        is_active = COALESCE($4, is_active)
       WHERE id = $5 RETURNING *`,
      [name, image_url, sort_order, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Category not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await db.query('UPDATE categories SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Category deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createMenuItem = async (req, res) => {
  const { category_id, name, description, price, image_url, weight_grams, calories } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO menu_items (category_id, name, description, price, image_url, weight_grams, calories)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [category_id, name, description, price, image_url, weight_grams, calories]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMenuItem = async (req, res) => {
  const { category_id, name, description, price, image_url, weight_grams, calories, is_available } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE menu_items SET
        category_id = COALESCE($1, category_id),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        image_url = COALESCE($5, image_url),
        weight_grams = COALESCE($6, weight_grams),
        calories = COALESCE($7, calories),
        is_available = COALESCE($8, is_available),
        updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [category_id, name, description, price, image_url, weight_grams, calories, is_available, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Item not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    await db.query('UPDATE menu_items SET is_available = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Item deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
