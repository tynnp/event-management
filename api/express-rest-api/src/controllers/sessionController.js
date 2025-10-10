const { getPostgresPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Tạo session (được gọi khi login)
exports.createSession = async (userId, token, expiresAt) => {
  const pool = getPostgresPool();
  try {
    await pool.query(
      `INSERT INTO user_sessions (id, user_id, session_token, expires_at)
       VALUES (uuid_generate_v4(), $1, $2, $3)`,
      [userId, token, expiresAt]
    );
  } catch (err) {
    console.error('Error creating session:', err?.message || err);
    throw err;
  }
};

// Lấy danh sách session (admin only)
exports.getAllSessions = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admins only' });
  }

  const pool = getPostgresPool();
  try {
    // Chọn rõ cột, tránh dùng u.username nếu không tồn tại
    const q = `
      SELECT
        s.id,
        s.user_id,
        s.session_token,
        s.expires_at,
        s.created_at,
        s.last_activity,
        COALESCE(u.name, u.email, 'unknown') AS user_display
      FROM user_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `;

    const result = await pool.query(q);
    return res.json(result.rows);
  } catch (err) {
    // Log chi tiết để dev debug (console/pm2)
    console.error('Error fetching sessions:', err && err.stack ? err.stack : err);
    // Trả message an toàn cho client
    return res.status(500).json({ message: 'Error fetching sessions' });
  }
};

// Xóa session
exports.deleteSession = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admins only' });
  }

  const pool = getPostgresPool();
  try {
    await pool.query(`DELETE FROM user_sessions WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Session deleted' });
  } catch (err) {
    console.error('Error deleting session:', err);
    res.status(500).json({ message: 'Error deleting session' });
  }
};