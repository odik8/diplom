const db = require('../config/database');

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'];

exports.createOrder = async (req, res) => {
  const { items, delivery_address, notes } = req.body;
  if (!items || !items.length) return res.status(400).json({ message: 'Order must have items' });
  if (!delivery_address) return res.status(400).json({ message: 'Delivery address required' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Fetch prices from DB to prevent price manipulation
    const itemIds = items.map((i) => i.menu_item_id);
    const { rows: menuItems } = await client.query(
      'SELECT id, name, price FROM menu_items WHERE id = ANY($1) AND is_available = true',
      [itemIds]
    );
    if (menuItems.length !== itemIds.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'One or more items are unavailable' });
    }

    const priceMap = Object.fromEntries(menuItems.map((m) => [m.id, m]));
    let total = 0;
    const orderItemsData = items.map((item) => {
      const menuItem = priceMap[item.menu_item_id];
      const lineTotal = parseFloat(menuItem.price) * item.quantity;
      total += lineTotal;
      return { menu_item_id: item.menu_item_id, name: menuItem.name, quantity: item.quantity, price: menuItem.price };
    });

    const { rows: [order] } = await client.query(
      `INSERT INTO orders (customer_id, total_price, delivery_address, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, total.toFixed(2), delivery_address, notes]
    );

    for (const oi of orderItemsData) {
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, name, quantity, price_at_time)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, oi.menu_item_id, oi.name, oi.quantity, oi.price]
      );
    }

    await client.query('COMMIT');

    const fullOrder = await getOrderWithItems(order.id);
    res.status(201).json(fullOrder);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    client.release();
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT o.*, u.name as courier_name
       FROM orders o LEFT JOIN users u ON o.courier_id = u.id
       WHERE o.customer_id = $1 ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await getOrderWithItems(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Customers can only see their own orders
    if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Couriers can only see orders assigned to them
    if (req.user.role === 'courier' && order.courier_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    const order = rows[0];

    if (order.customer_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot cancel order at this stage' });
    }
    await db.query(
      "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );
    res.json({ message: 'Order cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: get all orders
exports.getAllOrders = async (req, res) => {
  const { status } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  try {
    let query = `SELECT o.*, u.name as customer_name, u.phone as customer_phone,
                        c.name as courier_name
                 FROM orders o
                 LEFT JOIN users u ON o.customer_id = u.id
                 LEFT JOIN users c ON o.courier_id = c.id`;
    const params = [];
    if (status) {
      params.push(status);
      query += ` WHERE o.status = $${params.length}`;
    }
    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    const countResult = await db.query(
      `SELECT COUNT(*) FROM orders${status ? ' WHERE status = $1' : ''}`,
      status ? [status] : []
    );
    res.json({ orders: rows, total: parseInt(countResult.rows[0].count, 10), page, limit });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: update order status
exports.updateOrderStatus = async (req, res) => {
  const { status, courier_id } = req.body;
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  try {
    if (courier_id) {
      const { rows: couriers } = await db.query(
        "SELECT id FROM users WHERE id = $1 AND role = 'courier' AND is_active = true",
        [courier_id]
      );
      if (!couriers.length) return res.status(400).json({ message: 'Invalid courier' });
    }
    const { rows } = await db.query(
      `UPDATE orders SET status = $1, courier_id = COALESCE($2, courier_id), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, courier_id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Courier: get assigned orders
exports.getCourierOrders = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT o.*, u.name as customer_name, u.phone as customer_phone
       FROM orders o LEFT JOIN users u ON o.customer_id = u.id
       WHERE o.courier_id = $1 AND o.status NOT IN ('delivered', 'cancelled')
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Courier: get available (ready) orders
exports.getAvailableOrders = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT o.*, u.name as customer_name, u.phone as customer_phone
       FROM orders o LEFT JOIN users u ON o.customer_id = u.id
       WHERE o.status = 'ready' AND o.courier_id IS NULL
       ORDER BY o.created_at ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Courier: update delivery status
exports.updateDeliveryStatus = async (req, res) => {
  const { status } = req.body;
  const courierAllowedStatuses = ['picked_up', 'delivered'];
  if (!courierAllowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Couriers can only set picked_up or delivered' });
  }
  try {
    const { rows } = await db.query(
      'SELECT * FROM orders WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    if (rows[0].courier_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const { rows: updated } = await db.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Courier: accept an available order
exports.acceptOrder = async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE orders SET courier_id = $1, status = 'picked_up', updated_at = NOW()
       WHERE id = $2 AND status = 'ready' AND courier_id IS NULL RETURNING *`,
      [req.user.id, req.params.id]
    );
    if (!rows.length) return res.status(400).json({ message: 'Order not available' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

async function getOrderWithItems(orderId) {
  const { rows: orders } = await db.query(
    `SELECT o.*, u.name as customer_name, u.phone as customer_phone,
            c.name as courier_name, c.phone as courier_phone
     FROM orders o
     LEFT JOIN users u ON o.customer_id = u.id
     LEFT JOIN users c ON o.courier_id = c.id
     WHERE o.id = $1`,
    [orderId]
  );
  if (!orders.length) return null;
  const order = orders[0];
  const { rows: items } = await db.query(
    'SELECT * FROM order_items WHERE order_id = $1',
    [orderId]
  );
  return { ...order, items };
}
