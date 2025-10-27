import React from "react";
import { Calendar, Users, Clock, Star, CheckCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";

export function Dashboard() {
  const { state } = useApp();
  const { currentUser, events, users } = state;

  const safeEvents = events ?? [];

  const userEvents = safeEvents.filter(
    (event) =>
      event.createdBy === currentUser?.id ||
      (event.participants ?? []).some((p) => p.userId === currentUser?.id)
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
          (p) => p.userId === currentUser?.id && p.checkedIn
        )
      ).length,
      icon: CheckCircle,
      color: "bg-green-500",
      trend: "+12% so với tháng trước",
    },
    {
      title: "Sự kiện sắp diễn ra",
      value: approvedEvents.filter(
        (event) =>
          new Date(event.startTime) > new Date() &&
          (event.participants ?? []).some((p) => p.userId === currentUser?.id)
      ).length,
      icon: Calendar,
      color: "bg-blue-500",
      trend: "3 sự kiện tuần này",
    },
    {
      title: "Đánh giá trung bình",
      value: currentUser?.eventsAttended ? "4.8/5.0" : "N/A",
      icon: Star,
      color: "bg-yellow-500",
      trend: "Xuất sắc",
    },
    {
      title:
        currentUser?.role === "admin" ? "Tổng người dùng" : "Sự kiện đã tạo",
      value:
        currentUser?.role === "admin" ? users.length : myCreatedEvents.length,
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
                  {pendingEvents.length}
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
                  {approvedEvents.length}
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
                  {safeEvents.reduce(
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
            📌 Sự kiện gần đây
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
                  <p className="text-sm text-gray-500 dark:text-dark-text-tertiary mt-1 flex items-center gap-1 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                    📍 {event.location}
                  </p>
                  <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500 dark:text-dark-text-tertiary">
                    <span className="flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      📅 {new Date(event.startTime).toLocaleDateString("vi-VN")}
                    </span>
                    <span className="flex items-center gap-1 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                      👥 {(event.participants ?? []).length} người tham gia
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full shadow-md transition-all duration-300 ${
                    event.status === "approved"
                      ? "bg-gradient-to-r from-green-400 to-green-500 text-white group-hover:shadow-lg"
                      : event.status === "pending"
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white group-hover:shadow-lg"
                      : "bg-gradient-to-r from-red-400 to-red-500 text-white group-hover:shadow-lg"
                  }`}
                >
                  {event.status === "approved"
                    ? "Đã duyệt"
                    : event.status === "pending"
                    ? "Chờ duyệt"
                    : "Bị từ chối"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}