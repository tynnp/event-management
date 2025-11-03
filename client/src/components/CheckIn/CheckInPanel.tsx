import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { QrCode, Users, CheckCircle, Clock, Scan, X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Html5Qrcode } from "html5-qrcode";

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
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = "qr-reader";

  const RAW_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";
  const BASE = RAW_BASE.replace(/\/$/, "") + "/api";

  const getAvatarUrl = (url?: string) => {
    if (!url) return "/default-avatar.png";
    if (url.startsWith("http")) return url;
    // Remove leading slashes and add exactly one between base and path
    const cleanPath = url.replace(/^\/+/, '');
    return `${RAW_BASE}/${cleanPath}`;
  };

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
    
    setError(null);
    setScanResult("");

    if (qrScannerRef.current) {
      console.log("Cleaning up existing scanner...");
      try {
        const state = await qrScannerRef.current.getState();
        console.log("Current scanner state:", state);
        if (state === 2) {
          await qrScannerRef.current.stop();
        }
        await qrScannerRef.current.clear();
      } catch (e) {
        console.log("Error during cleanup:", e);
      }
      qrScannerRef.current = null;
    }

    setIsScanning(true);

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const scannerElement = document.getElementById(scannerDivId);
      if (!scannerElement) {
        throw new Error(`HTML Element with id=${scannerDivId} not found`);
      }
      scannerElement.innerHTML = "";

      console.log("Creating new scanner instance...");
      qrScannerRef.current = new Html5Qrcode(scannerDivId);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      const onScanSuccess = async (decodedText: string) => {
        setQrInput(decodedText);
        await stopScanner();
        setTimeout(async () => {
          const event = (remoteEvents ?? events).find((e: any) => e.id === selectedEvent);
          if (!event) {
            setScanResult("Không tìm thấy sự kiện");
            return;
          }
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
            const raw = decodedText.trim();
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
            const user = allUsers.find((u) => u.id === checkedUserId);
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
        }, 100);
      };

      console.log("Starting camera...");
      await qrScannerRef.current.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        (errorMessage) => { 
          if (!errorMessage.includes("NotFoundException")) {
            console.log("Scan error:", errorMessage);
          }
        }
      );
      console.log("Camera started successfully!");
    } catch (err: any) {
      setIsScanning(false);
      if (qrScannerRef.current) {
        try {
          await qrScannerRef.current.stop();
          await qrScannerRef.current.clear();
        } catch {}
        qrScannerRef.current = null;
      }
      console.error("Scanner error:", err);
      console.error("Error name:", err?.name);
      console.error("Error message:", err?.message);
      
      const errorName = err?.name || "";
      const errorMsg = err?.message || "";
      
      if (errorName === "NotAllowedError" || errorMsg.includes("Permission denied")) {
        setScanResult("Quyền truy cập camera bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt và tải lại trang.");
      } else if (errorName === "NotFoundError" || errorMsg.includes("Requested device not found")) {
        setScanResult("Không tìm thấy camera. Vui lòng kiểm tra thiết bị.");
      } else if (errorName === "NotReadableError" || errorMsg.includes("Could not start video source")) {
        setScanResult("Camera đang được sử dụng bởi ứng dụng khác. Vui lòng đóng các ứng dụng khác và thử lại.");
      } else if (errorMsg.includes("Scanner is already scanning")) {
        setScanResult("Scanner đang chạy. Vui lòng đợi hoặc tải lại trang.");
      } else {
        setScanResult(`Lỗi: ${errorMsg || err?.toString() || 'Không thể mở camera. Vui lòng thử lại hoặc tải lại trang.'}`);
      }
    }
  };

  const stopScanner = async () => {
    setIsScanning(false);
    if (qrScannerRef.current) {
      try {
        const state = await qrScannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await qrScannerRef.current.stop();
        }
        await qrScannerRef.current.clear();
        qrScannerRef.current = null;
      } catch (err) {
        // Scanner might already be stopped
      }
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

      const user = allUsers.find((u) => u.id === checkedUserId);
      setScanResult(`✅ Điểm danh thành công${user?.name ? ` cho ${user.name}` : ""}`);
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
      <div className="text-center mb-8 sm:mb-12 relative">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold flex items-center justify-center gap-2 sm:gap-3">
          <span className="pb-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
            Điểm danh sự kiện
          </span>
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mt-2 sm:mt-3 text-base sm:text-lg md:text-xl animate-fade-in-up">
          Quét mã QR để điểm danh người tham gia
        </p>
      </div>

      {/* QR Scanner + Event Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
        {/* QR Scanner Card */}
  <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-gray-700 animate-fade-in-up">
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
              <div className="flex flex-col sm:flex-row gap-3">
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
                  className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl shadow hover:bg-blue-600 transition-colors duration-200 disabled:bg-gray-400 flex items-center justify-center"
                >
                  <QrCode className="h-5 w-5 mr-2 animate-spin-slow" />
                  Quét
                </button>
              </div>
              {isScanning && (
                <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <div id={scannerDivId} className="w-full rounded-xl overflow-hidden" />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button 
                      onClick={stopScanner} 
                      className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
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
  <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-gray-700 animate-fade-in-up hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm">
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
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
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
  <div className="rounded-xl sm:rounded-2xl shadow-lg bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-gray-700 animate-fade-in-up overflow-hidden mt-6 sm:mt-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50">
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
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    {user?.avatar_url ? (
                      <img 
                        src={getAvatarUrl(user.avatar_url)} 
                        alt={user.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shadow-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                        {(user?.name?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {user?.name || 'Người dùng'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user?.email || participant.userId}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:space-x-4 flex-shrink-0">
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      Đăng ký:{" "}
                      {new Date(participant.joinedAt).toLocaleDateString(
                        "vi-VN"
                      )}
                    </span>
                    {participant.checkedIn ? (
                      <span className="flex items-center text-green-600 bg-green-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Đã điểm danh</span>
                        <span className="sm:hidden">Đã ĐD</span>
                      </span>
                    ) : (
                      <span className="flex items-center text-orange-600 bg-orange-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Chưa điểm danh</span>
                        <span className="sm:hidden">Chưa ĐD</span>
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
