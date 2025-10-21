import React, { useState } from "react";
import { Mail, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import { ThemeToggle } from "../Layout/ThemeToggle";

interface ForgotPasswordProps {
  onBack: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "done">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/email";

  // --- Gửi OTP ---
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi khi gửi email");
      setStep("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Đặt lại mật khẩu ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể đặt lại mật khẩu");
      setStep("done");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Giao diện các bước ---
  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <div className="max-w-md w-full bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl p-8 text-center space-y-6">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Đặt lại mật khẩu thành công!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Bạn có thể quay lại đăng nhập với mật khẩu mới.
          </p>
          <button
            onClick={onBack}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-300 via-purple-400 to-pink-400 dark:from-gray-900 dark:via-gray-800 dark:to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full space-y-8">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl p-10 border border-white/20 dark:border-gray-700">
          {step === "email" ? (
            <form className="space-y-6" onSubmit={handleSendOtp}>
              <h2 className="text-center text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                Quên mật khẩu?
              </h2>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Nhập email để nhận mã OTP đặt lại mật khẩu
              </p>
              {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 p-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                    bg-white/90 dark:bg-gray-800/70 
                    text-gray-900 dark:text-gray-100 
                    placeholder-gray-400 
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <h2 className="text-center text-2xl font-bold text-gray-800 dark:text-white">
                Xác nhận mã OTP
              </h2>
              {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>
              )}
              <div>
                <label className="block text-sm mb-1">Mã OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Nhập mã OTP 6 số"
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Mật khẩu mới</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full pl-10 p-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {isLoading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              <ArrowLeft className="inline h-4 w-4 mr-1" /> Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
