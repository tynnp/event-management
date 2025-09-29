const Comment = require('../models/Comment');

// Add a new comment
exports.addComment = async (req, res) => {
    try {
        const { eventId, content } = req.body;
        const userId = req.user.id; // Assuming user ID is stored in req.user after authentication

        const newComment = new Comment({
            userId,
            eventId,
            content
        });

        await newComment.save();
        res.status(201).json({ message: 'Comment added successfully', comment: newComment });
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment', error: error.message });
    }
};

// Get comments for an event
exports.getComments = async (req, res) => {
    try {
        const { eventId } = req.params;
        const comments = await Comment.find({ eventId }).populate('userId', 'username'); // Populate userId to get username

        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching comments', error: error.message });
    }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id; // Assuming user ID is stored in req.user after authentication

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        await comment.remove();
        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting comment', error: error.message });
    }
};