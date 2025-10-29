//file: api/express-rest-api/src/models/Category.js
const { getPostgresPool } = require('../config/database');

class Category {
  // Create new category
  static async create(categoryData) {
    const pool = getPostgresPool();
    const { id, name, description, color, icon } = categoryData;
    
    const result = await pool.query(
      'INSERT INTO categories (id, name, description, color, icon, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [id, name, description, color, icon]
    );
    
    return result.rows[0];
  }

  // Find all categories
  static async findAll() {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT id, name, description, color, icon, created_at FROM categories ORDER BY created_at DESC'
    );
    return result.rows;
  }

  // Find by ID
  static async findById(categoryId) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM categories WHERE id = $1',
      [categoryId]
    );
    return result.rows[0];
  }

  // Find by name
  static async findByName(name) {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT * FROM categories WHERE name = $1',
      [name]
    );
    return result.rows[0];
  }

  // Update category
  static async update(categoryId, updates) {
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

    values.push(categoryId);
    
    const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete category
  static async delete(categoryId) {
    const pool = getPostgresPool();
    await pool.query('DELETE FROM categories WHERE id = $1', [categoryId]);
  }
}

module.exports = Category;

