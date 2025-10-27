//file: api/express-rest-api/src/models/Event.js
const { getPostgresPool } = require('../config/database');

class Event {
  // Create new event
  static async create(eventData) {
    const pool = getPostgresPool();
    const { id, title, description, start_time, end_time, location, image_url, is_public, max_participants, created_by, category_id, status } = eventData;
    
    // Sử dụng status từ eventData, mặc định là 'pending'
    const eventStatus = status || 'pending';
    
    const result = await pool.query(
      `INSERT INTO events (id, title, description, start_time, end_time, location, image_url, 
        is_public, max_participants, created_by, category_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()) RETURNING *`,
      [id, title, description, start_time, end_time, location, image_url, is_public, max_participants, created_by, category_id, eventStatus]
    );
    
    return result.rows[0];
  }

  // Add event image
  static async addImage(imageId, eventId, imageUrl) {
    const pool = getPostgresPool();
    await pool.query(
      'INSERT INTO event_images (id, event_id, image_url, uploaded_at) VALUES ($1, $2, $3, NOW())',
      [imageId, eventId, imageUrl]
    );
  }

  // Find by ID
  static async findById(eventId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      `SELECT e.*, c.name as category_name 
       FROM events e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.id = $1`,
      [eventId]
    );
    return result.rows[0];
  }

  // Find all events (with filters)
  static async findAll(userId, userRole) {
    const pool = getPostgresPool();
    let result;
    
    if (userRole === 'admin' || userRole === 'moderator') {
      // Admin/Mod xem tất cả events
      result = await pool.query(`
        SELECT e.*, c.name as category_name 
        FROM events e
        LEFT JOIN categories c ON e.category_id = c.id
        ORDER BY e.created_at DESC
      `);
    } else {
      // User thường chỉ xem:
      // 1. Sự kiện công khai đã được duyệt (status = 'approved' AND is_public = true)
      // 2. Sự kiện do chính mình tạo (bất kỳ trạng thái nào)
      result = await pool.query(`
        SELECT e.*, c.name as category_name 
        FROM events e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE (e.status = $1 AND e.is_public = $2) OR e.created_by = $3
        ORDER BY e.created_at DESC
      `, ['approved', true, userId]);
    }
    
    return result.rows;
  }

  // Update event
  static async update(eventId, updates) {
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
    fields.push(`status = 'pending'`);
    values.push(eventId);
    
    const query = `UPDATE events SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Approve event
  static async approve(eventId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['approved', eventId]
    );
    return result.rows[0];
  }

  // Reject event
  static async reject(eventId, reason) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'UPDATE events SET status = $1, rejection_reason = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      ['rejected', reason, eventId]
    );
    return result.rows[0];
  }

  // Delete event
  static async delete(eventId) {
    const pool = getPostgresPool();
    const result = await pool.query('DELETE FROM events WHERE id = $1', [eventId]);
    return result.rowCount > 0;
  }

  // Get event statistics
  static async getStatistics(eventId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      `SELECT e.*, 
         COUNT(p.id) as current_participants,
         u.name as creator_name,
         c.name as category_name
       FROM events e
       LEFT JOIN participants p ON e.id = p.event_id
       LEFT JOIN users u ON e.created_by = u.id
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.id = $1
       GROUP BY e.id, u.name, c.name`,
      [eventId]
    );
    return result.rows[0];
  }

  // Check if user can edit event
  static async canEdit(eventId, userId, userRole) {
    const pool = getPostgresPool();
    const result = await pool.query('SELECT created_by FROM events WHERE id = $1', [eventId]);
    
    if (result.rows.length === 0) return false;
    
    const event = result.rows[0];
    return event.created_by === userId || userRole === 'moderator' || userRole === 'admin';
  }

  // Check if user can delete event
  static async canDelete(eventId, userId, userRole) {
    const pool = getPostgresPool();
    const result = await pool.query('SELECT created_by FROM events WHERE id = $1', [eventId]);
    
    if (result.rows.length === 0) return false;
    
    const event = result.rows[0];
    return event.created_by === userId || userRole === 'moderator' || userRole === 'admin';
  }
}

module.exports = Event;
