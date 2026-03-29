const { Router } = require('express');
const { authenticateToken } = require('../../middleware/auth');
const interactionController = require('./interaction.controller');

const router = Router();

router.post('/videos/:id/comments', authenticateToken, interactionController.addComment);
router.post('/videos/:id/comment', authenticateToken, interactionController.addComment);
router.post('/videos/:id/like', authenticateToken, interactionController.toggleLike);
router.post('/videos/:id/likes', authenticateToken, interactionController.toggleLike);
router.delete('/comments/:commentId', authenticateToken, interactionController.deleteComment);

module.exports = router;
