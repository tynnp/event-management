import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginForm } from './components/Auth/LoginForm';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { EventList } from './components/Events/EventList';
import { CreateEvent } from "./components/Events/CreateEvent";
import { EventDetail } from "./components/Events/EventDetail";
import { UserManagement } from './components/Users/UserManagement';
import { StatisticsPanel } from './components/Statistics/StatisticsPanel';
import { PersonalProfile } from './components/PersonalProfile/PersonalProfile';
import { ModerationPanel } from "./components/Moderation/ModerationPanel";
import { CheckInPanel } from "./components/CheckIn/CheckInPanel";
import { NotFound } from "./components/Layout/NotFound";
import { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";
import { Toaster } from 'react-hot-toast';

function AppContent() {
  const { state } = useApp();
  const { currentUser } = state;
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const pathToSection: Record<string, string> = {
      '/dashboard': 'dashboard',
      '/events': 'events',
      '/create-event': 'create-event',
      '/browse-events': 'browse-events',
      '/moderation': 'moderation',
      '/check-in': 'check-in',
      '/users': 'users',
      '/statistics': 'statistics',
      '/profile': 'profile',
    };

    const matchedSection = pathToSection[location.pathname];
    if (matchedSection) {
      setActiveSection(matchedSection);
    }
  }, [location.pathname]);

  // Require login even for shared links
  const isPublicView = new URLSearchParams(location.search).get('public') === '1';
  if (!currentUser) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary transition-all duration-300">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex relative transition-all duration-300">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main
          className={`flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<EventList />} />               {/* list */}
            <Route path="/events/:id" element={<EventDetail />} />         {/* detail */}
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/browse-events" element={<EventList />} />
            <Route path="/moderation" element={<ModerationPanel />} />
            <Route path="/check-in" element={<CheckInPanel />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/statistics" element={<StatisticsPanel />} />
            <Route path="/profile" element={<PersonalProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
      <footer className="bg-white dark:bg-dark-bg-secondary border-t border-gray-200 dark:border-gray-700 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            &copy; 2025 Nguyễn Ngọc Phú Tỷ và Nhóm phát triển - Đồ án Nhập môn Công nghệ phần mềm
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppProvider>
          <AppContent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: '#fff',
                padding: '12px 20px',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                fontWeight: 500,
                fontSize: '14px',
              },
            }}
          />
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;