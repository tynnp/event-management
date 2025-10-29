//file: api/express-rest-api/src/models/User.js
const { getPostgresPool } = require('../config/database');

class User {
  // Create new user
  static async create(userData) {
    const pool = getPostgresPool();
    const { id, email, password_hash, name, role = 'user', phone = null } = userData;
    
    const result = await pool.query(
      'INSERT INTO users (id, email, password_hash, name, role, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, email, password_hash, name, role, phone]
    );
    
    return result.rows[0];
  }

  // Find by ID
  static async findById(userId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0];
  }

  // Find by email
  static async findByEmail(email) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  // Get user profile (without sensitive data)
  static async getProfile(userId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT id, email, name, avatar_url, role, phone, events_attended, created_at, updated_at, last_login FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0];
  }

  // Update user profile
  static async updateProfile(userId, updates) {
    const pool = getPostgresPool();
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(userId);
    
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update password
  static async updatePassword(userId, newPasswordHash) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
      [newPasswordHash, userId]
    );
    return result.rows[0];
  }

  // Update role (admin only)
  static async updateRole(userId, newRole) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, role',
      [newRole, userId]
    );
    return result.rows[0];
  }

  // Toggle user lock status
  static async toggleLock(userId, isLocked) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'UPDATE users SET is_locked = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, is_locked',
      [isLocked, userId]
    );
    return result.rows[0];
  }

  // Get password hash for verification
  static async getPasswordHash(userId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0]?.password_hash;
  }

  // Update last login
  static async updateLastLogin(userId) {
    const pool = getPostgresPool();
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [userId]
    );
  }

  // Increment events attended
  static async incrementEventsAttended(userId) {
    const pool = getPostgresPool();
    await pool.query(
      'UPDATE users SET events_attended = events_attended + 1, updated_at = NOW() WHERE id = $1',
      [userId]
    );
  }

  // Get all users (for admin)
  static async findAll() {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT id, email, name, role, phone, avatar_url, created_at, is_locked, updated_at, last_login FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  }

  // Delete user
  static async delete(userId) {
    const pool = getPostgresPool();
    
    // Delete related data first
    await pool.query('DELETE FROM participants WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM ratings WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM events WHERE created_by = $1', [userId]);
    
    // Then delete user
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  }

  // Get user statistics
  static async getStatistics(userId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      `SELECT u.*, 
         COUNT(DISTINCT e.id) as events_created,
         COUNT(DISTINCT p.event_id) as events_joined,
         COUNT(DISTINCT r.id) as ratings_given
       FROM users u
       LEFT JOIN events e ON u.id = e.created_by
       LEFT JOIN participants p ON u.id = p.user_id
       LEFT JOIN ratings r ON u.id = r.user_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId]
    );
    return result.rows[0];
  }
}

module.exports = User;
