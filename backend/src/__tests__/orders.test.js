process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../app');
const db = require('../config/database');
const jwt = require('jsonwebtoken');

jest.mock('../config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const customerToken = jwt.sign({ id: 10, role: 'customer', name: 'C', email: 'c@c.com' }, 'test-secret');
const courierToken  = jwt.sign({ id: 20, role: 'courier',  name: 'D', email: 'd@d.com' }, 'test-secret');
const adminToken    = jwt.sign({ id: 1,  role: 'admin',    name: 'A', email: 'a@a.com' }, 'test-secret');

const mockClient = { query: jest.fn(), release: jest.fn() };

describe('Orders API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    db.connect.mockResolvedValue(mockClient);
  });

  // ─── Customer: create order ────────────────────────────────────────────────

  describe('POST /api/orders', () => {
    it('401 – unauthenticated', async () => {
      const res = await request(app).post('/api/orders').send({ items: [{ menu_item_id: 1, quantity: 1 }], delivery_address: 'Moscow, Lenina 1' });
      expect(res.status).toBe(401);
    });

    it('403 – courier cannot create order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${courierToken}`)
        .send({ items: [{ menu_item_id: 1, quantity: 1 }], delivery_address: 'Moscow, Lenina 1' });
      expect(res.status).toBe(403);
    });

    it('400 – empty items array', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ items: [], delivery_address: 'Moscow, Lenina 1' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/items/i);
    });

    it('400 – missing delivery_address', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ items: [{ menu_item_id: 1, quantity: 1 }] });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/address/i);
    });

    it('400 – item not available in DB', async () => {
      mockClient.query
        .mockResolvedValueOnce({})          // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // no items found
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ items: [{ menu_item_id: 999, quantity: 1 }], delivery_address: 'Moscow, Lenina 1' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('unavailable');
    });

    it('201 – creates order and returns full order', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Pizza', price: '300.00' }] }) // menu items
        .mockResolvedValueOnce({ rows: [{ id: 101, customer_id: 10, total_price: '300.00', status: 'pending', delivery_address: 'Moscow, Lenina 1' }] }) // order insert
        .mockResolvedValueOnce({}) // order_item insert
        .mockResolvedValueOnce({}); // COMMIT
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 101, customer_id: 10, customer_name: 'C', courier_name: null }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Pizza', quantity: 1, price_at_time: '300.00' }] });
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ items: [{ menu_item_id: 1, quantity: 1 }], delivery_address: 'Moscow, Lenina 1' });
      expect(res.status).toBe(201);
      expect(res.body.id).toBe(101);
      expect(res.body.items).toHaveLength(1);
    });
  });

  // ─── Customer: get my orders ───────────────────────────────────────────────

  describe('GET /api/orders/my', () => {
    it('403 – courier cannot access', async () => {
      const res = await request(app).get('/api/orders/my').set('Authorization', `Bearer ${courierToken}`);
      expect(res.status).toBe(403);
    });

    it('200 – returns customer own orders', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'delivered' }, { id: 2, status: 'pending' }] });
      const res = await request(app).get('/api/orders/my').set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  // ─── Customer: cancel order ────────────────────────────────────────────────

  describe('PATCH /api/orders/:id/cancel', () => {
    it('404 – order not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).patch('/api/orders/999/cancel').set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(404);
    });

    it('403 – cannot cancel another customers order', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, customer_id: 99, status: 'pending' }] });
      const res = await request(app).patch('/api/orders/1/cancel').set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('400 – cannot cancel order in preparing stage', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, customer_id: 10, status: 'preparing' }] });
      const res = await request(app).patch('/api/orders/1/cancel').set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(400);
    });

    it('400 – cannot cancel delivered order', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, customer_id: 10, status: 'delivered' }] });
      const res = await request(app).patch('/api/orders/1/cancel').set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(400);
    });

    it('200 – cancels pending order', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1, customer_id: 10, status: 'pending' }] })
        .mockResolvedValueOnce({});
      const res = await request(app).patch('/api/orders/1/cancel').set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Order cancelled');
    });

    it('200 – cancels confirmed order', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 2, customer_id: 10, status: 'confirmed' }] })
        .mockResolvedValueOnce({});
      const res = await request(app).patch('/api/orders/2/cancel').set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
    });
  });

  // ─── Courier: available orders ─────────────────────────────────────────────

  describe('GET /api/orders/available', () => {
    it('403 – customer cannot access', async () => {
      const res = await request(app).get('/api/orders/available').set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('200 – returns ready unassigned orders', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 5, status: 'ready', courier_id: null }] });
      const res = await request(app).get('/api/orders/available').set('Authorization', `Bearer ${courierToken}`);
      expect(res.status).toBe(200);
      expect(res.body[0].status).toBe('ready');
    });
  });

  // ─── Courier: accept order ─────────────────────────────────────────────────

  describe('PATCH /api/orders/:id/accept', () => {
    it('403 – customer cannot accept', async () => {
      const res = await request(app).patch('/api/orders/5/accept').set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('400 – order already taken or not ready', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // UPDATE returned nothing
      const res = await request(app).patch('/api/orders/5/accept').set('Authorization', `Bearer ${courierToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Order not available');
    });

    it('200 – courier accepts available order', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 5, courier_id: 20, status: 'picked_up' }] });
      const res = await request(app).patch('/api/orders/5/accept').set('Authorization', `Bearer ${courierToken}`);
      expect(res.status).toBe(200);
      expect(res.body.courier_id).toBe(20);
    });
  });

  // ─── Courier: update delivery status ──────────────────────────────────────

  describe('PATCH /api/orders/:id/delivery-status', () => {
    it('400 – invalid status (not picked_up or delivered)', async () => {
      const res = await request(app)
        .patch('/api/orders/5/delivery-status')
        .set('Authorization', `Bearer ${courierToken}`)
        .send({ status: 'confirmed' });
      expect(res.status).toBe(400);
    });

    it('404 – order not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app)
        .patch('/api/orders/5/delivery-status')
        .set('Authorization', `Bearer ${courierToken}`)
        .send({ status: 'delivered' });
      expect(res.status).toBe(404);
    });

    it('403 – courier not assigned to this order', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 5, courier_id: 99 }] });
      const res = await request(app)
        .patch('/api/orders/5/delivery-status')
        .set('Authorization', `Bearer ${courierToken}`)
        .send({ status: 'delivered' });
      expect(res.status).toBe(403);
    });

    it('200 – marks order as delivered', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 5, courier_id: 20 }] })
        .mockResolvedValueOnce({ rows: [{ id: 5, status: 'delivered', courier_id: 20 }] });
      const res = await request(app)
        .patch('/api/orders/5/delivery-status')
        .set('Authorization', `Bearer ${courierToken}`)
        .send({ status: 'delivered' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('delivered');
    });
  });

  // ─── Admin: list orders ────────────────────────────────────────────────────

  describe('GET /api/orders (admin)', () => {
    it('403 – customer cannot access', async () => {
      const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('200 – returns paginated orders', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] });
      const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.orders).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('200 – filters by status', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 3, status: 'pending' }] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });
      const res = await request(app).get('/api/orders?status=pending').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      const [query, params] = db.query.mock.calls[0];
      expect(params).toContain('pending');
    });
  });

  // ─── Admin: update order status ────────────────────────────────────────────

  describe('PATCH /api/orders/:id/status (admin)', () => {
    it('400 – invalid status value', async () => {
      const res = await request(app)
        .patch('/api/orders/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'flying' });
      expect(res.status).toBe(400);
    });

    it('404 – order not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app)
        .patch('/api/orders/999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'confirmed' });
      expect(res.status).toBe(404);
    });

    it('200 – updates status', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'confirmed' }] });
      const res = await request(app)
        .patch('/api/orders/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'confirmed' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('confirmed');
    });

    it('200 – assigns courier when courier_id provided', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 20 }] }) // courier role check
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'ready', courier_id: 20 }] });
      const res = await request(app)
        .patch('/api/orders/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ready', courier_id: 20 });
      expect(res.status).toBe(200);
      expect(res.body.courier_id).toBe(20);
    });

    it('400 – rejects courier_id that is not an active courier', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // courier role check fails
      const res = await request(app)
        .patch('/api/orders/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ready', courier_id: 99 });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid courier');
    });
  });

  // ─── Shared: get order by id ───────────────────────────────────────────────

  describe('GET /api/orders/:id', () => {
    it('401 – unauthenticated', async () => {
      const res = await request(app).get('/api/orders/1');
      expect(res.status).toBe(401);
    });

    it('404 – order not found', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/orders/999').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('403 – customer cannot see another users order', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1, customer_id: 99, courier_id: null }] })
        .mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/orders/1').set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('200 – customer can see their own order', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1, customer_id: 10, courier_id: null }] })
        .mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/orders/1').set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
    });

    it('403 – courier cannot see order not assigned to them', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1, customer_id: 10, courier_id: 99 }] })
        .mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/orders/1').set('Authorization', `Bearer ${courierToken}`);
      expect(res.status).toBe(403);
    });

    it('200 – admin can see any order', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1, customer_id: 10, courier_id: 99 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Pizza', quantity: 1 }] });
      const res = await request(app).get('/api/orders/1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
    });
  });
});
