const crypto = require('crypto');

// PayPalych (pal24 / pally.info) payment gateway client.
// Docs: https://paypalych.com/reference/api
//
// Real mode needs PAYPALYCH_TOKEN and PAYPALYCH_SHOP_ID from the merchant
// dashboard. Without a token (or with PAYPALYCH_TEST_MODE=true) the service
// runs in test mode: bills are emulated locally and "paid" through
// /api/payments/test/:billId, which goes through the same postback pipeline
// with a real signature check.

const API_URL = 'https://paypalych.com/api/v1';

const isTestMode = () =>
  process.env.PAYPALYCH_TEST_MODE === 'true' || !process.env.PAYPALYCH_TOKEN;

const apiToken = () => process.env.PAYPALYCH_TOKEN || 'paypalych_test_token';

// Postback signature: UPPERCASE(MD5("OutSum:InvId:API_TOKEN"))
const signBill = (outSum, invId) =>
  crypto.createHash('md5').update(`${outSum}:${invId}:${apiToken()}`).digest('hex').toUpperCase();

const verifySignature = (outSum, invId, signature) => {
  if (!signature) return false;
  const expected = signBill(outSum, invId);
  const got = String(signature).toUpperCase();
  if (got.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
};

// Creates a bill and returns { billId, paymentUrl }.
// baseUrl is the public origin of this backend (used for the test pay page).
async function createBill({ amount, orderId, description, baseUrl }) {
  const outSum = Number(amount).toFixed(2);

  if (isTestMode()) {
    const billId = 'TEST-' + crypto.randomBytes(8).toString('hex');
    return { billId, paymentUrl: `${baseUrl}/api/payments/test/${billId}` };
  }

  const res = await fetch(`${API_URL}/bill/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      amount: outSum,
      order_id: String(orderId),
      description: description || '',
      type: 'normal',
      shop_id: process.env.PAYPALYCH_SHOP_ID || '',
      currency_in: 'RUB',
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false || data.success === 'false') {
    throw new Error(`PayPalych bill/create failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return { billId: data.bill_id, paymentUrl: data.link_page_url || data.link_url };
}

module.exports = { isTestMode, signBill, verifySignature, createBill };
