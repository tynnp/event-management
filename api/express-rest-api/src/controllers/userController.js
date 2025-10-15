//file: api/express-rest-api/src/controllers/userController.js
const { getPostgresPool } = require('../config/database');
const { sendMail } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const { buildImageUrl } = require('../middleware/uploadMiddleware');


exports.getUserProfile = async (req, res) => {
  const pool = getPostgresPool();
  try {
    const result = await pool.query(
      'SELECT id, email, name, avatar_url, role, phone, events_attended, created_at, updated_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];
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
  const pool = getPostgresPool();
  const { name, phone } = req.body;

  const updates = [];
  const values = [];
  let i = 1;

  // Name validation
  if (name !== undefined) {
    if (name.trim() === "") {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }
    updates.push(`name = $${i}`);
    values.push(name);
    i++;
  }

  //Phone validation
  if (phone !== undefined) {
    const phonePattern = /^\+?\d+$/;
    if (!phonePattern.test(phone)) {
      return res.status(400).json({ message: 'Phone must contain only numbers and optional leading +' });
    }
    updates.push(`phone = $${i}`);
    values.push(phone);
    i++;
  }

  // Avatar upload handling
  if (req.file) {
    const filePath = req.file.path.replace(/\\/g, '/'); // fix Windows path
    updates.push(`avatar_url = $${i}`);
    values.push(filePath);
    i++;
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  updates.push(`updated_at = NOW()`);

  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${i}`;
  values.push(req.user.id);

  try {
    await pool.query(query, values);
    res.json({
      message: 'Profile updated successfully',
      avatar_url: req.file ? filePath : undefined
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  const pool = getPostgresPool();
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
    return res.status(400).json({ message: 'Password must be at least 8 characters and include letters and numbers' });
  }

  try {
    // Lấy password hash hiện tại từ DB
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error changing password', error: err.message });
  }
};

exports.changeUserRole = async (req, res) => {
  const pool = getPostgresPool();
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

  try {
    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, role',
      [newRole, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Role updated', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error updating role', error: err.message });
  }
};

// Khóa hoặc mở khóa tài khoản
exports.toggleUserLock = async (req, res) => {
  const pool = getPostgresPool();
  const { id } = req.params; // user cần khóa/mở khóa
  const { lock } = req.body; // true = khóa, false = mở

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can lock/unlock accounts' });
  }

  // không cho tự khóa chính mình
  if (req.user.id === id) {
    return res.status(400).json({ message: 'You cannot lock/unlock your own account' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET is_locked = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, is_locked',
      [lock, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });

    res.json({ message: lock ? 'User locked' : 'User unlocked', user: result.rows[0] });
  } catch (err) {
    console.error('Error in toggleUserLock:', err);
    res.status(500).json({ message: 'Error locking/unlocking user', error: err.message });
  }
};

exports.requestAccountDeletion = async (req, res) => {
  try {
    const pool = getPostgresPool();

    // Lấy thông tin user hiện tại
    const result = await pool.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

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
  const pool = getPostgresPool();
  const { userId } = req.params; // lấy id user cần xóa từ URL

  // chỉ admin mới có quyền xóa
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can delete user accounts' });
  }

  try {
    // kiểm tra user có tồn tại không
    const check = await pool.query('SELECT id, role FROM users WHERE id = $1', [userId]);
    if (check.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const target = check.rows[0];
    if (target.role === 'admin') {
      return res.status(403).json({ message: 'Admin account cannot be deleted by another admin' });
    }

    // xóa các dữ liệu liên quan trước (nếu có constraint)
    await pool.query('DELETE FROM participants WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM ratings WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM events WHERE created_by = $1', [userId]);

    // xóa user cuối cùng
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: `User ${userId} deleted successfully` });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  const pool = getPostgresPool();
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, phone, avatar_url, created_at, is_locked, updated_at, last_login FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
};
