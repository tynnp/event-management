//file: api/express-rest-api/src/models/Attendance.js
const { getPostgresPool } = require('../config/database');

class Attendance {
  // Create new participant
  static async create(participantData) {
    const pool = getPostgresPool();
    const { id, user_id, event_id, qr_code } = participantData;
    
    const result = await pool.query(
      'INSERT INTO participants (id, user_id, event_id, qr_code, joined_at, checked_in, check_in_time) VALUES ($1, $2, $3, $4, NOW(), true, NOW()) RETURNING *',
      [id, user_id, event_id, qr_code]
    );
    
    return result.rows[0];
  }

  // Create participant without check-in (join only)
  static async createPending(participantData) {
    const pool = getPostgresPool();
    const { id, user_id, event_id, qr_code } = participantData;
    const result = await pool.query(
      'INSERT INTO participants (id, user_id, event_id, qr_code, joined_at, checked_in) VALUES ($1, $2, $3, $4, NOW(), false) RETURNING *',
      [id, user_id, event_id, qr_code]
    );
    return result.rows[0];
  }

  // Update check-in status
  static async updateCheckIn(eventId, qrCode) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'UPDATE participants SET checked_in = true, check_in_time = NOW() WHERE event_id = $1 AND qr_code = $2 AND checked_in = false RETURNING *',
      [eventId, qrCode]
    );
    return result.rows[0];
  }

  // Find by user and event
  static async findByUserAndEvent(userId, eventId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM participants WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );
    return result.rows[0];
  }

  // Get participants for an event
  static async findByEvent(eventId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM participants WHERE event_id = $1',
      [eventId]
    );
    return result.rows;
  }

  // Get user's participations
  static async findByUser(userId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM participants WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  }

  // Check if user has already checked in
  static async hasCheckedIn(userId, eventId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT checked_in FROM participants WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );
    return result.rows[0]?.checked_in || false;
  }

  // Delete participant
  static async delete(userId, eventId) {
    const pool = getPostgresPool();
    await pool.query(
      'DELETE FROM participants WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );
  }
}

module.exports = Attendance;
