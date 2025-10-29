const express = require('express');
const router = express.Router();
const { getAllLogs } = require('../controllers/auditController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getAllLogs);

module.exports = router;
