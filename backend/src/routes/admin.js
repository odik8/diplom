const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const menuCtrl = require('../controllers/menuController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

router.get('/stats', ctrl.getStats);
router.get('/users', ctrl.getUsers);
router.post('/couriers', ctrl.createCourier);
router.patch('/users/:id/toggle', ctrl.toggleUserStatus);
router.get('/categories', ctrl.getAllCategories);
router.get('/menu-items', ctrl.getAllMenuItems);

module.exports = router;
