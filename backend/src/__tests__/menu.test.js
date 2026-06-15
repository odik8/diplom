process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../app');
const db = require('../config/database');
const jwt = require('jsonwebtoken');

jest.mock('../config/database', () => ({ query: jest.fn() }));

const adminToken = jwt.sign({ id: 1, email: 'admin@test.com', role: 'admin', name: 'Admin' }, 'test-secret');
const customerToken = jwt.sign({ id: 2, email: 'c@test.com', role: 'customer', name: 'C' }, 'test-secret');

describe('Menu API', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/menu/categories', () => {
    it('200 – returns list of active categories', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Pizza', is_active: true }, { id: 2, name: 'Drinks', is_active: true }] });
      const res = await request(app).get('/api/menu/categories');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('200 – returns empty array when no categories', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/menu/categories');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /api/menu/items', () => {
    it('200 – returns all available items', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Margherita', price: '350.00', is_available: true }] });
      const res = await request(app).get('/api/menu/items');
      expect(res.status).toBe(200);
      expect(res.body[0].name).toBe('Margherita');
    });

    it('200 – filters by category_id', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/menu/items?category_id=5');
      expect(res.status).toBe(200);
      const [query, params] = db.query.mock.calls[0];
      expect(params).toContain('5');
    });
  });

  describe('GET /api/menu/popular', () => {
    it('200 – returns items ranked by ordered quantity', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          { id: 1, name: 'Борщ', ordered_count: 5 },
          { id: 2, name: 'Плов', ordered_count: 3 },
        ],
      });
      const res = await request(app).get('/api/menu/popular');
      expect(res.status).toBe(200);
      expect(res.body[0].ordered_count).toBeGreaterThanOrEqual(res.body[1].ordered_count);
    });
  });

  describe('GET /api/menu/items/:id', () => {
    it('404 – item not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/menu/items/999');
      expect(res.status).toBe(404);
    });

    it('200 – returns item with category name', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 5, name: 'Burger', price: '250.00', category_name: 'Burgers' }] });
      const res = await request(app).get('/api/menu/items/5');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Burger');
      expect(res.body.category_name).toBe('Burgers');
    });
  });

  describe('POST /api/menu/categories (admin only)', () => {
    it('401 – no token', async () => {
      const res = await request(app).post('/api/menu/categories').send({ name: 'Drinks' });
      expect(res.status).toBe(401);
    });

    it('403 – customer cannot create category', async () => {
      const res = await request(app)
        .post('/api/menu/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Drinks' });
      expect(res.status).toBe(403);
    });

    it('201 – admin creates category', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 3, name: 'Drinks', is_active: true, sort_order: 0 }] });
      const res = await request(app)
        .post('/api/menu/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Drinks' });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Drinks');
    });
  });

  describe('PATCH /api/menu/categories/:id (admin only)', () => {
    it('404 – category not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app)
        .patch('/api/menu/categories/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' });
      expect(res.status).toBe(404);
    });

    it('200 – updates category', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Updated', is_active: true }] });
      const res = await request(app)
        .patch('/api/menu/categories/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated');
    });

    it('200 – can deactivate category via is_active=false', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Pizza', is_active: false }] });
      const res = await request(app)
        .patch('/api/menu/categories/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: false });
      expect(res.status).toBe(200);
      expect(res.body.is_active).toBe(false);
    });
  });

  describe('DELETE /api/menu/categories/:id (admin only)', () => {
    it('200 – soft-deletes category', async () => {
      db.query.mockResolvedValueOnce({});
      const res = await request(app)
        .delete('/api/menu/categories/1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Category deactivated');
    });
  });

  describe('POST /api/menu/items (admin only)', () => {
    it('201 – creates menu item', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 10, name: 'New Item', price: '199.00', is_available: true }] });
      const res = await request(app)
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ category_id: 1, name: 'New Item', price: 199 });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New Item');
    });
  });

  describe('PATCH /api/menu/items/:id (admin only)', () => {
    it('404 – item not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app)
        .patch('/api/menu/items/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 199 });
      expect(res.status).toBe(404);
    });

    it('200 – updates item price', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Pizza', price: '199.00' }] });
      const res = await request(app)
        .patch('/api/menu/items/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 199 });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/menu/items/:id (admin only)', () => {
    it('200 – soft-deletes item', async () => {
      db.query.mockResolvedValueOnce({});
      const res = await request(app)
        .delete('/api/menu/items/1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Item deactivated');
    });
  });
});
