//file: api/express-rest-api/src/controllers/commentController.js
const Comment = require('../models/Comment');

exports.addComment = async (req, res) => {
  try {
    const { eventId, content, parentId } = req.body;
    
    if (!eventId || !content) {
      return res.status(400).json({ message: 'eventId and content are required' });
    }
    
    const comment = new Comment({
      eventId,
      userId: req.user.id,
      content,
      parentId: parentId || null,
    });
    await comment.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: 'Error adding comment', error: err.message });
  }
};

exports.getCommentsByEvent = async (req, res) => {
  try {
    const userRole = req.user?.role || 'user'; // optional auth
    let filter = { eventId: req.params.eventId };

    // Nếu không phải admin, chỉ show comment chưa bị ẩn
    if (userRole !== 'admin') {
      filter.isHidden = false;
    }

    const comments = await Comment.find(filter).populate('replies');
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching comments', error: err.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { action, replyContent } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    switch (action) {
      case 'like':
        if (comment.likedBy.includes(userId)) {
          comment.likedBy = comment.likedBy.filter(id => id !== userId);
          comment.likes = Math.max(comment.likes - 1, 0);
        } else {
          comment.likedBy.push(userId);
          comment.likes += 1;
          if (comment.dislikedBy.includes(userId)) {
            comment.dislikedBy = comment.dislikedBy.filter(id => id !== userId);
            comment.dislikes = Math.max(comment.dislikes - 1, 0);
          }
        }
        break;

      case 'dislike':
        if (comment.dislikedBy.includes(userId)) {
          comment.dislikedBy = comment.dislikedBy.filter(id => id !== userId);
          comment.dislikes = Math.max(comment.dislikes - 1, 0);
        } else {
          comment.dislikedBy.push(userId);
          comment.dislikes += 1;
          if (comment.likedBy.includes(userId)) {
            comment.likedBy = comment.likedBy.filter(id => id !== userId);
            comment.likes = Math.max(comment.likes - 1, 0);
          }
        }
        break;

      case 'reply':
        if (!replyContent) return res.status(400).json({ message: 'replyContent required' });
        const reply = new Comment({
          eventId: comment.eventId,
          userId,
          content: replyContent,
          parentId: comment._id.toString(),
        });
        await reply.save();
        comment.replies.push(reply._id);
        break;

      case 'delete':
        if (comment.userId !== userId && userRole !== 'admin') {
          return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }
        await Comment.findByIdAndDelete(commentId);
        return res.json({ message: 'Comment deleted' });

      case 'hide':
        if (comment.userId !== userId && userRole !== 'admin') {
          return res.status(403).json({ message: 'Not authorized to hide this comment' });
        }
        comment.isHidden = true;
        break;

      case 'unhide':
        if (comment.userId !== userId && userRole !== 'admin') {
          return res.status(403).json({ message: 'Not authorized to unhide this comment' });
        }
      comment.isHidden = false;
      break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    await comment.save();
    const updatedComment = await Comment.findById(commentId).populate('replies');
    res.json(updatedComment);

  } catch (err) {
    res.status(500).json({ message: 'Error updating comment', error: err.message });
  }
};