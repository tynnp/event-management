const { getPostgresPool } = require('../config/database');
const Comment = require('../models/Comment');

exports.eventStatistics = async (req, res) => {
  const pool = getPostgresPool();
  try {
    const result = await pool.query('SELECT * FROM event_statistics');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching event statistics', error: err.message });
  }
};

exports.commentStatistics = async (req, res) => {
  try {
    const count = await Comment.countDocuments();
    res.json({ totalComments: count });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching comment statistics', error: err.message });
  }
};