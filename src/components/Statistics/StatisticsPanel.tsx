import { useApp } from '../../context/AppContext';
import { Users, Calendar, CheckCircle, Clock, Star } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function StatisticsPanel() {
  const { state } = useApp();
  const { currentUser, users, events } = state;

  if (!currentUser) return null;

  // --- Data cá nhân ---
  const myEvents = events.filter((e) => e.createdBy === currentUser.id);
  const myParticipations = events.filter((e) =>
    e.participants.some((p) => p.userId === currentUser.id)
  );
  const myCheckedIn = myParticipations.reduce(
    (sum, e) =>
      sum +
      e.participants.filter(
        (p) => p.userId === currentUser.id && p.checkedIn
      ).length,
    0
  );

  // --- Cards ---
  const adminStats = [
    { title: 'Tổng người dùng', value: users.length, icon: Users, color: 'bg-blue-500' },
    { title: 'Sự kiện đã duyệt', value: events.filter((e) => e.status === 'approved').length, icon: CheckCircle, color: 'bg-green-500' },
    { title: 'Sự kiện chờ duyệt', value: events.filter((e) => e.status === 'pending').length, icon: Clock, color: 'bg-orange-500' },
    { title: 'Sự kiện bị từ chối', value: events.filter((e) => e.status === 'rejected').length, icon: Calendar, color: 'bg-red-500' },
    { title: 'Tổng lượt tham gia', value: events.reduce((sum, e) => sum + e.participants.length, 0), icon: Users, color: 'bg-purple-500' },
  ];

  const organizerStats = [
    { title: 'Sự kiện đã tạo', value: myEvents.length, icon: Calendar, color: 'bg-blue-500' },
    { title: 'Đã duyệt', value: myEvents.filter((e) => e.status === 'approved').length, icon: CheckCircle, color: 'bg-green-500' },
    { title: 'Chờ duyệt', value: myEvents.filter((e) => e.status === 'pending').length, icon: Clock, color: 'bg-orange-500' },
    { title: 'Người tham gia sự kiện của tôi', value: myEvents.reduce((sum, e) => sum + e.participants.length, 0), icon: Users, color: 'bg-purple-500' },
    {
      title: 'Đánh giá trung bình',
      value:
        myEvents.length > 0
          ? (
              myEvents.reduce((sum, e) => sum + (e.averageRating || 0), 0) /
              myEvents.length
            ).toFixed(1) + '/5.0'
          : 'N/A',
      icon: Star,
      color: 'bg-yellow-500',
    },
  ];

  const userStats = [
    { title: 'Sự kiện đã tham gia', value: myParticipations.length, icon: Calendar, color: 'bg-blue-500' },
    { title: 'Số lần điểm danh', value: myCheckedIn, icon: CheckCircle, color: 'bg-green-500' },
    { title: 'Huy hiệu', value: currentUser.badges.length, icon: Star, color: 'bg-yellow-500' },
  ];

  const userCreatedEventsStats = [
    { title: 'Sự kiện đã tạo', value: myEvents.length, icon: Calendar, color: 'bg-purple-500' },
    { title: 'Đã duyệt', value: myEvents.filter((e) => e.status === 'approved').length, icon: CheckCircle, color: 'bg-green-500' },
    { title: 'Chờ duyệt', value: myEvents.filter((e) => e.status === 'pending').length, icon: Clock, color: 'bg-orange-500' },
    { title: 'Người tham gia', value: myEvents.reduce((sum, e) => sum + e.participants.length, 0), icon: Users, color: 'bg-blue-500' },
  ];

  // --- Data biểu đồ ---
  const eventStatusData = [
    { name: 'Đã duyệt', value: events.filter((e) => e.status === 'approved').length },
    { name: 'Chờ duyệt', value: events.filter((e) => e.status === 'pending').length },
    { name: 'Bị từ chối', value: events.filter((e) => e.status === 'rejected').length },
    { name: 'Hủy', value: events.filter((e) => e.status === 'cancelled').length },
  ];

  const userRoleData = [
    { name: 'Admin', value: users.filter((u) => u.role === 'admin').length },
    { name: 'Moderator', value: users.filter((u) => u.role === 'moderator').length },
    { name: 'User', value: users.filter((u) => u.role === 'user').length },
  ];

  const participantsPerEvent = myEvents.map((e) => ({
    name: e.title,
    đăngKý: e.participants.length,
    thamGia: e.participants.filter((p) => p.checkedIn).length,
  }));

  const ratingsPerEvent = myEvents.map((e) => ({
    name: e.title,
    value: e.averageRating || 0,
  }));

  const checkInData = [
    { name: 'Đã điểm danh', value: myCheckedIn },
    { name: 'Chưa điểm danh', value: myParticipations.length - myCheckedIn },
  ];

  const categoryData = myParticipations.reduce((acc: any[], e) => {
    const cat = e.category || 'Khác';
    const existing = acc.find((a) => a.name === cat);
    if (existing) existing.value++;
    else acc.push({ name: cat, value: 1 });
    return acc;
  }, []);

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">Thống kê chi tiết</h1>
        <p className="text-gray-600 dark:text-dark-text-secondary mt-1">
          {currentUser.role === 'admin'
            ? 'Tổng quan hệ thống + sự kiện đã tạo + sự kiện tham gia'
            : currentUser.role === 'moderator'
            ? 'Hoạt động tổ chức & tham gia sự kiện'
            : 'Hoạt động cá nhân của bạn'}
        </p>
      </div>

      {/* --- Admin block --- */}
      {currentUser.role === 'admin' && (
        <>
          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminStats.map((stat, i) => (
              <div
                key={i}
                className="card rounded-xl shadow-sm  p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color} rounded-lg p-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Event Status & User Roles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card rounded-xl shadow-sm  p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">Sự kiện theo trạng thái</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={eventStatusData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card rounded-xl shadow-sm  p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">Người dùng theo vai trò</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userRoleData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {userRoleData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* --- Organizer block (admin & moderator) --- */}
      {(currentUser.role === 'admin' || currentUser.role === 'moderator') && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">Thống kê sự kiện tôi tạo</h2>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizerStats.map((stat, i) => (
              <div
                key={i}
                className="card rounded-xl shadow-sm  p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color} rounded-lg p-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <div className="card rounded-xl shadow-sm  p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">Xu hướng đăng ký & tham gia</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={participantsPerEvent}>
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="đăngKý" stroke="#3b82f6" />
                  <Line type="monotone" dataKey="thamGia" stroke="#10b981" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card rounded-xl shadow-sm  p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">Độ hài lòng (trung bình)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratingsPerEvent}>
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="card rounded-xl shadow-sm  p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">Bảng thống kê từng sự kiện</h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-dark-bg-tertiary sticky top-0">
                  <tr>
                    <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">Tên sự kiện</th>
                    <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">Đăng ký</th>
                    <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">Check-in</th>
                    <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">Tỷ lệ</th>
                    <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">Đánh giá TB</th>
                  </tr>
                </thead>
                <tbody>
                  {myEvents.map((e) => {
                    const registered = e.participants.length;
                    const checkedIn = e.participants.filter((p) => p.checkedIn).length;
                    const rate =
                      registered > 0
                        ? ((checkedIn / registered) * 100).toFixed(1) + '%'
                        : '0%';
                    return (
                      <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary">
                        <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text-primary">{e.title}</td>
                        <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text-primary">{registered}</td>
                        <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text-primary">{checkedIn}</td>
                        <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text-primary">{rate}</td>
                        <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text-primary">
                          {e.averageRating > 0
                            ? e.averageRating.toFixed(1)
                            : 'Chưa có'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* User Created Events Statistics - Only for regular users */}
      {currentUser.role === 'user' && myEvents.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">Thống kê sự kiện tôi đã tạo</h2>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userCreatedEventsStats.map((stat, i) => (
              <div
                key={i}
                className="card rounded-xl shadow-sm p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color} rounded-lg p-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Created Events Table */}
          <div className="card rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">Sự kiện gần đây của tôi</h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-dark-bg-tertiary sticky top-0">
                  <tr>
                    <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">Tên sự kiện</th>
                    <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">Trạng thái</th>
                    <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">Người tham gia</th>
                    <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">Ngày tạo</th>
                    <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">Đánh giá TB</th>
                  </tr>
                </thead>
                <tbody>
                  {myEvents.slice(0, 10).map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary">
                      <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text-primary">{event.title}</td>
                      <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          event.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                          event.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                          event.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                          {event.status === 'approved' ? 'Đã duyệt' :
                           event.status === 'pending' ? 'Chờ duyệt' :
                           event.status === 'rejected' ? 'Bị từ chối' : 'Đã hủy'}
                        </span>
                      </td>
                      <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text-primary">{event.participants.length}</td>
                      <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text-primary">
                        {new Date(event.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text-primary">
                        {event.averageRating > 0 ? event.averageRating.toFixed(1) : 'Chưa có'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- User block (admin, mod, user) --- */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">Thống kê sự kiện tôi tham gia</h2>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userStats.map((stat, i) => (
            <div
              key={i}
              className="card rounded-xl shadow-sm  p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} rounded-lg p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card rounded-xl shadow-sm  p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">Tỉ lệ điểm danh</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={checkInData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {checkInData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card rounded-xl shadow-sm  p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">
              Sự kiện đã tham gia theo danh mục
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* History */}
        <div className="card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">Lịch sử sự kiện đã tham gia</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                <tr>
                  <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">Tên sự kiện</th>
                  <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">Ngày</th>
                  <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">Check-in</th>
                  <th className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-left text-gray-900 dark:text-dark-text-primary">Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {myParticipations.map((e) => {
                  const participant = e.participants.find(
                    (p) => p.userId === currentUser.id
                  );
                  const rating = e.ratings.find(
                    (r) => r.userId === currentUser.id
                  );
                  return (
                    <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary">
                      <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text-primary">{e.title}</td>
                      <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text-primary">
                        {new Date(e.startTime).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text-primary">
                        {participant?.checkedIn ? '✔️' : '❌'}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text-primary">
                        {rating ? rating.rating : 'Chưa đánh giá'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}