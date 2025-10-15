import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Share2,
  MessageSquare,
  Star,
  QrCode,
  ArrowLeft,
  CheckCircle,
  UserPlus,
  Heart,
  Eye,
  EyeOff,
  Trash2,
  Reply
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Event, Comment, Rating } from '../../types';

interface EventDetailProps {
  event?: Event;
  onBack?: () => void;
}

export function EventDetail({ event, onBack }: EventDetailProps) {
  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-[1px] rounded-2xl mb-6 w-full max-w-md">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-center mb-4">
              <Calendar className="h-12 w-12 text-blue-500 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">
              Bạn chưa tạo sự kiện nào
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
              Vui lòng tạo sự kiện để mới!
            </p>
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại danh sách
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { state, dispatch } = useApp();
  const { currentUser, comments, ratings, users } = state;
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [showHiddenComments, setShowHiddenComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const isParticipant = event.participants.some(p => p.userId === currentUser?.id);
  const isCreator = event.createdBy === currentUser?.id;
  const canRate = isParticipant && new Date(event.endTime) < new Date();
  const userParticipant = event.participants.find(p => p.userId === currentUser?.id);

  // Lấy tất cả comments và replies
  const allEventComments = [
    ...event.comments,
    ...comments.filter(c => c.eventId === event.id)
  ];

  // Nhóm comments và replies
  const groupedComments = allEventComments.reduce((acc, comment) => {
    if (!comment.parentId) {
      // Đây là comment gốc
      acc[comment.id] = {
        ...comment,
        replies: allEventComments.filter(c => c.parentId === comment.id)
      };
    }
    return acc;
  }, {} as Record<string, Comment & { replies: Comment[] }>);

  const visibleComments = Object.values(groupedComments).filter(c => !c.isHidden);
  const hiddenComments = Object.values(groupedComments).filter(c => c.isHidden);

  const allComments = showHiddenComments ? [...visibleComments, ...hiddenComments] : visibleComments;

  const eventRatings = ratings.filter(r => r.eventId === event.id);
  const hasRated = eventRatings.some(r => r.userId === currentUser?.id);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleJoinEvent = () => {
    if (currentUser && !isParticipant) {
      const qrCode = `${event.id}-${currentUser.id}-${Date.now()}`;
      dispatch({
        type: 'JOIN_EVENT',
        payload: {
          eventId: event.id,
          userId: currentUser.id,
          qrCode
        }
      });
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser && newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        userId: currentUser.id,
        eventId: event.id,
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
        isHidden: false
      };
      dispatch({ type: 'ADD_COMMENT', payload: comment });
      setNewComment('');
    }
  };

  const handleAddRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser && newRating > 0) {
      const rating: Rating = {
        id: Date.now().toString(),
        userId: currentUser.id,
        eventId: event.id,
        rating: newRating,
        review: newReview.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_RATING', payload: rating });
      setNewRating(0);
      setNewReview('');
    }
  };

  const handleUnhideComment = (commentId: string) => {
    dispatch({ type: 'UNHIDE_COMMENT', payload: commentId });
  };

  const handleHideComment = (commentId: string) => {
    dispatch({ type: 'HIDE_COMMENT', payload: commentId });
  };

  const handleDeleteComment = (commentId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      dispatch({ type: 'DELETE_COMMENT', payload: commentId });
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    setReplyContent('');
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !currentUser || !replyingTo) return;

    const reply: Comment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      eventId: event.id,
      content: replyContent.trim(),
      createdAt: new Date().toISOString(),
      isHidden: false,
      parentId: replyingTo
    };

    dispatch({ type: 'ADD_COMMENT', payload: reply });
    setReplyContent('');
    setReplyingTo(null);
  };

  const generateQRCode = (data: string) => {
    // Simple QR code placeholder - in a real app, you'd use a QR code library
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="white"/>
        <rect x="20" y="20" width="160" height="160" fill="black" opacity="0.1"/>
        <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="8" fill="black">
          QR: ${data}
        </text>
      </svg>
    `)}`;
  };

  const getEventStatus = () => {
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    if (now < start) return { status: 'upcoming', text: 'Sắp diễn ra', color: 'bg-blue-100 text-blue-800' };
    if (now >= start && now <= end) return { status: 'ongoing', text: 'Đang diễn ra', color: 'bg-green-100 text-green-800' };
    return { status: 'ended', text: 'Đã kết thúc', color: 'bg-gray-100 text-gray-800' };
  };

  const eventStatus = getEventStatus();

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:text-dark-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại
      </button>

      <div className="card rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="aspect-video bg-gradient-to-r from-blue-500 to-purple-600 relative">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-6 left-6">
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${eventStatus.color}`}>
              {eventStatus.text}
            </span>
          </div>
          <div className="absolute top-6 right-6 flex space-x-2">
            <button className="card/20 backdrop-blur-sm text-white p-2 rounded-lg hover:card/30 transition-colors">
              <Heart className="h-4 w-4" />
            </button>
            <button className="card/20 backdrop-blur-sm text-white p-2 rounded-lg hover:card/30 transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">{event.title}</h1>
              <p className="text-gray-600 dark:text-dark-text-secondary text-lg mb-6">{event.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center text-gray-700 dark:text-dark-text-secondary">
                    <Calendar className="h-5 w-5 mr-3 text-gray-400 dark:text-dark-text-tertiary" />
                    <div>
                      <p className="font-medium">{formatDate(event.startTime)}</p>
                      <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-dark-text-secondary">
                    <MapPin className="h-5 w-5 mr-3 text-gray-400 dark:text-dark-text-tertiary" />
                    <p>{event.location}</p>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-dark-text-secondary">
                    <Users className="h-5 w-5 mr-3 text-gray-400 dark:text-dark-text-tertiary" />
                    <p>
                      {event.participants.length}
                      {event.maxParticipants ? `/${event.maxParticipants}` : ''} người tham gia
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-2">Thông tin tổ chức</h3>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                      Người tạo: {users.find(u => u.id === event.createdBy)?.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                      Loại: {event.isPublic ? 'Công khai' : 'Riêng tư'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                      Danh mục: {event.category}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="lg:ml-8 lg:min-w-[300px]">
              <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-xl p-6">
                {!isParticipant && !isCreator && eventStatus.status === 'upcoming' && (
                  <button
                    onClick={handleJoinEvent}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <UserPlus className="h-4 w-4 inline mr-2" />
                    Tham gia sự kiện
                  </button>
                )}

                {isParticipant && userParticipant && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 py-3 px-4 rounded-lg">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Đã tham gia sự kiện
                    </div>

                    <button
                      onClick={() => setShowQR(true)}
                      className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg hover:bg-gray-900 transition-colors font-medium"
                    >
                      <QrCode className="h-4 w-4 inline mr-2" />
                      Xem mã QR
                    </button>

                    {userParticipant.checkedIn && (
                      <div className="text-center text-sm text-green-600">
                        ✓ Đã điểm danh: {new Date(userParticipant.checkInTime!).toLocaleString('vi-VN')}
                      </div>
                    )}
                  </div>
                )}

                {isCreator && (
                  <div className="text-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 py-3 px-4 rounded-lg">
                    <span className="font-medium">Bạn là người tạo sự kiện này</span>
                  </div>
                )}

                {event.averageRating > 0 && (
                  <div className="mt-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="font-medium">{event.averageRating.toFixed(1)}/5.0</span>
                      <span className="text-gray-500 dark:text-dark-text-tertiary">({eventRatings.length} đánh giá)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rating Section - only show if user can rate */}
          {canRate && !hasRated && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Đánh giá sự kiện</h3>
              <form onSubmit={handleAddRating} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                    Điểm đánh giá
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className={`p-1 ${star <= newRating ? 'text-yellow-500' : 'text-gray-300'}`}
                      >
                        <Star className="h-6 w-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                    Nhận xét (tùy chọn)
                  </label>
                  <textarea
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-tertiary"
                    placeholder="Chia sẻ cảm nhận của bạn về sự kiện..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={newRating === 0}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-400"
                >
                  Gửi đánh giá
                </button>
              </form>
            </div>
          )}

          {/* Comments Section */}
          <div className="border-t border-gray-200 dark:border-dark-border pt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Bình luận ({allComments.length})
              </h3>

              {hiddenComments.length > 0 && (
                <button
                  onClick={() => setShowHiddenComments(!showHiddenComments)}
                  className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {showHiddenComments ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Ẩn bình luận đã ẩn
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Hiện bình luận đã ẩn ({hiddenComments.length})
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Add Comment */}
            <form onSubmit={handleAddComment} className="mb-8">
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-tertiary"
                    placeholder="Viết bình luận..."
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  >
                    Bình luận
                  </button>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-6">
              {allComments.map((comment) => {
                const user = users.find(u => u.id === comment.userId);
                const isHidden = comment.isHidden;
                const canModerate = currentUser?.role === 'admin' || currentUser?.role === 'moderator';

                return (
                  <div key={comment.id} className={`flex space-x-4 p-4 rounded-lg ${isHidden ? 'bg-gray-100 dark:bg-gray-800 border-l-4 border-yellow-400' : 'bg-white dark:bg-dark-bg-secondary'}`}>
                    <div className="w-8 h-8 bg-gray-300 dark:bg-dark-bg-tertiary rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-dark-text-primary">{user?.name}</span>
                          <span className="text-gray-500 dark:text-dark-text-tertiary text-sm">
                            {new Date(comment.createdAt).toLocaleString('vi-VN')}
                          </span>
                          {isHidden && (
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded-full">
                              Đã ẩn
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Reply button */}
                          <button
                            onClick={() => handleReply(comment.id)}
                            className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            title="Trả lời"
                          >
                            <Reply className="h-4 w-4" />
                          </button>

                          {canModerate && (
                            <>
                              {isHidden ? (
                                <button
                                  onClick={() => handleUnhideComment(comment.id)}
                                  className="p-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                                  title="Hiện lại bình luận"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleHideComment(comment.id)}
                                  className="p-1 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors"
                                  title="Ẩn bình luận"
                                >
                                  <EyeOff className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                title="Xóa bình luận"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <p className={`${isHidden ? 'text-gray-500 dark:text-dark-text-tertiary' : 'text-gray-700 dark:text-dark-text-secondary'}`}>
                        {comment.content}
                      </p>

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 ml-4 space-y-3">
                          {comment.replies.map((reply) => {
                            const replyUser = users.find(u => u.id === reply.userId);
                            return (
                              <div key={reply.id} className="flex space-x-3 p-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg">
                                <div className="w-6 h-6 bg-gray-300 dark:bg-dark-bg-secondary rounded-full flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-gray-900 dark:text-dark-text-primary text-sm">{replyUser?.name}</span>
                                    <span className="text-gray-500 dark:text-dark-text-tertiary text-xs">
                                      {new Date(reply.createdAt).toLocaleString('vi-VN')}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 dark:text-dark-text-secondary text-sm">{reply.content}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Reply Form */}
                      {replyingTo === comment.id && (
                        <form onSubmit={handleSubmitReply} className="mt-4 ml-4">
                          <div className="flex space-x-3">
                            <div className="w-6 h-6 bg-gray-300 dark:bg-dark-bg-secondary rounded-full flex-shrink-0" />
                            <div className="flex-1">
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                rows={2}
                                className="w-full border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-tertiary text-sm"
                                placeholder="Viết phản hồi..."
                              />
                              <div className="flex space-x-2 mt-2">
                                <button
                                  type="submit"
                                  disabled={!replyContent.trim()}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                                >
                                  Phản hồi
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelReply}
                                  className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
              {allComments.length === 0 && (
                <p className="text-gray-500 dark:text-dark-text-tertiary text-center py-8">Chưa có bình luận nào</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && userParticipant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-8 max-w-sm w-full text-center border border-gray-200 dark:border-dark-border">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">Mã QR tham gia sự kiện</h3>
            <img
              src={generateQRCode(userParticipant.qrCode)}
              alt="QR Code"
              className="w-48 h-48 mx-auto mb-4 border border-gray-200 dark:border-dark-border rounded-lg"
            />
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
              Xuất trình mã này tại cửa để điểm danh
            </p>
            <button
              onClick={() => setShowQR(false)}
              className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}