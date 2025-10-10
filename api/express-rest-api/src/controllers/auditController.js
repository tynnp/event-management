const { getPostgresPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Ghi log (dùng nội bộ)
exports.logAction = async (userId, action, table, recordId, oldValues, newValues, req = null) => {
  const pool = getPostgresPool();
  const ip = req ? req.ip : null;
  const ua = req ? req.headers['user-agent'] : null;

  try {
    await pool.query(
      `INSERT INTO audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [uuidv4(), userId, action, table, recordId, JSON.stringify(oldValues || {}), JSON.stringify(newValues || {}), ip, ua]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

// Lấy tất cả log (admin only)
exports.getAllLogs = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admins only' });
  }

  const pool = getPostgresPool();
  try {
    const result = await pool.query(`
      SELECT a.*, u.username
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching logs:', err.message);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
};
