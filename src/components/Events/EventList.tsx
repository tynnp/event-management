import React, { useEffect, useState } from "react";
import { Calendar, Grid, List } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Event } from "../../types";

export function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filtered, setFiltered] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

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
    let mounted = true;
    const token = getAuthToken();

    const fetchEvents = async () => {
      setLoading(true);
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${BASE}/events`, {
          method: "GET",
          headers,
          credentials: "include",
        });

        if (res.status === 401)
          throw new Error("Bạn cần đăng nhập để xem danh sách sự kiện.");

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: res.statusText }));
          throw new Error(err.message || "Không thể tải danh sách sự kiện");
        }

        const data = await res.json();
        const list: Event[] = Array.isArray(data) ? data : data.events ?? [];
        if (mounted) {
          setEvents(list);
          setFiltered(list);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || "Lỗi tải sự kiện");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchEvents();
    return () => {
      mounted = false;
    };
  }, []);

  // Lọc theo từ khóa tìm kiếm
  useEffect(() => {
    const lower = search.toLowerCase();
    setFiltered(
      events.filter((e) => e.title.toLowerCase().includes(lower))
    );
  }, [search, events]);

  // Loading
  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  // Unauthorized
  if (error === "Bạn cần đăng nhập để xem danh sách sự kiện.") {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
        <div className="flex justify-center gap-4">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium"
          >
            Đăng nhập
          </Link>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Error khác
  if (error) return <div className="text-center text-red-500 py-10">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h1 className="text-3xl font-bold text-gray-900">Danh sách sự kiện</h1>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm sự kiện..."
            className="border rounded-lg px-3 py-2 text-sm w-56 focus:ring focus:ring-indigo-300"
          />

          <button
            onClick={() =>
              setViewMode((prev) => (prev === "list" ? "grid" : "list"))
            }
            className="p-2 border rounded-lg hover:bg-gray-100"
            title="Đổi kiểu xem"
          >
            {viewMode === "list" ? <Grid size={18} /> : <List size={18} />}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          Không có sự kiện nào phù hợp.
        </div>
      ) : viewMode === "list" ? (
        <ul className="space-y-4">
          {filtered.map((ev) => {
            const eventId = (ev as any).id ?? (ev as any)._id;
            return (
              <li
                key={eventId}
                className="p-4 border rounded-lg hover:shadow-md transition"
              >
                <Link to={`/events/${eventId}`} className="block">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {ev.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {(ev as any).start_time
                      ? new Date((ev as any).start_time).toLocaleString()
                      : ""}
                    {" - "}
                    {(ev as any).end_time
                      ? new Date((ev as any).end_time).toLocaleString()
                      : ""}
                  </p>
                  <p className="text-gray-700">{ev.location}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
       <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
  {filtered.map((ev) => {
    const eventId = (ev as any).id ?? (ev as any)._id;
    return (
      <Link
        key={eventId}
        to={`/events/${eventId}`}
        className="border rounded-lg overflow-hidden hover:shadow-md transition bg-white"
      >
        <div className="aspect-video bg-gray-200 flex items-center justify-center overflow-hidden">
  {(ev as any).image_url ? (
    <img
      src={(ev as any).image_url}
      alt={ev.title}
      className="w-full h-full object-cover"
    />
  ) : (
    <Calendar className="text-gray-400" size={36} />
  )}
</div>
        <div className="p-3">
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {ev.title}
          </h2>
          <p className="text-xs text-gray-500">
            {(ev as any).start_time
              ? new Date((ev as any).start_time).toLocaleDateString()
              : ""}
          </p>
          <p className="text-sm text-gray-700 truncate">{ev.location}</p>
        </div>
      </Link>
    );
  })}
</div>
      )}
    </div>
  );
}
