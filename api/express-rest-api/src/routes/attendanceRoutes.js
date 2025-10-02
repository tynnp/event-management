//file: api/express-rest-api/src/routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/checkin', authMiddleware, attendanceController.checkIn);
router.get('/generate-qr', authMiddleware, attendanceController.generateQRCode);

module.exports = router;