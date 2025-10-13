//file: api/express-rest-api/src/controllers/statsController.js
const { getPostgresPool } = require('../config/database');
const Comment = require('../models/Comment');

exports.eventStatistics = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
  const pool = getPostgresPool();
  try {
    const result = await pool.query('SELECT * FROM event_statistics');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching event statistics', error: err.message });
  }
};

exports.commentStatistics = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
  try {
    const count = await Comment.countDocuments();
    res.json({ totalComments: count });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching comment statistics', error: err.message });
  }
};

exports.systemStatistics = async (req, res) => {
  // chỉ admin xem được
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }

  const pool = getPostgresPool();

  try {
    const [
      totalUsers,
      totalEvents,
      pendingEvents,
      approvedEvents,
      totalParticipants,
      upcomingEvents,
      avgRating
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM users'),
      pool.query('SELECT COUNT(*) AS total FROM events'),
      pool.query(`SELECT COUNT(*) AS total FROM events WHERE status = 'pending'`),
      pool.query(`SELECT COUNT(*) AS total FROM events WHERE status = 'approved'`),
      pool.query('SELECT COUNT(*) AS total FROM participants'),
      pool.query('SELECT COUNT(*) AS total FROM events WHERE start_time > NOW() AND status = \'approved\''),
      pool.query('SELECT COALESCE(AVG(rating), 0)::numeric(10,2) AS average FROM ratings'),
    ]);

    res.json({
      total_users: parseInt(totalUsers.rows[0].total, 10),
      total_events: parseInt(totalEvents.rows[0].total, 10),
      pending_events: parseInt(pendingEvents.rows[0].total, 10),
      approved_events: parseInt(approvedEvents.rows[0].total, 10),
      total_participations: parseInt(totalParticipants.rows[0].total, 10),
      upcoming_events: parseInt(upcomingEvents.rows[0].total, 10),
      average_rating: parseFloat(avgRating.rows[0].average),
    });
  } catch (err) {
    console.error('Error fetching system statistics:', err);
    res.status(500).json({ message: 'Error fetching statistics', error: err.message });
  }
};