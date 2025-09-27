import React from 'react';
import { 
  Home, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  Plus,
  CheckSquare,
  MessageSquare,
  Shield
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { state } = useApp();
  const { currentUser } = state;

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: Home, roles: ['admin', 'moderator', 'user'] },
    { id: 'events', label: 'Sự kiện của tôi', icon: Calendar, roles: ['user', 'moderator', 'admin'] },
    { id: 'create-event', label: 'Tạo sự kiện', icon: Plus, roles: ['user', 'moderator', 'admin'] },
    { id: 'browse-events', label: 'Khám phá sự kiện', icon: Calendar, roles: ['user', 'moderator', 'admin'] },
    { id: 'moderation', label: 'Kiểm duyệt', icon: Shield, roles: ['moderator', 'admin'] },
    { id: 'check-in', label: 'Điểm danh', icon: CheckSquare, roles: ['user', 'moderator', 'admin'] },
    { id: 'users', label: 'Quản lý người dùng', icon: Users, roles: ['admin'] },
    { id: 'statistics', label: 'Thống kê', icon: BarChart3, roles: ['admin', 'moderator', 'user'] },
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: Settings, roles: ['user', 'moderator', 'admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(currentUser?.role || 'user')
  );

  return (
    <aside className="w-64 bg-white dark:bg-dark-bg-secondary shadow-sm border-r border-gray-200 dark:border-dark-border h-screen sticky top-0">
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                    : 'text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary hover:text-gray-900 dark:hover:text-dark-text-primary'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}