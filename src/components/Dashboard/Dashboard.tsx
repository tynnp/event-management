import { useState, useEffect } from "react";
import { Calendar, Users, Clock, Star, CheckCircle, Eye, MapPin, Pin } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export function Dashboard() {
  const { state } = useApp();
  const { currentUser } = state;
  const navigate = useNavigate();

  // API states
  const [events, setEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API configuration
  const RAW_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";
  const BASE = RAW_BASE.replace(/\/$/, "") + "/api";

  // Token function
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

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        // Fetch events, users and statistics in parallel
        const promises = [
          axios.get(`${BASE}/events`, { headers }),
          axios.get(`${BASE}/users`, { headers })
        ];

        // Only fetch statistics if user is admin
        if (currentUser?.role === 'admin') {
          promises.push(axios.get(`${BASE}/stats/system`, { headers }));
        }

        const responses = await Promise.all(promises);
        const [eventsRes, usersRes, statsRes] = responses;

        // Normalize events from backend (snake_case -> camelCase)
        const normalizedEvents = eventsRes.data?.map((e: any) => ({
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
          participants: e.participants || [],
          comments: e.comments || [],
          ratings: e.ratings || [],
          averageRating: e.average_rating || e.averageRating || 0,
          category: e.category_name || e.category
        })) || [];

        setEvents(normalizedEvents);
        setUsers(usersRes.data || []);

        // Set statistics if available (admin only)
        if (statsRes) {
          setStatistics(statsRes.data);
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const safeEvents = events ?? [];

  const userEvents = safeEvents.filter(
    (event) =>
      event.createdBy === currentUser?.id ||
      (event.participants ?? []).some((p: any) => p.userId === currentUser?.id)
  );

  const approvedEvents = safeEvents.filter((event) => event.status === "approved");
  const pendingEvents = safeEvents.filter((event) => event.status === "pending");
  const myCreatedEvents = safeEvents.filter(
    (event) => event.createdBy === currentUser?.id
  );

  const stats = [
    {
      title: "Sự kiện đã tham gia",
      value: userEvents.filter((event) =>
        (event.participants ?? []).some(
          (p: any) => p.userId === currentUser?.id && p.checkedIn
        )
      ).length,
      icon: CheckCircle,
      color: "bg-green-500",
      trend: "+12% so với tháng trước",
    },
    {
      title: "Sự kiện sắp diễn ra",
      value: statistics?.upcoming_events ?? approvedEvents.filter(
        (event) =>
          new Date(event.startTime) > new Date() &&
          (event.participants ?? []).some((p: any) => p.userId === currentUser?.id)
      ).length,
      icon: Calendar,
      color: "bg-blue-500",
      trend: "3 sự kiện tuần này",
    },
    {
      title: "Đánh giá trung bình",
      value: statistics?.average_rating ? `${statistics.average_rating.toFixed(1)}/5.0` : (currentUser?.eventsAttended ? "4.8/5.0" : "N/A"),
      icon: Star,
      color: "bg-yellow-500",
      trend: "Xuất sắc",
    },
    {
      title:
        currentUser?.role === "admin" ? "Tổng người dùng" : "Sự kiện đã tạo",
      value:
        currentUser?.role === "admin"
          ? (statistics?.total_users ?? users.length)
          : myCreatedEvents.length,
      icon: currentUser?.role === "admin" ? Users : Calendar,
      color: "bg-purple-500",
      trend:
        currentUser?.role === "admin"
          ? "+5 người dùng mới"
          : "Hoạt động tích cực",
    },
  ];

  const recentEvents = approvedEvents
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const getRoleText = (role: string) => {
    switch (role) {
      case "admin":
        return "Quản trị viên";
      case "moderator":
        return "Kiểm duyệt viên";
      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">
            Lỗi tải dữ liệu
          </h2>
          <p className="text-gray-600 dark:text-dark-text-secondary mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-dark-text-primary flex items-center gap-2">
          <span className="text-4xl animate-bounce">👋</span>
          <span className="inline-block text-gray-700 pb-2">Chào mừng, </span>
          <span className="inline-block bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent pb-2">
            {getRoleText(currentUser?.role || "")} {currentUser?.name}
          </span>
        </h1>
        <p className="text-gray-600 dark:text-dark-text-secondary mt-2 text-sm">
          Quản lý và tham gia các sự kiện một cách hiệu quả
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="relative group rounded-2xl p-6 bg-white dark:bg-dark-bg-secondary shadow-lg hover:shadow-2xl hover:-translate-y-2 transform transition-all duration-500 ease-[cubic-bezier(.2,1,.22,1)]"
          >
            {/* Nội dung */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary">
                  {stat.title}
                </p>
                <p className="text-3xl font-extrabold mt-1 bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                  {stat.value}
                </p>
              </div>
              <div
                className={`${stat.color} p-3 rounded-full bg-opacity-10 group-hover:bg-opacity-20 transition-colors duration-300`}
              >
                <stat.icon className="h-7 w-7 text-current transform group-hover:scale-125 group-hover:rotate-12 group-hover:animate-pulse transition-all duration-500" />
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-dark-text-tertiary mt-4 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              {stat.trend}
            </p>

            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 bg-gradient-to-r from-indigo-500/10 via-pink-500/10 to-purple-500/10 blur-xl transition duration-700 pointer-events-none"></div>
          </div>
        ))}
      </div>

      {/* Admin/Moderator specific stats */}
      {(currentUser?.role === "admin" || currentUser?.role === "moderator") && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending Events */}
          <div className="relative rounded-xl p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden group">
            <div className="absolute inset-0 border border-transparent group-hover:border-orange-300 dark:group-hover:border-orange-500 rounded-xl transition-all duration-300"></div>

            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Sự kiện chờ duyệt
                </p>
                <p className="text-3xl font-extrabold mt-1 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                  {statistics?.pending_events ?? pendingEvents.length}
                </p>
              </div>
              <Clock className="h-10 w-10 text-orange-500 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>

          {/* Approved Events */}
          <div className="relative rounded-xl p-6 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-green-900/10 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden group">
            <div className="absolute inset-0 border border-transparent group-hover:border-green-300 dark:group-hover:border-green-500 rounded-xl transition-all duration-300"></div>

            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Sự kiện đã duyệt
                </p>
                <p className="text-3xl font-extrabold mt-1 bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent">
                  {statistics?.approved_events ?? approvedEvents.length}
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500 dark:text-green-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>

          {/* Total Participants */}
          <div className="relative rounded-xl p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/10 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden group">
            <div className="absolute inset-0 border border-transparent group-hover:border-indigo-300 dark:group-hover:border-indigo-500 rounded-xl transition-all duration-300"></div>

            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Tổng tham gia
                </p>
                <p className="text-3xl font-extrabold mt-1 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  {statistics?.total_participations ?? safeEvents.reduce(
                    (sum, event) => sum + ((event.participants ?? []).length || 0),
                    0
                  )}
                </p>
              </div>
              <Users className="h-10 w-10 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Events */}
      <div className="card relative rounded-xl bg-white dark:bg-dark-bg-secondary shadow-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border bg-gradient-to-r from-indigo-500/10 to-pink-500/10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary flex items-center gap-2">
            <Pin className="w-5 h-5 text-pink-500" />
            <span>Sự kiện gần đây</span>
          </h2>
        </div>

        {/* Event List */}
        <div className="divide-y divide-gray-200 dark:divide-dark-border">
          {recentEvents.map((event) => (
            <div
              key={event.id}
              className="p-6 cursor-pointer group relative transition-all duration-300 ease-in-out hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 dark:hover:from-indigo-900/20 dark:hover:to-pink-900/20"
            >
              <div className="absolute inset-0 border border-transparent group-hover:border-indigo-300 dark:group-hover:border-pink-400 rounded-lg pointer-events-none transition-all duration-300" />

              <div className="flex items-center justify-between relative z-10">
                {/* Event Info */}
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-dark-text-primary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-dark-text-tertiary mt-1 flex items-center gap-1.5 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </p>

                  <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500 dark:text-dark-text-tertiary">
                    <span className="flex items-center gap-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.startTime).toLocaleDateString("vi-VN")}</span>
                    </span>
                    <span className="flex items-center gap-1.5 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                      <Users className="w-4 h-4" />
                      <span>{(event.participants ?? []).length} người tham gia</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/events/${event.id}`)}
                  className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm overflow-hidden transition-all duration-500 ease-in-out
                  ${event.status === "approved"
                      ? "bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-green-900/10 text-green-700 dark:text-green-300"
                      : event.status === "pending"
                        ? "bg-gradient-to-r from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/10 text-yellow-700 dark:text-yellow-300"
                        : "bg-gradient-to-r from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-900/10 text-red-700 dark:text-red-300"
                    }
                  hover:scale-105 hover:shadow-xl`}
                >
                  <div className="absolute inset-0 rounded-xl border border-transparent transition-all duration-300 group-hover:border-current" />
                  <Eye className="w-4 h-4" />
                  <span>Xem chi tiết</span>
                </button>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}