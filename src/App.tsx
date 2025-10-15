import { BrowserRouter, Routes, Route } from "react-router-dom";
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
          className={`flex-1 p-8 transition-all duration-300 ${
            sidebarOpen ? 'ml-[250px]' : 'ml-0'
          }`}
        >
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<EventDetail />} />
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