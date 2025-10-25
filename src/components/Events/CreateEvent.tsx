import React, { useState } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Type,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";

interface CreateEventProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  maxParticipants: string;
  startTime: string;
  endTime: string;
  location: string;
  isPublic: boolean;
  image?: File;
}

interface FormErrors {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  maxParticipants?: string;
}

const categories = ['Hội thảo', 'Triển lãm', 'Workshop', 'Networking', 'Khác'];

export function CreateEvent({ onCancel, onSuccess }: CreateEventProps) {
  const { state, dispatch } = useApp();
  const { currentUser } = state;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    category: categories[0],
    isPublic: true,
    maxParticipants: "",
    image: undefined,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const getToken = (): string | null => {
    const keys = ['token', 'accessToken', 'authToken', 'currentUser', 'user'];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const obj = JSON.parse(raw);
        if (obj?.token) return obj.token;
        if (obj?.accessToken) return obj.accessToken;
        if (obj?.data?.token) return obj.data.token;
      } catch {
        // non-JSON value (e.g. raw token)
        if (k !== 'currentUser' && k !== 'user') return raw;
      }
    }
    return null;
  };

  const clearAuth = () => {
    try {
      ['token','accessToken','authToken','currentUser','user'].forEach(k => localStorage.removeItem(k));
    } catch {}
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean | File | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value as any }));
    if ((errors as any)[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB");
        return;
      }
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.title.trim()) newErrors.title = "Vui lòng nhập tên sự kiện";
    if (!formData.description.trim()) newErrors.description = "Vui lòng nhập mô tả sự kiện";
    if (!formData.startTime) newErrors.startTime = "Vui lòng chọn thời gian bắt đầu";
    if (!formData.endTime) newErrors.endTime = "Vui lòng chọn thời gian kết thúc";

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      if (end <= start) {
        newErrors.endTime = "Thời gian kết thúc phải sau thời gian bắt đầu";
      }
    }

    if (!formData.location.trim()) newErrors.location = "Vui lòng nhập địa điểm";
    if (formData.maxParticipants && parseInt(formData.maxParticipants) < 1) {
      newErrors.maxParticipants = "Số người tham gia phải lớn hơn 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const RAW_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";
      const BASE = RAW_BASE.replace(/\/$/, "") + "/api";

      const token = getToken();
      if (!token) {
        clearAuth();
        navigate('/login');
        return;
      }

      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('category', formData.category);
      payload.append('start_time', formData.startTime);
payload.append('end_time', formData.endTime);

      payload.append('location', formData.location);
      payload.append('isPublic', String(formData.isPublic));
      if (formData.maxParticipants) payload.append('maxParticipants', formData.maxParticipants);
      if (formData.image) payload.append('image', formData.image);

      const res = await fetch(`${BASE}/events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}` // do NOT set Content-Type when sending FormData
        },
        body: payload,
        credentials: 'include'
      });

      // debug: if not ok, read full body (json or text)
      if (!res.ok) {
        const status = res.status;
        let bodyText = '';
        try {
          bodyText = JSON.stringify(await res.json());
        } catch {
          try {
            bodyText = await res.text();
          } catch {
            bodyText = res.statusText || 'No response body';
          }
        }
        console.error(`[CreateEvent] Server returned ${status}:`, bodyText);
        if (status === 401) {
          clearAuth();
          navigate('/login', { replace: true });
          return;
        }
        throw new Error(`Server ${status}: ${bodyText}`);
      }

      const created = await res.json().catch(() => null);
      if (created && dispatch) {
        try {
          const ev = created.event ?? created.data ?? created;
          dispatch({ type: 'CREATE_EVENT', payload: ev });
        } catch {}
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Error creating event:", err);
      alert(err?.message || "Có lỗi xảy ra khi tạo sự kiện");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto transition-colors duration-300">
      <div
        className="rounded-3xl p-8 shadow-2xl 
      bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 
      dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 
      border border-gray-200 dark:border-gray-700
      animate-fade-in-up"
      >
        {/* Tiêu đề */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
            🎟️
            <span className="pb-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
              Tạo sự kiện mới
            </span>
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mt-2 text-lg">
            Tạo và quản lý sự kiện của bạn một cách dễ dàng
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* --- Tên sự kiện --- */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Type className="h-5 w-5 text-blue-500 dark:text-blue-400" /> Tên
              sự kiện *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Nhập tên sự kiện..."
              className={`w-full px-4 py-3 rounded-xl border transition 
            bg-white dark:bg-gray-800 
            text-gray-900 dark:text-gray-100 
            focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500
            ${
              errors.title
                ? "border-red-500 dark:border-red-400"
                : "border-gray-300 dark:border-gray-600"
            }`}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* --- Ảnh bìa --- */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-pink-500 dark:text-pink-400" />{" "}
              Ảnh bìa sự kiện
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm text-gray-600 dark:text-gray-400 
            file:mr-4 file:py-2 file:px-4 file:rounded-xl 
            file:border-0 file:font-medium 
            file:bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 
            hover:file:from-blue-300 hover:file:via-purple-300 hover:file:to-pink-300 
            dark:file:from-indigo-700 dark:file:via-purple-700 dark:file:to-pink-700 
            dark:file:text-gray-100 dark:hover:file:opacity-90"
            />
            {preview && (
              <div className="mt-3">
                <img
                  src={preview}
                  alt="Xem trước ảnh bìa"
                  className="w-full h-48 object-cover rounded-xl border border-gray-200 dark:border-gray-700 shadow-md"
                />
              </div>
            )}
          </div>

          {/* --- Mô tả sự kiện --- */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500 dark:text-green-400" />{" "}
              Mô tả sự kiện *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              placeholder="Mô tả chi tiết về sự kiện..."
              className={`w-full px-4 py-3 rounded-xl border transition 
            bg-white dark:bg-gray-800 
            text-gray-900 dark:text-gray-100 
            focus:outline-none focus:ring-2 focus:ring-green-400 dark:focus:ring-green-500
            ${
              errors.description
                ? "border-red-500 dark:border-red-400"
                : "border-gray-300 dark:border-gray-600"
            }`}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* --- Danh mục --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Danh mục
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border 
              bg-white dark:bg-gray-800 
              text-gray-900 dark:text-gray-100 
              focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500
              border-gray-300 dark:border-gray-600"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* --- Số người tham gia --- */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-500 dark:text-teal-400" />
              Số người tham gia tối đa
            </label>
            <input
              type="number"
              min="1"
              value={formData.maxParticipants}
              onChange={(e) => handleInputChange("maxParticipants", e.target.value)}
              placeholder="Để trống nếu không giới hạn..."
              className={`w-full px-4 py-3 rounded-xl border transition 
      bg-white dark:bg-gray-800 
      text-gray-900 dark:text-gray-100 
      focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500
      ${
        errors.maxParticipants
          ? "border-red-500 dark:border-red-400"
          : "border-gray-300 dark:border-gray-600"
      }`}
            />
            {errors.maxParticipants && (
              <p className="text-red-500 text-sm mt-1">
                {errors.maxParticipants}
              </p>
            )}
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Để trống nếu bạn không muốn giới hạn số người tham gia
            </p>
          </div>

          {/* --- Thời gian --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bắt đầu */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                Thời gian bắt đầu *
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => handleInputChange("startTime", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border 
              bg-white dark:bg-gray-800 
              text-gray-900 dark:text-gray-100 
              focus:outline-none focus:ring-2 focus:ring-purple-400 dark:focus:ring-purple-500
              ${
                errors.startTime
                  ? "border-red-500 dark:border-red-400"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              />
              {errors.startTime && (
                <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>
              )}
            </div>

            {/* Kết thúc */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-pink-500 dark:text-pink-400" />
                Thời gian kết thúc *
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => handleInputChange("endTime", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border 
              bg-white dark:bg-gray-800 
              text-gray-900 dark:text-gray-100 
              focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-pink-500
              ${
                errors.endTime
                  ? "border-red-500 dark:border-red-400"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              />
              {errors.endTime && (
                <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* --- Địa điểm --- */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-500 dark:text-orange-400" />{" "}
              Địa điểm *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="Nhập địa điểm tổ chức..."
              className={`w-full px-4 py-3 rounded-xl border 
            bg-white dark:bg-gray-800 
            text-gray-900 dark:text-gray-100 
            focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500
            ${
              errors.location
                ? "border-red-500 dark:border-red-400"
                : "border-gray-300 dark:border-gray-600"
            }`}
            />
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">{errors.location}</p>
            )}
          </div>

          {/* --- Nút hành động --- */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 
            hover:bg-gray-300 dark:hover:bg-gray-600 
            text-gray-800 dark:text-gray-100 
            transition font-medium disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r 
            from-indigo-500 via-purple-500 to-pink-500 
            text-white font-bold hover:scale-105 transform transition-all disabled:opacity-50"
            >
              {loading ? 'Đang tạo...' : 'Tạo sự kiện'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}