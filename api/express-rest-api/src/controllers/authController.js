// file: api/express-rest-api/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const { v4: uuidv4 } = require('uuid');

exports.register = async (req, res) => {
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
    
    await User.create({
      id,
      email,
      password_hash: hashedPassword,
      name,
      phone,
      role: 'user'
    });
    
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
  const { email, password } = req.body;

  try {
    const user = await User.findByEmail(email);
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

    // Create session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    (async () => {
      try {
        await Session.create({
          id: uuidv4(),
          user_id: user.id,
          session_token: token,
          expires_at: expiresAt
        });
      } catch (sessErr) {
        console.error('createSession failed:', sessErr && sessErr.stack ? sessErr.stack : sessErr);
      }
    })();

    // Update last login
    await User.updateLastLogin(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || "",
        avatar_url: user.avatar_url || null
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

exports.logout = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  try {
    // 1. Xóa tất cả sessions của user
    await Session.deleteByUser(userId);

    // 2. Cập nhật last_login = NOW() (ghi lại thời điểm logout)
    await User.updateLastLogin(userId);

    // 3. Trả response
    res.json({ message: 'Logout successful' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Logout failed', error: err.message });
  }
};


