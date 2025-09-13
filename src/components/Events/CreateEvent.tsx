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
    requiresApproval: true,
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
      status: formData.requiresApproval ? 'pending' : 'approved',
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Tạo sự kiện mới</h2>
          <p className="text-gray-600 mt-2">Tạo và quản lý sự kiện của bạn một cách dễ dàng</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Type className="inline h-4 w-4 mr-2" />
              Tên sự kiện *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Nhập tên sự kiện..."
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ImageIcon className="inline h-4 w-4 mr-2" />
              Ảnh bìa sự kiện
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm text-gray-600"
            />
            {preview && (
              <div className="mt-3">
                <img src={preview} alt="Xem trước ảnh bìa" className="w-full h-48 object-cover rounded-lg border" />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline h-4 w-4 mr-2" />
              Mô tả sự kiện *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Mô tả chi tiết về sự kiện..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-2" />
                Thời gian bắt đầu *
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.startTime ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-2" />
                Thời gian kết thúc *
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.endTime ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-2" />
              Địa điểm *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Nhập địa điểm tổ chức..."
            />
            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
          </div>

          {/* Category and Max Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline h-4 w-4 mr-2" />
                Giới hạn người tham gia
              </label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.maxParticipants ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Để trống nếu không giới hạn"
                min="1"
              />
              {errors.maxParticipants && <p className="text-red-500 text-sm mt-1">{errors.maxParticipants}</p>}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Quyền riêng tư</label>
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
                      <span className="text-sm font-medium text-gray-900">Công khai</span>
                    </div>
                    <p className="text-sm text-gray-500">Mọi người có thể tìm thấy và tham gia</p>
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
                      <span className="text-sm font-medium text-gray-900">Riêng tư</span>
                    </div>
                    <p className="text-sm text-gray-500">Chỉ những người có link mới có thể tham gia</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.requiresApproval}
                  onChange={(e) => handleInputChange('requiresApproval', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Yêu cầu kiểm duyệt trước khi công khai</span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                {currentUser?.role === 'user' ? 'Sự kiện sẽ được gửi đến kiểm duyệt viên để phê duyệt' : 'Bạn có thể tự phê duyệt sự kiện'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Tạo sự kiện
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}