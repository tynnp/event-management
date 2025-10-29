// file: api/express-rest-api/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { getPostgresPool } = require('../config/database');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    // Giải mã token trước, nếu sai chữ ký -> lỗi ngay
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kiểm tra trong PostgreSQL
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM user_sessions WHERE session_token = $1 AND user_id = $2',
      [token, decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Session invalid or revoked' });
    }

    const session = result.rows[0];
    const now = new Date();
    if (new Date(session.expires_at) < now) {
      return res.status(401).json({ message: 'Session expired' });
    }

    // Gắn thông tin user vào request
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
