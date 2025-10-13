import React, { useState } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Type,
  FileText,
  Globe,
  Lock,
  Image as ImageIcon,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Event } from "../../types";

interface CreateEventProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function CreateEvent({ onCancel, onSuccess }: CreateEventProps) {
  const { state, dispatch } = useApp();
  const { currentUser } = state;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    category: "Công nghệ",
    isPublic: true,
    maxParticipants: "",
    image: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string | null>(null);

  const categories = [
    "Công nghệ",
    "Giáo dục",
    "Thể thao",
    "Âm nhạc",
    "Nghệ thuật",
    "Kinh doanh",
    "Sức khỏe",
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Vui lòng nhập tên sự kiện";
    if (!formData.description.trim())
      newErrors.description = "Vui lòng nhập mô tả sự kiện";
    if (!formData.startTime)
      newErrors.startTime = "Vui lòng chọn thời gian bắt đầu";
    if (!formData.endTime)
      newErrors.endTime = "Vui lòng chọn thời gian kết thúc";
    if (formData.startTime && formData.endTime) {
      if (new Date(formData.endTime) <= new Date(formData.startTime)) {
        newErrors.endTime = "Thời gian kết thúc phải sau thời gian bắt đầu";
      }
    }
    if (!formData.location.trim())
      newErrors.location = "Vui lòng nhập địa điểm";
    if (formData.maxParticipants && parseInt(formData.maxParticipants) < 1) {
      newErrors.maxParticipants = "Số lượng người tham gia phải lớn hơn 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !currentUser) return;

    let eventStatus: "approved" | "pending" = "approved";

    if (currentUser.role === "user") {
      eventStatus = formData.isPublic ? "pending" : "approved";
    }

    const newEvent: Event = {
      id: Date.now().toString(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      startTime: formData.startTime,
      endTime: formData.endTime,
      location: formData.location.trim(),
      category: formData.category,
      isPublic: formData.isPublic,
      maxParticipants: formData.maxParticipants
        ? parseInt(formData.maxParticipants)
        : undefined,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      status: eventStatus,
      participants: [],
      comments: [],
      ratings: [],
      averageRating: 0,
      image: formData.image || undefined,
    };

    dispatch({ type: "CREATE_EVENT", payload: newEvent });
    onSuccess();
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData((prev) => ({ ...prev, image: base64 }));
        setPreview(base64);
      };
      reader.readAsDataURL(file);
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
              className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 
            hover:bg-gray-300 dark:hover:bg-gray-600 
            text-gray-800 dark:text-gray-100 
            transition font-medium"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r 
            from-indigo-500 via-purple-500 to-pink-500 
            text-white font-bold hover:scale-105 transform transition-all"
            >
              Tạo sự kiện
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
