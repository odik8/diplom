const router = require('express').Router();
const ctrl = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

// Customer
router.post('/:orderId/create', authenticate, authorize('customer'), ctrl.createPayment);

// PayPalych server-to-server notification (public, signature-verified)
router.post('/paypalych/postback', ctrl.postback);

// Test-mode emulated payment (404 in real mode):
// HTML page for browsers + JSON confirm for the mobile app
router.get('/test/:billId', ctrl.testPayPage);
router.post('/test/:billId', ctrl.testPayConfirm);
router.post('/test/:billId/confirm', ctrl.testPayConfirmApi);

module.exports = router;
