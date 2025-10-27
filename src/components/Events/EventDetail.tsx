import React, { useEffect, useState } from "react";
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
  Reply,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Event, Comment, Rating, Participant, User } from "../../types";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";

interface ApiParticipant {
  userId: string;
  joinedAt: string;
  qrCode: string;
  checkedIn?: boolean;
  checkInTime?: string;
}

export function EventDetail({ event: propEvent, onBack }: { event?: Event; onBack?: () => void }) {
  const { state, dispatch } = useApp();
  const { currentUser, users = [], comments = [], ratings = [] } = state;
  const { id: paramId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Local UI/state
  const [remoteEvent, setRemoteEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState<number>(0);
  const [newReview, setNewReview] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [sendingRating, setSendingRating] = useState(false);
  const [joining, setJoining] = useState(false);

  const [showQR, setShowQR] = useState(false);
  const [showHiddenComments, setShowHiddenComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const RAW_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";
  const BASE = RAW_BASE.replace(/\/$/, "") + "/api";

  const getAuthToken = (): string | null => {
    const keys = ["token", "accessToken", "authToken", "currentUser", "user"];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.token) return parsed.token;
        if (parsed?.accessToken) return parsed.accessToken;
        if (parsed?.data?.token) return parsed.data.token;
        if (parsed?.tokenString) return parsed.tokenString;
      } catch {
        if (raw && raw.length < 500) return raw;
      }
    }
    return null;
  };

  const token = getAuthToken() ?? undefined;

  const normalizeEvent = (raw: any): Event => {
    const averageRatingNum = Number(raw.averageRating ?? raw.average_rating ?? 0);
    return {
      id: raw.id ?? raw._id,
      title: raw.title ?? raw.name ?? "",
      description: raw.description ?? raw.desc ?? "",
      startTime: raw.startTime ?? raw.start_time,
      endTime: raw.endTime ?? raw.end_time,
      location: raw.location ?? raw.venue ?? "",
      image: raw.image ?? raw.image_url ?? raw.imageUrl,
      isPublic: raw.isPublic ?? raw.is_public ?? true,
      maxParticipants: raw.maxParticipants ?? raw.max_participants ?? undefined,
      createdBy: raw.createdBy ?? raw.created_by ?? (raw.created_by_user?.id ?? ""),
      createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
      status: raw.status ?? "pending",
      rejectionReason: raw.rejectionReason ?? raw.rejection_reason,
      participants: (raw.participants ?? raw.attendees ?? []) as Participant[],
      comments: (raw.comments ?? []) as Comment[],
      ratings: (raw.ratings ?? []) as Rating[],
      averageRating: isNaN(averageRatingNum) ? 0 : averageRatingNum,
      category: (typeof raw.category === "string" ? raw.category : raw.category?.name) ?? (raw.category_name ?? "Khác"),
    };
  };

  useEffect(() => {
    let mounted = true;
    if (propEvent) {
      setRemoteEvent(propEvent);
      return;
    }
    const id = paramId;
    if (!id) return;

    const controller = new AbortController();
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${BASE}/events/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          signal: controller.signal as any,
        });
        if (!mounted) return;
        const raw = res.data?.event ?? res.data?.data ?? res.data;
        if (!raw) {
          setError("Dữ liệu sự kiện không hợp lệ.");
          return;
        }
        setRemoteEvent(normalizeEvent(raw));
      } catch (err: any) {
        if (!mounted) return;
        if (axios.isCancel(err)) return;
        if (err.response?.status === 401) {
          // unauthorized - clear and redirect
          try {
            localStorage.removeItem("token");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("authToken");
          } catch { }
          setError("Bạn cần đăng nhập để xem dữ liệu. Vui lòng đăng nhập lại.");
          navigate("/login");
        } else {
          setError(err.response?.data?.message ?? err.message ?? "Lỗi tải sự kiện.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchEvent();

    return () => {
      mounted = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId, propEvent]);

  const event = propEvent ?? remoteEvent;
  if (!propEvent && loading) return <div className="text-center py-10">Đang tải...</div>;
  if (!propEvent && error) return <div className="text-center text-red-500 py-10">{error}</div>;
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

  // derived helpers
  const participants = (event.participants ?? []) as Participant[];
  const commentsOfEvent = (event.comments ?? []) as Comment[];
  const eventRatings = (event.ratings ?? []) as Rating[];

  const isParticipant = participants.some((p: any) => p.userId === currentUser?.id);
  const isCreator = event.createdBy === currentUser?.id;
  const canRate = isParticipant && new Date(event.endTime).getTime() < Date.now();
  const userParticipant = participants.find((p: any) => p.userId === currentUser?.id);

  // comments grouping and visibility
  const allEventComments: Comment[] = [...(commentsOfEvent || []), ...(comments.filter((c: Comment) => c.eventId === event.id) || [])];
  const groupedComments = allEventComments.reduce<Record<string, Comment & { replies: Comment[] }>>((acc, comment) => {
    if (!comment.parentId) {
      acc[comment.id] = { ...comment, replies: allEventComments.filter((c) => c.parentId === comment.id) };
    }
    return acc;
  }, {});
  const visibleComments = Object.values(groupedComments).filter((c) => !c.isHidden);
  const hiddenComments = Object.values(groupedComments).filter((c) => c.isHidden);
  const allComments = showHiddenComments ? [...visibleComments, ...hiddenComments] : visibleComments;

  // formatting
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const postComment = async (payload: Partial<Comment>) => {
    try {
      setSendingComment(true);
      const res = await axios.post(
        `${BASE}/comments`,
        { ...payload },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      const created: Comment = res.data?.data ?? res.data;
      setRemoteEvent((prev) => {
        if (!prev) return prev;
        return { ...prev, comments: [...(prev.comments ?? []), created] };
      });

      dispatch?.({ type: "ADD_COMMENT", payload: created });
      setNewComment("");

    } catch (err: any) {
      alert(err.response?.data?.message ?? "Không thể gửi bình luận.");
    } finally {
      setSendingComment(false);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Bạn cần đăng nhập để bình luận.");
      return;
    }
    if (!newComment.trim()) return;
    const body: Partial<Comment> = {
      userId: currentUser.id,
      eventId: event.id,
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
      isHidden: false,
    };
    postComment(body);
  };

  const postRating = async (payload: Partial<Rating>) => {
    try {
      setSendingRating(true);
      const res = await axios.post(`${BASE}/ratings`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const created: Rating = res.data?.data ?? res.data;
      setRemoteEvent((prev) => {
        if (!prev) return prev;
        const ratings = [...(prev.ratings ?? []), created];
        const avg = ratings.reduce((s, r) => s + (r.rating ?? r.rating ?? 0), 0) / ratings.length;
        return { ...prev, ratings, averageRating: Number.isFinite(avg) ? Number(avg) : prev.averageRating };
      });
      dispatch?.({ type: "ADD_RATING", payload: created });
      setNewRating(0);
      setNewReview("");
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Không thể gửi đánh giá.");
    } finally {
      setSendingRating(false);
    }
  };

  const handleAddRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Bạn cần đăng nhập để đánh giá.");
      return;
    }
    if (newRating <= 0) return;
    const body: Partial<Rating> = {
      userId: currentUser.id,
      eventId: event.id,
      rating: newRating,
      review: newReview?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    postRating(body);
  };

  const handleJoinEvent = async () => {
    if (!currentUser) {
      alert("Bạn cần đăng nhập để tham gia.");
      return;
    }
    if (isParticipant) {
      alert("Bạn đã tham gia rồi.");
      return;
    }
    try {
      setJoining(true);
      const res = await axios.post(
        `${BASE}/participants`,
        { eventId: event.id },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      const created = res.data?.data ?? res.data;
      setRemoteEvent((prev) => {
        if (!prev) return prev;
        return { ...prev, participants: [...(prev.participants ?? []), created] as Participant[] };
      });
      dispatch?.({ type: "JOIN_EVENT", payload: { eventId: event.id, userId: currentUser.id, qrCode: (created as any).qrCode } });
      setShowQR(true);
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Không thể tham gia sự kiện.");
    } finally {
      setJoining(false);
    }
  };

  const handleUnhideComment = async (commentId: string) => {
    dispatch?.({ type: "UNHIDE_COMMENT", payload: commentId });
  };
  const handleHideComment = async (commentId: string) => {
    dispatch?.({ type: "HIDE_COMMENT", payload: commentId });
  };
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
    try {
      await axios.delete(`${BASE}/comments/${commentId}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      // update local
      setRemoteEvent((prev) => {
        if (!prev) return prev;
        return { ...prev, comments: (prev.comments ?? []).filter((c) => c.id !== commentId) };
      });
      dispatch?.({ type: "DELETE_COMMENT", payload: commentId });
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Không thể xóa bình luận.");
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    setReplyContent("");
  };
  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent("");
  };
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !currentUser || !replyingTo) return;
    const body: Partial<Comment> = {
      userId: currentUser.id,
      eventId: event.id,
      content: replyContent.trim(),
      createdAt: new Date().toISOString(),
      isHidden: false,
      parentId: replyingTo,
    };
    await postComment(body);
    setReplyingTo(null);
    setReplyContent("");
  };

  const generateQRCode = (data: string) => {
    // fallback svg if needed; but we use qrcode.react below
    return data;
  };

  const getEventStatus = () => {
    const now = Date.now();
    const start = new Date(event.startTime).getTime();
    const end = new Date(event.endTime).getTime();
    if (now < start) return { status: "upcoming", text: "Sắp diễn ra", color: "bg-blue-100 text-blue-800" };
    if (now >= start && now <= end) return { status: "ongoing", text: "Đang diễn ra", color: "bg-green-100 text-green-800" };
    return { status: "ended", text: "Đã kết thúc", color: "bg-gray-100 text-gray-800" };
  };

  const eventStatus = getEventStatus();
  const currentParticipant = participants.find((p: any) => p.userId === currentUser?.id) as Participant | undefined;

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
      <div className="rounded-2xl shadow-lg overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-[#1e1b4b] dark:via-[#312e81] dark:to-[#1e3a8a] border border-gray-200 dark:border-indigo-800/40">
        <div className="aspect-video relative">
          {event.image ? <img src={event.image} alt={event.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600" />}
          <div className="absolute inset-0 bg-black/30" />

          <div className="absolute top-6 left-6">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${eventStatus.color}`}>{eventStatus.text}</span>
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
                      <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">{formatTime(event.startTime)} - {formatTime(event.endTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-dark-text-secondary">
                    <MapPin className="h-5 w-5 mr-3 text-gray-400 dark:text-dark-text-tertiary" />
                    <p>{event.location}</p>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-dark-text-secondary">
                    <Users className="h-5 w-5 mr-3 text-gray-400 dark:text-dark-text-tertiary" />
                    <p>{participants.length}{event.maxParticipants ? `/${event.maxParticipants}` : ""} người tham gia</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-2">Thông tin tổ chức</h3>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Người tạo: {users.find((u: User) => u.id === event.createdBy)?.name ?? "Không xác định"}</p>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Loại: {event.isPublic ? "Công khai" : "Riêng tư"}</p>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Danh mục: {event.category}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="lg:ml-8 lg:min-w-[300px]">
              <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-xl p-6">
                {!isParticipant && !isCreator && eventStatus.status === "upcoming" && (
                  <button onClick={handleJoinEvent} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    <UserPlus className="h-4 w-4 inline mr-2" /> Tham gia sự kiện
                  </button>
                )}

                {isParticipant && userParticipant && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 py-3 px-4 rounded-lg">
                      <CheckCircle className="h-4 w-4 mr-2" /> Đã tham gia sự kiện
                    </div>

                    <button
                      onClick={() => setShowQR(true)}
                      className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg hover:bg-gray-900 transition-colors font-medium"
                    >
                      <QrCode className="h-4 w-4 inline mr-2" /> Xem mã QR
                    </button>

                    {userParticipant.checkedIn && <div className="text-center text-sm text-green-600">✓ Đã điểm danh: {new Date(userParticipant.checkInTime!).toLocaleString("vi-VN")}</div>}
                  </div>
                )}

                {isCreator && (
                  <div className="text-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 py-3 px-4 rounded-lg">
                    <span className="font-medium">Bạn là người tạo sự kiện này</span>
                  </div>
                )}

                {(event.averageRating ?? 0) > 0 && (
                  <div className="mt-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="font-medium">{(event.averageRating ?? 0).toFixed(1)}/5.0</span>
                      <span className="text-gray-500 dark:text-dark-text-tertiary">({eventRatings.length} đánh giá)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rating Section */}
          {canRate && !eventRatings.some((r) => r.userId === currentUser?.id) && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Đánh giá sự kiện</h3>
              <form onSubmit={handleAddRating} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Điểm đánh giá</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setNewRating(star)} className={`p-1 ${star <= newRating ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"}`}>
                        <Star className="h-6 w-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Nhận xét (tùy chọn)</label>
                  <textarea value={newReview} onChange={(e) => setNewReview(e.target.value)} rows={3} placeholder="Chia sẻ cảm nhận của bạn..." className="w-full border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-dark-bg-tertiary" />
                </div>
                <button type="submit" disabled={newRating === 0 || sendingRating} className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition disabled:bg-gray-400">
                  {sendingRating ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </form>
            </div>
          )}

          {/* Comments */}
          <div className="border-t border-gray-200 dark:border-dark-border pt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-xl flex items-center text-gray-900 dark:text-dark-text-primary">
                <MessageSquare className="h-5 w-5 mr-2" /> Bình luận ({allComments.length})
              </h3>

              {hiddenComments.length > 0 && (
                <button onClick={() => setShowHiddenComments(!showHiddenComments)} className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                  {showHiddenComments ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" /> Ẩn bình luận đã ẩn
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" /> Hiện bình luận đã ẩn ({hiddenComments.length})
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
                  <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={3} className="w-full border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-tertiary" placeholder="Viết bình luận..." />
                  <button type="submit" disabled={!newComment.trim() || sendingComment} className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400">
                    {sendingComment ? "Đang gửi..." : "Bình luận"}
                  </button>
                </div>
              </div>
            </form>

            {/* List Comments */}
            <div className="space-y-6">
              {allComments.map((comment) => {
                const user = users.find((u: User) => u.id === comment.userId);
                const isHidden = comment.isHidden;
                const canModerate = currentUser?.role === "admin" || currentUser?.role === "moderator";

                return (
                  <div key={comment.id} className={`flex space-x-4 p-4 rounded-lg ${isHidden ? "bg-gray-100 dark:bg-gray-800 border-l-4 border-yellow-400" : "bg-white dark:bg-dark-bg-secondary"}`}>
                    <div className="w-8 h-8 bg-gray-300 dark:bg-dark-bg-tertiary rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-dark-text-primary">{user?.name ?? "Người dùng"}</span>
                          <span className="text-gray-500 dark:text-dark-text-tertiary text-sm">{new Date(comment.createdAt).toLocaleString("vi-VN")}</span>
                          {isHidden && <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded-full">Đã ẩn</span>}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleReply(comment.id)} className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors" title="Trả lời">
                            <Reply className="h-4 w-4" />
                          </button>

                          {canModerate && (
                            <>
                              {isHidden ? (
                                <button onClick={() => handleUnhideComment(comment.id)} className="p-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors" title="Hiện lại bình luận">
                                  <Eye className="h-4 w-4" />
                                </button>
                              ) : (
                                <button onClick={() => handleHideComment(comment.id)} className="p-1 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors" title="Ẩn bình luận">
                                  <EyeOff className="h-4 w-4" />
                                </button>
                              )}
                              <button onClick={() => handleDeleteComment(comment.id)} className="p-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors" title="Xóa bình luận">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <p className={`${isHidden ? "text-gray-500 dark:text-dark-text-tertiary" : "text-gray-700 dark:text-dark-text-secondary"}`}>{comment.content}</p>

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 ml-4 space-y-3">
                          {comment.replies.map((reply) => {
                            const replyUser = users.find((u: User) => u.id === reply.userId);
                            return (
                              <div key={reply.id} className="flex space-x-3 p-3 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg">
                                <div className="w-6 h-6 bg-gray-300 dark:bg-dark-bg-secondary rounded-full flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-gray-900 dark:text-dark-text-primary text-sm">{replyUser?.name ?? "Người dùng"}</span>
                                    <span className="text-gray-500 dark:text-dark-text-tertiary text-xs">{new Date(reply.createdAt).toLocaleString("vi-VN")}</span>
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
                              <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} rows={2} className="w-full border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-tertiary text-sm" placeholder="Viết phản hồi..." />
                              <div className="flex space-x-2 mt-2">
                                <button type="submit" disabled={!replyContent.trim()} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400">Phản hồi</button>
                                <button type="button" onClick={handleCancelReply} className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">Hủy</button>
                              </div>
                            </div>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}

              {allComments.length === 0 && <p className="text-gray-500 dark:text-dark-text-tertiary text-center py-8">Chưa có bình luận nào</p>}
            </div>
          </div>
        </div>
      </div>

      {/* QR CODE POPUP */}
      {showQR && currentParticipant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-8 max-w-sm w-full text-center border border-gray-200 dark:border-dark-border">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">Mã QR tham gia sự kiện</h3>
            <QRCodeSVG value={(currentParticipant as ApiParticipant).qrCode ?? `${window.location.href}`} size={180} />
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">Xuất trình mã này tại cửa để điểm danh</p>
            <button onClick={() => setShowQR(false)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">Đóng</button>
          </div>
        </div>
      )}

      {/* Modal hiển thị mã QR */}
      {showQR && userParticipant && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center relative">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Mã QR của bạn
            </h2>

            <div className="flex justify-center mb-4">
              <QRCodeSVG
                value={userParticipant.qrCode || `${event.id}-${currentUser?.id}`}
                size={200}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="M"
              />
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300">
              Vui lòng đưa mã này để điểm danh tham gia sự kiện.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}