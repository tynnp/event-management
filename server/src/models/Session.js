//file: api/express-rest-api/src/models/Session.js
const { getPostgresPool } = require('../config/database');

class Session {
  // Create new session
  static async create(sessionData) {
    const pool = getPostgresPool();
    const { id, user_id, session_token, expires_at } = sessionData;
    
    const result = await pool.query(
      'INSERT INTO user_sessions (id, user_id, session_token, expires_at, created_at, last_activity) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
      [id, user_id, session_token, expires_at]
    );
    
    return result.rows[0];
  }

  // Find by token
  static async findByToken(sessionToken) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM user_sessions WHERE session_token = $1',
      [sessionToken]
    );
    return result.rows[0];
  }

  // Find by user
  static async findByUser(userId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM user_sessions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  // Find active sessions by user
  static async findActiveByUser(userId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM user_sessions WHERE user_id = $1 AND expires_at > NOW() ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  // Update last activity
  static async updateLastActivity(sessionToken) {
    const pool = getPostgresPool();
    await pool.query(
      'UPDATE user_sessions SET last_activity = NOW() WHERE session_token = $1',
      [sessionToken]
    );
  }

  // Delete session
  static async delete(sessionToken) {
    const pool = getPostgresPool();
    await pool.query(
      'DELETE FROM user_sessions WHERE session_token = $1',
      [sessionToken]
    );
  }

  // Delete all sessions for user
  static async deleteByUser(userId) {
    const pool = getPostgresPool();
    await pool.query(
      'DELETE FROM user_sessions WHERE user_id = $1',
      [userId]
    );
  }

  // Delete expired sessions
  static async deleteExpired() {
    const pool = getPostgresPool();
    await pool.query(
      'DELETE FROM user_sessions WHERE expires_at < NOW()'
    );
  }

  // Check if session is valid
  static async isValid(sessionToken) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT id FROM user_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [sessionToken]
    );
    return result.rows.length > 0;
  }
}

module.exports = Session;

