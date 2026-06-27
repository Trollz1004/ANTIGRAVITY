import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { TaskBriefInput } from './components/TaskBriefInput';
import { LaunchPanel } from './components/LaunchPanel';
import { TreasuryBand } from './components/TreasuryBand';
import { HermesRouterPanel } from './components/HermesRouterPanel';
import { OpenClawSupportPanel } from './components/OpenClawSupportPanel';
import { RevenueEnginePanel } from './components/RevenueEnginePanel';
import { TrustHierarchyPanel } from './components/TrustHierarchyPanel';
import { StackIntegrityPanel } from './components/StackIntegrityPanel';
import { RunbooksPanel } from './components/RunbooksPanel';
import { BuildAgentPanel } from './components/BuildAgentPanel';
import { OpsBand } from './components/OpsBand';
import { Footer } from './components/Footer';
import { ScanningRepoIndicator } from './components/ScanningRepoIndicator';
import { T5500Panel } from './components/T5500Panel';
import { NotificationPanel } from './components/NotificationPanel';
import { useWebSocketNotifications } from './hooks/useWebSocketNotifications';
import { ToastContainer } from './components/Toast';
import { ToastProvider } from './lib/useToast';
import { AuthProvider } from './lib/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import { RateLimitDashboard } from './components/RateLimitDashboard';
import { UploadProgressPanel } from './components/UploadProgressPanel';
import { AgentMemoryPanel } from './components/AgentMemoryPanel';
import { MissionProgressPanel } from './components/MissionProgressPanel';

const MissionControlShell: React.FC = () => {
  const [activePanel, setActivePanel] = useState('ops'); // Default active panel
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const { notifications, unreadCount, markAsRead, clearAllNotifications } = useWebSocketNotifications();

  return (
    <div className="flex flex-col h-screen bg-background text-white font-sans">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          active={activePanel}
          setActive={setActivePanel}
          unreadCount={unreadCount}
          onNotificationBellClick={() => setShowNotificationPanel(prev => !prev)}
        /> {/* Pass active and setActive to Sidebar */}
        <main className="flex-1 overflow-auto p-4">
          {activePanel === 'ops' && <TaskBriefInput />}
          {activePanel === 'ops' && <ScanningRepoIndicator />}
          {activePanel === 'ops' && <AgentMemoryPanel />}
          {activePanel === 'memory' && <AgentMemoryPanel />}
          {activePanel === 'tasks' && <MissionProgressPanel />}
          {activePanel === 'ops' && <LaunchPanel />}
          {activePanel === 'ops' && <TreasuryBand />}
          {activePanel === 'ops' && <HermesRouterPanel />}
          {activePanel === 'ops' && <OpenClawSupportPanel />}
          {activePanel === 'ops' && <T5500Panel />}
          {activePanel === 'ops' && <RevenueEnginePanel />}
          {activePanel === 'ops' && <TrustHierarchyPanel />}
          {activePanel === 'ops' && <StackIntegrityPanel />}
          {activePanel === 'uploads' && <UploadProgressPanel />}
          {activePanel === 'rate-limits' && <RateLimitDashboard />}
          {/* Add other panels here based on activePanel */}
        </main>
        <aside className="w-64 bg-panel p-4 overflow-auto">
          <RunbooksPanel />
          <BuildAgentPanel />
          <OpsBand />
        </aside>
      </div>
      <Footer />
      <ToastContainer />
      {showNotificationPanel && (
        <div className="absolute top-16 right-4 z-50">
          <NotificationPanel
            notifications={notifications}
            markAsRead={markAsRead}
            clearAllNotifications={clearAllNotifications}
            onClose={() => setShowNotificationPanel(false)}
          />
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <MissionControlShell />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
