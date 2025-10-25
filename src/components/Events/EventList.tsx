import React, { useEffect, useState } from "react";
import { Calendar, MapPin, Users, Clock, Filter, Plus } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Event } from "../../types";
import { Link, useNavigate } from "react-router-dom";


interface EventListProps {
  showMyEvents?: boolean;
  showCreateButton?: boolean;
  onCreateEvent?: () => void;
  onEventClick?: (event: Event) => void;
}

export function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // const BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api";

  const RAW_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";
  const BASE = RAW_BASE.replace(/\/$/, "") + "/api"; // đảm bảo luôn có /api

  const getAuthToken = () => {
    const keys = ["token", "accessToken", "authToken", "currentUser", "user"];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const obj = JSON.parse(raw);
        if (obj?.token) return obj.token;
        if (obj?.accessToken) return obj.accessToken;
      } catch {
        if (raw && k !== "currentUser" && k !== "user") return raw;
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
      const headers: Record<string,string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${BASE}/events`, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (res.status === 401) throw new Error("Không có quyền truy cập hoặc token đã hết hạn. Vui lòng đăng nhập lại.");
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || "Không thể tải danh sách sự kiện");
      }

      const data = await res.json();
      // hỗ trợ backend trả { events: [...] } hoặc [...events]
      const list: Event[] = Array.isArray(data) ? data : (data.events ?? data.data ?? []);
      console.log("Fetched events raw:", data);
      if (mounted) setEvents(list);
    } catch (err: any) {
      if (mounted) setError(err?.message || "Không thể tải danh sách sự kiện");
    } finally {
      if (mounted) setLoading(false);
    }
  };

  fetchEvents();
  return () => { mounted = false; };
}, []);

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  if (error === "Bạn cần đăng nhập để xem danh sách sự kiện.") {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
        <div className="flex justify-center gap-4">
          <Link to="/login" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium">
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

  if (error) return <div className="text-center text-red-500 py-10">{error}</div>;

   return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Danh sách sự kiện</h1>
      <ul className="space-y-4">
        {events.map((ev) => {
          const eventId = (ev as any).id ?? (ev as any)._id;
          if (!eventId) console.warn("Event missing id/_id:", ev);
          return (
            <li key={eventId ?? Math.random()} className="p-4 border rounded-lg hover:shadow-md transition">
              <Link to={`/events/${eventId}`} className="block">
                <h2 className="text-xl font-semibold text-gray-900">{ev.title}</h2>
                <p className="text-sm text-gray-500">
                  {ev.startTime ? new Date(ev.startTime).toLocaleString() : ""}
                  {" - "}
                  {ev.endTime ? new Date(ev.endTime).toLocaleString() : ""}
                </p>
                <p className="text-gray-700">{ev.location}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}