require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// HSTS and CSP upgrade-insecure-requests only in production: dev runs plain
// http, and both make browsers force https and break the test payment page.
const isProd = process.env.NODE_ENV === 'production';
app.use(helmet({
  hsts: isProd,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: { upgradeInsecureRequests: isProd ? [] : null },
  },
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // PayPalych postback is form-encoded

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many attempts, try again later' },
  skip: () => process.env.NODE_ENV === 'test',
});

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
