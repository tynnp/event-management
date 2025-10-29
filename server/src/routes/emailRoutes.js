// file: api/express-rest-api/src/routes/emailRoutes.js
const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailVerificationController');
const authMiddleware = require('../middleware/authMiddleware');

// đổi email (cần login)
router.post('/change-email/send-otp', authMiddleware, emailController.sendChangeEmailOTP);
router.post('/change-email/verify', authMiddleware, emailController.verifyChangeEmailOTP);

// quên mật khẩu
router.post('/forgot-password/send-otp', emailController.sendResetPasswordOTP);
router.post('/forgot-password/reset', emailController.resetPassword);

module.exports = router;
