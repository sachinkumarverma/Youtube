const { Router } = require('express');
const { authenticateToken } = require('../../middleware/auth');
const reportController = require('./report.controller');

const router = Router();

router.post('/:videoId', authenticateToken, reportController.submit);

module.exports = router;
