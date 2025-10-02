//file: api/express-rest-api/src/routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, commentController.addComment);
router.get('/:eventId', commentController.getCommentsByEvent);

module.exports = router;