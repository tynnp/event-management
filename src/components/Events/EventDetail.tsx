//file: src/components/Events/EventDetail.tsx
import React, { useEffect, useState } from 'react';
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
import { useParams, useNavigate } from 'react-router-dom';

interface EventDetailProps {
  event?: Event;
  onBack?: () => void;
}

export function EventDetail({ event: propEvent, onBack }: EventDetailProps) {
  const { state, dispatch } = useApp();
  const { currentUser, comments = [], ratings = [], users = [] } = state;

  const { id: paramId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // --- All hooks / state must be declared unconditionally at top to respect Rules of Hooks ---
  const [remoteEvent, setRemoteEvent] = useState<Event | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [showHiddenComments, setShowHiddenComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');



  const RAW_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';
  const BASE = RAW_BASE.replace(/\/$/, '') + '/api';

  const getToken = (): string | null => {
    const keys = ['token', 'accessToken', 'authToken', 'currentUser', 'user'];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const obj = JSON.parse(raw);
        if (obj?.token) return obj.token;
        if (obj?.accessToken) return obj.accessToken;
        if (obj?.data?.token) return obj.data.token;
      } catch {
        if (k !== 'currentUser' && k !== 'user') return raw;
      }
    }
    return null;
  };

  const clearAuth = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
    } catch {}
  };

  useEffect(() => {
    let mounted = true;
    if (propEvent) {
      setRemoteEvent(null);
      setRemoteError(null);
      setLoadingRemote(false);
      return;
    }

    const id = paramId;
    if (!id) return;

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchEvent = async () => {
      setLoadingRemote(true);
      setRemoteError(null);

      const token = getToken();

      try {
        const res = await fetch(`${BASE}/events/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          credentials: 'include',
          signal
        });

        if (!mounted) return;

        if (res.status === 401) {
          clearAuth();
          setRemoteError('Không có quyền truy cập. Vui lòng đăng nhập lại.');
          navigate('/login', { replace: true });
          return;
        }

        if (!res.ok) {
          let bodyText = await res.text();
          try {
            const json = JSON.parse(bodyText);
            throw new Error(json.message || json.error || res.statusText);
          } catch {
            throw new Error(bodyText || res.statusText);
          }
        }

        const data = await res.json().catch(() => null);
        if (!mounted) return;
        const raw = data?.event ?? data?.data ?? data;
        if (!raw) {
          setRemoteError('Dữ liệu sự kiện không hợp lệ');
          return;
        }

        // Chuẩn hóa key cho frontend
        const ev: Event = {
          id: raw.id ?? raw._id,
          title: raw.title,
          description: raw.description,
          location: raw.location,
          startTime: raw.startTime ?? raw.start_time,
          endTime: raw.endTime ?? raw.end_time,
          createdBy: raw.createdBy ?? raw.created_by,
          isPublic: raw.isPublic ?? raw.is_public,
          maxParticipants: raw.maxParticipants ?? raw.max_participants,
          category: raw.category ?? raw.categoryId ?? raw.category_id,
          image: raw.imageUrl ?? raw.image_url,
          rejectionReason: raw.rejectionReason ?? raw.rejection_reason,
          averageRating: raw.averageRating ?? raw.average_rating ?? 0,
          comments: raw.comments ?? [],
          participants: raw.participants ?? [],
          createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
          status: raw.status ?? 'pending',
          ratings: raw.ratings ?? []
        };
        setRemoteEvent(ev);



        if ((ev as any)._id && !(ev as any).id) {
          (ev as any).id = (ev as any)._id;
        }
        (ev as any).participants = (ev as any).participants ?? [];
        (ev as any).comments = (ev as any).comments ?? [];
        (ev as any).averageRating = (ev as any).averageRating ?? 0;

        setRemoteEvent(ev);
      } catch (err: any) {
        if (!mounted) return;
        if (err?.name === 'AbortError') return;
        setRemoteError(err?.message || 'Lỗi khi tải sự kiện');
      } finally {
        if (!mounted) return;
        setLoadingRemote(false);
      }
    };

    fetchEvent();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [propEvent, paramId, BASE, navigate]);

  const event = propEvent || remoteEvent;

  if (!propEvent && loadingRemote) {
    return <div className="text-center py-10">Đang tải...</div>;
  }

  if (!propEvent && remoteError) {
    return <div className="text-center text-red-500 py-10">{remoteError}</div>;
  }

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
            <p className="text-gray-600 dark:text-dark-text-secondary mb-6">Vui lòng tạo sự kiện để mới!</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => (onBack ? onBack() : navigate(-1))}
                className="inline-flex items-center bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại danh sách
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- UI/logic below uses 'event' variable ---
  const participants = (event as any).participants ?? [];
  const commentsOfEvent = (event as any).comments ?? [];

  const isParticipant = participants.some((p: any) => p.userId === currentUser?.id);
  const isCreator = event.createdBy === currentUser?.id;
  const canRate = isParticipant && new Date(event.endTime).getTime() < Date.now();
  const userParticipant = participants.find((p: any) => p.userId === currentUser?.id);

  const allEventComments: Comment[] = [
    ...((commentsOfEvent as Comment[]) || []),
    ...comments.filter((c: Comment) => c.eventId === event.id)
  ];

  const groupedComments = allEventComments.reduce<Record<string, Comment & { replies: Comment[] }>>((acc, comment) => {
    if (!comment.parentId) {
      acc[comment.id] = {
        ...comment,
        replies: allEventComments.filter((c: Comment) => c.parentId === comment.id)
      };
    }
    return acc;
  }, {});

  const visibleComments = Object.values(groupedComments).filter(c => !c.isHidden);
  const hiddenComments = Object.values(groupedComments).filter(c => c.isHidden);
  const allComments = showHiddenComments ? [...visibleComments, ...hiddenComments] : visibleComments;

  const eventRatings = ratings.filter(r => r.eventId === event.id);
  const hasRated = eventRatings.some(r => r.userId === currentUser?.id);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const handleJoinEvent = () => {
    if (currentUser && !isParticipant) {
      const qrCode = `${event.id}-${currentUser.id}-${Date.now()}`;
      dispatch({ type: 'JOIN_EVENT', payload: { eventId: event.id, userId: currentUser.id, qrCode } });
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

  const handleUnhideComment = (commentId: string) => dispatch({ type: 'UNHIDE_COMMENT', payload: commentId });
  const handleHideComment = (commentId: string) => dispatch({ type: 'HIDE_COMMENT', payload: commentId });
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
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">' +
      '<rect width="200" height="200" fill="white"/>' +
      '<rect x="20" y="20" width="160" height="160" fill="black" opacity="0.1"/>' +
      '<text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="8" fill="black">QR: ' +
      data +
      '</text>' +
      '</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  };

  const getEventStatus = () => {
    const now = Date.now();
    const start = new Date(event.startTime).getTime();
    const end = new Date(event.endTime).getTime();
    if (now < start) return { status: 'upcoming', text: 'Sắp diễn ra', color: 'bg-blue-100 text-blue-800' };
    if (now >= start && now <= end) return { status: 'ongoing', text: 'Đang diễn ra', color: 'bg-green-100 text-green-800' };
    return { status: 'ended', text: 'Đã kết thúc', color: 'bg-gray-100 text-gray-800' };
  };

  const eventStatus = getEventStatus();

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Nút quay lại */}
      <button
        onClick={() => (onBack ? onBack() : navigate(-1))}
        className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-500 mb-4 transition-all"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại
      </button>

      {/* Header */}
      <div
        className="rounded-2xl shadow-lg overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 
        dark:from-[#1e1b4b] dark:via-[#312e81] dark:to-[#1e3a8a] border border-gray-200 dark:border-indigo-800/40"
      >
        <div className="aspect-video relative">
          {event.image ? (
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600" />
          )}
          <div className="absolute inset-0 bg-black/30" />

          <div className="absolute top-6 left-6">
            <span
              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${eventStatus.color}`}
            >
              {eventStatus.text}
            </span>
          </div>

          <div className="absolute top-6 right-6 flex space-x-2">
            <button className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-white/30 transition">
              <Heart className="h-4 w-4" />
            </button>
            <button className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-white/30 transition">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Thông tin sự kiện */}
        <div className="p-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4 animate-gradient-x">
            {event.title}
          </h1>
          <p className="text-gray-700 dark:text-gray-300 text-lg mb-8">
            {event.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="space-y-4">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <Calendar className="h-5 w-5 mr-3 text-purple-500" />
                <div>
                  <p className="font-medium">{formatDate(event.startTime)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </p>
                </div>
              </div>

              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <MapPin className="h-5 w-5 mr-3 text-pink-500" />
                <p>{event.location}</p>
              </div>

              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <Users className="h-5 w-5 mr-3 text-blue-500" />
                <div>
                  <p>
                    Người tạo:{" "}
                    {users.find((u) => u.id === event.createdBy)?.name ||
                      "Không xác định"}
                  </p>
                  <p>Loại: {event.isPublic ? "Công khai" : "Riêng tư"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-dark-bg-tertiary p-6 rounded-2xl shadow-inner">
              {!isParticipant && !isCreator && eventStatus.status === "upcoming" && (
                <button
                  onClick={handleJoinEvent}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:scale-105 transform transition"
                >
                  <UserPlus className="h-4 w-4 inline mr-2" />
                  Tham gia sự kiện
                </button>
              )}

              {isParticipant && userParticipant && (
                <div className="space-y-4 text-center">
                  <div className="text-green-600 bg-green-100 dark:bg-green-900/20 py-3 px-4 rounded-lg font-medium flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Đã tham gia sự kiện
                  </div>
                  <button
                    onClick={() => setShowQR(true)}
                    className="w-full bg-gray-800 text-white py-3 rounded-xl hover:bg-gray-900 transition"
                  >
                    <QrCode className="h-4 w-4 inline mr-2" />Xem mã QR
                  </button>
                </div>
              )}

              {isCreator && (
                <div className="text-center mt-4 text-blue-500 dark:text-blue-400 font-semibold">
                  Bạn là người tạo sự kiện này
                </div>
              )}

              {(event.averageRating ?? 0) > 0 && (
                <div className="mt-4 text-center flex items-center justify-center gap-2 text-yellow-500">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="font-semibold">
                    {(event.averageRating ?? 0).toFixed(1)}/5.0
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Đánh giá sự kiện */}
          {canRate && !hasRated && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-10">
              <h3 className="font-semibold text-lg mb-4">Đánh giá sự kiện</h3>
              <form onSubmit={handleAddRating} className="space-y-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className={`p-1 ${
                        star <= newRating
                          ? "text-yellow-500"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                </div>
                <textarea
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  rows={3}
                  placeholder="Chia sẻ cảm nhận của bạn..."
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:bg-dark-bg-tertiary"
                />
                <button
                  type="submit"
                  disabled={newRating === 0}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition disabled:bg-gray-400"
                >
                  Gửi đánh giá
                </button>
              </form>
            </div>
          )}

          {/* Bình luận */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-xl flex items-center text-gray-900 dark:text-gray-100">
                <MessageSquare className="h-5 w-5 mr-2" />
                Bình luận ({allComments.length})
              </h3>
            </div>
            <form onSubmit={handleAddComment} className="mb-8">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                placeholder="Viết bình luận..."
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 mb-2 focus:ring-2 focus:ring-indigo-500 dark:bg-dark-bg-tertiary"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
              >
                Bình luận
              </button>
            </form>

            {/* Danh sách bình luận */}
            <div className="space-y-6">
              {allComments.map((comment) => {
                const user = users.find((u) => u.id === comment.userId);
                const isHidden = comment.isHidden;
                const canModerate =
                  currentUser?.role === "admin" || currentUser?.role === "moderator";
                return (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-xl shadow-sm ${
                      isHidden
                        ? "bg-gray-100 dark:bg-gray-800 border-l-4 border-yellow-400"
                        : "bg-white dark:bg-dark-bg-secondary"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {user?.name}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleReply(comment.id)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Reply className="h-4 w-4" />
                        </button>
                        {canModerate && (
                          <>
                            {isHidden ? (
                              <button
                                onClick={() => handleUnhideComment(comment.id)}
                                className="text-green-500"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleHideComment(comment.id)}
                                className="text-yellow-500"
                              >
                                <EyeOff className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <p
                      className={`${
                        isHidden
                          ? "text-gray-500 dark:text-gray-400"
                          : "text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {comment.content}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* QR CODE POPUP */}
      {showQR && userParticipant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-8 max-w-sm w-full text-center border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Mã QR tham gia sự kiện</h3>
            <img
              src={generateQRCode(userParticipant.qrCode ?? "")}
              alt="QR Code"
              className="w-48 h-48 mx-auto mb-4 rounded-lg"
            />
            <button
              onClick={() => setShowQR(false)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};