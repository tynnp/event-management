import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types/index';
import { Edit, Trash, Lock, Unlock, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export function UserManagement() {
  const { state, dispatch } = useApp();
  const { users } = state;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when search/filter changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      dispatch({ type: 'DELETE_USER', payload: id });
    }
  };

  const handleRoleChange = (id: string, newRole: 'admin' | 'moderator' | 'user') => {
    dispatch({ type: 'UPDATE_USER_ROLE', payload: { id, role: newRole } });
  };

  const handleToggleLock = (id: string, isLocked: boolean) => {
    dispatch({ type: 'TOGGLE_USER_LOCK', payload: { id, isLocked } });
  };

  return (
    <div className="card rounded-xl p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-6">Quản lý người dùng</h2>
      
      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-dark-text-tertiary" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={roleFilter}
            onChange={(e) => handleRoleFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản trị viên</option>
            <option value="moderator">Kiểm duyệt viên</option>
            <option value="user">Người dùng</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 text-sm text-gray-600 dark:text-dark-text-secondary">
        Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} trong tổng số {filteredUsers.length} người dùng
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
          <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">Tên</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">Vai trò</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">Trạng thái</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
            {currentUsers.map((user: User) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary">
                <td className="px-4 py-3 text-gray-900 dark:text-dark-text-primary">{user.name}</td>
                <td className="px-4 py-3 text-gray-900 dark:text-dark-text-primary">{user.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                    className="input-field rounded-md px-2 py-1 text-sm"
                  >
                    <option value="admin">Quản trị viên</option>
                    <option value="moderator">Kiểm duyệt viên</option>
                    <option value="user">Người dùng</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  {user.isLocked ? (
                    <span className="text-red-600 dark:text-red-400 font-medium">Đã khóa</span>
                  ) : (
                    <span className="text-green-600 dark:text-green-400 font-medium">Hoạt động</span>
                  )}
                </td>
                <td className="px-4 py-3 flex space-x-2">
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Xóa"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    title="Chỉnh sửa"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleLock(user.id, !user.isLocked)}
                    className={`p-1 ${user.isLocked ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'} rounded`}
                    title={user.isLocked ? 'Mở khóa' : 'Khóa'}
                  >
                    {user.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </button>
                </td>
              </tr>
            ))}
            {currentUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-dark-text-tertiary">
                  {searchTerm || roleFilter !== 'all' ? 'Không tìm thấy người dùng nào' : 'Chưa có người dùng nào'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-dark-text-secondary">
            Trang {currentPage} / {totalPages}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-dark-text-tertiary bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Trước
            </button>

            {/* Page numbers */}
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 dark:text-dark-text-tertiary bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-dark-text-tertiary bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
