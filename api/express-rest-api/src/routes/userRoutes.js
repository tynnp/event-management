// file: api/express-rest-api/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware'); // thêm dòng này

// Lấy thông tin profile
router.get('/profile', authMiddleware, userController.getUserProfile);

// Cập nhật profile + upload avatar
router.put(
  '/profile',
  authMiddleware,
  upload.single('avatar'), // field name trong form-data là "avatar"
  userController.updateUserProfile
);

// Đổi mật khẩu
router.post('/change-password', authMiddleware, userController.changePassword);

// Phân quyền user
router.put('/:id/role', authMiddleware, userController.changeUserRole);

// Khóa / mở khóa tài khoản (admin)
router.put('/:id/lock', authMiddleware, userController.toggleUserLock);

// Yêu cầu xóa tài khoản (user)
router.post('/request-delete', authMiddleware, userController.requestAccountDeletion);

// DELETE user account (admin only)
router.delete('/:userId', authMiddleware, userController.deleteUserAccount);

// Lấy danh sách tất cả người dùng
router.get('/', authMiddleware, userController.getAllUsers);

module.exports = router;
