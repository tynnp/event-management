const { getPostgresPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Gửi thông báo (dùng nội bộ)
exports.sendNotification = async (userId, title, message, type, relatedEventId = null) => {
  const pool = getPostgresPool();
  try {
    await pool.query(
      `INSERT INTO notifications (id, user_id, title, message, type, related_event_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), userId, title, message, type, relatedEventId]
    );
  } catch (err) {
    console.error('Error sending notification:', err.message);
  }
};

// Lấy danh sách thông báo cho moderator/admin
exports.getAllNotifications = async (req, res) => {
  const pool = getPostgresPool();
  try {
    let result;

    if (req.user.role === 'admin' || req.user.role === 'moderator') {
      // admin/mod xem tất cả
      result = await pool.query(`
        SELECT n.*, u.name AS user_name
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        ORDER BY n.created_at DESC
      `);
    } else {
      // user thường chỉ xem của mình
      result = await pool.query(`
        SELECT n.*, u.name AS user_name
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE n.user_id = $1
        ORDER BY n.created_at DESC
      `, [req.user.id]);
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};


// Đánh dấu đã đọc
exports.markAsRead = async (req, res) => {
  const pool = getPostgresPool();
  try {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1`,
      [req.params.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error marking notification:', err.message);
    res.status(500).json({ message: 'Error marking notification' });
  }
};

// Xóa thông báo
exports.deleteNotification = async (req, res) => {
  const pool = getPostgresPool();
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admins only' });
  }

  try {
    await pool.query(`DELETE FROM notifications WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting notification' });
  }
};
