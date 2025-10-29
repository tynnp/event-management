import React from "react";
import { Link } from "react-router-dom";
import { Ghost, ArrowLeft } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-pink-50 to-purple-100 dark:from-[#0f172a] dark:via-[#1e1b4b] dark:to-[#312e81] transition-all duration-500">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Ghost className="w-24 h-24 text-indigo-500 dark:text-indigo-300 animate-bounce" />
        </div>
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600 drop-shadow-md">
          404
        </h1>
        <p className="text-xl text-gray-700 dark:text-gray-300 font-semibold">
          Ôi! Trang bạn tìm không tồn tại
        </p>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Có thể đường dẫn đã bị thay đổi, hoặc bạn vừa gõ sai mất rồi.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại trang chính
        </Link>
      </div>
    </div>
  );
}
