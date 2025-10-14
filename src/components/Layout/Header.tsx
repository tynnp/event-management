import React, { useState } from "react";
import { User, LogOut, Bell, Settings, Menu } from "lucide-react";
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

  const [showModal, setShowModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/login");
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setError("");
    setSuccess("");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleChangePassword = () => {
    if (!currentUser) return;

    if (oldPassword !== currentUser.password) {
      setError("Mật khẩu cũ không đúng!");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    dispatch({
      type: "CHANGE_PASSWORD",
      payload: { email: currentUser.email, newPassword },
    });

    setSuccess("Đổi mật khẩu thành công!");
    setTimeout(() => setShowModal(false), 1200);
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
        <div className="w-full px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo + Menu */}
            <div className="flex items-center space-x-3">
              <button
                onClick={onMenuToggle}
                className="relative p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-dark-bg-tertiary transition transform hover:scale-105 active:scale-95"
              >
                <Menu className="h-5 w-5 text-gray-600 dark:text-dark-text-secondary transition-transform duration-300 group-hover:rotate-90" />
              </button>

              <span className="text-2xl pb-1 font-[800] tracking-wide bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                Quản lý sự kiện
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />

              {/* Bell */}
              <button
                className="relative p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 
              dark:text-dark-text-tertiary dark:hover:text-indigo-400 dark:hover:bg-dark-bg-tertiary transition"
              >
                <Bell className="h-5 w-5" />
              </button>

              {/* User */}
              <div className="flex items-center space-x-3">
                <div
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={handleOpenModal}
                  title="Đổi mật khẩu"
                >
                  <div className="relative w-9 h-9 rounded-full ring-2 ring-indigo-400 dark:ring-indigo-500 shadow overflow-hidden">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-gradient-to-r from-indigo-400 via-pink-400 to-purple-500 animate-gradient-xy">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="leading-tight">
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
                  className="p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 
                dark:text-dark-text-tertiary dark:hover:text-indigo-400 dark:hover:bg-dark-bg-tertiary transition transform hover:rotate-90"
                  title="Cài đặt"
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
