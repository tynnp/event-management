import React from 'react';
import { User, LogOut, Bell, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const { state, dispatch } = useApp();
  const { currentUser } = state;

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'moderator':
        return 'Kiểm duyệt viên';
      default:
        return 'Người dùng';
    }
  };

  return (
    <header className="bg-white dark:bg-dark-bg-secondary shadow-sm border-b border-gray-200 dark:border-dark-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">Quản lý sự kiện</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-dark-text-tertiary dark:hover:text-dark-text-primary transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600 dark:text-dark-text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{currentUser?.name}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(currentUser?.role || '')}`}>
                    {getRoleText(currentUser?.role || '')}
                  </span>
                </div>
              </div>
              
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-dark-text-tertiary dark:hover:text-dark-text-primary transition-colors">
                <Settings className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 dark:text-dark-text-tertiary dark:hover:text-red-400 transition-colors"
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