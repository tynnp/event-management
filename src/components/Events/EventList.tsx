import React, { useState } from 'react';
import { Calendar, MapPin, Users, Clock, Filter, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Event } from '../../types';

interface EventListProps {
  showMyEvents?: boolean;
  showCreateButton?: boolean;
  onCreateEvent?: () => void;
  onEventClick?: (event: Event) => void;
}

export function EventList({ showMyEvents = false, showCreateButton = false, onCreateEvent, onEventClick }: EventListProps) {
  const { state } = useApp();
  const { events, currentUser } = state;
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [category, setCategory] = useState('all');

  let filteredEvents = events.filter(event => event.status === 'approved');

  if (showMyEvents) {
    filteredEvents = events.filter(event => 
      event.createdBy === currentUser?.id ||
      event.participants.some(p => p.userId === currentUser?.id)
    );
  }

  if (filter === 'upcoming') {
    filteredEvents = filteredEvents.filter(event => new Date(event.startTime) > new Date());
  } else if (filter === 'past') {
    filteredEvents = filteredEvents.filter(event => new Date(event.endTime) < new Date());
  }

  if (category !== 'all') {
    filteredEvents = filteredEvents.filter(event => event.category === category);
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    if (now < start) return { status: 'upcoming', text: 'Sắp diễn ra', color: 'bg-blue-100 text-blue-800' };
    if (now >= start && now <= end) return { status: 'ongoing', text: 'Đang diễn ra', color: 'bg-green-100 text-green-800' };
    return { status: 'ended', text: 'Đã kết thúc', color: 'bg-gray-100 text-gray-800' };
  };

  const categories = ['all', 'Công nghệ', 'Giáo dục', 'Thể thao', 'Âm nhạc', 'Nghệ thuật'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {showMyEvents ? 'Sự kiện của tôi' : 'Khám phá sự kiện'}
          </h2>
          <p className="text-gray-600 mt-1">
            {showMyEvents 
              ? 'Quản lý các sự kiện bạn tạo và tham gia' 
              : 'Tìm kiếm và tham gia các sự kiện thú vị'}
          </p>
        </div>

        {showCreateButton && (
          <button
            onClick={onCreateEvent}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo sự kiện mới
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Lọc:</span>
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
          >
            <option value="all">Tất cả</option>
            <option value="upcoming">Sắp diễn ra</option>
            <option value="past">Đã kết thúc</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'Tất cả danh mục' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          const eventStatus = getEventStatus(event);
          const isParticipant = event.participants.some(p => p.userId === currentUser?.id);
          const isCreator = event.createdBy === currentUser?.id;

          return (
            <div
              key={event.id}
              onClick={() => onEventClick?.(event)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
            >
              <div className="aspect-video bg-gradient-to-r from-blue-500 to-purple-600 relative">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                <div className="absolute top-4 left-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${eventStatus.color}`}>
                    {eventStatus.text}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 text-xs rounded-full">
                    {event.category}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(event.startTime)} • {formatTime(event.startTime)}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <span>
                      {event.participants.length}
                      {event.maxParticipants ? `/${event.maxParticipants}` : ''} người tham gia
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isCreator && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded-full">
                        Người tạo
                      </span>
                    )}
                    {isParticipant && !isCreator && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 text-xs rounded-full">
                        Đã tham gia
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-yellow-500">
                    {event.averageRating > 0 && (
                      <>
                        <span className="text-sm font-medium">{event.averageRating.toFixed(1)}</span>
                        <span className="ml-1">⭐</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Không tìm thấy sự kiện nào</p>
          <p className="text-gray-400 mt-1">Thử thay đổi bộ lọc hoặc tạo sự kiện mới</p>
        </div>
      )}
    </div>
  );
}