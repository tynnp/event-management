// file: api/express-rest-api/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const { v4: uuidv4 } = require('uuid');
const { connectRedis } = require('../config/redis');
const { sendMail } = require('../utils/emailService');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Step 1: Start registration - send OTP and store pending data in Redis
exports.registerStart = async (req, res) => {
  const { email, password, name, phone } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // basic pattern: at least 8 chars, letters and numbers
  const pwPattern = /^(?=.{8,}$)(?=.*[A-Za-z])(?=.*\d).*/;
  if (!pwPattern.test(password)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters long and include letters and numbers'
    });
  }

  try {
    // Check email already exists
    const exists = await User.findByEmail(email);
    if (exists) {
      return res.status(400).json({ message: 'Email has been registered' });
    }

    const client = await connectRedis();
    const otp = generateOTP();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store pending registration for 10 minutes
    const pending = { email, name, phone: phone || null, password_hash: hashedPassword };
    await client.setEx(`register:${email}`, 600, JSON.stringify({ otp, pending }));

    // Send email with OTP
    await sendMail(email, 'Xác thực đăng ký tài khoản', `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 10 phút.`);

    return res.status(200).json({ message: 'OTP sent to your email. Please verify to complete registration.' });
  } catch (err) {
    console.error('registerStart error:', err);
    return res.status(500).json({ message: 'Failed to start registration', error: err.message });
  }
};

// Step 2: Verify OTP and create user
exports.registerVerify = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const client = await connectRedis();
    const data = await client.get(`register:${email}`);
    if (!data) {
      return res.status(400).json({ message: 'OTP expired or not found' });
    }

    const parsed = JSON.parse(data);
    if (parsed.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Ensure email still not registered
    const exists = await User.findByEmail(email);
    if (exists) {
      await client.del(`register:${email}`);
      return res.status(400).json({ message: 'Email has been registered' });
    }

    const id = uuidv4();
    const { pending } = parsed;
    await User.create({
      id,
      email: pending.email,
      password_hash: pending.password_hash,
      name: pending.name,
      phone: pending.phone,
      role: 'user'
    });

    await client.del(`register:${email}`);

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('registerVerify error:', err);
    return res.status(500).json({ message: 'Registration verification failed', error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      // If user not found, check if there is a pending registration awaiting OTP
      try {
        const client = await connectRedis();
        const pending = await client.get(`register:${email}`);
        if (pending) {
          return res.status(403).json({ message: 'Tài khoản chưa kích hoạt. Vui lòng kiểm tra email để nhập OTP.' });
        }
      } catch (e) {
        // ignore redis errors, fall back to generic message
      }
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng' });
    }

    if (user.is_locked) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa. Vui lòng liên hệ admin.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng' });

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


