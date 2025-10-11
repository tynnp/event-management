//file: api/express-rest-api/src/models/Comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  eventId: { type: String, required: true },
  userId: { type: String, required: true },
  content: { type: String, required: true },
  parentId: { type: String, default: null },
  isHidden: { type: Boolean, default: false },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  likedBy: [{ type: String }],     // track userId đã like
  dislikedBy: [{ type: String }],  // track userId đã dislike
  createdAt: { type: Date, default: Date.now },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});

module.exports = mongoose.model('Comment', commentSchema);
