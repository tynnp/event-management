import { useState, useCallback } from "react";
import { useApp } from "../../context/AppContext";
import { Eye, EyeOff, Lock, Camera, X } from "lucide-react";
import Cropper, { Area } from "react-easy-crop";

// Kiểu vùng crop
interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

//Hàm cắt ảnh bằng canvas
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

  // ---  đổi mật khẩu ---
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");

  // --- Avatar ---
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || "");

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
    setAvatarPreview(croppedImage);
    dispatch({
      type: "UPDATE_AVATAR",
      payload: { email: currentUser.email, avatar: croppedImage },
    });
    setCropModalOpen(false);
  }, [imageToCrop, croppedAreaPixels, dispatch, currentUser]);

  // Đổi mật khẩu
  const handleChangePassword = () => {
    if (oldPassword !== currentUser.password) {
      setMessage("❌ Mật khẩu cũ không đúng!");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("⚠️ Mật khẩu mới phải ít nhất 6 ký tự!");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("❌ Mật khẩu xác nhận không khớp!");
      return;
    }

    dispatch({
      type: "CHANGE_PASSWORD",
      payload: { email: currentUser.email, newPassword },
    });
    setMessage("✅ Đổi mật khẩu thành công!");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

 return (
  <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/40 to-pink-50/40 dark:from-gray-900 dark:via-gray-950 dark:to-black transition-colors duration-700 p-6 flex justify-center">
    <div className="card max-w-3xl w-full bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-100 dark:border-gray-700 relative overflow-hidden">

     
      <div className="absolute inset-0 opacity-30 dark:opacity-10 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-pink-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-400 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>


      <h2 className="text-4xl font-extrabold text-center mb-6 relative z-10">
        <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
          ✨ Hồ sơ cá nhân ✨
        </span>
      </h2>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8 mt-4 relative z-10">
        <div className="relative group">
          <img
            src={
              avatarPreview ||
              `https://api.dicebear.com/9.x/thumbs/svg?seed=${currentUser.name}`
            }
            alt="Avatar"
            className="w-28 h-28 rounded-full object-cover border-4 border-indigo-500 dark:border-pink-500 shadow-xl group-hover:scale-105 transition-transform duration-300"
          />
          <label className="absolute bottom-1 right-1 bg-gradient-to-r from-indigo-500 to-pink-500 text-white p-2 rounded-full cursor-pointer shadow-md hover:scale-105 transition-all duration-300">
            <Camera size={18} />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>
        <p className="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-100">{currentUser.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser.email}</p>
      </div>

      {/* Thông tin cá nhân */}
      <div className="space-y-6 mb-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: "Họ và tên", value: currentUser.name },
            { label: "Email", value: currentUser.email },
            { label: "Số điện thoại", value: currentUser.phone || "Chưa cập nhật" },
            {
              label: "Vai trò",
              value:
                currentUser.role === "admin"
                  ? "Quản trị viên"
                  : currentUser.role === "moderator"
                  ? "Kiểm duyệt viên"
                  : "Người dùng",
            },
          ].map((info, i) => (
            <div key={i} className="hover:scale-[1.01] transition-transform duration-300">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {info.label}
              </label>
              <input
                type="text"
                value={info.value}
                readOnly
                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-pink-500 transition"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Đổi mật khẩu */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 relative z-10">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-indigo-500 dark:text-pink-400" />
          Đổi mật khẩu
        </h3>

        <div className="space-y-4 max-w-md mx-auto">
          {[
            { label: "Mật khẩu cũ", value: oldPassword, setValue: setOldPassword, show: showOld, setShow: setShowOld },
            { label: "Mật khẩu mới", value: newPassword, setValue: setNewPassword, show: showNew, setShow: setShowNew },
            { label: "Xác nhận mật khẩu mới", value: confirmPassword, setValue: setConfirmPassword, show: showConfirm, setShow: setShowConfirm },
          ].map((f, i) => (
            <div key={i}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {f.label}
              </label>
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
            <p className={`text-sm ${message.includes("✅") ? "text-green-500" : "text-red-500"}`}>{message}</p>
          )}

          <button
            onClick={handleChangePassword}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 hover:scale-[1.02] shadow-lg transition-all duration-300"
          >
            💾 Lưu mật khẩu mới
          </button>
        </div>
      </div>

      {/* Modal Crop ảnh */}
      {cropModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 relative w-[350px] h-[400px] flex flex-col shadow-2xl">
            <button
              onClick={() => setCropModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 transition"
            >
              <X size={22} />
            </button>
            <div className="relative flex-1">
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
            <div className="mt-4 flex justify-between items-center">
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-2/3 accent-indigo-500"
              />
              <button
                onClick={handleSaveCropped}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

}

