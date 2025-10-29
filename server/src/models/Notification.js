//file: api/express-rest-api/src/models/Notification.js
const { getPostgresPool } = require('../config/database');

class Notification {
  // Create new notification
  static async create(notificationData) {
    const pool = getPostgresPool();
    const { id, user_id, title, message, type, related_event_id } = notificationData;
    
    const result = await pool.query(
      'INSERT INTO notifications (id, user_id, title, message, type, related_event_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
      [id, user_id, title, message, type, related_event_id]
    );
    
    return result.rows[0];
  }

  // Find by user
  static async findByUser(userId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  // Find unread notifications by user
  static async findUnreadByUser(userId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 AND is_read = false ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  // Find by ID
  static async findById(notificationId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM notifications WHERE id = $1',
      [notificationId]
    );
    return result.rows[0];
  }

  // Mark as read
  static async markAsRead(notificationId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *',
      [notificationId]
    );
    return result.rows[0];
  }

  // Mark all as read for user
  static async markAllAsRead(userId) {
    const pool = getPostgresPool();
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [userId]
    );
  }

  // Delete notification
  static async delete(notificationId) {
    const pool = getPostgresPool();
    await pool.query('DELETE FROM notifications WHERE id = $1', [notificationId]);
  }

  // Get unread count for user
  static async getUnreadCount(userId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = Notification;

