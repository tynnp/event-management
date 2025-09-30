const Comment = require('../models/Comment');

exports.addComment = async (req, res) => {
  try {
    const { eventId, content, parentId } = req.body;
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
    const comments = await Comment.find({ eventId: req.params.eventId });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching comments', error: err.message });
  }
};