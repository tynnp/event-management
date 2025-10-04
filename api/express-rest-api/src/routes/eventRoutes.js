//file: api/express-rest-api/src/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// CRUD + duyệt sự kiện chỉ moderator hoặc admin
router.post('/', authMiddleware, roleMiddleware(['moderator','admin']), eventController.createEvent);
router.put('/:id', authMiddleware, roleMiddleware(['moderator','admin']), eventController.updateEvent);
router.delete('/:id', authMiddleware, roleMiddleware(['moderator','admin']), eventController.deleteEvent);
router.put('/:id/approve', authMiddleware, roleMiddleware(['moderator','admin']), eventController.approveEvent);
router.put('/:id/reject', authMiddleware, roleMiddleware(['moderator','admin']), eventController.rejectEvent);

// Event công khai cho tất cả xem
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventDetail);

module.exports = router;
