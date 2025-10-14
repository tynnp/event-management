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
import { PersonalProfile } from './components/PersonalProfile/PersonalProfile';
import { BrowserRouter } from "react-router-dom";

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
        return <PersonalProfile/>
      
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