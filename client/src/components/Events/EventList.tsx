import { useEffect, useState } from "react";
import { Calendar, MapPin, Users, Filter, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Event } from "../../types";
import { useApp } from "../../context/AppContext";

interface EventWithExtras extends Event {
  category_name?: string;
  category_id?: string;
}

interface Category {
  id: string;
  name: string;
}

export function EventList() {
  const [events, setEvents] = useState<EventWithExtras[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventWithExtras[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useApp();
  const { currentUser } = state;
  
  // Xác định là "Sự kiện của tôi" hay "Khám phá sự kiện"
  const isMyEvents = location.pathname === "/events";

  const RAW_BASE =
    (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";
  const BASE = RAW_BASE.replace(/\/$/, "") + "/api";

  const getAuthToken = () => {
    const keys = ["token", "accessToken", "authToken"];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.token) return parsed.token;
      } catch {
        return raw;
      }
    }
    return null;
  };

  useEffect(() => {
    const token = getAuthToken();

    const fetchEvents = async () => {
      setLoading(true);
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const [eventRes, categoryRes] = await Promise.all([
          fetch(`${BASE}/events`, { headers }),
          fetch(`${BASE}/categories`, { headers }),
        ]);

        if (eventRes.status === 401)
          throw new Error("Bạn cần đăng nhập để xem danh sách sự kiện.");

        if (!eventRes.ok)
          throw new Error("Không thể tải danh sách sự kiện từ máy chủ.");

        const eventData = await eventRes.json();
        const categoryData = await categoryRes.json();

        // Tạo map category_id -> category_name
        const categoryMap: Record<string, string> = {};
        if (Array.isArray(categoryData)) {
          categoryData.forEach((cat: Category) => {
            categoryMap[cat.id] = cat.name;
          });
          setCategories(categoryData);
        }

        // Process events - map fields from API
        let list: EventWithExtras[] = Array.isArray(eventData)
          ? eventData
          : eventData.events ?? [];

        // Map API fields to frontend Event type
        list = list.map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          startTime: event.start_time || event.startTime,
          endTime: event.end_time || event.endTime,
          location: event.location,
          image: event.image_url || event.image,
          isPublic: event.is_public ?? true,
          maxParticipants: event.max_participants || event.maxParticipants,
          createdBy: event.created_by || event.createdBy,
          createdAt: event.created_at || event.createdAt,
          status: event.status,
          rejectionReason: event.rejection_reason || event.rejectionReason,
          cancellationReason: event.cancellation_reason || event.cancellationReason,
          participants: event.participants || [],
          comments: event.comments || [],
          ratings: event.ratings || [],
          averageRating: typeof event.average_rating === 'number' ? event.average_rating : parseFloat(event.average_rating) || 0,
          category: event.category_name || categoryMap[event.category_id] || "",
          category_id: event.category_id,
          category_name: event.category_name || categoryMap[event.category_id] || "",
        }));

        // Filter events based on route
        let filteredList: EventWithExtras[];
        if (isMyEvents && currentUser) {
          // "Sự kiện của tôi" - hiển thị tất cả events user đã tạo (bao gồm cả cancelled/rejected)
          filteredList = list.filter((e) => e.createdBy === currentUser.id);
        } else {
          // "Khám phá sự kiện" - chỉ hiển thị events đã approved (không hiển thị cancelled/rejected)
          filteredList = list.filter((e) => e.status === "approved");
        }

        setEvents(filteredList);
        setFilteredEvents(filteredList);
      } catch (err: any) {
        setError(err.message || "Lỗi tải dữ liệu sự kiện");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [isMyEvents, currentUser?.id]);

  // Lọc theo thời gian và danh mục
  useEffect(() => {
    let list = [...events];

    if (filter === "upcoming") {
      list = list.filter((e) => new Date(e.startTime) > new Date());
    } else if (filter === "past") {
      list = list.filter((e) => new Date(e.endTime) < new Date());
    }

    if (category !== "all") {
      list = list.filter(
        (e) => e.category_name?.toLowerCase() === category.toLowerCase()
      );
    }

    setFilteredEvents(list);
  }, [filter, category, events]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getEventStatus = (event: EventWithExtras) => {
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    // Check event status first
    if (event.status === 'cancelled') {
      return { text: "Đã hủy", color: "bg-red-100 text-red-800" };
    }
    if (event.status === 'rejected') {
      return { text: "Bị từ chối", color: "bg-red-100 text-red-800" };
    }
    if (event.status === 'pending') {
      return { text: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800" };
    }

    // For approved events, check time-based status
    if (now < start)
      return { text: "Sắp diễn ra", color: "bg-blue-100 text-blue-800" };
    if (now >= start && now <= end)
      return { text: "Đang diễn ra", color: "bg-green-100 text-green-800" };
    return { text: "Đã kết thúc", color: "bg-gray-100 text-gray-800" };
  };

  if (loading)
    return <div className="text-center py-12 text-gray-500">Đang tải...</div>;
  if (error)
    return (
      <div className="text-center py-12 text-red-500 font-medium">{error}</div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3">
            <span className="pb-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
              {isMyEvents ? "Sự kiện của tôi" : "Khám phá sự kiện"}
            </span>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {isMyEvents 
              ? "Quản lý các sự kiện mà bạn đã tạo"
              : "Tìm kiếm và tham gia các sự kiện thú vị"}
          </p>
        </div>

        {!isMyEvents && (
          <button
            onClick={() => navigate("/create-event")}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold hover:scale-105 transform transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo sự kiện mới
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-xl p-4 shadow-md bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 
           dark:from-[#1e1b4b] dark:via-[#312e81] dark:to-[#1e3a8a] border border-gray-200 dark:border-indigo-800/40
      transition-colors duration-300"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
            <span className="text-sm font-semibold text-gray-700 dark:text-indigo-200">
              Lọc:
            </span>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/70 dark:bg-indigo-950/40
            border border-gray-300 dark:border-indigo-800 text-gray-800 dark:text-indigo-100
            focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500
            transition-all duration-300"
          >
            <option value="all">Tất cả</option>
            <option value="upcoming">Sắp diễn ra</option>
            <option value="past">Đã kết thúc</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium
            bg-white/70 dark:bg-indigo-950/40 border border-gray-300 dark:border-indigo-800
            text-gray-800 dark:text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400
            dark:focus:ring-indigo-500 transition-all duration-300"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Event grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          const eventStatus = getEventStatus(event);
          const eventId = (event as any).id ?? (event as any)._id;

          return (
            <div
              key={eventId}
              onClick={() => navigate(`/events/${eventId}`)}
              className="rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all group bg-gradient-to-br from-white via-indigo-50 to-purple-50 dark:from-dark-bg-secondary dark:via-dark-bg-tertiary dark:to-dark-bg-primary"
            >
              <div className="aspect-video relative bg-gradient-to-r from-blue-400 to-purple-600">
                {event.image && (
                  <img
                    src={event.image}
                    alt={event.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                  />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                <div className="absolute top-4 left-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${eventStatus.color}`}
                  >
                    {eventStatus.text}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 text-xs rounded-full">
                    {event.category_name || "Khác"}
                  </span>
                </div>
                {isMyEvents && (
                  <div className="absolute bottom-4 right-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-white/20 backdrop-blur-sm text-white ${
                        event.isPublic
                          ? "bg-green-500/20 text-green-200"
                          : "bg-red-500/20 text-red-200"
                      }`}
                    >
                      {event.isPublic ? "Công khai" : "Riêng tư"}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                  {event.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                  {event.description}
                </p>

                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span>
                      {formatDate(event.startTime)} •{" "}
                      {formatTime(event.startTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-pink-500" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>
                      {event.maxParticipants
                        ? `${event.maxParticipants} người`
                        : "Không giới hạn"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end text-yellow-500">
                  {event.averageRating > 0 && typeof event.averageRating === 'number' && (
                    <>
                      <span className="text-sm font-medium">
                        {event.averageRating.toFixed(1)}
                      </span>
                      <span className="ml-1">⭐</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Không tìm thấy sự kiện nào
          </p>
          <p className="text-gray-400 dark:text-gray-500 mt-1">
            Thử thay đổi bộ lọc hoặc tạo sự kiện mới
          </p>
        </div>
      )}
    </div>
  );
}