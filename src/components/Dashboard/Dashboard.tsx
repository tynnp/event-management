import React from 'react';
import { Calendar, Users, Clock, Star, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function Dashboard() {
  const { state } = useApp();
  const { currentUser, events, users } = state;

  const userEvents = events.filter(event => 
    event.createdBy === currentUser?.id || 
    event.participants.some(p => p.userId === currentUser?.id)
  );

  const approvedEvents = events.filter(event => event.status === 'approved');
  const pendingEvents = events.filter(event => event.status === 'pending');
  const myCreatedEvents = events.filter(event => event.createdBy === currentUser?.id);

  const stats = [
    {
      title: 'Sự kiện đã tham gia',
      value: userEvents.filter(event => 
        event.participants.some(p => p.userId === currentUser?.id && p.checkedIn)
      ).length,
      icon: CheckCircle,
      color: 'bg-green-500',
      trend: '+12% so với tháng trước'
    },
    {
      title: 'Sự kiện sắp diễn ra',
      value: approvedEvents.filter(event => 
        new Date(event.startTime) > new Date() &&
        event.participants.some(p => p.userId === currentUser?.id)
      ).length,
      icon: Calendar,
      color: 'bg-blue-500',
      trend: '3 sự kiện tuần này'
    },
    {
      title: 'Đánh giá trung bình',
      value: currentUser?.eventsAttended ? '4.8/5.0' : 'N/A',
      icon: Star,
      color: 'bg-yellow-500',
      trend: 'Xuất sắc'
    },
    {
      title: currentUser?.role === 'admin' ? 'Tổng người dùng' : 'Sự kiện đã tạo',
      value: currentUser?.role === 'admin' ? users.length : myCreatedEvents.length,
      icon: currentUser?.role === 'admin' ? Users : Calendar,
      color: 'bg-purple-500',
      trend: currentUser?.role === 'admin' ? '+5 người dùng mới' : 'Hoạt động tích cực'
    }
  ];

  const recentEvents = approvedEvents
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'moderator':
        return 'Kiểm duyệt viên';
      default:
        return null; // Không hiển thị role cho user thường
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
          Chào mừng, {getRoleText(currentUser?.role || '') ? `${getRoleText(currentUser?.role || '')} ` : ''}{currentUser?.name}!
        </h1>
        <p className="text-gray-600 dark:text-dark-text-secondary mt-1">
          Quản lý và tham gia các sự kiện một cách hiệu quả
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-dark-text-tertiary mt-4">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Admin/Moderator specific stats */}
      {(currentUser?.role === 'admin' || currentUser?.role === 'moderator') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Sự kiện chờ duyệt</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{pendingEvents.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500 dark:text-orange-400" />
            </div>
          </div>
          
          <div className="card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Sự kiện đã duyệt</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{approvedEvents.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
            </div>
          </div>

          <div className="card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Tổng tham gia</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {events.reduce((sum, event) => sum + event.participants.length, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Events */}
      <div className="card rounded-xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Sự kiện gần đây</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-dark-border">
          {recentEvents.map((event) => (
            <div key={event.id} className="p-6 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{event.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-dark-text-tertiary mt-1">{event.location}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className="text-xs text-gray-500 dark:text-dark-text-tertiary">
                      {new Date(event.startTime).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-dark-text-tertiary">
                      {event.participants.length} người tham gia
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    event.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                    event.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                    {event.status === 'approved' ? 'Đã duyệt' :
                     event.status === 'pending' ? 'Chờ duyệt' : 'Bị từ chối'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {recentEvents.length === 0 && (
            <div className="p-6 text-center text-gray-500 dark:text-dark-text-tertiary">
              Chưa có sự kiện nào
            </div>
          )}
        </div>
      </div>

    </div>
  );
}