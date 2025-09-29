const Review = require('../models/Review');

// Add a new review
exports.addReview = async (req, res) => {
    try {
        const { userId, eventId, rating, feedback } = req.body;
        const newReview = new Review({ userId, eventId, rating, feedback });
        await newReview.save();
        res.status(201).json({ message: 'Review added successfully', review: newReview });
    } catch (error) {
        res.status(500).json({ message: 'Error adding review', error: error.message });
    }
};

// Get all reviews for an event
exports.getReviews = async (req, res) => {
    try {
        const { eventId } = req.params;
        const reviews = await Review.find({ eventId });
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
};

// Delete a review
exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        await Review.findByIdAndDelete(reviewId);
        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting review', error: error.message });
    }
};