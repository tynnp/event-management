import React, { useState } from 'react';
import { Eye, Check, X, Clock, MessageSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Event } from '../../types';

export function ModerationPanel() {
  const { state, dispatch } = useApp();
  const { events, users, comments, currentUser } = state;
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const pendingEvents = events.filter(event => event.status === 'pending');
  const reportedComments = comments.filter(comment => !comment.isHidden); // In a real app, you'd have a reporting system

  const handleApproveEvent = (eventId: string) => {
    dispatch({ type: 'APPROVE_EVENT', payload: eventId });
  };

  const handleRejectEvent = (eventId: string, reason: string) => {
    dispatch({ type: 'REJECT_EVENT', payload: { eventId, reason } });
    setShowRejectModal(false);
    setRejectionReason('');
    setSelectedEvent(null);
  };

  const handleHideComment = (commentId: string) => {
    dispatch({ type: 'HIDE_COMMENT', payload: commentId });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">Kiểm duyệt nội dung</h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mt-1">Quản lý và kiểm duyệt sự kiện, bình luận</p>
      </div>

      {/* Pending Events */}
      <div className="card rounded-xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary flex items-center">
            <Clock className="h-5 w-5 mr-2 text-orange-500 dark:text-orange-400" />
            Sự kiện chờ duyệt ({pendingEvents.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-dark-border">
          {pendingEvents.map((event) => {
            const creator = users.find(u => u.id === event.createdBy);
            
            return (
              <div key={event.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary mb-2">{event.title}</h4>
                    <p className="text-gray-600 dark:text-dark-text-secondary mb-3 line-clamp-2">{event.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 dark:text-dark-text-tertiary mb-4">
                      <div>
                        <p><strong>Người tạo:</strong> {creator?.name}</p>
                        <p><strong>Thời gian:</strong> {formatDate(event.startTime)}</p>
                      </div>
                      <div>
                        <p><strong>Địa điểm:</strong> {event.location}</p>
                        <p><strong>Danh mục:</strong> {event.category}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        event.isPublic ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                      }`}>
                        {event.isPublic ? 'Công khai' : 'Riêng tư'}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                        {event.category}
                      </span>
                      {event.maxParticipants && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          Giới hạn: {event.maxParticipants} người
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-6">
                    <button
                      onClick={() => handleApproveEvent(event.id)}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Duyệt
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowRejectModal(true);
                      }}
                      className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Từ chối
                    </button>
                    <button
                      className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {pendingEvents.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-dark-text-tertiary">
              <Clock className="h-12 w-12 text-gray-400 dark:text-dark-text-tertiary mx-auto mb-4" />
              <p className="text-lg">Không có sự kiện chờ duyệt</p>
              <p className="text-sm">Tất cả sự kiện đã được xử lý</p>
            </div>
          )}
        </div>
      </div>

      {/* Comments Moderation */}
      <div className="card rounded-xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
            Quản lý bình luận
          </h3>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-dark-border">
          {comments.slice(0, 10).map((comment) => {
            const user = users.find(u => u.id === comment.userId);
            const event = events.find(e => e.id === comment.eventId);
            
            return (
              <div key={comment.id} className={`p-6 ${comment.isHidden ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900 dark:text-dark-text-primary">{user?.name}</span>
                      <span className="text-gray-500 dark:text-dark-text-tertiary text-sm">
                        bình luận trong "{event?.title}"
                      </span>
                      {comment.isHidden && (
                        <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full">
                          Đã ẩn
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-dark-text-secondary mb-2">{comment.content}</p>
                    <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">{formatDate(comment.createdAt)}</p>
                  </div>

                  {!comment.isHidden && (
                    <button
                      onClick={() => handleHideComment(comment.id)}
                      className="ml-4 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Ẩn bình luận
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {comments.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-dark-text-tertiary">
              <MessageSquare className="h-12 w-12 text-gray-400 dark:text-dark-text-tertiary mx-auto mb-4" />
              <p className="text-lg">Chưa có bình luận nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Chờ duyệt</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{pendingEvents.length}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500 dark:text-orange-400" />
          </div>
        </div>

        <div className="card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Đã duyệt</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {events.filter(e => e.status === 'approved').length}
              </p>
            </div>
            <Check className="h-8 w-8 text-green-500 dark:text-green-400" />
          </div>
        </div>

        <div className="card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Bị từ chối</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {events.filter(e => e.status === 'rejected').length}
              </p>
            </div>
            <X className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>
        </div>

        <div className="card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Bình luận ẩn</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {comments.filter(c => c.isHidden).length}
              </p>
            </div>
            <MessageSquare className="h-8 w-8 text-gray-500 dark:text-gray-400" />
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">Từ chối sự kiện</h3>
            <p className="text-gray-600 dark:text-dark-text-secondary mb-4">
              Bạn có chắc chắn muốn từ chối sự kiện "{selectedEvent.title}"?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Lý do từ chối *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="input-field w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập lý do từ chối..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedEvent(null);
                }}
                className="button-secondary flex-1 px-4 py-2 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleRejectEvent(selectedEvent.id, rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}