const { Router } = require('express');
const { authenticateToken } = require('../../middleware/auth');
const notificationController = require('./notification.controller');

const router = Router();

router.get('/', authenticateToken, notificationController.getAll);
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);
router.put('/:id/read', authenticateToken, notificationController.markAsRead);
router.delete('/:id', authenticateToken, notificationController.remove);

module.exports = router;
