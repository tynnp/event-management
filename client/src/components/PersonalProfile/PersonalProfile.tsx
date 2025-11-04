import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { Eye, EyeOff, Lock, Camera, X } from "lucide-react";
import Cropper, { Area } from "react-easy-crop";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Kiểu vùng crop
interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Hàm cắt ảnh bằng canvas
const getCroppedImg = (imageSrc: string, cropArea: CropArea): Promise<string> => {
  const image = new Image();
  image.src = imageSrc;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const { width, height, x, y } = cropArea;
  canvas.width = width;
  canvas.height = height;

  return new Promise((resolve) => {
    image.onload = () => {
      if (!ctx) return;
      ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg"));
    };
  });
};

export function PersonalProfile() {
  const { state, dispatch } = useApp();
  const { currentUser } = state;

  const [name, setName] = useState(currentUser?.name || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState(
    currentUser?.avatar_url ? getAvatarUrl(currentUser.avatar_url) : "/default-avatar.png"
  );

  function getAvatarUrl(url?: string) {
    if (!url) return "/default-avatar.png";
    if (url.startsWith("http")) return url;
    // Remove leading slashes and add exactly one between base and path
    const cleanPath = url.replace(/^\/+/, '');
    return `${API_URL}/${cleanPath}`;
  }

  useEffect(() => {
    if (currentUser?.avatar_url) {
      setAvatarPreview(getAvatarUrl(currentUser.avatar_url));
    } else {
      setAvatarPreview("/default-avatar.png");
    }
  }, [currentUser]);

  // --- Crop Modal ---
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  if (!currentUser) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-dark-text-secondary">
        <p>Chưa có thông tin người dùng</p>
      </div>
    );
  }

  // Khi chọn ảnh mới
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Xử lý khi crop xong
  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // Lưu ảnh đã crop
  const handleSaveCropped = useCallback(async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);

    // Convert base64 -> Blob để gửi qua FormData
    const blob = await (await fetch(croppedImage)).blob();
    const formData = new FormData();
    formData.append("avatar", blob, "avatar.jpg");

    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${state.token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi cập nhật avatar");

      const avatarUrl = data.avatar_url || croppedImage;

      setAvatarPreview(croppedImage);
      dispatch({
        type: "UPDATE_PROFILE",
        payload: { avatar_url: avatarUrl },
      });

      setCropModalOpen(false);
      setMessage("Cập nhật ảnh đại diện thành công!");
      setIsSuccess(true);
    } catch (err) {
      toast.error("Không thể cập nhật avatar!");
    }
  }, [imageToCrop, croppedAreaPixels, state.token, dispatch]);

  const handleSaveInfo = async () => {
    setIsLoading(true);
    setMessage("");
    setIsSuccess(false);

    try {
      let updateProfileSuccess = false;
      let changePasswordSuccess = false;

      // Gửi thông tin cá nhân nếu có thay đổi
      if (name !== currentUser.name || phone !== currentUser.phone) {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("phone", phone);

        const res = await fetch(`${API_URL}/api/users/profile`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${state.token}` },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Lỗi cập nhật thông tin");
        updateProfileSuccess = true;
      }

      if (oldPassword && newPassword && confirmPassword) {
        if (newPassword.length < 6)
          throw new Error("Mật khẩu mới phải ít nhất 6 ký tự!");
        if (newPassword !== confirmPassword)
          throw new Error("Mật khẩu xác nhận không khớp!");

        const res = await fetch(`${API_URL}/api/users/change-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify({
            currentPassword: oldPassword,
            newPassword,
            confirmPassword
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Lỗi đổi mật khẩu!");
        changePasswordSuccess = true;

        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }

      if (updateProfileSuccess || changePasswordSuccess) {
        setMessage("Cập nhật thông tin thành công!");
        setIsSuccess(true);
        dispatch({ type: "UPDATE_PROFILE", payload: { name, phone } });
      } else {
        setMessage("Không có thay đổi nào để lưu!");
        setIsSuccess(false);
      }
    } catch (err: any) {
      setMessage(err.message);
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/40 to-pink-50/40 dark:from-gray-900 dark:via-gray-950 dark:to-black transition-colors duration-700 p-6 flex justify-center">
      <div className="card max-w-3xl w-full bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-100 dark:border-gray-700 relative overflow-hidden">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <img
              src={avatarPreview || "/default-avatar.png"}
              alt="avatar"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
            />
            <label className="absolute bottom-0 right-0 bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-full cursor-pointer">
              <Camera size={18} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Modal Crop ảnh */}
        {cropModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
            <div className="relative bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl w-[90%] max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Cắt ảnh đại diện</h3>

              <div className="relative w-full h-64 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  cropShape="round"
                  showGrid={false}
                />
              </div>

              <div className="flex items-center gap-3 mt-5 justify-between">
                <button
                  onClick={() => setCropModalOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                >
                  <X size={18} />
                  Hủy
                </button>

                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-1/2 accent-indigo-500"
                />

                <button
                  onClick={handleSaveCropped}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white whitespace-nowrap transition"
                >
                  <Camera size={18} />
                  Lưu ảnh
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Thông tin cá nhân */}
        <div className="space-y-6 mb-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ và tên</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-pink-500 transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={currentUser.email}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-lg 
                 bg-gray-100 dark:bg-gray-800 
                 border border-gray-300 dark:border-gray-700 
                 text-gray-500 dark:text-gray-400 
                 cursor-not-allowed select-none"
                />
                <Lock
                  size={16}
                  className="absolute right-3 top-3 text-gray-400 dark:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-pink-500 transition"
              />
            </div>

            {/* Vai trò */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vai trò
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={
                    currentUser.role === "admin"
                      ? "Quản trị viên"
                      : currentUser.role === "moderator"
                        ? "Kiểm duyệt viên"
                        : "Người dùng"
                  }
                  readOnly
                  className="w-full px-4 py-2.5 rounded-lg 
                 bg-gray-100 dark:bg-gray-800 
                 border border-gray-300 dark:border-gray-700 
                 text-gray-600 dark:text-gray-400 
                 cursor-not-allowed select-none"
                />
                <Lock
                  size={16}
                  className="absolute right-3 top-3 text-gray-400 dark:text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Đổi mật khẩu */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 relative z-10">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-500 dark:text-pink-400" />
            Cập nhật thông tin & mật khẩu
          </h3>

          <div className="space-y-4 max-w-md mx-auto">
            {[
              { label: "Mật khẩu cũ", value: oldPassword, setValue: setOldPassword, show: showOld, setShow: setShowOld },
              { label: "Mật khẩu mới", value: newPassword, setValue: setNewPassword, show: showNew, setShow: setShowNew },
              { label: "Xác nhận mật khẩu mới", value: confirmPassword, setValue: setConfirmPassword, show: showConfirm, setShow: setShowConfirm },
            ].map((f, i) => (
              <div key={i}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                <div className="relative">
                  <input
                    type={f.show ? "text" : "password"}
                    value={f.value}
                    onChange={(e) => f.setValue(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-pink-500 pr-10 transition"
                  />
                  <button
                    type="button"
                    onClick={() => f.setShow(!f.show)}
                    className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-pink-400 transition"
                  >
                    {f.show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            ))}

            {message && (
              <p className={`text-sm text-center font-medium ${isSuccess ? "text-green-500" : "text-red-500"}`}>
                {message}
              </p>
            )}

            <button
              onClick={handleSaveInfo}
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90 hover:scale-[1.02]"}
                shadow-lg transition-all duration-300`}
            >
              {isLoading ? "Đang lưu..." : "Lưu thông tin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
