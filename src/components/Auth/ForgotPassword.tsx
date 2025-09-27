import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { ThemeToggle } from '../Layout/ThemeToggle';

interface ForgotPasswordProps {
  onBack: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      if (email.trim()) {
        setIsSubmitted(true);
      } else {
        setError('Vui lòng nhập email');
      }
    }, 1500);
  };

  const handleResendEmail = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Reset để có thể gửi lại
    }, 1000);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-dark-bg-primary dark:to-dark-bg-secondary py-12 px-4 sm:px-6 lg:px-8">
        {/* Theme Toggle Button */}
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-dark-text-primary">
              Email đã được gửi!
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-dark-text-secondary">
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến <strong>{email}</strong>
            </p>
          </div>

          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl p-8 border border-gray-200 dark:border-dark-border">
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Bước tiếp theo:
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Kiểm tra hộp thư đến của bạn</li>
                  <li>• Mở email từ hệ thống</li>
                  <li>• Nhấp vào liên kết đặt lại mật khẩu</li>
                  <li>• Tạo mật khẩu mới</li>
                </ul>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Lưu ý:</strong> Email có thể mất vài phút để đến. Nếu không thấy email, hãy kiểm tra thư mục spam.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  className="flex-1 flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-dark-border text-sm font-medium rounded-lg text-gray-700 dark:text-dark-text-secondary bg-white dark:bg-dark-bg-tertiary hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 dark:border-gray-300 mr-2"></div>
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi lại email'
                  )}
                </button>
                
                <button
                  onClick={onBack}
                  className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại đăng nhập
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-dark-bg-primary dark:to-dark-bg-secondary py-12 px-4 sm:px-6 lg:px-8">
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-dark-text-primary">
            Quên mật khẩu?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-dark-text-secondary">
            Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu
          </p>
        </div>

        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl p-8 border border-gray-200 dark:border-dark-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                Email đăng ký
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-tertiary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-dark-text-tertiary" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang gửi...
                </>
              ) : (
                'Gửi hướng dẫn đặt lại mật khẩu'
              )}
            </button>
          </form>

          <div className="mt-6">
            <button
              onClick={onBack}
              className="w-full flex justify-center items-center text-sm text-blue-600 hover:text-blue-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại đăng nhập
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-dark-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-dark-bg-secondary text-gray-500 dark:text-dark-text-tertiary">
                  Cần hỗ trợ?
                </span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                Liên hệ với chúng tôi qua email:{' '}
                <a href="mailto:support@eventmanager.com" className="text-blue-600 hover:text-blue-500">
                  support@eventmanager.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
