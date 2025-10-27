const Session = require('../models/Session');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const { getPostgresPool } = require('../config/database');

// Tạo session (được gọi khi login)
exports.createSession = async (userId, token, expiresAt) => {
  try {
    await Session.create({
      id: uuidv4(),
      user_id: userId,
      session_token: token,
      expires_at: expiresAt
    });
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
    // Get all sessions and join with users for display
    const sessions = await Session.findByUser(null); // Need to modify to get all
    const allSessions = await pool.query(`
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
    `);
    
    return res.json(allSessions.rows);
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

  try {
    // Note: Session.delete() needs session_token, not id
    // For now, use direct query until model is updated
    const pool = getPostgresPool();
    await pool.query(`DELETE FROM user_sessions WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Session deleted' });
  } catch (err) {
    console.error('Error deleting session:', err);
    res.status(500).json({ message: 'Error deleting session' });
  }
};