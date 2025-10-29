//file: api/express-rest-api/src/controllers/commentController.js
const Comment = require('../models/Comment');
const { sendNotification } = require('./notificationController');

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
    
    // Nếu là reply, thêm comment này vào danh sách replies của parent và gửi thông báo
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
      // Kiểm tra xem comment đã có trong replies chưa
      const commentIdStr = comment._id.toString();
      const existingReply = parentComment.replies.find(r => r.toString() === commentIdStr);
      if (!existingReply) {
        parentComment.replies.push(comment._id);
        await parentComment.save();
      }
      
      // Gửi thông báo cho chủ bình luận gốc (nếu không phải chính mình)
      if (parentComment.userId !== req.user.id) {
        try {
          const User = require('../models/User');
          const user = await User.findById(req.user.id);
          await sendNotification(
            parentComment.userId,
            'Có người trả lời bình luận của bạn',
            `${user?.name || 'Ai đó'} đã trả lời bình luận của bạn: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
            'comment_replied',
            parentComment.eventId
          );
        } catch (notifErr) {
          console.warn('Failed to send reply notification:', notifErr.message);
        }
      }
    }
    
    res.status(201).json({ data: comment });
  } catch (err) {
    res.status(500).json({ message: 'Error adding comment', error: err.message });
  }
};

exports.getCommentsByEvent = async (req, res) => {
  try {
    const userRole = req.user?.role || 'user'; // optional auth
    let filter = { eventId: req.params.eventId };
    
    // Chỉ lấy parent comments (không có parentId), populate replies
    let parentFilter = { ...filter, parentId: null };
    
    // Nếu không phải admin, chỉ show comment chưa bị ẩn
    if (userRole !== 'admin') {
      parentFilter.isHidden = false;
    }

    const parentComments = await Comment.find(parentFilter)
      .populate({
        path: 'replies',
        match: userRole === 'admin' ? {} : { isHidden: false }
      })
      .sort({ createdAt: -1 });
    
    res.json(parentComments);
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
          // Gửi thông báo cho chủ bình luận (nếu không phải chính mình)
          if (comment.userId !== userId) {
            try {
              const User = require('../models/User');
              const user = await User.findById(userId);
              await sendNotification(
                comment.userId,
                'Có người thích bình luận của bạn',
                `${user?.name || 'Ai đó'} đã thích bình luận của bạn trong sự kiện`,
                'comment_liked',
                comment.eventId
              );
            } catch (notifErr) {
              console.warn('Failed to send like notification:', notifErr.message);
            }
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
        
        // Gửi thông báo cho chủ bình luận gốc (nếu không phải chính mình)
        if (comment.userId !== userId) {
          try {
            const User = require('../models/User');
            const user = await User.findById(userId);
            await sendNotification(
              comment.userId,
              'Có người trả lời bình luận của bạn',
              `${user?.name || 'Ai đó'} đã trả lời bình luận của bạn: "${replyContent.substring(0, 50)}${replyContent.length > 50 ? '...' : ''}"`,
              'comment_replied',
              comment.eventId
            );
          } catch (notifErr) {
            console.warn('Failed to send reply notification:', notifErr.message);
          }
        }
        break;

      case 'delete':
        // Admin và moderator có thể xóa bất kỳ comment nào, user chỉ có thể xóa comment của mình
        if (comment.userId !== userId && !['admin', 'moderator'].includes(userRole)) {
          return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }
        await Comment.findByIdAndDelete(commentId);
        // Xóa comment khỏi replies của parent nếu có
        if (comment.parentId) {
          await Comment.updateOne(
            { _id: comment.parentId },
            { $pull: { replies: comment._id } }
          );
        }
        return res.json({ message: 'Comment deleted' });

      case 'hide':
        // Admin và moderator có thể ẩn bất kỳ comment nào
        if (comment.userId !== userId && !['admin', 'moderator'].includes(userRole)) {
          return res.status(403).json({ message: 'Not authorized to hide this comment' });
        }
        comment.isHidden = true;
        // Ẩn tất cả replies của comment này
        if (comment.replies && comment.replies.length > 0) {
          await Comment.updateMany(
            { _id: { $in: comment.replies } },
            { $set: { isHidden: true } }
          );
        }
        break;

      case 'unhide':
        // Admin và moderator có thể hiện bất kỳ comment nào
        if (comment.userId !== userId && !['admin', 'moderator'].includes(userRole)) {
          return res.status(403).json({ message: 'Not authorized to unhide this comment' });
        }
        comment.isHidden = false;
        // Hiện tất cả replies của comment này
        if (comment.replies && comment.replies.length > 0) {
          await Comment.updateMany(
            { _id: { $in: comment.replies } },
            { $set: { isHidden: false } }
          );
        }
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