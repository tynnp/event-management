import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../../context/AppContext";
import { User } from "../../types/index";
import { toast } from "react-hot-toast";
import { Trash, Lock, Unlock, Search, ChevronLeft, ChevronRight, Upload, Download, X } from "lucide-react";
import axios from "axios";
import * as XLSX from "xlsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function UserManagement() {
  const { state, dispatch } = useApp();
  const { users } = state;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Bulk upload state
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  // Fetch users from API (extracted to function để gọi lại sau delete)
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch({ type: "SET_USERS", payload: response.data });
    } catch (error) {}
  };

  useEffect(() => {
    fetchUsers();
  }, [dispatch]);

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`${API_URL}/api/users/${selectedUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Không cần dispatch DELETE_USER nữa, thay vào đó refetch để đảm bảo sync với server
      await fetchUsers(); // Refetch để cập nhật UI ngay lập tức và chính xác
      toast.success("Người dùng đã bị xóa!");
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error("Óa người dùng thất bại!");
    }
  };

  const handleRoleChange = async (
    id: string,
    newRole: "admin" | "moderator" | "user"
  ) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.put(
        `${API_URL}/api/users/${id}/role`,
        { newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch({
        type: "UPDATE_USER_ROLE",
        payload: { id, role: response.data.user.role },
      });
    } catch (error) {
      toast.error("Cập nhật vai trò thất bại!");
    }
  };

  const handleToggleLock = async (id: string, isLocked: boolean) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.put(
        `${API_URL}/api/users/${id}/lock`,
        { lock: isLocked },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedUser = response.data.user;
      dispatch({
        type: "TOGGLE_USER_LOCK",
        payload: { id: updatedUser.id, is_locked: updatedUser.is_locked },
      });
      toast.success(
        updatedUser.is_locked ? "Người dùng đã bị khóa!" : "Người dùng đã được mở khóa!"
      );
    } catch (error) {
      toast.error("Thao tác thất bại!");
    }
  };

  // Bulk upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error("Vui lòng chọn file Excel (.xlsx hoặc .xls)");
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      toast.error("Vui lòng chọn file Excel!");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(`${API_URL}/api/users/bulk-upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadResult(response.data);
      await fetchUsers(); // Refresh danh sách users
      toast.success(`Thành công: ${response.data.successCount}/${response.data.total} tài khoản`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Upload thất bại!");
    } finally {
      setIsUploading(false);
    }
  };

  const closeBulkUploadModal = () => {
    setShowBulkUploadModal(false);
    setSelectedFile(null);
    setUploadResult(null);
  };

  const downloadTemplate = () => {
    // Tạo template Excel
    const template = [
      ['email', 'name', 'password', 'role', 'phone'],
      ['user1@example.com', 'Nguyen Van A', 'password123', 'user', '0901234567'],
      ['user2@example.com', 'Tran Thi B', 'password123', 'moderator', '0912345678']
    ];
    
    // Tạo workbook và worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(template);
    
    // Set column widths cho dễ nhìn
    ws['!cols'] = [
      { wch: 25 }, // email
      { wch: 20 }, // name
      { wch: 15 }, // password
      { wch: 12 }, // role
      { wch: 15 }  // phone
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    
    // Download file
    XLSX.writeFile(wb, 'user_template.xlsx');
  };

  // Modal JSX (sẽ dùng portal)
  const modalContent = showDeleteModal && selectedUser && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-bg-primary p-6 rounded-xl shadow-2xl max-w-sm w-full">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
          Xác nhận xóa người dùng
        </h3>
        <p className="text-gray-700 dark:text-dark-text-secondary mb-6">
          Bạn có chắc chắn muốn xóa người dùng <strong>{selectedUser.name}</strong> không?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-dark-bg-secondary text-gray-700 dark:text-dark-text-secondary hover:bg-gray-300 dark:hover:bg-dark-bg-tertiary transition"
          >
            Hủy
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="card rounded-2xl p-6 shadow-xl bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-dark-bg-primary dark:via-dark-bg-secondary dark:to-dark-bg-primary border border-gray-200 dark:border-dark-border transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
        {/* Title */}
        <h2 className="text-3xl font-[800] text-gray-900 dark:text-dark-text-primary flex items-center gap-3 mb-6">
          <span className="pb-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-md transition-all duration-500">
            Quản lý người dùng
          </span>
        </h2>

        {/* Search + Filter + Bulk Upload Button */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-dark-text-tertiary" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary shadow-sm transition-all duration-300 hover:shadow-md"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => handleRoleFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="moderator">Kiểm duyệt viên</option>
              <option value="user">Người dùng</option>
            </select>
          </div>
          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
          >
            <Upload className="h-4 w-4" />
            <span className="whitespace-nowrap">Thêm nhiều tài khoản</span>
          </button>
        </div>

        {/* Stats */}
        <div className="mb-4 text-sm text-gray-600 dark:text-dark-text-secondary italic">
          Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} trong tổng số{" "}
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {filteredUsers.length}
          </span>{" "}
          người dùng
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 dark:border-dark-border shadow-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
            <thead className="bg-gradient-to-r from-indigo-50 to-pink-50 dark:from-dark-bg-tertiary dark:to-dark-bg-secondary">
              <tr>
                {["Tên", "Email", "Vai trò", "Trạng thái", ""].map((header, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-dark-text-tertiary uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
              {currentUsers.map((user, idx) => (
                <tr
                  key={user.id}
                  className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50 dark:hover:from-dark-bg-secondary dark:hover:to-dark-bg-tertiary transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <td className="px-4 py-3 text-gray-900 dark:text-dark-text-primary font-medium">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-dark-text-secondary">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                      className="rounded-md px-2 py-1 text-sm border border-gray-300 dark:border-dark-border focus:ring-2 focus:ring-indigo-500 transition duration-200 bg-white dark:bg-dark-bg-secondary"
                    >
                      <option value="admin">Quản trị viên</option>
                      <option value="moderator">Kiểm duyệt viên</option>
                      <option value="user">Người dùng</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_locked ? (
                      <span className="text-red-600 dark:text-red-400 font-semibold">
                        Đã khóa
                      </span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        Hoạt động
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 flex space-x-2">
                    <button
                      onClick={() => openDeleteModal(user)}
                      className="p-2 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 hover:scale-110 active:scale-95"
                      title="Xóa"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleLock(user.id, !user.is_locked)}
                      className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
                        user.is_locked
                          ? "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                          : "text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                      }`}
                      title={user.is_locked ? "Mở khóa" : "Khóa"}
                    >
                      {user.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {currentUsers.map((user, idx) => (
            <div
              key={user.id}
              className="bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary break-all">
                    {user.email}
                  </p>
                </div>
                <div className="flex space-x-2 ml-2">
                  <button
                    onClick={() => openDeleteModal(user)}
                    className="p-2 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
                    title="Xóa"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleLock(user.id, !user.is_locked)}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      user.is_locked
                        ? "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                        : "text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                    }`}
                    title={user.is_locked ? "Mở khóa" : "Khóa"}
                  >
                    {user.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-dark-text-tertiary">Vai trò:</span>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                    className="rounded-md px-2 py-1 text-sm border border-gray-300 dark:border-dark-border focus:ring-2 focus:ring-indigo-500 transition duration-200 bg-white dark:bg-dark-bg-tertiary"
                  >
                    <option value="admin">Quản trị viên</option>
                    <option value="moderator">Kiểm duyệt viên</option>
                    <option value="user">Người dùng</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-dark-text-tertiary">Trạng thái:</span>
                  {user.is_locked ? (
                    <span className="text-sm text-red-600 dark:text-red-400 font-semibold">
                      Đã khóa
                    </span>
                  ) : (
                    <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                      Hoạt động
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700 dark:text-dark-text-secondary">
              Trang <span className="font-semibold">{currentPage}</span> / {totalPages}
            </div>
            <div className="flex items-center space-x-2 flex-wrap justify-center">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-dark-text-tertiary bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                <ChevronLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Trước</span>
              </button>
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage > totalPages - 3) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                        pageNum === currentPage
                          ? "bg-indigo-600 text-white dark:bg-indigo-400 dark:text-gray-900"
                          : "bg-white text-gray-700 dark:bg-dark-bg-tertiary dark:text-dark-text-primary hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-dark-text-tertiary bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="h-4 w-4 sm:ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {createPortal(modalContent, document.body)}

      {/* Bulk Upload Modal */}
      {createPortal(
        showBulkUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-bg-primary p-6 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">
                  Thêm nhiều tài khoản từ Excel
                </h3>
                <button
                  onClick={closeBulkUploadModal}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-dark-bg-secondary rounded-lg transition"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-dark-text-tertiary" />
                </button>
              </div>

              {/* Instructions */}
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  Hướng dẫn:
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>File Excel phải có các cột: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">email</code>, <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">name</code>, <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">password</code></li>
                  <li>Các cột tùy chọn: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">role</code> (user/moderator/admin), <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">phone</code></li>
                  <li>Mật khẩu phải có tối thiểu 8 ký tự</li>
                  <li>Email phải là duy nhất và hợp lệ</li>
                </ul>
              </div>

              {/* Download Template Button */}
              <button
                onClick={downloadTemplate}
                className="mb-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download className="h-4 w-4" />
                Tải file mẫu
              </button>

              {/* File Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  Chọn file Excel:
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-900 dark:text-dark-text-primary border border-gray-300 dark:border-dark-border rounded-lg cursor-pointer bg-gray-50 dark:bg-dark-bg-tertiary focus:outline-none"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-dark-text-secondary">
                    File đã chọn: <strong>{selectedFile.name}</strong>
                  </p>
                )}
              </div>

              {/* Upload Result */}
              {uploadResult && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-dark-bg-secondary rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
                    Kết quả upload:
                  </h4>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{uploadResult.total}</p>
                      <p className="text-xs text-gray-600 dark:text-dark-text-tertiary">Tổng số</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{uploadResult.successCount}</p>
                      <p className="text-xs text-gray-600 dark:text-dark-text-tertiary">Thành công</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{uploadResult.failedCount}</p>
                      <p className="text-xs text-gray-600 dark:text-dark-text-tertiary">Thất bại</p>
                    </div>
                  </div>

                  {/* Failed Items */}
                  {uploadResult.results.failed.length > 0 && (
                    <div className="mt-3">
                      <h5 className="font-semibold text-red-600 dark:text-red-400 mb-2">
                        Các dòng lỗi:
                      </h5>
                      <div className="max-h-40 overflow-y-auto">
                        {uploadResult.results.failed.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="text-sm p-2 mb-1 bg-red-50 dark:bg-red-900/20 rounded border-l-4 border-red-500"
                          >
                            <span className="font-semibold">Dòng {item.row}</span> ({item.email}): {item.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={closeBulkUploadModal}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-dark-bg-secondary text-gray-700 dark:text-dark-text-secondary hover:bg-gray-300 dark:hover:bg-dark-bg-tertiary transition"
                  disabled={isUploading}
                >
                  Đóng
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={!selectedFile || isUploading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}
    </>
  );
}