const { Router } = require('express');
const { authenticateToken } = require('../../middleware/auth');
const controller = require('./analytics.controller');

const router = Router();

router.get('/overview', authenticateToken, controller.getOverview);
router.get('/subscribers', authenticateToken, controller.getSubscriberGrowth);
router.get('/views', authenticateToken, controller.getViewsOverTime);
router.get('/likes', authenticateToken, controller.getLikesOverTime);
router.get('/comments', authenticateToken, controller.getCommentsOverTime);
router.get('/top-videos', authenticateToken, controller.getTopVideos);

module.exports = router;
