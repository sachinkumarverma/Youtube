const { Router } = require('express');
const multer = require('multer');
const { authenticateToken } = require('../../middleware/auth');
const videoController = require('./video.controller');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.get('/', videoController.getAll);
router.get('/trending', videoController.getTrending);
router.get('/explore', videoController.getExplore);

// Authenticated routes
router.get('/subscriptions', authenticateToken, videoController.getSubscriptions);
router.post('/', authenticateToken, videoController.create);

// Param routes
router.get('/:id', videoController.getById);
router.put('/:id/view', videoController.incrementViews);
router.put('/:id', authenticateToken, upload.single('thumbnail'), videoController.update);
router.delete('/:id', authenticateToken, videoController.remove);

module.exports = router;
