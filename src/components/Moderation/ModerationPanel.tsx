import React, { useState } from "react";
import {
  Eye,
  Check,
  X,
  Clock,
  MessageSquare,
  EyeOff,
  Trash2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Event } from "../../types";

export function ModerationPanel() {
  const { state, dispatch } = useApp();
  const { events, users, comments, currentUser } = state;

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const pendingEvents = events.filter((event) => event.status === "pending");
  const reportedComments = comments.filter((comment) => !comment.isHidden);

  const handleApproveEvent = (eventId: string) => {
    dispatch({ type: "APPROVE_EVENT", payload: eventId });
  };

  const handleRejectEvent = (eventId: string, reason: string) => {
    dispatch({ type: "REJECT_EVENT", payload: { eventId, reason } });
    setShowRejectModal(false);
    setRejectionReason("");
    setSelectedEvent(null);
  };

  const handleHideComment = (commentId: string) => {
    dispatch({ type: "HIDE_COMMENT", payload: commentId });
  };

  const handleUnhideComment = (commentId: string) => {
    dispatch({ type: "UNHIDE_COMMENT", payload: commentId });
  };

  const handleDeleteComment = (commentId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa bình luận này?")) {
      dispatch({ type: "DELETE_COMMENT", payload: commentId });
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold flex items-center gap-3">
          <span className="text-4xl animate-bounce">✨</span>
          <span className="pb-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
            Kiểm duyệt nội dung
          </span>
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mt-1">
          Quản lý và kiểm duyệt sự kiện, bình luận
        </p>
      </div>

      {/* Pending Events */}
      <div className="card rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border bg-gradient-to-r from-yellow-200 via-orange-200 to-pink-200 dark:from-yellow-700 dark:via-orange-700 dark:to-pink-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500 dark:text-orange-400" />
            Sự kiện chờ duyệt ({pendingEvents.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-dark-border">
          {pendingEvents.map((event) => {
            const creator = users.find((u) => u.id === event.createdBy);
            return (
              <div
                key={event.id}
                className="p-6 hover:bg-gradient-to-r hover:from-indigo-50 hover:via-purple-50 hover:to-pink-50 dark:hover:from-indigo-900 dark:hover:via-purple-900 dark:hover:to-pink-900 rounded-xl transition-all duration-300 mb-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-dark-text-primary">
                      {event.title}
                    </h4>
                    <p className="text-gray-600 dark:text-dark-text-secondary mb-3 line-clamp-2">
                      {event.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 dark:text-dark-text-tertiary mb-4">
                      <div>
                        <p>
                          <strong>Người tạo:</strong> {creator?.name}
                        </p>
                        <p>
                          <strong>Thời gian:</strong>{" "}
                          {formatDate(event.startTime)}
                        </p>
                      </div>
                      <div>
                        <p>
                          <strong>Địa điểm:</strong> {event.location}
                        </p>
                        <p>
                          <strong>Danh mục:</strong> {event.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium transition-all ${
                          event.isPublic
                            ? "bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700"
                            : "bg-gradient-to-r from-orange-400 to-orange-600 text-white hover:from-orange-500 hover:to-orange-700"
                        }`}
                      >
                        {event.isPublic ? "Công khai" : "Riêng tư"}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 text-gray-800 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 dark:text-gray-300">
                        {event.category}
                      </span>
                      {event.maxParticipants && (
                        <span className="px-2 py-1 text-xs rounded-full bg-gradient-to-r from-blue-400 to-blue-600 text-white hover:from-blue-500 hover:to-blue-700">
                          Giới hạn: {event.maxParticipants} người
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col space-y-2 ml-6">
                    <button
                      onClick={() => handleApproveEvent(event.id)}
                      className="flex items-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                    >
                      <Check className="h-4 w-4 mr-1" /> Duyệt
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowRejectModal(true);
                      }}
                      className="flex items-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                    >
                      <X className="h-4 w-4 mr-1" /> Từ chối
                    </button>
                    <button className="flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm">
                      <Eye className="h-4 w-4 mr-1" /> Chi tiết
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
      <div className="card rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border bg-gradient-to-r from-blue-200 via-blue-300 to-purple-200 dark:from-blue-700 dark:via-blue-800 dark:to-purple-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            Quản lý bình luận
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-dark-border">
          {comments.slice(0, 10).map((comment) => {
            const user = users.find((u) => u.id === comment.userId);
            const event = events.find((e) => e.id === comment.eventId);
            return (
              <div
                key={comment.id}
                className={`p-6 rounded-xl mb-4 hover:scale-[1.01] transition-transform duration-200 ${
                  comment.isHidden
                    ? "bg-gray-100 dark:bg-gray-800 border-l-4 border-yellow-400"
                    : "bg-white dark:bg-dark-bg-secondary"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900 dark:text-dark-text-primary">
                        {user?.name}
                      </span>
                      <span className="text-gray-500 dark:text-dark-text-tertiary text-sm">
                        bình luận trong "{event?.title}"
                      </span>
                      {comment.isHidden && (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300">
                          Đã ẩn
                        </span>
                      )}
                    </div>
                    <p
                      className={`mb-2 ${
                        comment.isHidden
                          ? "text-gray-500 dark:text-dark-text-tertiary"
                          : "text-gray-700 dark:text-dark-text-secondary"
                      }`}
                    >
                      {comment.content}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {comment.isHidden ? (
                      <button
                        onClick={() => handleUnhideComment(comment.id)}
                        className="flex items-center px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                      >
                        <Eye className="h-4 w-4 mr-1" /> Hiện lại
                      </button>
                    ) : (
                      <button
                        onClick={() => handleHideComment(comment.id)}
                        className="flex items-center px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors text-sm"
                      >
                        <EyeOff className="h-4 w-4 mr-1" /> Ẩn
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="flex items-center px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "Chờ duyệt",
            count: pendingEvents.length,
            icon: Clock,
            color: "orange",
          },
          {
            title: "Đã duyệt",
            count: events.filter((e) => e.status === "approved").length,
            icon: Check,
            color: "green",
          },
          {
            title: "Bị từ chối",
            count: events.filter((e) => e.status === "rejected").length,
            icon: X,
            color: "red",
          },
          {
            title: "Bình luận ẩn",
            count: comments.filter((c) => c.isHidden).length,
            icon: MessageSquare,
            color: "gray",
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`card rounded-xl p-6 bg-gradient-to-r from-${stat.color}-200 via-${stat.color}-300 to-${stat.color}-200 dark:from-${stat.color}-700 dark:via-${stat.color}-800 dark:to-${stat.color}-700 hover:scale-[1.03] transition-all duration-300`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">
                    {stat.title}
                  </p>
                  <p
                    className={`text-2xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}
                  >
                    {stat.count}
                  </p>
                </div>
                <Icon
                  className={`h-8 w-8 text-${stat.color}-500 dark:text-${stat.color}-400`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card rounded-xl p-6 max-w-md w-full bg-white dark:bg-dark-bg-primary shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">
              Từ chối sự kiện
            </h3>
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
                  setRejectionReason("");
                  setSelectedEvent(null);
                }}
                className="button-secondary flex-1 px-4 py-2 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  handleRejectEvent(selectedEvent.id, rejectionReason)
                }
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
