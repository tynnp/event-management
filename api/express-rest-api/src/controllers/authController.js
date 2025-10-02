//file: api/express-rest-api/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPostgresPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.register = async (req, res) => {
  const pool = getPostgresPool();
  const { email, password, name, phone } = req.body;
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

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};