const express = require('express');
const { addReview, getReviews, deleteReview } = require('../controllers/reviewController');

const router = express.Router();

router.post('/', addReview);
router.get('/:eventId', getReviews);
router.delete('/:reviewId', deleteReview);

module.exports = router;