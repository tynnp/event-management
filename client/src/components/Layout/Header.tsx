import { useEffect, useState } from "react";
import { LogOut, Bell, Settings, Menu, Check, Trash2, Clock } from "lucide-react";
import axios from "axios";
import { useApp } from "../../context/AppContext";
import { ThemeToggle } from "./ThemeToggle";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { currentUser } = state;

  // Notifications state
  const [openNotif, setOpenNotif] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

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
        if (parsed?.tokenString) return parsed.tokenString;
      } catch {
        if (raw && raw.length < 500) return raw;
      }
    }
    return null;
  };

  const fetchNotifications = async () => {
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await axios.get(`${BASE}/notifications`, { headers });
      const rows = res.data || [];
      setNotifications(rows);
      setUnreadCount(rows.filter((n: any) => !n.is_read).length);
    } catch (err: any) {
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchNotifications();
    const id = window.setInterval(fetchNotifications, 30000);
    return () => window.clearInterval(id);
  }, [currentUser?.id]);

  const handleToggleNotif = async () => {
    setOpenNotif((v) => !v);
    if (!openNotif) await fetchNotifications();
  };

  const markAsRead = async (id: string) => {
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      await axios.patch(`${BASE}/notifications/${id}/read`, {}, { headers });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const deleteNotification = async (id: string) => {
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      await axios.delete(`${BASE}/notifications/${id}`, { headers });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const getAvatarUrl = (url?: string) => {
    if (!url) return "/default-avatar.png";
    if (url.startsWith("http")) return url;
    // Remove leading slashes and add exactly one between base and path
    const cleanPath = url.replace(/^\/+/, '');
    return `${RAW_BASE}/${cleanPath}`;
  };

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/login");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng!";
    if (hour < 18) return "Chào buổi chiều!";
    return "Chào buổi tối!";
  };

  return (
    <>
      <header
        className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50  
      dark:from-dark-bg-secondary dark:via-dark-bg dark:to-dark-bg-secondary
      shadow-md border-b border-gray-200 dark:border-dark-border sticky top-0 z-50
      transition-colors duration-500"
      >
        <div className="w-full px-2 sm:px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo + Menu */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={onMenuToggle}
                className="relative p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-dark-bg-tertiary transition transform hover:scale-105 active:scale-95"
              >
                <Menu className="h-5 w-5 text-gray-600 dark:text-dark-text-secondary transition-transform duration-300 group-hover:rotate-90" />
              </button>

              <span className="text-lg sm:text-2xl pb-1 font-[800] tracking-wide bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                <span className="hidden sm:inline">Quản lý sự kiện</span>
                <span className="sm:hidden">QLSK</span>
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              <ThemeToggle />

              {/* Bell */}
              <div className="relative">
                <button
                  onClick={handleToggleNotif}
                  className="relative p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 
              dark:text-dark-text-tertiary dark:hover:text-indigo-400 dark:hover:bg-dark-bg-tertiary transition"
                  aria-label="Thông báo"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {openNotif && (
                  <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-[360px] max-w-md max-h-[60vh] overflow-auto bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl shadow-2xl z-50">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
                      <span className="font-semibold text-gray-900 dark:text-dark-text-primary">Thông báo</span>
                      <button onClick={fetchNotifications} className="text-sm text-indigo-600 hover:text-indigo-500">Làm mới</button>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-gray-500 dark:text-dark-text-tertiary">Không có thông báo</div>
                    ) : (
                      <ul className="divide-y divide-gray-100 dark:divide-dark-border">
                        {notifications.map((n) => (
                          <li key={n.id} className={`px-4 py-3 flex items-start gap-3 ${n.is_read ? '' : 'bg-indigo-50/50 dark:bg-indigo-900/20'}`}>
                            <div className="mt-0.5">
                              <div className={`w-2 h-2 rounded-full ${n.is_read ? 'bg-gray-300' : 'bg-indigo-500'}`}></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary truncate">{n.title}</p>
                              <p className="text-sm text-gray-600 dark:text-dark-text-secondary whitespace-pre-wrap break-words">{n.message}</p>
                              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-dark-text-tertiary">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{new Date(n.created_at || n.createdAt).toLocaleString('vi-VN')}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-2">
                              {!n.is_read && (
                                <button onClick={() => markAsRead(n.id)} title="Đánh dấu đã đọc" className="p-1.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100">
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={() => deleteNotification(n.id)} title="Xóa" className="p-1.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* User */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div
                  className="flex items-center space-x-2 select-none"
                >
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-indigo-400 dark:ring-indigo-500 shadow overflow-hidden">
                    <img
                      src={getAvatarUrl(currentUser?.avatar_url)}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="leading-tight hidden md:block">
                    <p className="text-xs text-gray-500 dark:text-dark-text-tertiary">
                      {getGreeting()}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary">
                      {currentUser?.name}
                    </p>
                  </div>
                </div>

                {/* Settings */}
                <button
                  onClick={() => navigate("/profile")}
                  className="p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 
                  dark:text-dark-text-tertiary dark:hover:text-indigo-400 dark:hover:bg-dark-bg-tertiary 
                  transition transform hover:rotate-90"
                  title="Hồ sơ cá nhân"
                >
                  <Settings className="h-5 w-5" />
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 
                dark:text-dark-text-tertiary dark:hover:text-red-400 dark:hover:bg-red-900/30 
                transition transform hover:scale-110 active:scale-95"
                  title="Đăng xuất"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MODAL ĐỔI MẬT KHẨU ===== */}
      {/* {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 w-[360px] shadow-xl transition-all">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-500" />
              Đổi mật khẩu
            </h3>

            <div className="mt-4 space-y-3">
              <input
                type="password"
                placeholder="Mật khẩu cũ"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <input
                type="password"
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <input
                type="password"
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-500 text-sm">{success}</p>}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-dark-bg-tertiary hover:bg-gray-300 dark:hover:bg-dark-border transition"
              >
                Hủy
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )} */}
    </>
  );
}
