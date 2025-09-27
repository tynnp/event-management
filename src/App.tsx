import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginForm } from './components/Auth/LoginForm';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { EventList } from './components/Events/EventList';
import { EventDetail } from './components/Events/EventDetail';
import { CreateEvent } from './components/Events/CreateEvent';
import { ModerationPanel } from './components/Moderation/ModerationPanel';
import { CheckInPanel } from './components/CheckIn/CheckInPanel';
import { UserManagement } from './components/Users/UserManagement';
import { StatisticsPanel } from './components/Statistics/StatisticsPanel';
import { Event } from './types';

function AppContent() {
  const { state } = useApp();
  const { currentUser } = state;
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!currentUser) {
    return <LoginForm />;
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setActiveSection('event-detail');
  };

  const handleCreateEvent = () => {
    setActiveSection('create-event');
  };

  const handleBackToEvents = () => {
    setSelectedEvent(null);
    setActiveSection('events');
  };

  const handleEventCreated = () => {
    setActiveSection('events');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      
      case 'events':
        return (
          <EventList
            showMyEvents={true}
            showCreateButton={true}
            onCreateEvent={handleCreateEvent}
            onEventClick={handleEventClick}
          />
        );
      
      case 'create-event':
        return (
          <CreateEvent
            onCancel={handleBackToEvents}
            onSuccess={handleEventCreated}
          />
        );
      
      case 'browse-events':
        return (
          <EventList
            showMyEvents={false}
            onEventClick={handleEventClick}
          />
        );
      
      case 'event-detail':
        return selectedEvent ? (
          <EventDetail
            event={selectedEvent}
            onBack={handleBackToEvents}
          />
        ) : (
          <div>Không tìm thấy sự kiện</div>
        );
      
      case 'moderation':
        return <ModerationPanel />;
      
      case 'check-in':
        return <CheckInPanel />;
      
      case 'users':
        return <UserManagement />;
      
      case 'statistics':
        return <StatisticsPanel />
      
      case 'profile':
        return (
          <div className="card rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">Hồ sơ cá nhân</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Họ và tên</label>
                  <input
                    type="text"
                    value={currentUser.name}
                    readOnly
                    className="input-field w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-bg-tertiary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Email</label>
                  <input
                    type="email"
                    value={currentUser.email}
                    readOnly
                    className="input-field w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-bg-tertiary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Số điện thoại</label>
                  <input
                    type="tel"
                    value={currentUser.phone || ''}
                    readOnly
                    className="input-field w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-bg-tertiary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Vai trò</label>
                  <input
                    type="text"
                    value={currentUser.role === 'admin' ? 'Quản trị viên' : 
                           currentUser.role === 'moderator' ? 'Kiểm duyệt viên' : 'Người dùng'}
                    readOnly
                    className="input-field w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-bg-tertiary"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-3">Huy hiệu</h3>
                <div className="flex flex-wrap gap-2">
                  {currentUser.badges.map((badge, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium"
                    >
                      {badge}
                    </span>
                  ))}
                  {currentUser.badges.length === 0 && (
                    <p className="text-gray-500 dark:text-dark-text-tertiary">Chưa có huy hiệu nào</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
      <Header onMenuToggle={() => setSidebarOpen(true)} />
      <div className="flex relative">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className={`
          flex-1 transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'ml-64' : 'ml-0'}
          p-8
        `}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;