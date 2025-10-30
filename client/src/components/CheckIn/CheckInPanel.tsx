import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { QrCode, Users, CheckCircle, Clock, Scan } from "lucide-react";
import { useApp } from "../../context/AppContext";

export function CheckInPanel() {
  const { state, dispatch } = useApp();
  const { events, users, currentUser } = state;
  const [allUsers, setAllUsers] = useState<any[]>(users || []);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [qrInput, setQrInput] = useState("");
  const [scanResult, setScanResult] = useState<string>("");
  const [remoteEvents, setRemoteEvents] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const scanAnimationRef = useRef<number | null>(null);

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
    const fetchEvents = async () => {
      if (!currentUser) return;
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const res = await axios.get(`${BASE}/events`, { headers });
        const normalized = (res.data || []).map((e: any) => ({
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
          averageRating: Number(e.average_rating ?? e.averageRating ?? 0),
          category: e.category_name || e.category,
        }));
        setRemoteEvents(normalized);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Không thể tải sự kiện");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [currentUser]);

  // Fetch users for participant display
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const res = await axios.get(`${BASE}/users`, { headers });
        if (Array.isArray(res.data)) setAllUsers(res.data);
      } catch {}
    };
    fetchUsers();
  }, []);

  const dataEvents = remoteEvents ?? events;
  const myCreatedEvents = useMemo(
    () => dataEvents.filter((e: any) => e.createdBy === currentUser?.id),
    [dataEvents, currentUser?.id]
  );
  const selectedEventData = dataEvents.find((e: any) => e.id === selectedEvent);

  useEffect(() => {
    const loadParticipants = async () => {
      if (!selectedEvent) return;
      try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const res = await axios.get(`${BASE}/attendance/participants`, {
          params: { event_id: selectedEvent },
          headers,
        });
        const rows = res.data || [];
        const normalized = rows.map((r: any) => ({
          userId: r.user_id ?? r.userId,
          joinedAt: r.joined_at ?? r.joinedAt ?? new Date().toISOString(),
          qrCode: r.qr_code ?? r.qrCode,
          checkedIn: !!(r.checked_in ?? r.checkedIn),
          checkInTime: r.check_in_time ?? r.checkInTime ?? undefined,
        }));
        setSelectedParticipants(normalized);
      } catch (err) {
      }
    };
    loadParticipants();
  }, [selectedEvent]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    if (!selectedEvent) {
      setScanResult("Vui lòng chọn sự kiện trước");
      return;
    }
    try {
      setError(null);
      setScanResult("");
      setIsScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream as any;
        await videoRef.current.play();
      }

      // Init detector if supported
      const hasBarcodeDetector = typeof (window as any).BarcodeDetector !== "undefined";
      if (hasBarcodeDetector) {
        if (!detectorRef.current) {
          try {
            detectorRef.current = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
          } catch {
            detectorRef.current = null;
          }
        }
      }

      const detectLoop = async () => {
        if (!isScanning) return;
        try {
          if (detectorRef.current && videoRef.current) {
            const results = await detectorRef.current.detect(videoRef.current);
            if (results && results.length > 0) {
              const value = results[0]?.rawValue || results[0]?.rawValue || "";
              if (value) {
                setQrInput(value);
                await stopScanner();
                await handleQRScan();
                return;
              }
            }
          }
        } catch {
          // ignore frame errors
        }
        scanAnimationRef.current = requestAnimationFrame(detectLoop);
      };

      if (detectorRef.current) {
        scanAnimationRef.current = requestAnimationFrame(detectLoop);
      } else {
        setScanResult("Trình duyệt không hỗ trợ quét QR. Vui lòng nhập mã thủ công.");
      }
    } catch (err: any) {
      setIsScanning(false);
      setScanResult("Không thể mở camera. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  const stopScanner = async () => {
    setIsScanning(false);
    if (scanAnimationRef.current) cancelAnimationFrame(scanAnimationRef.current);
    scanAnimationRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {}
      (videoRef.current as any).srcObject = null;
    }
  };

  const handleScanButtonClick = () => {
    if (!selectedEvent) {
      setScanResult("Vui lòng chọn sự kiện trước");
      return;
    }
    const value = qrInput.trim();
    if (value) {
      handleQRScan();
    } else {
      startScanner();
    }
  };

  const handleQRScan = async () => {
    if (!selectedEvent || !qrInput.trim()) {
      setScanResult("Vui lòng chọn sự kiện và nhập mã QR");
      return;
    }

    // Use the same data source as dropdown to avoid mismatch
    const event = (remoteEvents ?? events).find((e: any) => e.id === selectedEvent);
    if (!event) {
      setScanResult("Không tìm thấy sự kiện");
      return;
    }

    // Check if event is happening now
    const now = new Date();
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);

    if (now < eventStart) {
      setScanResult("Sự kiện chưa bắt đầu, không thể điểm danh");
      return;
    }

    if (now > eventEnd) {
      setScanResult("Sự kiện đã kết thúc, không thể điểm danh");
      return;
    }

    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const raw = qrInput.trim();
      const isJsonOrData = raw.startsWith("{") || raw.startsWith("data:");
      const payload: any = { event_id: selectedEvent };
      if (isJsonOrData) payload.qr_data = raw; else payload.qr_code = raw;

      const res = await axios.post(`${BASE}/attendance/checkin`, payload, { headers });
      const participant = res.data?.participant ?? res.data;
      const checkedUserId = participant.user_id ?? participant.userId;

      if (checkedUserId) {
        dispatch({ type: "CHECK_IN", payload: { eventId: selectedEvent, userId: checkedUserId } });
        setSelectedParticipants(prev => prev.map((p: any) => p.userId === checkedUserId ? { ...p, checkedIn: true, checkInTime: new Date().toISOString() } : p));
      }

      const user = users.find((u) => u.id === checkedUserId);
      setScanResult(`Điểm danh thành công${user?.name ? ` cho ${user.name}` : ""}`);
      setQrInput("");
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message;
      const msg = backendMsg === 'Event not found'
        ? 'Không tìm thấy sự kiện'
        : backendMsg === 'QR code not found for this event'
          ? 'Không tìm thấy mã QR này trong hệ thống'
          : backendMsg || 'Điểm danh thất bại';
      setScanResult(msg);
    }
  };

  const getEventStatus = (event: any) => {
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    if (now < start)
      return {
        status: "upcoming",
        text: "Sắp diễn ra",
        color: "text-blue-600",
      };
    if (now >= start && now <= end)
      return {
        status: "ongoing",
        text: "Đang diễn ra",
        color: "text-green-600",
      };
    return {
      status: "ended",
      text: "Đã kết thúc",
      color: "text-gray-600 dark:text-dark-text-secondary",
    };
  };

  return (
  <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-12 relative">
        <h2 className="text-3xl md:text-4xl font-extrabold flex items-center justify-center gap-3">
          <span className="pb-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
            Điểm danh sự kiện
          </span>
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mt-3 text-lg md:text-xl animate-fade-in-up">
          Quét mã QR để điểm danh người tham gia
        </p>
      </div>

      {/* QR Scanner + Event Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* QR Scanner Card */}
  <div className="rounded-2xl p-8 shadow-lg bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-gray-700 animate-fade-in-up min-h-[420px]">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
            <Scan className="h-6 w-6 mr-2 text-blue-700 animate-pulse" />
            Quét mã QR
          </h3>

          <div className="space-y-6">
            {/* Chọn sự kiện */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chọn sự kiện
              </label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="">Chọn sự kiện...</option>
                {myCreatedEvents.map((event) => {
                  const status = getEventStatus(event);
                  return (
                    <option key={event.id} value={event.id}>
                      {event.title} - {status.text}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Input QR */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mã QR hoặc nhập thủ công
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="Quét hoặc nhập mã QR..."
                  className="flex-1 px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  onClick={handleScanButtonClick}
                  disabled={!selectedEvent}
                  className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl shadow hover:bg-blue-600 transition-colors duration-200 disabled:bg-gray-400 flex items-center"
                >
                  <QrCode className="h-5 w-5 mr-2 animate-spin-slow" />
                  Quét
                </button>
              </div>
              {isScanning && (
                <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-black">
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                    <div className="absolute inset-0 border-2 border-blue-500/60 rounded-xl pointer-events-none" />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button onClick={stopScanner} className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      Dừng quét
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Scan Result */}
            {scanResult && (
              <div
                className={`p-4 rounded-xl border animate-fade-in-up transition-all duration-300 ${
                  scanResult.includes("thành công")
                    ? "bg-green-50 text-green-800 border-green-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                {scanResult}
              </div>
            )}
          </div>
        </div>

        {/* Event Details Card */}
        {selectedEventData && (
  <div className="rounded-2xl p-8 shadow-lg bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-gray-700 animate-fade-in-up hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Chi tiết sự kiện
            </h3>

            <div className="space-y-5">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 text-lg">
                  {selectedEventData.title}
                </h4>
                <p className="text-gray-700 dark:text-gray-300 mt-1">
                  {selectedEventData.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Thời gian:
                  </span>
                  <p className="font-medium mt-1">
                    {new Date(selectedEventData.startTime).toLocaleDateString(
                      "vi-VN"
                    )}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    {new Date(selectedEventData.startTime).toLocaleTimeString(
                      "vi-VN",
                      { hour: "2-digit", minute: "2-digit" }
                    )}{" "}
                    -{" "}
                    {new Date(selectedEventData.endTime).toLocaleTimeString(
                      "vi-VN",
                      { hour: "2-digit", minute: "2-digit" }
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Địa điểm:
                  </span>
                  <p className="font-medium mt-1">
                    {selectedEventData.location}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="pt-5 border-t border-gray-300 dark:border-gray-600">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="hover:scale-105 transition-transform">
                    <div className="flex items-center justify-center text-blue-500 mb-1">
                      <Users className="h-5 w-5 mr-1" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {selectedParticipants.length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Đăng ký
                    </p>
                  </div>
                  <div className="hover:scale-105 transition-transform">
                    <div className="flex items-center justify-center text-green-500 mb-1">
                      <CheckCircle className="h-5 w-5 mr-1" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {
                        selectedParticipants.filter((p: any) => p.checkedIn).length
                      }
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Đã điểm danh
                    </p>
                  </div>
                  <div className="hover:scale-105 transition-transform">
                    <div className="flex items-center justify-center text-orange-500 mb-1">
                      <Clock className="h-5 w-5 mr-1" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {
                        selectedParticipants.filter((p: any) => !p.checkedIn).length
                      }
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Chưa điểm danh
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Participants List Card */}
      {selectedEventData && (
  <div className="rounded-2xl shadow-lg bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-gray-700 animate-fade-in-up overflow-hidden mt-10">
          <div className="px-8 py-5 border-b border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Danh sách người tham gia ({selectedParticipants.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-600">
            {selectedParticipants.map((participant: any, idx: number) => {
              const user = allUsers.find((u) => u.id === participant.userId);
              return (
                <div
                  key={participant.userId}
                  className="p-4 flex items-center justify-between hover:bg-gray-100/50 dark:hover:bg-gray-700 transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className="flex items-center space-x-4">
                    {user?.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {(user?.name?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {user?.name || 'Người dùng'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user?.email || participant.userId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Đăng ký:{" "}
                      {new Date(participant.joinedAt).toLocaleDateString(
                        "vi-VN"
                      )}
                    </span>
                    {participant.checkedIn ? (
                      <span className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Đã điểm danh
                      </span>
                    ) : (
                      <span className="flex items-center text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        Chưa điểm danh
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {selectedParticipants.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Chưa có người đăng ký tham gia
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
