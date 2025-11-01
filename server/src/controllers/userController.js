//file: api/express-rest-api/src/controllers/userController.js
const User = require('../models/User');
const { sendMail } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const { buildImageUrl, normalizeImagePath } = require('../middleware/uploadMiddleware');

const fs = require('fs');
const path = require('path');

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.getProfile(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // nếu có avatar, build URL đầy đủ (vd http://localhost:5000/uploads/xxx.jpg)
    if (user.avatar_url) {
      user.avatar_url = buildImageUrl(user.avatar_url);
    }

    // loại bỏ id và role trước khi trả về client
    const { id, role, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const updates = {};
    let filePath;

    if (name !== undefined) {
      if (name.trim() === "") {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      updates.name = name;
    }

    if (phone !== undefined) {
      const phonePattern = /^\+?\d+$/;
      if (!phonePattern.test(phone)) {
        return res.status(400).json({ message: 'Phone must contain only numbers and optional leading +' });
      }
      updates.phone = phone;
    }

    if (req.file) {
      const rawPath = req.file.path.replace(/\\/g, '/');
      
      try {
        const old = await User.findById(req.user.id);
        const oldPath = old?.avatar_url;

        if (oldPath) {
          const fileName = path.basename(oldPath);
          const fullPath = path.resolve(__dirname, '..', '..', 'uploads', fileName);
          if (fs.existsSync(fullPath)) {
            fs.unlink(fullPath, (err) => {
              if (err) console.warn('Không thể xóa avatar cũ:', err.message);
            });
          } else {
            console.warn('File cũ không tồn tại:', fullPath);
          }
        }
      } catch (err) {
        console.error('Error removing old avatar:', err);
      }

      // Lưu path tương đối vào database (vd: /uploads/123.jpg)
      filePath = normalizeImagePath(rawPath);
      updates.avatar_url = filePath;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    await User.updateProfile(req.user.id, updates);
    
    // Trả về URL đầy đủ cho client
    const updatedAvatarUrl = req.file ? buildImageUrl(filePath) : undefined;

    res.json({
      message: 'Profile updated successfully',
      avatar_url: updatedAvatarUrl  // URL đầy đủ để client hiển thị
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match' });
    }

    // Password policy: tối thiểu 8 ký tự, có chữ và số
    const pwPattern = /^(?=.{8,}$)(?=.*[A-Za-z])(?=.*\d).*/;
    if (!pwPattern.test(newPassword)) {
      return res.status(400).json({ message: 'Mật khẩu phải tối thiểu 8 ký tự, có chữ và số' });
    }

    // Lấy password hash hiện tại từ DB
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(req.user.id, newHash);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error changing password', error: err.message });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params; // id user cần thay đổi role
    const { newRole } = req.body; // 'user' | 'moderator' | 'admin'

    // chỉ admin mới được thay đổi role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can change user roles' });
    }

    // không cho admin thay đổi role của chính mình
    if (req.user.id === id) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    // check role hợp lệ
    const validRoles = ['user', 'moderator', 'admin'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.updateRole(id, newRole);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Role updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Error updating role', error: err.message });
  }
};

// Khóa hoặc mở khóa tài khoản
exports.toggleUserLock = async (req, res) => {
  try {
    const { id } = req.params; // user cần khóa/mở khóa
    const { lock } = req.body; // true = khóa, false = mở

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can lock/unlock accounts' });
    }

    // không cho tự khóa chính mình
    if (req.user.id === id) {
      return res.status(400).json({ message: 'You cannot lock/unlock your own account' });
    }

    const user = await User.toggleLock(id, lock);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: lock ? 'User locked' : 'User unlocked', user });
  } catch (err) {
    console.error('Error in toggleUserLock:', err);
    res.status(500).json({ message: 'Error locking/unlocking user', error: err.message });
  }
};

exports.requestAccountDeletion = async (req, res) => {
  try {
    // Lấy thông tin user hiện tại
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Lấy mail chủ từ EMAIL_USER
    const adminEmail = process.env.EMAIL_USER;
    if (!adminEmail) {
      return res.status(500).json({ message: 'EMAIL_USER not configured in .env' });
    }

    // Soạn nội dung email
    const subject = `[ACCOUNT DELETION REQUEST] ${user.name || user.email}`;
    const body = `
      A user has requested to delete their account.

      User ID: ${user.id}
      Name: ${user.name || '(no name)'}
      Email: ${user.email}
      Time: ${new Date().toLocaleString()}
    `;

    // Gửi mail đến email chủ
    await sendMail(adminEmail, subject, body);

    res.json({ message: 'Account deletion request sent to system owner' });
  } catch (err) {
    console.error('Error sending deletion request:', err);
    res.status(500).json({ message: 'Failed to send deletion request', error: err.message });
  }
};

// DELETE USER ACCOUNT (admin only)
exports.deleteUserAccount = async (req, res) => {
  const { userId } = req.params; // lấy id user cần xóa từ URL

  // chỉ admin mới có quyền xóa
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can delete user accounts' });
  }

  try {
    // kiểm tra user có tồn tại không
    const target = await User.findById(userId);
    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (target.role === 'admin') {
      return res.status(403).json({ message: 'Admin account cannot be deleted by another admin' });
    }

    await User.delete(userId);

    res.json({ message: `User ${userId} deleted successfully` });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    // Build full avatar URLs
    const usersWithAvatars = users.map(user => {
      if (user.avatar_url) {
        user.avatar_url = buildImageUrl(user.avatar_url);
      }
      return user;
    });
    res.json(usersWithAvatars);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
};
