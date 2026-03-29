const { Router } = require('express');
const { authenticateToken } = require('../../middleware/auth');
const authController = require('./auth.controller');

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.put('/profile', authenticateToken, authController.updateProfile);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
