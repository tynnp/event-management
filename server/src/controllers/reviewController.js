//file: api/express-rest-api/src/controllers/reviewController.js
const Rating = require('../models/Rating');
const { v4: uuidv4 } = require('uuid');

exports.addReview = async (req, res) => {
  try {
    const { event_id, rating, review } = req.body;
    if (!event_id || !rating) {
      return res.status(400).json({ message: 'event_id and rating are required' });
    }
    const numeric = Number(rating);
    if (!Number.isFinite(numeric) || numeric < 1 || numeric > 5) {
      return res.status(400).json({ message: 'rating must be between 1 and 5' });
    }

    const Event = require('../models/Event');
    const event = await Event.findById(event_id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const end = new Date(event.end_time || event.endTime);
    if (!Number.isFinite(end.getTime()) || Date.now() <= end.getTime()) {
      return res.status(400).json({ message: 'Event has not ended yet' });
    }

    // Ensure the user participated (joined) in this event
    const { getPostgresPool } = require('../config/database');
    const pool = getPostgresPool();
    const joined = await pool.query(
      'SELECT 1 FROM participants WHERE user_id = $1 AND event_id = $2 LIMIT 1',
      [req.user.id, event_id]
    );
    if (!joined.rows[0]) {
      return res.status(403).json({ message: 'Only participants can review this event' });
    }

    // Upsert: if user already rated, update; else create
    const existing = await Rating.findByUserAndEvent(req.user.id, event_id);
    let saved;
    if (existing) {
      saved = await Rating.update(existing.id, numeric, review ?? existing.review ?? null);
    } else {
      const id = uuidv4();
      saved = await Rating.create({
        id,
        user_id: req.user.id,
        event_id,
        rating: numeric,
        review: review ?? null,
      });
    }

    res.status(201).json({ message: 'Review saved', data: saved });
  } catch (err) {
    res.status(500).json({ message: 'Error adding review', error: err.message });
  }
};

exports.getReviewsByEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const reviews = await Rating.findByEvent(eventId);
    const stats = await Rating.getEventStats(eventId);
    res.json({ reviews, stats });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews', error: err.message });
  }
};