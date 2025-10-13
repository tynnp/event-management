const express = require('express');
const router = express.Router();
const { getAllNotifications, markAsRead, deleteNotification } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getAllNotifications);
router.patch('/:id/read', authMiddleware, markAsRead);
router.delete('/:id', authMiddleware, deleteNotification);

module.exports = router;
