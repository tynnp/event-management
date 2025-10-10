//file: api/express-rest-api/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware'); // <- thêm dòng này


router.post('/register', authController.register);
router.post('/login', authController.login);

// Logout
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;