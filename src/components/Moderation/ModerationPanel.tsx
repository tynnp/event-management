import { useState, useEffect } from "react";
import { Globe, Lock, Users, Tag, Eye, Check, X, Clock } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Event } from "../../types";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export function ModerationPanel() {
  const { state, dispatch } = useApp();
  const { users } = state;
  const navigate = useNavigate();

  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [allEventsStats, setAllEventsStats] = useState<Event[]>([]);
  const [allUsers, setAllUsers] = useState(users || []);

  const RAW_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";
  const BASE = RAW_BASE.replace(/\/$/, "") + "/api";

  const getToken = (): string | null => {
    const keys = ['token', 'accessToken', 'authToken', 'currentUser', 'user'];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.token) return parsed.token;
        if (parsed?.accessToken) return parsed.accessToken;
        if (parsed?.data?.token) return parsed.data.token;
      } catch {
        if (raw && raw.length < 500) return raw;
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = getToken();
        const res = await axios.get(`${BASE}/events`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const rawEvents = res.data || [];

        // Normalize events from backend (snake_case -> camelCase)
        const normalizedEvents = rawEvents.map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          startTime: e.start_time || e.startTime,
          endTime: e.end_time || e.endTime,
          location: e.location,
          image: e.image_url || e.image,
          isPublic: e.is_public !== undefined ? e.is_public : e.isPublic,
          maxParticipants: e.max_participants || e.maxParticipants,
          createdBy: e.created_by || e.createdBy,
          createdAt: e.created_at || e.createdAt,
          status: e.status,
          rejectionReason: e.rejection_reason || e.rejectionReason,
          participants: [],
          comments: [],
          ratings: [],
          averageRating: 0,
          category: e.category_name || e.category
        }));

        setAllEventsStats(normalizedEvents);
        const pending = normalizedEvents.filter((e: Event) => e.status === 'pending');
        setPendingEvents(pending);
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };

    const fetchUsers = async () => {
      try {
        const token = getToken();
        const res = await axios.get(`${BASE}/users`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setAllUsers(res.data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchEvents();
    fetchUsers();
  }, []);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);


  const refreshEvents = async () => {
    const token = getToken();
    const res = await axios.get(`${BASE}/events`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const rawEvents = res.data || [];

    // Normalize events from backend (snake_case -> camelCase)
    const normalizedEvents = rawEvents.map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startTime: e.start_time || e.startTime,
      endTime: e.end_time || e.endTime,
      location: e.location,
      image: e.image_url || e.image,
      isPublic: e.is_public !== undefined ? e.is_public : e.isPublic,
      maxParticipants: e.max_participants || e.maxParticipants,
      createdBy: e.created_by || e.createdBy,
      createdAt: e.created_at || e.createdAt,
      status: e.status,
      rejectionReason: e.rejection_reason || e.rejectionReason,
      participants: [],
      comments: [],
      ratings: [],
      averageRating: 0,
      category: e.category_name || e.category
    }));

    setAllEventsStats(normalizedEvents);
    const pending = normalizedEvents.filter((e: Event) => e.status === 'pending');
    setPendingEvents(pending);
  };

  const handleApproveEvent = async (eventId: string) => {
    try {
      const token = getToken();
      await axios.put(
        `${BASE}/events/${eventId}/approve`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );

      // Refresh events
      await refreshEvents();

      alert("Sự kiện đã được duyệt thành công!");
      dispatch({ type: "APPROVE_EVENT", payload: eventId });
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Không thể duyệt sự kiện.");
    }
  };

  const handleRejectEvent = async (eventId: string, reason: string) => {
    try {
      const token = getToken();
      await axios.put(
        `${BASE}/events/${eventId}/reject`,
        { reason },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );

      // Refresh events
      await refreshEvents();

      alert("Sự kiện đã bị từ chối.");

      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedEvent(null);
      dispatch({ type: "REJECT_EVENT", payload: { eventId, reason } });
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Không thể từ chối sự kiện.");
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
            const creator = allUsers.find((u) => u.id === event.createdBy);
            return (
              <div
                key={event.id}
                className="p-6 transition-all duration-200 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary border-b border-gray-100 dark:border-dark-border last:border-b-0"
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
                      {/* Công khai / Riêng tư */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shadow-sm border transition-all duration-200
                            ${event.isPublic
                            ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900/30"
                            : "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800 dark:hover:bg-yellow-900/30"
                          }`}
                      >
                        {event.isPublic
                          ? <Globe className="h-3.5 w-3.5" />
                          : <Lock className="h-3.5 w-3.5" />}
                        {event.isPublic ? "Công khai" : "Riêng tư"}
                      </span>

                      {/* Danh mục */}
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shadow-sm border
                        bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 transition-all duration-200
                        dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800/60"
                      >
                        <Tag className="h-3.5 w-3.5" /> {event.category}
                      </span>

                      {/* Số người tham gia */}
                      {event.maxParticipants && (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shadow-sm border
                          bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 transition-all duration-200
                          dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/30"
                        >
                          <Users className="h-3.5 w-3.5" /> {event.maxParticipants} người
                        </span>
                      )}
                    </div>


                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col space-y-2 ml-6">
                    {/* Nút Duyệt */}
                    <button
                      onClick={() => handleApproveEvent(event.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm 
               bg-green-50 text-green-700 border border-green-200
               hover:bg-green-100 hover:shadow-md transition-all duration-200
               dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900/30"
                    >
                      <Check className="w-4 h-4" />
                      <span>Duyệt</span>
                    </button>

                    {/* Nút Từ chối */}
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowRejectModal(true);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm 
               bg-red-50 text-red-700 border border-red-200
               hover:bg-red-100 hover:shadow-md transition-all duration-200
               dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/30"
                    >
                      <X className="w-4 h-4" />
                      <span>Từ chối</span>
                    </button>

                    {/* Nút Chi tiết */}
                    <button
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm 
               bg-gray-50 text-gray-700 border border-gray-200
               hover:bg-gray-100 hover:shadow-md transition-all duration-200
               dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800/60"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Chi tiết</span>
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


      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Chờ duyệt",
            count: pendingEvents.length,
            icon: Clock,
            color: "orange",
          },
          {
            title: "Đã duyệt",
            count: allEventsStats.filter((e) => e.status === "approved").length,
            icon: Check,
            color: "green",
          },
          {
            title: "Bị từ chối",
            count: allEventsStats.filter((e) => e.status === "rejected").length,
            icon: X,
            color: "red",
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
