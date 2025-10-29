//file: api/express-rest-api/src/controllers/statsController.js
const { getPostgresPool } = require('../config/database');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const Rating = require('../models/Rating');

exports.eventStatistics = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
  const pool = getPostgresPool();
  try {
    // Using database view for complex statistics
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
    // Get all events to calculate statistics
    const allEvents = await Event.findAll(null, 'admin'); // Get all events for admin
    
    const allUsers = await User.findAll();
    
    // Count events by status
    const pendingEvents = allEvents.filter(e => e.status === 'pending').length;
    const approvedEvents = allEvents.filter(e => e.status === 'approved').length;
    const cancelledEvents = allEvents.filter(e => e.status === 'cancelled').length;
    const rejectedEvents = allEvents.filter(e => e.status === 'rejected').length;
    
    // Count upcoming approved events
    const now = new Date();
    const upcomingEvents = allEvents.filter(e => 
      e.status === 'approved' && new Date(e.start_time) > now
    ).length;

    // Get average rating using view or direct query
    const avgRatingResult = await pool.query(
      'SELECT COALESCE(AVG(rating), 0)::numeric(10,2) AS average FROM ratings'
    );
    
    // Get total participants count
    const allParticipants = await Attendance.findByEvent(null); // Would need to modify model for this
    const totalParticipantsResult = await pool.query('SELECT COUNT(*) AS total FROM participants');

    res.json({
      total_users: allUsers.length,
      total_events: allEvents.length,
      pending_events: pendingEvents,
      approved_events: approvedEvents,
      cancelled_events: cancelledEvents,
      rejected_events: rejectedEvents,
      total_participations: parseInt(totalParticipantsResult.rows[0].total, 10),
      upcoming_events: upcomingEvents,
      average_rating: parseFloat(avgRatingResult.rows[0].average),
    });
  } catch (err) {
    console.error('Error fetching system statistics:', err);
    res.status(500).json({ message: 'Error fetching statistics', error: err.message });
  }
};