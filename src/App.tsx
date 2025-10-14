import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginForm } from './components/Auth/LoginForm';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { EventList } from './components/Events/EventList';
import { UserManagement } from './components/Users/UserManagement';
import { StatisticsPanel } from './components/Statistics/StatisticsPanel';
import { PersonalProfile } from './components/PersonalProfile/PersonalProfile';
import { useState } from 'react';

function AppContent() {
  const { state } = useApp();
  const { currentUser } = state;
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!currentUser) {
    return <LoginForm />;
  }

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
        <main className="flex-1 p-8">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/statistics" element={<StatisticsPanel />} />
            <Route path="/profile" element={<PersonalProfile />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;