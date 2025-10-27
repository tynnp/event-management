const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');
const { getPostgresPool } = require('../config/database');

// Gửi thông báo (dùng nội bộ)
exports.sendNotification = async (userId, title, message, type, relatedEventId = null) => {
  try {
    await Notification.create({
      id: uuidv4(),
      user_id: userId,
      title,
      message,
      type,
      related_event_id: relatedEventId
    });
  } catch (err) {
    console.error('Error sending notification:', err.message);
  }
};

// Lấy danh sách thông báo
exports.getAllNotifications = async (req, res) => {
  const pool = getPostgresPool();
  try {
    let result;

    if (req.user.role === 'admin' || req.user.role === 'moderator') {
      // Admin/mod xem tất cả - cần join với users để lấy name
      result = await pool.query(`
        SELECT n.*, u.name AS user_name
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        ORDER BY n.created_at DESC
      `);
    } else {
      // User thường chỉ xem của chính mình với user_name
      const notifications = await Notification.findByUser(req.user.id);
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      
      result = {
        rows: notifications.map(n => ({
          ...n,
          user_name: user.name
        }))
      };
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

// Đánh dấu đã đọc
exports.markAsRead = async (req, res) => {
  const notificationId = req.params.id;

  try {
    // Kiểm tra xem thông báo có tồn tại và thuộc về user không
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const ownerId = notification.user_id;

    // Nếu user không phải admin hoặc chủ sở hữu thì không được đánh dấu
    if (req.user.role !== 'admin' && req.user.id !== ownerId) {
      return res.status(403).json({ message: 'Not authorized to mark this notification' });
    }

    await Notification.markAsRead(notificationId);

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error marking notification:', err.message);
    res.status(500).json({ message: 'Error marking notification' });
  }
};

// Xóa thông báo
exports.deleteNotification = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admins only' });
  }

  try {
    await Notification.delete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err.message);
    res.status(500).json({ message: 'Error deleting notification' });
  }
};
