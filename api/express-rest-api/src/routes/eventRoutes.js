// file: api/express-rest-api/src/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// Public access to shared link
router.get('/public/:id', eventController.getEventPublic);

// Bắt buộc đăng nhập cho tất cả route events
router.use(authMiddleware);

// Upload hình ảnh khi tạo event 
router.post('/', upload.single('image'), eventController.createEvent);

// Upload hình ảnh khi update event
router.put('/:id', upload.single('image'), eventController.updateEvent);

// Duyệt / từ chối event chỉ moderator và admin
router.put('/:id/approve', roleMiddleware(['moderator','admin']), eventController.approveEvent);
router.put('/:id/reject', roleMiddleware(['moderator','admin']), eventController.rejectEvent);

// Lấy danh sách + chi tiết event không cần phân quyền
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventDetail);

// Generate share link (owner/admin/moderator)
router.post('/:id/share', eventController.shareEventLink);

module.exports = router;
