import { useState } from "react";
import { QrCode, Users, CheckCircle, Clock, Scan } from "lucide-react";
import { useApp } from "../../context/AppContext";

export function CheckInPanel() {
  const { state, dispatch } = useApp();
  const { events, users } = state;
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [qrInput, setQrInput] = useState("");
  const [scanResult, setScanResult] = useState<string>("");

  const approvedEvents = events.filter((e) => e.status === "approved");
  const selectedEventData = events.find((e) => e.id === selectedEvent);

  const handleQRScan = () => {
    if (!selectedEvent || !qrInput.trim()) {
      setScanResult("Vui lòng chọn sự kiện và nhập mã QR");
      return;
    }

    // Parse QR code format: eventId-userId-timestamp
    const qrParts = qrInput.trim().split("-");
    if (qrParts.length !== 3) {
      setScanResult("Mã QR không hợp lệ");
      return;
    }

    const [eventId, userId] = qrParts;

    if (eventId !== selectedEvent) {
      setScanResult("Mã QR không thuộc sự kiện đã chọn");
      return;
    }

    const event = events.find((e) => e.id === eventId);
    if (!event) {
      setScanResult("Không tìm thấy sự kiện");
      return;
    }

    const participant = event.participants.find((p) => p.userId === userId);

    if (!participant) {
      setScanResult("Người dùng chưa đăng ký sự kiện này");
      return;
    }

    if (participant.checkedIn) {
      setScanResult("Người dùng đã điểm danh trước đó");
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

    // Perform check-in
    dispatch({
      type: "CHECK_IN",
      payload: { eventId, userId },
    });

    const user = users.find((u) => u.id === userId);
    setScanResult(`Điểm danh thành công cho ${user?.name}`);
    setQrInput("");
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
    <div className="space-x-6">
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
        <div className="rounded-3xl p-8 shadow-2xl bg-gradient-to-r from-blue-200 via-blue-300 to-blue-400 dark:from-blue-800 dark:via-blue-700 dark:to-blue-900 border border-gray-200 dark:border-gray-700 animate-fade-in-up hover:shadow-3xl hover:-translate-y-1 transition-all duration-300">
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
                {approvedEvents.map((event) => {
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
                  onClick={handleQRScan}
                  disabled={!selectedEvent || !qrInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:bg-gray-400 flex items-center"
                >
                  <QrCode className="h-5 w-5 mr-2 animate-spin-slow" />
                  Quét
                </button>
              </div>
            </div>

            {/* Scan Result */}
            {scanResult && (
              <div
                className={`p-4 rounded-2xl border animate-fade-in-up transition-all duration-300 ${
                  scanResult.includes("thành công")
                    ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800"
                }`}
              >
                {scanResult}
              </div>
            )}
          </div>
        </div>

        {/* Event Details Card */}
        {selectedEventData && (
          <div className="rounded-3xl p-8 shadow-2xl bg-gradient-to-r from-purple-200 via-pink-200 to-pink-300 dark:from-purple-800 dark:via-pink-800 dark:to-pink-900 border border-gray-200 dark:border-gray-700 animate-fade-in-up hover:shadow-3xl hover:-translate-y-1 transition-all duration-300">
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
                    <div className="flex items-center justify-center text-blue-600 mb-1">
                      <Users className="h-5 w-5 mr-1 animate-bounce" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {selectedEventData.participants.length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Đăng ký
                    </p>
                  </div>
                  <div className="hover:scale-105 transition-transform">
                    <div className="flex items-center justify-center text-green-600 mb-1">
                      <CheckCircle className="h-5 w-5 mr-1 animate-bounce" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {
                        selectedEventData.participants.filter(
                          (p) => p.checkedIn
                        ).length
                      }
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Đã điểm danh
                    </p>
                  </div>
                  <div className="hover:scale-105 transition-transform">
                    <div className="flex items-center justify-center text-orange-600 mb-1">
                      <Clock className="h-5 w-5 mr-1 animate-bounce" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {
                        selectedEventData.participants.filter(
                          (p) => !p.checkedIn
                        ).length
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
        <div className="rounded-3xl shadow-2xl bg-gradient-to-r from-green-100 via-green-200 to-green-300 dark:from-green-800 dark:via-green-700 dark:to-green-900 border border-gray-200 dark:border-gray-700 backdrop-blur-sm animate-fade-in-up overflow-hidden mt-10">
          <div className="px-8 py-5 border-b border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Danh sách người tham gia ({selectedEventData.participants.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-600">
            {selectedEventData.participants.map((participant, idx) => {
              const user = users.find((u) => u.id === participant.userId);
              return (
                <div
                  key={participant.userId}
                  className="p-4 flex items-center justify-between hover:bg-gray-100/50 dark:hover:bg-gray-700 transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {user?.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user?.email}
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
            {selectedEventData.participants.length === 0 && (
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
