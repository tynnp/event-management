//file: api/express-rest-api/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/profile', authMiddleware, userController.getUserProfile);
router.put('/profile', authMiddleware, userController.updateUserProfile);
//Thay đổi password
router.post('/change-password', authMiddleware, userController.changePassword);
//Phân quyền user
router.put('/:id/role', authMiddleware, userController.changeUserRole);
// Khóa / mở khóa tài khoản (admin)
router.put('/:id/lock', authMiddleware, userController.toggleUserLock);


module.exports = router;