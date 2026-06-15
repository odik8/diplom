process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '7d';

const request = require('supertest');
const app = require('../app');
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../config/database', () => ({ query: jest.fn() }));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

const makeToken = (payload) => jwt.sign(payload, 'test-secret');

describe('Auth API', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/auth/register', () => {
    it('400 – missing required fields', async () => {
      const res = await request(app).post('/api/auth/register').send({});
      expect(res.status).toBe(400);
    });

    it('400 – password too short', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test', email: 'test@test.com', password: 'abc',
      });
      expect(res.status).toBe(400);
    });

    it('409 – duplicate email', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test', email: 'exists@test.com', password: 'password123',
      });
      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Email already registered');
    });

    it('201 – creates customer and returns token', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test', email: 'new@test.com', role: 'customer' }] });
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test', email: 'new@test.com', password: 'password123',
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('customer');
    });

    it('201 – creates courier when role=courier', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 2, name: 'Courier', email: 'c@test.com', role: 'courier' }] });
      const res = await request(app).post('/api/auth/register').send({
        name: 'Courier', email: 'c@test.com', password: 'password123', role: 'courier',
      });
      expect(res.status).toBe(201);
      expect(db.query.mock.calls[1][1][3]).toBe('courier');
    });

    it('forces customer role when admin role is attempted', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 3, name: 'X', email: 'x@test.com', role: 'customer' }] });
      await request(app).post('/api/auth/register').send({
        name: 'X', email: 'x@test.com', password: 'password123', role: 'admin',
      });
      expect(db.query.mock.calls[1][1][3]).toBe('customer');
    });
  });

  describe('POST /api/auth/login', () => {
    it('400 – missing fields', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
    });

    it('401 – user not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).post('/api/auth/login').send({ email: 'no@no.com', password: 'pass' });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('401 – wrong password', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'u@u.com', password_hash: 'hash', role: 'customer', name: 'U' }] });
      bcrypt.compare.mockResolvedValueOnce(false);
      const res = await request(app).post('/api/auth/login').send({ email: 'u@u.com', password: 'wrong' });
      expect(res.status).toBe(401);
    });

    it('200 – valid credentials return token without password_hash', async () => {
      const fakeUser = { id: 1, name: 'User', email: 'u@u.com', password_hash: 'hash', role: 'customer', phone: null, address: null };
      db.query.mockResolvedValueOnce({ rows: [fakeUser] });
      bcrypt.compare.mockResolvedValueOnce(true);
      const res = await request(app).post('/api/auth/login').send({ email: 'u@u.com', password: 'correct' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).not.toHaveProperty('password_hash');
      expect(res.body.user.email).toBe('u@u.com');
    });
  });

  describe('GET /api/auth/me', () => {
    it('401 – no token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('401 – invalid token', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer bad.token.here');
      expect(res.status).toBe(401);
    });

    it('200 – returns current user', async () => {
      const token = makeToken({ id: 1, email: 'u@u.com', role: 'customer', name: 'U' });
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'U', email: 'u@u.com', role: 'customer' }] });
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('u@u.com');
    });

    it('404 – user deleted from DB after token issued', async () => {
      const token = makeToken({ id: 999, email: 'gone@u.com', role: 'customer', name: 'Gone' });
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/auth/profile', () => {
    it('401 – no token', async () => {
      const res = await request(app).patch('/api/auth/profile').send({ name: 'New' });
      expect(res.status).toBe(401);
    });

    it('200 – updates name and address', async () => {
      const token = makeToken({ id: 1, email: 'u@u.com', role: 'customer', name: 'U' });
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'New Name', email: 'u@u.com', role: 'customer', phone: null, address: 'Moscow, Lenina 1' }] });
      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name', address: 'Moscow, Lenina 1' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New Name');
      expect(res.body.address).toBe('Moscow, Lenina 1');
    });
  });
});
