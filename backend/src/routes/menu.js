const router = require('express').Router();
const ctrl = require('../controllers/menuController');
const { authenticate, authorize } = require('../middleware/auth');

// Public
router.get('/categories', ctrl.getCategories);
router.get('/items', ctrl.getMenuItems);
router.get('/items/:id', ctrl.getMenuItem);

// Admin only
router.post('/categories', authenticate, authorize('admin'), ctrl.createCategory);
router.patch('/categories/:id', authenticate, authorize('admin'), ctrl.updateCategory);
router.delete('/categories/:id', authenticate, authorize('admin'), ctrl.deleteCategory);

router.post('/items', authenticate, authorize('admin'), ctrl.createMenuItem);
router.patch('/items/:id', authenticate, authorize('admin'), ctrl.updateMenuItem);
router.delete('/items/:id', authenticate, authorize('admin'), ctrl.deleteMenuItem);

module.exports = router;
