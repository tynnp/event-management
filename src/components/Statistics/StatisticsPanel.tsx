import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useApp } from "../../context/AppContext";
import type { Participant, Rating } from "../../types";
import { Users, Calendar, CheckCircle, Clock, Star, XCircle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend, LineChart, Line } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function StatisticsPanel() {
  const { state } = useApp();
  const { currentUser, users, events } = state;

  // --- Remote API data (admin-focused) ---
  const [remoteUsers, setRemoteUsers] = useState<any[] | null>(null);
  const [remoteEvents, setRemoteEvents] = useState<any[] | null>(null);
  const [remoteParticipations, setRemoteParticipations] = useState<any[] | null>(null);
  const [systemStats, setSystemStats] = useState<any | null>(null);
  const [userRatingsByEvent, setUserRatingsByEvent] = useState<Record<string, number>>({});
  const [participantStatsByEvent, setParticipantStatsByEvent] = useState<Record<string, { total: number; checked: number }>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const RAW_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";
  const BASE = RAW_BASE.replace(/\/$/, "") + "/api";

  const getToken = (): string | null => {
    const keys = ["token", "accessToken", "authToken", "currentUser", "user"];
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
    if (!currentUser) return;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const promises: Promise<any>[] = [
          axios.get(`${BASE}/events`, { headers }),
          axios.get(`${BASE}/users`, { headers }),
          axios.get(`${BASE}/attendance/my`, { headers })
        ];
        if (currentUser.role === "admin") {
          promises.push(axios.get(`${BASE}/stats/system`, { headers }));
        }

        const responses = await Promise.all(promises);
        const eventsRes = responses[0];
        const usersRes = responses[1];
        const myPartRes = responses[2];
        const systemRes = responses[3];

        const normalizedEvents = (eventsRes.data || []).map((e: any) => ({
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
          averageRating: Number(e.average_rating ?? e.averageRating ?? 0),
          category: e.category_name || e.category
        }));

        setRemoteEvents(normalizedEvents);
        setRemoteUsers(usersRes.data || []);
        setRemoteParticipations(myPartRes?.data || null);
        if (systemRes) setSystemStats(systemRes.data || null);

        // Fetch per-event participant stats for events I created (total & checked)
        const myEventIds = normalizedEvents.filter((e: any) => e.createdBy === currentUser.id).map((e: any) => e.id);
        if (myEventIds.length > 0) {
          try {
            const statsEntries = await Promise.all(
              myEventIds.map(async (eventId: string) => {
                try {
                  const res = await axios.get(`${BASE}/attendance/participants`, {
                    params: { event_id: eventId },
                    headers,
                  });
                  const rows = Array.isArray(res.data) ? res.data : [];
                  const total = rows.length;
                  const checked = rows.filter((r: any) => !!(r.checked_in ?? r.checkedIn)).length;
                  return [eventId, { total, checked }] as const;
                } catch {
                  return [eventId, { total: 0, checked: 0 }] as const;
                }
              })
            );
            const statsMap: Record<string, { total: number; checked: number }> = {};
            for (const [id, stats] of statsEntries) statsMap[id] = stats;
            setParticipantStatsByEvent(statsMap);
          } catch {}
        }

        // Fetch my rating per participated event (ensure correct display in history)
        try {
          const myEventIdsParticipated: string[] = Array.isArray(myPartRes?.data)
            ? myPartRes.data.map((r: any) => r.event_id)
            : normalizedEvents
                .filter((e: any) => (e.participants ?? []).some((p: any) => p.userId === currentUser.id))
                .map((e: any) => e.id);
          const uniqueIds = Array.from(new Set(myEventIdsParticipated));
          const entries = await Promise.all(
            uniqueIds.map(async (eventId: string) => {
              try {
                const res = await axios.get(`${BASE}/chats/reviews/${eventId}`, { headers });
                const list = (res.data?.reviews ?? res.data ?? []) as any[];
                const mine = list.find((r: any) => (r.user_id ?? r.userId) === currentUser.id);
                const value = mine ? Number(mine.rating) : undefined;
                return [eventId, value] as const;
              } catch {
                return [eventId, undefined] as const;
              }
            })
          );
          const map: Record<string, number> = {};
          for (const [id, value] of entries) {
            if (Number.isFinite(value as any)) map[id] = value as number;
          }
          setUserRatingsByEvent(map);
        } catch {}
      } catch (err: any) {
        console.error("Error fetching statistics:", err);
        setError(err?.response?.data?.message || "Không thể tải thống kê từ API");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [currentUser]);

  if (!currentUser) return null;

  // --- Data sources (prefer remote if available) ---
  const dataUsers = remoteUsers ?? users;
  const dataEvents = remoteEvents ?? events;
  const dataMyParticipations = remoteParticipations ?? null;

  // --- Data cá nhân ---
  const myEvents = useMemo(() => dataEvents.filter((e: any) => e.createdBy === currentUser.id), [dataEvents, currentUser.id]);
  const myParticipations = useMemo(() => {
    if (dataMyParticipations && Array.isArray(dataMyParticipations)) {
      // dataMyParticipations are rows from participants table: { event_id, checked_in, ... }
      const eventIdSet = new Set<string>(dataMyParticipations.map((r: any) => r.event_id));
      return dataEvents.filter((e: any) => eventIdSet.has(e.id));
    }
    return dataEvents.filter((e: any) => (e.participants ?? []).some((p: any) => p.userId === currentUser.id));
  }, [dataMyParticipations, dataEvents, currentUser.id]);
  const myCheckedIn = useMemo(() => {
    if (dataMyParticipations && Array.isArray(dataMyParticipations)) {
      // Count rows with checked_in = true
      return dataMyParticipations.filter((r: any) => !!r.checked_in).length;
    }
    return myParticipations.reduce(
      (sum, e) =>
        sum +
        e.participants.filter((p: Participant) => p.userId === currentUser.id && p.checkedIn)
          .length,
      0
    );
  }, [dataMyParticipations, myParticipations, currentUser.id]);

  // Build quick lookup for my participation by event id
  const myParticipationMap: Record<string, any> = useMemo(() => {
    const map: Record<string, any> = {};
    if (Array.isArray(dataMyParticipations)) {
      for (const r of dataMyParticipations) {
        map[r.event_id] = r;
      }
    }
    return map;
  }, [dataMyParticipations]);

  // --- Cards ---
  const adminStats = [
    {
      title: "Tổng người dùng",
      value: systemStats?.total_users ?? dataUsers.length,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Sự kiện đã duyệt",
      value: systemStats?.approved_events ?? dataEvents.filter((e: any) => e.status === "approved").length,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      title: "Sự kiện chờ duyệt",
      value: systemStats?.pending_events ?? dataEvents.filter((e: any) => e.status === "pending").length,
      icon: Clock,
      color: "bg-orange-500",
    },
    {
      title: "Sự kiện bị từ chối",
      value: dataEvents.filter((e: any) => e.status === "rejected").length,
      icon: Calendar,
      color: "bg-red-500",
    },
    // {
    //   title: "Tổng lượt tham gia",
    //   value: events.reduce((sum, e) => sum + e.participants.length, 0),
    //   icon: Users,
    //   color: "bg-purple-500",
    // },
  ];

  const organizerStats = [
    {
      title: "Sự kiện đã tạo",
      value: myEvents.length,
      icon: Calendar,
      color: "bg-blue-500",
    },
    {
      title: "Đã duyệt",
      value: myEvents.filter((e) => e.status === "approved").length,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      title: "Chờ duyệt",
      value: myEvents.filter((e) => e.status === "pending").length,
      icon: Clock,
      color: "bg-orange-500",
    },
    {
      title: "Sự kiện bị từ chối",
      value: myEvents.filter((e) => e.status === "cancelled").length,
      icon: XCircle,
      color: "bg-red-500"
    },
    {
      title: "Người tham gia sự kiện của tôi",
      value: myEvents.reduce((sum, e: any) => {
        const stats = participantStatsByEvent[e.id];
        if (stats) return sum + stats.total;
        const count = Array.isArray(e.participants) ? e.participants.length : Number(e.current_participants ?? 0);
        return sum + (Number.isFinite(count) ? count : 0);
      }, 0),
      icon: Users,
      color: "bg-purple-500",
    },
    {
      title: "Đánh giá trung bình",
      value:
        myEvents.length > 0
          ? (
            myEvents.reduce((sum, e) => sum + (e.averageRating || 0), 0) /
            myEvents.length
          ).toFixed(1) + "/5.0"
          : "N/A",
      icon: Star,
      color: "bg-yellow-500",
    },
  ];

  const userStats = [
    {
      title: "Sự kiện đã tham gia",
      value: myParticipations.length,
      icon: Calendar,
      color: "bg-blue-500",
    },
    {
      title: "Số lần điểm danh",
      value: myCheckedIn,
      icon: CheckCircle,
      color: "bg-green-500",
    },
  ];

  // userCreatedEventsStats removed (unused)

  // --- Data biểu đồ ---
  const eventStatusData = [
    {
      name: "Đã duyệt",
      value: dataEvents.filter((e: any) => e.status === "approved").length,
    },
    {
      name: "Chờ duyệt",
      value: dataEvents.filter((e: any) => e.status === "pending").length,
    },
    {
      name: "Bị từ chối",
      value: dataEvents.filter((e: any) => e.status === "rejected").length,
    },
  ];

  const userRoleData = [
    { name: "Admin", value: dataUsers.filter((u: any) => u.role === "admin").length },
    {
      name: "Moderator",
      value: dataUsers.filter((u: any) => u.role === "moderator").length,
    },
    { name: "User", value: dataUsers.filter((u: any) => u.role === "user").length },
  ];

  const participantsPerEvent = myEvents.map((e) => {
    const stats = participantStatsByEvent[e.id];
    const registered = stats ? stats.total : (Array.isArray(e.participants) ? e.participants.length : 0);
    const checked = stats ? stats.checked : (Array.isArray(e.participants) ? e.participants.filter((p: Participant) => p.checkedIn).length : 0);
    return { name: e.title, đăngKý: registered, thamGia: checked };
  });

  const ratingsPerEvent = myEvents.map((e) => ({
    name: e.title,
    value: Number(e.averageRating ?? 0) || 0,
  }));

  const checkInData = [
    { name: "Đã điểm danh", value: myCheckedIn },
    { name: "Chưa điểm danh", value: Math.max(0, myParticipations.length - myCheckedIn) },
  ];

  const categoryData = myParticipations.reduce((acc: any[], e) => {
    const cat = e.category || "Khác";
    const existing = acc.find((a) => a.name === cat);
    if (existing) existing.value++;
    else acc.push({ name: cat, value: 1 });
    return acc;
  }, []);

  return (
    <div className="space-y-12">
      {currentUser?.role === "admin" && loading && (
        <div className="text-sm text-gray-500 dark:text-gray-400">Đang tải thống kê từ API…</div>
      )}
      {currentUser?.role === "admin" && error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      {currentUser?.role === "admin" && (
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-dark-text-primary flex items-center gap-2">
            <span className="pb-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
              Thống kê tổng quan
            </span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Tổng quan hoạt động người dùng và sự kiện trong toàn hệ thống
          </p>
        </div>
      )}

      {/* --- Admin block --- */}
      {currentUser.role === "admin" && (
        <>
          {/* Cards */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
            {adminStats.map((stat, i) => (
              <div key={i} className="card p-6 rounded-2xl shadow-lg">
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

                {/* {stat.trend && (
                  <p className="text-xs text-gray-500 dark:text-dark-text-tertiary mt-4 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                    {stat.trend}
                  </p>
                )} */}

                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 bg-gradient-to-r from-indigo-500/10 via-pink-500/10 to-purple-500/10 blur-xl transition duration-700 pointer-events-none"></div>
              </div>
            ))}
          </div>

          {/* Event Status & User Roles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="relative group rounded-2xl p-6 bg-white dark:bg-dark-bg-secondary shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">
                Sự kiện theo trạng thái
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={eventStatusData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 bg-gradient-to-r from-indigo-500/5 via-pink-500/5 to-purple-500/5 blur-xl transition duration-700 pointer-events-none"></div>
            </div>

            <div className="relative group rounded-2xl p-6 bg-white dark:bg-dark-bg-secondary shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">
                Người dùng theo vai trò
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userRoleData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {userRoleData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 bg-gradient-to-r from-indigo-500/5 via-pink-500/5 to-purple-500/5 blur-xl transition duration-700 pointer-events-none"></div>
            </div>
          </div>
        </>
      )}

      {/* --- Organizer block --- */}
      {(currentUser.role === "admin" || currentUser.role === "moderator" || currentUser.role === "user") && (
        <div className="space-y-6">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-dark-text-primary flex items-center gap-2">
            <span className="pb-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
              Thống kê sự kiện tôi tạo
            </span>
          </h2>


          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizerStats.map((stat, i) => (
              <div
                key={i}
                className="relative group rounded-2xl p-6 bg-white dark:bg-dark-bg-secondary shadow-md hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500 ease-[cubic-bezier(.2,1,.22,1)]"
              >
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-extrabold mt-1 bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                  </div>

                  <div
                    className={`${stat.color} p-3 rounded-lg bg-opacity-10 group-hover:bg-opacity-20 transition-colors duration-300`}
                  >
                    <stat.icon className="h-7 w-7 text-current transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-500" />
                  </div>
                </div>

                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 bg-gradient-to-r from-indigo-500/10 via-pink-500/10 to-purple-500/10 blur-xl transition duration-700 pointer-events-none"></div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <div className="card rounded-xl shadow-sm  p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">
                Xu hướng đăng ký & tham gia
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={participantsPerEvent}>
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="đăngKý" stroke="#3b82f6" />
                  <Line type="monotone" dataKey="thamGia" stroke="#10b981" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card rounded-xl shadow-sm  p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">
                Độ hài lòng (trung bình)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratingsPerEvent}>
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="card rounded-xl shadow-sm  p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">
              Bảng thống kê từng sự kiện
            </h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-dark-bg-tertiary sticky top-0">
                  <tr>
                    <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">
                      Tên sự kiện
                    </th>
                    <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">
                      Đăng ký
                    </th>
                    <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">
                      Check-in
                    </th>
                    <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">
                      Tỷ lệ
                    </th>
                    <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">
                      Đánh giá TB
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {myEvents.map((e) => {
                    const registered = e.participants.length;
                    const checkedIn = e.participants.filter(
                      (p: Participant) => p.checkedIn
                    ).length;
                    const rate =
                      registered > 0
                        ? ((checkedIn / registered) * 100).toFixed(1) + "%"
                        : "0%";
                    return (
                      <tr
                        key={e.id}
                        className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary"
                      >
                        <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text-primary">
                          {e.title}
                        </td>
                        <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text-primary">
                          {registered}
                        </td>
                        <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text-primary">
                          {checkedIn}
                        </td>
                        <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text-primary">
                          {rate}
                        </td>
                        <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text-primary">
                          {Number(e.averageRating ?? 0) > 0
                            ? Number(e.averageRating).toFixed(1)
                            : "Chưa có"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- User block (admin, mod, user) --- */}
      <div className="space-y-6">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-dark-text-primary flex items-center gap-2">
          <span className="pb-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
            Thống kê sự kiện tôi tham gia
          </span>
        </h2>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userStats.map((stat, i) => (
            <div
              key={i}
              className="relative group rounded-2xl p-6 bg-white dark:bg-dark-bg-secondary shadow-md hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500 ease-[cubic-bezier(.2,1,.22,1)]"
            >
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-extrabold mt-1 bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                </div>

                <div
                  className={`${stat.color} p-3 rounded-lg bg-opacity-10 group-hover:bg-opacity-20 transition-colors duration-300`}
                >
                  <stat.icon className="h-6 w-6 text-current transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-500" />
                </div>
              </div>

              {/* Glow nền khi hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 bg-gradient-to-r from-indigo-500/10 via-pink-500/10 to-purple-500/10 blur-xl transition duration-700 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card rounded-xl shadow-sm  p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">
              Tỉ lệ điểm danh
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={checkInData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {checkInData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card rounded-xl shadow-sm  p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">
              Sự kiện đã tham gia theo danh mục
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* History */}
        <div className="overflow-x-auto animate-fadeIn rounded-xl border border-gray-200 dark:border-dark-border shadow-sm">
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-dark-bg-secondary dark:to-dark-bg-tertiary">
                <th className="px-6 py-3 text-left font-semibold text-gray-800 dark:text-gray-100 first:rounded-tl-xl last:rounded-tr-xl">
                  Tên sự kiện
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-800 dark:text-gray-100">
                  Ngày
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-800 dark:text-gray-100">
                  Check-in
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-800 dark:text-gray-100 first:rounded-tr-xl">
                  Đánh giá
                </th>
              </tr>
            </thead>
            <tbody>
              {myParticipations.map((e) => {
                const myRow = myParticipationMap[e.id];
                const ratingObj = e.ratings.find((r: Rating) => r.userId === currentUser.id);
                const ratingValue = userRatingsByEvent[e.id] ?? ratingObj?.rating;

                return (
                  <tr
                    key={e.id}
                    className="group hover:shadow-md hover:scale-[1.01] transform transition duration-300 odd:bg-gray-50 even:bg-white dark:odd:bg-dark-bg-secondary dark:even:bg-dark-bg-primary"
                  >
                    <td className="px-6 py-4 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-gray-100">
                      {e.title}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-300">
                      {new Date(e.startTime).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
                      {myRow ? (!!myRow.checked_in ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-100 rounded-full shadow-sm transition hover:scale-105">
                          <CheckCircle className="w-4 h-4" />
                          Đã Check-in
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-100 rounded-full shadow-sm transition hover:scale-105">
                          <XCircle className="w-4 h-4" />
                          Chưa Check-in
                        </span>
                      )) : (
                        // Fallback to event participants if myRow missing
                        e.participants.find((p: Participant) => p.userId === currentUser.id && p.checkedIn) ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-100 rounded-full shadow-sm transition hover:scale-105">
                            <CheckCircle className="w-4 h-4" />
                            Đã Check-in
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-100 rounded-full shadow-sm transition hover:scale-105">
                            <XCircle className="w-4 h-4" />
                            Chưa Check-in
                          </span>
                        )
                      )}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
                      {Number.isFinite(ratingValue as any) ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-center gap-[2px] text-yellow-500">
                            {[1,2,3,4,5].map((i) => (
                              <Star key={i} className={`w-4 h-4 ${i <= Number(ratingValue) ? 'fill-current' : ''}`} />
                            ))}
                          </div>
                          <span className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">{Number(ratingValue).toFixed(1)}/5</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 text-sm">
                          <Star className="w-4 h-4" />
                          Chưa đánh giá
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
