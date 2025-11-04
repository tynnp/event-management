const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');
const { getPostgresPool } = require('../config/database');

// Gửi thông báo (dùng nội bộ)
exports.sendNotification = async (userId, title, message, type, relatedEventId = null) => {
  try {
    const notification = await Notification.create({
      id: uuidv4(),
      user_id: userId,
      title,
      message,
      type,
      related_event_id: relatedEventId
    });
    console.log(`Notification sent: ${type} to user ${userId}`, { title, message });
    return notification;
  } catch (err) {
    console.error('Error sending notification:', err.message);
    console.error('Details:', { userId, title, message, type, relatedEventId });
    throw err; // Don't silently fail - let caller handle it
  }
};

// Lấy danh sách thông báo (mỗi user chỉ thấy của mình)
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findByUser(req.user.id);
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    const rows = notifications.map(n => ({
      ...n,
      user_name: user?.name
    }));
    res.json(rows);
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

// Xóa thông báo (chủ sở hữu hoặc admin)
exports.deleteNotification = async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ message: 'Notification not found' });
    if (req.user.role !== 'admin' && n.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this notification' });
    }
    await Notification.delete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err.message);
    res.status(500).json({ message: 'Error deleting notification' });
  }
};
