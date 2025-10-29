//file: api/express-rest-api/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter'); // 🔹 thêm dòng này

// Register with OTP
router.post('/register/start', authController.registerStart);
router.post('/register/verify', authController.registerVerify);

// Login (thêm rate limiter)
router.post('/login', loginLimiter, authController.login); // 🔹 giới hạn 5 lần / 5 phút

// Logout
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
