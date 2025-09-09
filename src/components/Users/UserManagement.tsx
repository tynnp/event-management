import React from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types/index';
import { Edit, Trash, Lock, Unlock } from 'lucide-react';

export function UserManagement() {
  const { state, dispatch } = useApp();
  const { users } = state;

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Quản lý người dùng</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user: User) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                    className="border rounded-md px-2 py-1 text-sm"
                  >
                    <option value="admin">Quản trị viên</option>
                    <option value="moderator">Kiểm duyệt viên</option>
                    <option value="user">Người dùng</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  {user.isLocked ? (
                    <span className="text-red-600 font-medium">Đã khóa</span>
                  ) : (
                    <span className="text-green-600 font-medium">Hoạt động</span>
                  )}
                </td>
                <td className="px-4 py-3 flex space-x-2">
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Xóa"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Chỉnh sửa"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleLock(user.id, !user.isLocked)}
                    className={`p-1 ${user.isLocked ? 'text-green-600 hover:bg-green-50' : 'text-yellow-600 hover:bg-yellow-50'} rounded`}
                    title={user.isLocked ? 'Mở khóa' : 'Khóa'}
                  >
                    {user.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Chưa có người dùng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
