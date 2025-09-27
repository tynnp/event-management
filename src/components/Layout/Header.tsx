import React from 'react';
import { User, LogOut, Bell, Settings, Menu } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { state, dispatch } = useApp();
  const { currentUser } = state;

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Chào buổi sáng!';
    } else if (hour < 18) {
      return 'Chào buổi chiều!';
    } else {
      return 'Chào buổi tối!';
    }
  };

  return (
    <header className="bg-white dark:bg-dark-bg-secondary shadow-sm border-b border-gray-200 dark:border-dark-border sticky top-0 z-50">
      <div className="w-full px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* Menu Toggle Button - Always visible */}
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors mr-2"
            >
              <Menu className="h-5 w-5 text-gray-600 dark:text-dark-text-secondary" />
            </button>
            
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
                  <p className="text-xs text-gray-500 dark:text-dark-text-tertiary">{getGreeting()}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{currentUser?.name}</p>
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