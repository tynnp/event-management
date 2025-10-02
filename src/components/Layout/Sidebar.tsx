// import React from "react";
import {
  Home,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Plus,
  CheckSquare,
  Shield,
  X,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  activeSection,
  onSectionChange,
  isOpen,
  onClose,
}: SidebarProps) {
  const { state } = useApp();
  const { currentUser } = state;

  const menuItems = [
    {
      id: "dashboard",
      label: "Tổng quan",
      icon: Home,
      roles: ["admin", "moderator", "user"],
    },
    {
      id: "events",
      label: "Sự kiện của tôi",
      icon: Calendar,
      roles: ["user", "moderator", "admin"],
    },
    {
      id: "create-event",
      label: "Tạo sự kiện",
      icon: Plus,
      roles: ["user", "moderator", "admin"],
    },
    {
      id: "browse-events",
      label: "Khám phá sự kiện",
      icon: Calendar,
      roles: ["user", "moderator", "admin"],
    },
    {
      id: "moderation",
      label: "Kiểm duyệt",
      icon: Shield,
      roles: ["moderator", "admin"],
    },
    {
      id: "check-in",
      label: "Điểm danh",
      icon: CheckSquare,
      roles: ["user", "moderator", "admin"],
    },
    { id: "users", label: "Quản lý người dùng", icon: Users, roles: ["admin"] },
    {
      id: "statistics",
      label: "Thống kê",
      icon: BarChart3,
      roles: ["admin", "moderator", "user"],
    },
    {
      id: "profile",
      label: "Hồ sơ cá nhân",
      icon: Settings,
      roles: ["user", "moderator", "admin"],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(currentUser?.role || "user")
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 z-50 w-64 h-screen 
        bg-gradient-to-b from-white via-gray-50 to-white dark:from-dark-bg dark:via-dark-bg-secondary dark:to-dark-bg 
        shadow-lg border-r border-gray-200 dark:border-dark-border
        transform transition-transform duration-500 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Header */}
        <div className="bg-white/80 dark:bg-dark-bg-secondary/80 backdrop-blur-md shadow-md border-b border-gray-200 dark:border-dark-border">
          <div className="w-full px-4">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-wide bg-gradient-to-r from-indigo-500 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-gradient-x">
                  📂 MENU
                </span>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-dark-bg-tertiary transition-all duration-300"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-dark-text-secondary group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="mt-4 px-4">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 group
              ${
                activeSection === item.id
                  ? "bg-gradient-to-r from-indigo-500/10 to-pink-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 shadow-sm"
                  : "text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${
                      activeSection === item.id
                        ? "text-indigo-500 dark:text-indigo-300"
                        : "text-gray-500 dark:text-dark-text-tertiary"
                    }`}
                  />
                  {item.label}

                  {activeSection === item.id && (
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300 animate-pulse">
                      Active
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
