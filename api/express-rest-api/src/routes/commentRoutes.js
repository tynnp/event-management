const express = require('express');
const { addComment, getComments, deleteComment } = require('../controllers/commentController');

const router = express.Router();

// Route to add a comment
router.post('/:eventId/comments', addComment);

// Route to get comments for an event
router.get('/:eventId/comments', getComments);

// Route to delete a comment
router.delete('/comments/:commentId', deleteComment);

module.exports = router;