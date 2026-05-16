const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

// Customer
router.post('/', authenticate, authorize('customer'), ctrl.createOrder);
router.get('/my', authenticate, authorize('customer'), ctrl.getMyOrders);
router.patch('/:id/cancel', authenticate, authorize('customer'), ctrl.cancelOrder);

// Courier
router.get('/available', authenticate, authorize('courier'), ctrl.getAvailableOrders);
router.get('/assigned', authenticate, authorize('courier'), ctrl.getCourierOrders);
router.patch('/:id/accept', authenticate, authorize('courier'), ctrl.acceptOrder);
router.patch('/:id/delivery-status', authenticate, authorize('courier'), ctrl.updateDeliveryStatus);

// Admin
router.get('/', authenticate, authorize('admin'), ctrl.getAllOrders);
router.patch('/:id/status', authenticate, authorize('admin'), ctrl.updateOrderStatus);

// Shared (customer sees own, courier sees assigned, admin sees all)
router.get('/:id', authenticate, ctrl.getOrderById);

module.exports = router;
