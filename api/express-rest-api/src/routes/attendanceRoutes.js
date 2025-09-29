const express = require('express');
const { markAttendance, getAttendanceRecords } = require('../controllers/attendanceController');

const router = express.Router();

// Route to mark attendance
router.post('/mark', markAttendance);

// Route to get attendance records
router.get('/records', getAttendanceRecords);

module.exports = router;