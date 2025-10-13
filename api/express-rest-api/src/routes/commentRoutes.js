//file: api/express-rest-api/src/routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

// bình luận & đánh giá đều cho tất cả user đăng nhập
router.post('/comments', authMiddleware, commentController.addComment);
router.get('/comments/:eventId', commentController.getCommentsByEvent);

router.post('/reviews', authMiddleware, reviewController.addReview);
router.get('/reviews/:eventId', reviewController.getReviewsByEvent);

router.patch('/:commentId', authMiddleware, commentController.updateComment);


module.exports = router;
