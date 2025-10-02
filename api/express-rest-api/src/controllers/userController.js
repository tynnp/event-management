//file: api/express-rest-api/src/controllers/userController.js
const { getPostgresPool } = require('../config/database');

exports.getUserProfile = async (req, res) => {
  const pool = getPostgresPool();
  try {
    const result = await pool.query(
      'SELECT id, email, name, avatar_url, role, phone, events_attended, created_at, updated_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    // loại bỏ id và role trước khi trả về client
    const { id, role, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  const pool = getPostgresPool();
  const { name, phone, avatar_url } = req.body;

  const updates = [];
  const values = [];
  let i = 1;

  // name: chỉ update nếu khác undefined, và không được rỗng
  if (name !== undefined) {
    if (name.trim() === "") {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }
    updates.push(`name = $${i}`);
    values.push(name);
    i++;
  }

  // phone: update nếu client gửi, phải là số hợp lệ
  if (phone !== undefined) {
    const phonePattern = /^\+?\d+$/; // bắt đầu có thể là +, chỉ chứa số
    if (!phonePattern.test(phone)) {
      return res.status(400).json({ message: 'Phone must contain only numbers and optional leading +' });
    }
    updates.push(`phone = $${i}`);
    values.push(phone);
    i++;
  }

  // avatar_url: update nếu client gửi
  if (avatar_url !== undefined) {
    updates.push(`avatar_url = $${i}`);
    values.push(avatar_url);
    i++;
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  // luôn update updated_at
  updates.push(`updated_at = NOW()`);

  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${i}`;
  values.push(req.user.id);

  try {
    await pool.query(query, values);
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
};


