// file: api/express-rest-api/src/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Bắt buộc đăng nhập cho tất cả route events
router.use(authMiddleware);

// CRUD (user có thể create/update/delete event của chính họ; controller sẽ enforce ownership)
// Moderator/Admin có thể edit/delete mọi event vì controller kiểm tra role
router.post('/', eventController.createEvent);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

// Duyệt sự kiện: CHỈ moderator (theo yêu cầu)
router.put('/:id/approve', roleMiddleware(['moderator','admin']), eventController.approveEvent);
router.put('/:id/reject', roleMiddleware(['moderator','admin']), eventController.rejectEvent);

// Lấy danh sách và detail (đã require auth ở trên)
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventDetail);

module.exports = router;
