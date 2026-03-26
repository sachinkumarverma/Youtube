const { Router } = require('express');
const { authenticateToken } = require('../../middleware/auth');
const userController = require('./user.controller');

const router = Router();

// Subscriptions
router.get('/subscriptions', authenticateToken, userController.getSubscriptions);
router.post('/subscribe/:channel_id', authenticateToken, userController.toggleSubscription);
router.post('/subscribe/:channel_id/toggle-notifications', authenticateToken, userController.toggleNotifications);

// Watch Later
router.get('/watch-later', authenticateToken, userController.getWatchLater);
router.post('/watch-later/:video_id', authenticateToken, userController.toggleWatchLater);

// History
router.get('/history', authenticateToken, userController.getHistory);
router.post('/history/:video_id', authenticateToken, userController.addToHistory);

// Liked
router.get('/liked', authenticateToken, userController.getLikedVideos);

// Channel
router.get('/channel', authenticateToken, userController.getMyChannel);
router.get('/channel/:id', userController.getPublicChannel);

module.exports = router;
