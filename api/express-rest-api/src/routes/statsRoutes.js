//file: api/express-rest-api/src/routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// chỉ admin mới được xem thống kê
router.get('/events', authMiddleware, roleMiddleware(['admin']), statsController.eventStatistics);
router.get('/comments', authMiddleware, roleMiddleware(['admin']), statsController.commentStatistics);
router.get('/system', authMiddleware, roleMiddleware(['admin']), statsController.systemStatistics);

module.exports = router;
