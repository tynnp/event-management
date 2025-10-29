//file: api/express-rest-api/src/routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

// Optional auth for GET comments (allow viewing comments without login)
const optionalAuth = (req, res, next) => {
  // Try to parse auth if provided, but don't require it
  if (req.headers.authorization) {
    authMiddleware(req, res, next);
  } else {
    req.user = null;
    next();
  }
};

// Routes - GET comments không bắt buộc phải auth
router.get('/comments/:eventId', optionalAuth, commentController.getCommentsByEvent);

// Routes cần auth
router.post('/comments', authMiddleware, commentController.addComment);
router.patch('/:commentId', authMiddleware, commentController.updateComment);

// Reviews routes
router.post('/reviews', authMiddleware, reviewController.addReview);
router.get('/reviews/:eventId', reviewController.getReviewsByEvent);

module.exports = router;
