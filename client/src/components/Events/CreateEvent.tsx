import axios from "axios";
import React, { useState, useEffect } from "react";
import { Calendar, MapPin, Users, Type, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "react-hot-toast";
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

export function CreateEvent({ onCancel, onSuccess }: CreateEventProps) {
  const { state, dispatch } = useApp();
  const { currentUser } = state;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const [categories, setCategories] = useState<
    { id: string; name: string; description: string }[]
  >([]);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    category: "",
    isPublic: true,
    maxParticipants: "",
    image: undefined,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const RAW_BASE =
          (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";
        const BASE = RAW_BASE.replace(/\/$/, "") + "/api";

        const token = getToken();
        if (!token) {
          return;
        }

        const res = await axios.get(`${BASE}/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (Array.isArray(res.data)) {
          setCategories(res.data);
          if (res.data.length > 0)
            setFormData((prev) => ({ ...prev, category: res.data[0].id }));
        }
      } catch (err) {}
    };

    fetchCategories();
  }, []);

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
      ['token', 'accessToken', 'authToken', 'currentUser', 'user'].forEach(k => localStorage.removeItem(k));
    } catch { }
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
        toast.error("Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB");
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
      payload.append('start_time', formData.startTime);
      payload.append('end_time', formData.endTime);
      payload.append('location', formData.location);
      payload.append('is_public', String(formData.isPublic));
      if (formData.maxParticipants)
        payload.append('max_participants', formData.maxParticipants);
      payload.append('category_id', formData.category);
      if (formData.image) payload.append('image', formData.image);

      const res = await fetch(`${BASE}/events`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
        credentials: 'include',
      });

      // Parse response
      const created = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          clearAuth();
          navigate('/login', { replace: true });
          return;
        }

        // Kiểm tra lỗi giới hạn tạo event
        if (res.status === 403 && created?.code === 'DAILY_LIMIT_REACHED') {
          toast.error(created.message || "Bạn chỉ được phép tạo 1 sự kiện mỗi ngày. Vui lòng thử lại vào ngày mai.");
          setLoading(false);
          return;
        }

        toast.error(created?.message || "Không thể tạo sự kiện. Vui lòng thử lại!"); 
        throw new Error(`Server ${res.status}: ${JSON.stringify(created)}`);
      }

      if (created?.status === 'approved') {
        toast.success("Sự kiện đã được tạo thành công! Sự kiện của bạn đã được hiển thị ngay lập tức."); 
      } else {
        toast.success("Sự kiện đã được tạo thành công! Đang chờ kiểm duyệt...");
      }

      if (created && dispatch) {
        try {
          const ev = created.event ?? created.data ?? created;
          dispatch({ type: 'CREATE_EVENT', payload: ev });
        } catch { }
      }

      if (onSuccess) onSuccess();

      setFormData({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        location: "",
        category: categories.length > 0 ? categories[0].id : "",
        isPublic: true,
        maxParticipants: "",
        image: undefined,
      });
      setPreview(null);
      setErrors({});

    } catch (err: any) {
      toast.error(err?.message || "Có lỗi xảy ra khi tạo sự kiện");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto transition-colors duration-300">
      <div
        className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl 
      bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 
      dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 
      border border-gray-200 dark:border-gray-700
      animate-fade-in-up"
      >
        {/* Tiêu đề */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
            <span className="pb-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
              Tạo sự kiện mới
            </span>
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mt-2 text-base sm:text-lg">
            Tạo và quản lý sự kiện của bạn một cách dễ dàng
          </p>
        </div>

        {/* Thông báo giới hạn cho user thường */}
        {currentUser?.role === 'user' && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span><strong>Lưu ý:</strong> Bạn chỉ được phép tạo <strong>1 sự kiện mỗi ngày</strong>.</span>
            </p>
          </div>
        )}

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
            ${errors.title
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
            ${errors.description
                  ? "border-red-500 dark:border-red-400"
                  : "border-gray-300 dark:border-gray-600"
                }`}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* --- Danh mục và Chế độ --- */}
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
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chế độ: Công khai/Riêng tư */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chế độ sự kiện
              </label>
              <div className="flex gap-4 items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="eventMode"
                    value="public"
                    checked={formData.isPublic === true}
                    onChange={() => handleInputChange("isPublic", true)}
                    className="mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Công khai</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="eventMode"
                    value="private"
                    checked={formData.isPublic === false}
                    onChange={() => handleInputChange("isPublic", false)}
                    className="mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Riêng tư</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.isPublic
                  ? (currentUser?.role === 'admin' || currentUser?.role === 'moderator'
                    ? 'Sự kiện sẽ được hiển thị công khai ngay lập tức'
                    : 'Sự kiện công khai cần được duyệt bởi Admin/Mod')
                  : 'Sự kiện riêng tư sẽ được hiển thị ngay lập tức (không cần duyệt)'}
              </p>
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
      ${errors.maxParticipants
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
              ${errors.startTime
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
              ${errors.endTime
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
            ${errors.location
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