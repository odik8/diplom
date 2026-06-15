process.env.JWT_SECRET = 'test-secret';
process.env.PAYPALYCH_TEST_MODE = 'true';

const request = require('supertest');
const app = require('../app');
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const { signBill, verifySignature, isTestMode } = require('../services/paypalych');

jest.mock('../config/database', () => ({ query: jest.fn() }));

const customerToken = jwt.sign({ id: 10, email: 'c@test.com', role: 'customer', name: 'C' }, 'test-secret');
const courierToken = jwt.sign({ id: 20, email: 'k@test.com', role: 'courier', name: 'K' }, 'test-secret');

const order = (over = {}) => ({
  id: 1, customer_id: 10, status: 'pending', total_price: '500.00',
  payment_status: 'unpaid', payment_bill_id: null, payment_url: null, ...over,
});

describe('PayPalych service', () => {
  it('runs in test mode under tests', () => {
    expect(isTestMode()).toBe(true);
  });

  it('signature is UPPERCASE(MD5(OutSum:InvId:token)) and verifies', () => {
    const sig = signBill('500.00', '1');
    expect(sig).toMatch(/^[A-F0-9]{32}$/);
    expect(verifySignature('500.00', '1', sig)).toBe(true);
    expect(verifySignature('500.00', '1', sig.toLowerCase())).toBe(true);
  });

  it('rejects wrong signature, amount or order id', () => {
    const sig = signBill('500.00', '1');
    expect(verifySignature('999.00', '1', sig)).toBe(false);
    expect(verifySignature('500.00', '2', sig)).toBe(false);
    expect(verifySignature('500.00', '1', 'A'.repeat(32))).toBe(false);
    expect(verifySignature('500.00', '1', undefined)).toBe(false);
  });
});

describe('Payments API', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/payments/:orderId/create', () => {
    it('401 – unauthenticated', async () => {
      const res = await request(app).post('/api/payments/1/create');
      expect(res.status).toBe(401);
    });

    it('403 – courier cannot create payments', async () => {
      const res = await request(app).post('/api/payments/1/create')
        .set('Authorization', `Bearer ${courierToken}`);
      expect(res.status).toBe(403);
    });

    it('404 – order not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).post('/api/payments/999/create')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(404);
    });

    it("403 – cannot pay another user's order", async () => {
      db.query.mockResolvedValueOnce({ rows: [order({ customer_id: 99 })] });
      const res = await request(app).post('/api/payments/1/create')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('400 – cancelled order', async () => {
      db.query.mockResolvedValueOnce({ rows: [order({ status: 'cancelled' })] });
      const res = await request(app).post('/api/payments/1/create')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(400);
    });

    it('400 – already paid', async () => {
      db.query.mockResolvedValueOnce({ rows: [order({ payment_status: 'paid' })] });
      const res = await request(app).post('/api/payments/1/create')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Order already paid');
    });

    it('200 – creates test bill and marks order pending', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [order()] })
        .mockResolvedValueOnce({ rows: [] }); // UPDATE
      const res = await request(app).post('/api/payments/1/create')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.payment_status).toBe('pending');
      expect(res.body.bill_id).toMatch(/^TEST-/);
      expect(res.body.payment_url).toContain(`/api/payments/test/${res.body.bill_id}`);
      const updateCall = db.query.mock.calls[1];
      expect(updateCall[0]).toContain("payment_status = 'pending'");
    });

    it('200 – reuses existing pending bill', async () => {
      db.query.mockResolvedValueOnce({
        rows: [order({ payment_status: 'pending', payment_bill_id: 'TEST-abc', payment_url: 'http://x/api/payments/test/TEST-abc' })],
      });
      const res = await request(app).post('/api/payments/1/create')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.bill_id).toBe('TEST-abc');
      expect(db.query).toHaveBeenCalledTimes(1); // no new bill, no UPDATE
    });
  });

  describe('POST /api/payments/paypalych/postback', () => {
    it('400 – missing parameters', async () => {
      const res = await request(app).post('/api/payments/paypalych/postback')
        .type('form').send({ InvId: '1' });
      expect(res.status).toBe(400);
    });

    it('400 – invalid signature', async () => {
      const res = await request(app).post('/api/payments/paypalych/postback')
        .type('form')
        .send({ InvId: '1', OutSum: '500.00', Status: 'SUCCESS', SignatureValue: 'F'.repeat(32) });
      expect(res.status).toBe(400);
      expect(db.query).not.toHaveBeenCalled();
    });

    it('200 – SUCCESS marks order paid', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [order({ payment_status: 'pending' })] })
        .mockResolvedValueOnce({ rows: [] }); // UPDATE
      const res = await request(app).post('/api/payments/paypalych/postback')
        .type('form')
        .send({ InvId: '1', OutSum: '500.00', TrsId: 'T1', Status: 'SUCCESS', SignatureValue: signBill('500.00', '1') });
      expect(res.status).toBe(200);
      const updateCall = db.query.mock.calls[1];
      expect(updateCall[0]).toContain("payment_status = 'paid'");
    });

    it('200 – FAIL marks order failed', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [order({ payment_status: 'pending' })] })
        .mockResolvedValueOnce({ rows: [] });
      const res = await request(app).post('/api/payments/paypalych/postback')
        .type('form')
        .send({ InvId: '1', OutSum: '500.00', Status: 'FAIL', SignatureValue: signBill('500.00', '1') });
      expect(res.status).toBe(200);
      expect(db.query.mock.calls[1][0]).toContain("payment_status = 'failed'");
    });

    it('200 – idempotent for already paid order, no second update', async () => {
      db.query.mockResolvedValueOnce({ rows: [order({ payment_status: 'paid' })] });
      const res = await request(app).post('/api/payments/paypalych/postback')
        .type('form')
        .send({ InvId: '1', OutSum: '500.00', Status: 'SUCCESS', SignatureValue: signBill('500.00', '1') });
      expect(res.status).toBe(200);
      expect(db.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('Test pay page', () => {
    it('200 – renders payment page for open bill', async () => {
      db.query.mockResolvedValueOnce({ rows: [order({ payment_status: 'pending', payment_bill_id: 'TEST-abc' })] });
      const res = await request(app).get('/api/payments/test/TEST-abc');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Оплата заказа #1');
      expect(res.text).toContain('500.00');
    });

    it('404 – unknown bill', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/payments/test/NOPE');
      expect(res.status).toBe(404);
    });

    it('POST /confirm (JSON API) success → order paid, returns payment_status', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [order({ payment_status: 'pending', payment_bill_id: 'TEST-abc' })] }) // by bill
        .mockResolvedValueOnce({ rows: [order({ payment_status: 'pending' })] }) // postback lookup
        .mockResolvedValueOnce({ rows: [] }); // UPDATE
      const res = await request(app).post('/api/payments/test/TEST-abc/confirm')
        .send({ result: 'success' });
      expect(res.status).toBe(200);
      expect(res.body.payment_status).toBe('paid');
      expect(db.query.mock.calls[2][0]).toContain("payment_status = 'paid'");
    });

    it('POST /confirm (JSON API) fail → payment_status failed', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [order({ payment_status: 'pending', payment_bill_id: 'TEST-abc' })] })
        .mockResolvedValueOnce({ rows: [order({ payment_status: 'pending' })] })
        .mockResolvedValueOnce({ rows: [] });
      const res = await request(app).post('/api/payments/test/TEST-abc/confirm')
        .send({ result: 'fail' });
      expect(res.status).toBe(200);
      expect(res.body.payment_status).toBe('failed');
    });

    it('POST confirm success → order paid through postback pipeline', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [order({ payment_status: 'pending', payment_bill_id: 'TEST-abc' })] }) // by bill
        .mockResolvedValueOnce({ rows: [order({ payment_status: 'pending' })] }) // postback lookup
        .mockResolvedValueOnce({ rows: [] }); // UPDATE
      const res = await request(app).post('/api/payments/test/TEST-abc')
        .type('form').send({ result: 'success' });
      expect(res.status).toBe(200);
      expect(res.text).toContain('Оплата прошла успешно');
      expect(db.query.mock.calls[2][0]).toContain("payment_status = 'paid'");
    });
  });
});
