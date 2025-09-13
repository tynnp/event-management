import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Share2, 
  MessageSquare,
  Star,
  QrCode,
  ArrowLeft,
  CheckCircle,
  UserPlus,
  Heart
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Event, Comment, Rating } from '../../types';

interface EventDetailProps {
  event: Event;
  onBack: () => void;
}

export function EventDetail({ event, onBack }: EventDetailProps) {
  const { state, dispatch } = useApp();
  const { currentUser, comments, ratings, users } = state;
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [showQR, setShowQR] = useState(false);

  const isParticipant = event.participants.some(p => p.userId === currentUser?.id);
  const isCreator = event.createdBy === currentUser?.id;
  const canRate = isParticipant && new Date(event.endTime) < new Date();
  const userParticipant = event.participants.find(p => p.userId === currentUser?.id);

  const eventComments = [
    ...event.comments.filter(c => !c.isHidden),
    ...comments.filter(c => c.eventId === event.id && !c.isHidden)
  ];

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
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="aspect-video bg-gradient-to-r from-blue-500 to-purple-600 relative">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-6 left-6">
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${eventStatus.color}`}>
              {eventStatus.text}
            </span>
          </div>
          <div className="absolute top-6 right-6 flex space-x-2">
            <button className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-white/30 transition-colors">
              <Heart className="h-4 w-4" />
            </button>
            <button className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-white/30 transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
              <p className="text-gray-600 text-lg mb-6">{event.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <p className="font-medium">{formatDate(event.startTime)}</p>
                      <p className="text-sm text-gray-500">
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                    <p>{event.location}</p>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Users className="h-5 w-5 mr-3 text-gray-400" />
                    <p>
                      {event.participants.length}
                      {event.maxParticipants ? `/${event.maxParticipants}` : ''} người tham gia
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Thông tin tổ chức</h3>
                    <p className="text-sm text-gray-600">
                      Người tạo: {users.find(u => u.id === event.createdBy)?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Loại: {event.isPublic ? 'Công khai' : 'Riêng tư'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Danh mục: {event.category}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="lg:ml-8 lg:min-w-[300px]">
              <div className="bg-gray-50 rounded-xl p-6">
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
                    <div className="flex items-center justify-center text-green-600 bg-green-50 py-3 px-4 rounded-lg">
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
                  <div className="text-center text-blue-600 bg-blue-50 py-3 px-4 rounded-lg">
                    <span className="font-medium">Bạn là người tạo sự kiện này</span>
                  </div>
                )}

                {event.averageRating > 0 && (
                  <div className="mt-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="font-medium">{event.averageRating.toFixed(1)}/5.0</span>
                      <span className="text-gray-500">({eventRatings.length} đánh giá)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rating Section - only show if user can rate */}
          {canRate && !hasRated && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Đánh giá sự kiện</h3>
              <form onSubmit={handleAddRating} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nhận xét (tùy chọn)
                  </label>
                  <textarea
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="border-t border-gray-200 pt-8">
            <h3 className="font-semibold text-gray-900 mb-6 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Bình luận ({eventComments.length})
            </h3>

            {/* Add Comment */}
            <form onSubmit={handleAddComment} className="mb-8">
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {eventComments.map((comment) => {
                const user = users.find(u => u.id === comment.userId);
                return (
                  <div key={comment.id} className="flex space-x-4">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">{user?.name}</span>
                        <span className="text-gray-500 text-sm">
                          {new Date(comment.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                );
              })}
              {eventComments.length === 0 && (
                <p className="text-gray-500 text-center py-8">Chưa có bình luận nào</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && userParticipant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center">
            <h3 className="text-lg font-semibold mb-4">Mã QR tham gia sự kiện</h3>
            <img
              src={generateQRCode(userParticipant.qrCode)}
              alt="QR Code"
              className="w-48 h-48 mx-auto mb-4 border border-gray-200 rounded-lg"
            />
            <p className="text-sm text-gray-600 mb-4">
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