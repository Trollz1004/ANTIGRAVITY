import React from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { TaskBriefInput } from './components/TaskBriefInput';
import { LaunchPanel } from './components/LaunchPanel';
import { TreasuryBand } from './components/TreasuryBand';
import { HermesRouterPanel } from './components/HermesRouterPanel';
import { PaperclipWorkerPanel } from './components/PaperclipWorkerPanel';
import { RevenueEnginePanel } from './components/RevenueEnginePanel';
import { TrustHierarchyPanel } from './components/TrustHierarchyPanel';
import { StackIntegrityPanel } from './components/StackIntegrityPanel';
import { RunbooksPanel } from './components/RunbooksPanel';
import { BuildAgentPanel } from './components/BuildAgentPanel';
import { MissionBand } from './components/MissionBand';
import { Footer } from './components/Footer';
import { ScanningRepoIndicator } from './components/ScanningRepoIndicator';
import { T5500Panel } from './components/T5500Panel';

export const App: React.FC = () => (
  <div className="flex flex-col h-screen bg-background text-white font-sans">
    <TopBar />
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4">
        <TaskBriefInput />
        <ScanningRepoIndicator />
        <LaunchPanel />
        <TreasuryBand />
        <HermesRouterPanel />
        <PaperclipWorkerPanel />
        <T5500Panel />
        <RevenueEnginePanel />
        <TrustHierarchyPanel />
        <StackIntegrityPanel />
      </main>
      <aside className="w-64 bg-panel p-4 overflow-auto">
        <RunbooksPanel />
        <BuildAgentPanel />
        <MissionBand />
      </aside>
    </div>
    <Footer />
  </div>
);
