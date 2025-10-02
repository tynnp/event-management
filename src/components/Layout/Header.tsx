// import React from "react";
import { User, LogOut, Bell, Settings, Menu } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { state, dispatch } = useApp();
  const { currentUser } = state;

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Chào buổi sáng!";
    } else if (hour < 18) {
      return "Chào buổi chiều!";
    } else {
      return "Chào buổi tối!";
    }
  };

  return (
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
              {/* Ripple effect */}
              <span className="absolute inset-0 rounded-full bg-indigo-400/20 opacity-0 group-active:opacity-100 scale-0 group-active:scale-100 transition-all duration-500"></span>
            </button>

            <span className="text-3xl font-[800] tracking-wide bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
              Quản lý sự kiện
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {/* Bell with notification dot */}
            <button
              className="relative p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 
            dark:text-dark-text-tertiary dark:hover:text-indigo-400 dark:hover:bg-dark-bg-tertiary transition"
            >
              <Bell className="h-5 w-5" />
              {/* <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full"></span> */}
            </button>

            {/* User */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center 
                ring-2 ring-indigo-400 dark:ring-indigo-500 shadow 
                bg-gradient-to-r from-indigo-400 via-pink-400 to-purple-500 animate-gradient-xy"
                >
                  <User className="h-4 w-4 text-white" />
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
  );
}
