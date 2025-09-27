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
  Shield,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ activeSection, onSectionChange, isOpen, onClose }: SidebarProps) {
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
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 w-64 h-screen bg-white dark:bg-dark-bg-secondary shadow-sm border-r border-gray-200 dark:border-dark-border
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header with close button */}
        <div className="bg-white dark:bg-dark-bg-secondary shadow-sm border-b border-gray-200 dark:border-dark-border">
          <div className="w-full px-4">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                {/* Placeholder div to match the menu button width + margin */}
                <div className="p-2 mr-2">
                  <div className="h-5 w-5"></div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">Menu</span>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-dark-text-secondary" />
              </button>
            </div>
          </div>
        </div>

        <nav className="mt-4 px-4">
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
    </>
  );
}