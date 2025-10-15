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
import { Link } from "react-router-dom";

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
      path: "/dashboard",
    },
    {
      id: "events",
      label: "Sự kiện của tôi",
      icon: Calendar,
      roles: ["user", "moderator", "admin"],
      path: "/events",
    },
    {
      id: "create-event",
      label: "Tạo sự kiện",
      icon: Plus,
      roles: ["user", "moderator", "admin"],
      path: "/create-event",
    },
    {
      id: "browse-events",
      label: "Khám phá sự kiện",
      icon: Calendar,
      roles: ["user", "moderator", "admin"],
      path: "/browse-events",
    },
    {
      id: "moderation",
      label: "Kiểm duyệt",
      icon: Shield,
      roles: ["moderator", "admin"],
      path: "/moderation",
    },
    {
      id: "check-in",
      label: "Điểm danh",
      icon: CheckSquare,
      roles: ["user", "moderator", "admin"],
      path: "/check-in",
    },
    { id: "users", label: "Quản lý người dùng", icon: Users, roles: ["admin"], path: "/users" },
    {
      id: "statistics",
      label: "Thống kê",
      icon: BarChart3,
      roles: ["admin", "moderator", "user"],
      path: "/statistics",
    },
    {
      id: "profile",
      label: "Hồ sơ cá nhân",
      icon: Settings,
      roles: ["user", "moderator", "admin"],
      path: "/profile",
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
        className={`fixed top-0 left-0 z-50 w-64 h-screen bg-gradient-to-b  from-indigo-50 via-white to-indigo-100       
        dark:from-[#0f172a] dark:via-[#1e1b4b] dark:to-[#312e81]  
        shadow-lg border-r border-gray-200 dark:border-indigo-900/40
        transform transition-transform duration-500 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} `}
      >
        {/* Header */}
        <div className="bg-white/70 dark:bg-indigo-950/60 backdrop-blur-md border-b border-gray-200 dark:border-indigo-800/40 px-4 h-16 flex justify-between items-center shadow-md">
          <span className="text-lg font-bold tracking-wide bg-gradient-to-r from-indigo-500 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-gradient-x">
            📂 MENU
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800/40 transition-all duration-300"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-indigo-300 hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-4 px-4">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg
                      transition-colors ease-in-out duration-150 transition-shadow duration-150 group select-none
                      active:bg-transparent focus:bg-transparent
                      ${activeSection === item.id
                      ? "bg-gradient-to-r from-indigo-500/10 to-pink-500/10 text-indigo-600 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 shadow-sm"
                      : "text-gray-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-200"
                    }`}
                  onClick={() => {
                    onSectionChange(item.id);

                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${activeSection === item.id
                      ? "text-indigo-500 dark:text-indigo-300"
                      : "text-gray-500 dark:text-indigo-400/70 group-hover:text-indigo-500 dark:group-hover:text-indigo-300"
                      }`}
                  />
                  {item.label}

                  {activeSection === item.id && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
