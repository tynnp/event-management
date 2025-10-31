import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "../Layout/ThemeToggle";
import { ForgotPassword } from "./ForgotPassword";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAwaitingOtp, setIsAwaitingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [registerData, setRegisterData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();
  const { dispatch } = useApp();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      // Assuming the API returns user data and a token
      const { user, token } = response.data;

      // Save token and user to localStorage for session persistence
      localStorage.setItem("authToken", token);
      localStorage.setItem("currentUser", JSON.stringify(user));

      // Update currentUser in context
      dispatch({ type: "LOGIN", payload: { user, token } });

      // Fetch users after login
      const fetchUsers = async () => {
        try {
          const token = localStorage.getItem("authToken");
          const response = await axios.get(`${API_URL}/api/users`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          dispatch({ type: "FETCH_USERS", payload: response.data });
        } catch (error) {
          console.error("Failed to fetch users:", error);
        }
      };

      fetchUsers();

      // Redirect to Dashboard
      navigate("/dashboard");
    } catch (error) {
      const anyErr: any = error as any;
      const msg = anyErr?.response?.data?.message || "Email hoặc mật khẩu không đúng";
      setError(msg);
      console.error("Login error:", error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!registerData.name || !registerData.email || !registerData.password) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (registerData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/auth/register/start`, {
        name: registerData.name,
        phone: registerData.phone,
        email: registerData.email,
        password: registerData.password,
      });

      if (res.status === 200) {
        toast.success("Đã gửi mã OTP tới email. Vui lòng kiểm tra hộp thư.");
        setIsAwaitingOtp(true);
      } else {
        throw new Error(res.data.message || "Lỗi không xác định");
      }
    } catch (err: any) {
      console.error("Register error:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Đăng ký thất bại. Vui lòng thử lại sau.");
      }
      toast.error("Không thể gửi OTP!");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otpCode || otpCode.length < 6) {
      setError("Vui lòng nhập mã OTP hợp lệ");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/auth/register/verify`, {
        email: registerData.email,
        otp: otpCode,
      });

      if (res.status === 201 || res.status === 200) {
        toast.success("Xác thực thành công! Bạn có thể đăng nhập.");
        setIsAwaitingOtp(false);
        setIsRegistering(false);
        setOtpCode("");
        setRegisterData({ name: "", phone: "", email: "", password: "", confirmPassword: "" });
      } else {
        throw new Error(res.data.message || "Lỗi không xác định");
      }
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Xác thực OTP thất bại. Vui lòng thử lại.");
      }
      toast.error("Xác thực OTP thất bại!");
    }
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-300 via-purple-400 to-pink-400 dark:from-gray-900 dark:via-gray-800 dark:to-black py-12 px-4 sm:px-6 lg:px-8">
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl p-10 border border-white/20 dark:border-gray-700">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-transparent pb-2 bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600 dark:from-indigo-400 dark:to-pink-400 drop-shadow-md">
              {isRegistering ? "Đăng ký tài khoản" : "Đăng nhập"}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isRegistering
                ? "Tạo tài khoản mới để tham gia sự kiện"
                : "Quản lý và tham gia sự kiện dễ dàng"}
            </p>
          </div>

          <div className="mt-8">
            {!isRegistering ? (
              <form className="space-y-6" onSubmit={handleLogin}>
                {error && (
                  <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm animate-pulse">
                    {error}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="py-2 pr-10 pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      placeholder="Nhập email của bạn"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Mật khẩu
                  </label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                    <input
                      key={showPassword ? "text" : "password"}
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="py-2 pr-10 pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      placeholder="Nhập mật khẩu"
                    />
                    <button
                      type="button"
                      onClick={handleTogglePassword}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-lg text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 shadow-lg hover:shadow-indigo-500/40 dark:hover:shadow-pink-500/30 font-medium transition-all transform hover:scale-[1.02]"
                >
                  Đăng nhập
                </button>
              </form>
            ) : (
              // Form đăng ký
              <form className="space-y-6" onSubmit={isAwaitingOtp ? handleVerifyOtp : handleRegister}>
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                {!isAwaitingOtp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-tertiary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={registerData.name}
                    onChange={(e) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Nhập họ và tên"
                  />
                </div>
                )}

                {!isAwaitingOtp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-tertiary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={registerData.phone}
                    onChange={(e) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                )}

                {!isAwaitingOtp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-tertiary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="Nhập email của bạn"
                  />
                </div>
                )}

                {!isAwaitingOtp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                    Mật khẩu
                  </label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      required
                      className="py-2 pr-10 pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 
                      bg-white/90 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 
                      placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      placeholder="Nhập mật khẩu"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                    >
                      {showRegisterPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                )}

                {!isAwaitingOtp && (
                <div className="relative mt-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-indigo-500 dark:text-indigo-400" />

                    {/* Ô nhập xác nhận mật khẩu */}
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="py-2 pr-10 pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 
                      bg-white/90 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 
                      placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="Nhập lại mật khẩu"
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                )}

                {isAwaitingOtp && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                      Nhập mã OTP (đã gửi tới {registerData.email})
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-tertiary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Nhập mã OTP 6 chữ số"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mã có hiệu lực trong 10 phút.</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-lg text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 shadow-lg hover:shadow-indigo-500/40 dark:hover:shadow-pink-500/30 font-medium transition-all transform hover:scale-[1.02]"
                >
                  {isAwaitingOtp ? "Xác thực OTP" : "Đăng ký"}
                </button>
              </form>
            )}

            {/* Toggle đăng ký / đăng nhập */}
            <div className="mt-6">
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="w-full text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {isRegistering
                  ? "Đã có tài khoản? Đăng nhập"
                  : "Chưa có tài khoản? Đăng ký ngay"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
