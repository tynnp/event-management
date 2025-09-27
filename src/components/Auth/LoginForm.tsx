import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ThemeToggle } from '../Layout/ThemeToggle';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const { state, dispatch } = useApp();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = state.users.find(u => u.email === email && u.password === password);
    
    if (user) {
      dispatch({ type: 'LOGIN', payload: user });
    } else {
      setError('Email hoặc mật khẩu không đúng');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (state.users.find(u => u.email === registerData.email)) {
      setError('Email đã được sử dụng');
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      email: registerData.email,
      password: registerData.password,
      name: registerData.name,
      phone: registerData.phone,
      role: 'user' as const,
      createdAt: new Date().toISOString(),
      eventsAttended: 0,
      badges: []
    };

    dispatch({ type: 'REGISTER', payload: newUser });
  };

  const demoAccounts = [
    { email: 'tynnp@hcmue.edu.vn', password: 'admin123', role: 'Quản trị viên' },
    { email: 'kietcvt@hcmue.edu.vn', password: 'mod123', role: 'Kiểm duyệt viên' },
    { email: 'vynu@hcmue.edu.vn', password: 'user123', role: 'Người dùng' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-dark-bg-primary dark:to-dark-bg-secondary py-12 px-4 sm:px-6 lg:px-8">
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-dark-text-primary">
            {isRegistering ? 'Đăng ký tài khoản' : 'Đăng nhập'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-dark-text-secondary">
            {isRegistering ? 'Tạo tài khoản mới để tham gia sự kiện' : 'Quản lý và tham gia sự kiện dễ dàng'}
          </p>
        </div>

        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl p-8 border border-gray-200 dark:border-dark-border">
          {!isRegistering ? (
            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                  Email
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

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                  Mật khẩu
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-tertiary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-dark-text-tertiary" />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 dark:text-dark-text-tertiary" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 dark:text-dark-text-tertiary" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Đăng nhập
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleRegister}>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Họ và tên</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-tertiary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={registerData.name}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Số điện thoại</label>
                <input
                  type="tel"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-tertiary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Email</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-tertiary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={registerData.email}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Mật khẩu</label>
                <input
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-tertiary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={registerData.password}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border placeholder-gray-500 dark:placeholder-dark-text-tertiary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Đăng ký
              </button>
            </form>
          )}

          <div className="mt-6">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-500"
            >
              {isRegistering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
            </button>
          </div>

          {!isRegistering && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-dark-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-dark-bg-secondary text-gray-500 dark:text-dark-text-tertiary">Tài khoản demo</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {demoAccounts.map((account, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                    }}
                    className="w-full text-left px-3 py-2 bg-gray-50 dark:bg-dark-bg-tertiary hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{account.role}</span>
                      <span className="text-xs text-gray-500 dark:text-dark-text-tertiary">{account.email}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}