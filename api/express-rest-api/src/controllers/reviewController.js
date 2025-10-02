//file: api/express-rest-api/src/controllers/reviewController.js
const { getPostgresPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.addReview = async (req, res) => {
  const pool = getPostgresPool();
  const { event_id, rating, review } = req.body;
  try {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO ratings (id, user_id, event_id, rating, review, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
      [id, req.user.id, event_id, rating, review]
    );
    res.status(201).json({ message: 'Review added' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding review', error: err.message });
  }
};

exports.getReviewsByEvent = async (req, res) => {
  const pool = getPostgresPool();
  try {
    const result = await pool.query('SELECT * FROM ratings WHERE event_id = $1', [req.params.eventId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews', error: err.message });
  }
};