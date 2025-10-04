//file: api/express-rest-api/src/routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');

// tất cả đều được check-in
router.post('/checkin', authMiddleware, attendanceController.checkIn);
// Trước đây: router.get('/generate-qr', authMiddleware, attendanceController.generateQRCode);
router.get('/generate-qr', authMiddleware, attendanceController.generateQRCode);


module.exports = router;
