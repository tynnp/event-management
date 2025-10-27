//file: api/express-rest-api/src/controllers/reviewController.js
const Rating = require('../models/Rating');
const { v4: uuidv4 } = require('uuid');

exports.addReview = async (req, res) => {
  try {
    const { event_id, rating, review } = req.body;
    const id = uuidv4();
    
    await Rating.create({
      id,
      user_id: req.user.id,
      event_id,
      rating,
      review
    });
    
    res.status(201).json({ message: 'Review added' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding review', error: err.message });
  }
};

exports.getReviewsByEvent = async (req, res) => {
  try {
    const reviews = await Rating.findByEvent(req.params.eventId);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews', error: err.message });
  }
};