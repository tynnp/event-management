import React, { useState } from 'react';
import { Calendar, MapPin, Users, Type, FileText, Globe, Lock, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Event } from '../../types';

interface CreateEventProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function CreateEvent({ onCancel, onSuccess }: CreateEventProps) {
  const { state, dispatch } = useApp();
  const { currentUser } = state;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    category: 'Công nghệ',
    isPublic: true,
    maxParticipants: '',
    image: '' // ảnh bìa
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string | null>(null);

  const categories = ['Công nghệ', 'Giáo dục', 'Thể thao', 'Âm nhạc', 'Nghệ thuật', 'Kinh doanh', 'Sức khỏe'];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Vui lòng nhập tên sự kiện';
    if (!formData.description.trim()) newErrors.description = 'Vui lòng nhập mô tả sự kiện';
    if (!formData.startTime) newErrors.startTime = 'Vui lòng chọn thời gian bắt đầu';
    if (!formData.endTime) newErrors.endTime = 'Vui lòng chọn thời gian kết thúc';
    if (formData.startTime && formData.endTime) {
      if (new Date(formData.endTime) <= new Date(formData.startTime)) {
        newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }
    }
    if (!formData.location.trim()) newErrors.location = 'Vui lòng nhập địa điểm';
    if (formData.maxParticipants && parseInt(formData.maxParticipants) < 1) {
      newErrors.maxParticipants = 'Số lượng người tham gia phải lớn hơn 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !currentUser) return;

    // Logic xác định status dựa trên role và loại sự kiện
    let eventStatus: 'approved' | 'pending' = 'approved';
    
    if (currentUser.role === 'user') {
      // Người dùng thường: sự kiện công khai cần duyệt, sự kiện riêng tư không cần
      eventStatus = formData.isPublic ? 'pending' : 'approved';
    }
    // Admin và moderator: luôn được phê duyệt tự động

    const newEvent: Event = {
      id: Date.now().toString(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      startTime: formData.startTime,
      endTime: formData.endTime,
      location: formData.location.trim(),
      category: formData.category,
      isPublic: formData.isPublic,
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      status: eventStatus,
      participants: [],
      comments: [],
      ratings: [],
      averageRating: 0,
      image: formData.image || undefined
    };

    dispatch({ type: 'CREATE_EVENT', payload: newEvent });
    onSuccess();
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({ ...prev, image: base64 }));
        setPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card rounded-xl p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">Tạo sự kiện mới</h2>
          <p className="text-gray-600 dark:text-dark-text-secondary mt-2">Tạo và quản lý sự kiện của bạn một cách dễ dàng</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
              <Type className="inline h-4 w-4 mr-2" />
              Tên sự kiện *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`input-field w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500 dark:border-red-400' : ''}`}
              placeholder="Nhập tên sự kiện..."
            />
            {errors.title && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
              <ImageIcon className="inline h-4 w-4 mr-2" />
              Ảnh bìa sự kiện
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm text-gray-600 dark:text-dark-text-tertiary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300"
            />
            {preview && (
              <div className="mt-3">
                <img src={preview} alt="Xem trước ảnh bìa" className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-dark-border" />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
              <FileText className="inline h-4 w-4 mr-2" />
              Mô tả sự kiện *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`input-field w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.description ? 'border-red-500 dark:border-red-400' : ''}`}
              placeholder="Mô tả chi tiết về sự kiện..."
            />
            {errors.description && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                <Calendar className="inline h-4 w-4 mr-2" />
                Thời gian bắt đầu *
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className={`input-field w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.startTime ? 'border-red-500 dark:border-red-400' : ''}`}
              />
              {errors.startTime && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.startTime}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                <Calendar className="inline h-4 w-4 mr-2" />
                Thời gian kết thúc *
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className={`input-field w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.endTime ? 'border-red-500 dark:border-red-400' : ''}`}
              />
              {errors.endTime && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.endTime}</p>}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
              <MapPin className="inline h-4 w-4 mr-2" />
              Địa điểm *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={`input-field w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.location ? 'border-red-500 dark:border-red-400' : ''}`}
              placeholder="Nhập địa điểm tổ chức..."
            />
            {errors.location && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.location}</p>}
          </div>

          {/* Category and Max Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Danh mục
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="input-field w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                <Users className="inline h-4 w-4 mr-2" />
                Giới hạn người tham gia
              </label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                className={`input-field w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.maxParticipants ? 'border-red-500 dark:border-red-400' : ''}`}
                placeholder="Để trống nếu không giới hạn"
                min="1"
              />
              {errors.maxParticipants && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.maxParticipants}</p>}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-3">Quyền riêng tư</label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    checked={formData.isPublic}
                    onChange={() => handleInputChange('isPublic', true)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-green-600" />
                      <span className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">Công khai</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">Mọi người có thể tìm thấy và tham gia</p>
                  </div>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    checked={!formData.isPublic}
                    onChange={() => handleInputChange('isPublic', false)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 mr-2 text-orange-600" />
                      <span className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">Riêng tư</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">Chỉ những người có link mới có thể tham gia</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Thông báo về logic duyệt sự kiện */}
            <div className={`rounded-lg p-4 ${
              currentUser?.role === 'user' 
                ? formData.isPublic 
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                  : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
            }`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className={`h-5 w-5 ${
                    currentUser?.role === 'user' 
                      ? formData.isPublic 
                        ? 'text-yellow-400' 
                        : 'text-green-400'
                      : 'text-blue-400'
                  }`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  {currentUser?.role === 'user' ? (
                    <div>
                      <p className={`text-sm font-medium ${
                        formData.isPublic 
                          ? 'text-yellow-800 dark:text-yellow-200'
                          : 'text-green-800 dark:text-green-200'
                      }`}>
                        <strong>Thông báo duyệt sự kiện:</strong>
                      </p>
                      <p className={`text-sm ${
                        formData.isPublic 
                          ? 'text-yellow-700 dark:text-yellow-300'
                          : 'text-green-700 dark:text-green-300'
                      }`}>
                        {formData.isPublic 
                          ? 'Sự kiện công khai sẽ được gửi đến kiểm duyệt viên để phê duyệt trước khi hiển thị.'
                          : 'Sự kiện riêng tư sẽ được phê duyệt tự động và có thể sử dụng ngay.'
                        }
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Quyền đặc biệt:</strong> Sự kiện của bạn sẽ được phê duyệt tự động do vai trò {currentUser?.role === 'admin' ? 'quản trị viên' : 'kiểm duyệt viên'}.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="button-secondary px-6 py-3 rounded-lg transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="button-primary px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Tạo sự kiện
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}