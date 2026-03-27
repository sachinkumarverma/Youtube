const { Router } = require('express');
const adminController = require('./admin.controller');
const adminAuth = require('./admin.auth');

const router = Router();

// Admin auth
router.post('/auth/register', async (req, res) => {
  try {
    const result = await adminAuth.registerAdmin(req.body);
    res.status(201).json(result);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Server error' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const result = await adminAuth.loginAdmin(req.body);
    res.json(result);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Server error' });
  }
});

// Dashboard & management (no auth middleware for simplicity; add in production)
router.get('/stats', adminController.getStats);
router.get('/logs', adminController.getLogs);
router.get('/videos', adminController.getVideos);
router.delete('/videos/:id', adminController.deleteVideo);
router.get('/reports', adminController.getReports);
router.put('/reports/:id/review', adminController.reviewReport);
router.get('/users', adminController.getUsers);
router.get('/comments', adminController.getComments);
router.delete('/comments/:id', async (req, res, next) => {
  try {
    const { query } = require('../../lib/db');
    await query('DELETE FROM comments WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) { next(error); }
});

module.exports = router;
