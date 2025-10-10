// file: api/express-rest-api/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPostgresPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { createSession } = require('./sessionController'); // đường dẫn đúng tới controller
// LOGOUT
const { logAction } = require('./auditController'); // nếu chưa import

exports.register = async (req, res) => {
  const pool = getPostgresPool();
  const { email, password, name, phone } = req.body;

  const pwPattern = /^(?=.{8,}$)(?=.*[A-Za-z])(?=.*\d).*/; // ít nhất 8 ký tự, có chữ và số
  if (!pwPattern.test(password)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters long and include letters and numbers'
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await pool.query(
      'INSERT INTO users (id, email, password_hash, name, phone, role, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
      [id, email, hashedPassword, name, phone, 'user']
    );
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    // Nếu lỗi duplicate key
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Email has been registered' });
    }
    // Lỗi khác
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

exports.login = async (req, res) => {
  const pool = getPostgresPool();
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.is_locked) {
      return res.status(403).json({ message: 'Account is locked. Please contact admin.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Tạo session record (best-effort, không chặn login nếu fail)
    (async () => {
      try {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
        await createSession(user.id, token, expiresAt);
      } catch (sessErr) {
        // Log rõ ràng để dev biết (không trả lỗi cho client)
        console.error('createSession failed:', sessErr && sessErr.stack ? sessErr.stack : sessErr);
      }
    })();

    // Trả token và user info cho client
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

exports.logout = async (req, res) => {
  const pool = getPostgresPool();
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  try {
    // 1. Xóa session của user trong bảng user_sessions
    await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);

    // 2. Cập nhật last_login = NOW() (ghi lại thời điểm logout)
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [userId]);

    // 3. Trả response
    res.json({ message: 'Logout successful' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Logout failed', error: err.message });
  }
};


