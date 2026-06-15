const crypto = require('crypto');
const db = require('../config/database');
const paypalych = require('../services/paypalych');

// Customer: create (or reuse) a payment bill for an order
exports.createPayment = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM orders WHERE id = $1', [req.params.orderId]);
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    const order = rows[0];

    if (order.customer_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    if (order.status === 'cancelled') return res.status(400).json({ message: 'Order is cancelled' });
    if (order.payment_status === 'paid') return res.status(400).json({ message: 'Order already paid' });

    // Reuse the open bill instead of creating a new one on every tap
    if (order.payment_status === 'pending' && order.payment_url) {
      return res.json({
        payment_url: order.payment_url,
        bill_id: order.payment_bill_id,
        payment_status: 'pending',
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const { billId, paymentUrl } = await paypalych.createBill({
      amount: order.total_price,
      orderId: order.id,
      description: `Оплата заказа #${order.id}`,
      baseUrl,
    });

    await db.query(
      `UPDATE orders SET payment_status = 'pending', payment_bill_id = $1, payment_url = $2,
       updated_at = NOW() WHERE id = $3`,
      [billId, paymentUrl, order.id]
    );

    res.json({ payment_url: paymentUrl, bill_id: billId, payment_status: 'pending' });
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Shared postback pipeline: PayPalych and the test pay page both go through it,
// so the signature check is exercised in either mode.
async function processPostback(body) {
  const { InvId, OutSum, TrsId, Status, SignatureValue } = body;
  if (!InvId || !OutSum || !SignatureValue) {
    return { code: 400, message: 'Missing parameters' };
  }
  if (!paypalych.verifySignature(OutSum, InvId, SignatureValue)) {
    return { code: 400, message: 'Invalid signature' };
  }

  const { rows } = await db.query('SELECT * FROM orders WHERE id = $1', [InvId]);
  if (!rows.length) return { code: 404, message: 'Order not found' };
  const order = rows[0];

  if (order.payment_status === 'paid') return { code: 200, message: 'OK' }; // idempotent

  if (Status === 'SUCCESS') {
    await db.query(
      `UPDATE orders SET payment_status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [order.id]
    );
  } else {
    await db.query(
      `UPDATE orders SET payment_status = 'failed', updated_at = NOW() WHERE id = $1`,
      [order.id]
    );
  }
  console.log(`Payment postback: order #${order.id} → ${Status} (trs ${TrsId || '-'})`);
  return { code: 200, message: 'OK' };
}

// PayPalych server-to-server notification (configured as Result URL)
exports.postback = async (req, res) => {
  try {
    const result = await processPostback(req.body);
    res.status(result.code).send(result.message);
  } catch (err) {
    console.error('Postback error:', err);
    res.status(500).send('Server error');
  }
};

// ── Test mode only: emulated payment page ────────────────────────────────────

const testPage = (title, body) => `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; background: #f6f6f6;
         display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
  .card { background: #fff; border-radius: 16px; padding: 32px; max-width: 360px; width: 90%;
          box-shadow: 0 4px 16px rgba(0,0,0,.08); text-align: center; }
  h1 { font-size: 20px; margin: 0 0 8px; }
  .muted { color: #777; font-size: 14px; margin-bottom: 24px; }
  .amount { font-size: 32px; font-weight: 700; margin: 16px 0 24px; }
  button { width: 100%; padding: 14px; border: 0; border-radius: 10px; font-size: 16px;
           font-weight: 600; cursor: pointer; margin-top: 8px; }
  .pay { background: #FF6B35; color: #fff; }
  .fail { background: #eee; color: #c0392b; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 12px;
           background: #fff3cd; color: #856404; margin-bottom: 16px; }
</style></head><body><div class="card">${body}</div></body></html>`;

exports.testPayPage = async (req, res) => {
  if (!paypalych.isTestMode()) return res.status(404).send('Not found');
  try {
    const { rows } = await db.query('SELECT * FROM orders WHERE payment_bill_id = $1', [req.params.billId]);
    if (!rows.length) return res.status(404).send(testPage('Счёт не найден', '<h1>Счёт не найден</h1>'));
    const order = rows[0];

    if (order.payment_status === 'paid') {
      return res.send(testPage('Оплачено', `
        <h1>✅ Заказ #${order.id} уже оплачен</h1>
        <p class="muted">Вернитесь в приложение</p>`));
    }

    res.send(testPage('Тестовая оплата', `
      <span class="badge">ТЕСТОВЫЙ РЕЖИМ · PayPalych</span>
      <h1>Оплата заказа #${order.id}</h1>
      <p class="muted">Meal Delivery — доставка готовой еды</p>
      <div class="amount">${Number(order.total_price).toFixed(2)} ₽</div>
      <form method="POST" action="/api/payments/test/${order.payment_bill_id}">
        <button class="pay" name="result" value="success">Оплатить</button>
        <button class="fail" name="result" value="fail">Отклонить платёж</button>
      </form>`));
  } catch (err) {
    console.error('Test pay page error:', err);
    res.status(500).send('Server error');
  }
};

// Emulates the provider postback for an order, including a valid signature
const emulatePostback = (order, success) => {
  const outSum = Number(order.total_price).toFixed(2);
  return processPostback({
    InvId: String(order.id),
    OutSum: outSum,
    TrsId: 'TEST-' + crypto.randomBytes(6).toString('hex'),
    Status: success ? 'SUCCESS' : 'FAIL',
    CurrencyIn: 'RUB',
    SignatureValue: paypalych.signBill(outSum, String(order.id)),
  });
};

// JSON confirm for the mobile app's native test payment screen
exports.testPayConfirmApi = async (req, res) => {
  if (!paypalych.isTestMode()) return res.status(404).json({ message: 'Not found' });
  try {
    const { rows } = await db.query('SELECT * FROM orders WHERE payment_bill_id = $1', [req.params.billId]);
    if (!rows.length) return res.status(404).json({ message: 'Bill not found' });
    const order = rows[0];

    const success = req.body.result === 'success';
    const result = await emulatePostback(order, success);
    if (result.code !== 200) return res.status(result.code).json({ message: result.message });

    res.json({ order_id: order.id, payment_status: success ? 'paid' : 'failed' });
  } catch (err) {
    console.error('Test pay confirm error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.testPayConfirm = async (req, res) => {
  if (!paypalych.isTestMode()) return res.status(404).send('Not found');
  try {
    const { rows } = await db.query('SELECT * FROM orders WHERE payment_bill_id = $1', [req.params.billId]);
    if (!rows.length) return res.status(404).send('Bill not found');
    const order = rows[0];

    const result = await emulatePostback(order, req.body.result === 'success');
    if (result.code !== 200) return res.status(result.code).send(result.message);

    if (req.body.result === 'success') {
      res.send(testPage('Оплата завершена', `
        <h1>✅ Оплата прошла успешно</h1>
        <p class="muted">Заказ #${order.id} оплачен.<br>Вернитесь в приложение и обновите экран заказа.</p>`));
    } else {
      res.send(testPage('Платёж отклонён', `
        <h1>❌ Платёж отклонён</h1>
        <p class="muted">Заказ #${order.id} не оплачен.<br>Вы можете повторить оплату из приложения.</p>`));
    }
  } catch (err) {
    console.error('Test pay confirm error:', err);
    res.status(500).send('Server error');
  }
};
