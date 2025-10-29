//file: api/express-rest-api/src/models/Rating.js
const { getPostgresPool } = require('../config/database');

class Rating {
  // Create new rating
  static async create(ratingData) {
    const pool = getPostgresPool();
    const { id, user_id, event_id, rating, review } = ratingData;
    
    const result = await pool.query(
      'INSERT INTO ratings (id, user_id, event_id, rating, review, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [id, user_id, event_id, rating, review]
    );
    
    return result.rows[0];
  }

  // Find by ID
  static async findById(ratingId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM ratings WHERE id = $1',
      [ratingId]
    );
    return result.rows[0];
  }

  // Find by event
  static async findByEvent(eventId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM ratings WHERE event_id = $1 ORDER BY created_at DESC',
      [eventId]
    );
    return result.rows;
  }

  // Find by user
  static async findByUser(userId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM ratings WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  // Find by user and event
  static async findByUserAndEvent(userId, eventId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM ratings WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );
    return result.rows[0];
  }

  // Update rating
  static async update(ratingId, rating, review) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'UPDATE ratings SET rating = $1, review = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [rating, review, ratingId]
    );
    return result.rows[0];
  }

  // Delete rating
  static async delete(ratingId) {
    const pool = getPostgresPool();
    await pool.query('DELETE FROM ratings WHERE id = $1', [ratingId]);
  }

  // Get event average rating and count
  static async getEventStats(eventId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      `SELECT 
         COALESCE(AVG(rating), 0) as average_rating,
         COUNT(*) as total_ratings
       FROM ratings 
       WHERE event_id = $1`,
      [eventId]
    );
    return result.rows[0];
  }
}

module.exports = Rating;

