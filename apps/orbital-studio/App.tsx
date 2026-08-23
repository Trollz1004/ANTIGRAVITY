import { useCallback, useEffect, useRef, useState } from 'react';
import { api, subscribeEvents } from './api';
import AgentLibrary from './components/AgentLibrary';
import BrainPanel from './components/BrainPanel';
import BrowserPanel from './components/BrowserPanel';
import BridgePanel from './components/BridgePanel';
import CouncilPanel from './components/CouncilPanel';
import ControlCenter from './components/ControlCenter';
import PaperMatesPanel from './components/PaperMatesPanel';
import Header from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import ServicesPanel from './components/ServicesPanel';
import SwarmEngine from './components/SwarmEngine';
import Graphy from './components/Graphy';
import GeminiClassicOS from './components/GeminiClassicOS';
import UltracodeStudio from './components/UltracodeStudio';
import MissionControlPipeline from './components/MissionControlPipeline';
import OdooEcommerceHub from './components/OdooEcommerceHub';
import type { AgentDef, CategoryDef, Health, SwarmTask, Tab } from './types';

export default function App() {
  const [tab, setTab] = useState<Tab>('control');
  const [agents, setAgents] = useState<AgentDef[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [tasks, setTasks] = useState<SwarmTask[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const refreshTimer = useRef<number | null>(null);

  // Embedded-browser bridge injected by the Electron preload; absent in the
  // plain web build, where the dashboard stays full-width.
  const isElectron = typeof window !== 'undefined' && !!(window as unknown as { mcElectron?: unknown }).mcElectron;

  const refreshTasks = useCallback(() => {
    // Debounce bursts of SSE events into one fetch.
    if (refreshTimer.current !== null) return;
    refreshTimer.current = window.setTimeout(async () => {
      refreshTimer.current = null;
      try {
        const [{ tasks: nextTasks }, nextHealth] = await Promise.all([api.tasks(), api.health()]);
        setTasks(nextTasks);
        setHealth(nextHealth);
      } catch {
        setHealth(null);
      }
    }, 120);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [libraryRes, tasksRes, healthRes] = await Promise.all([api.agents(), api.tasks(), api.health()]);
        setAgents(libraryRes.agents);
        setCategories(libraryRes.categories);
        setTasks(tasksRes.tasks);
        setHealth(healthRes);
      } catch {
        setHealth(null);
      }
    })();
    const unsubscribe = subscribeEvents(refreshTasks);
    const poll = window.setInterval(refreshTasks, 30_000);
    return () => {
      unsubscribe();
      window.clearInterval(poll);
    };
  }, [refreshTasks]);

  const [isScreensaverOpen, setIsScreensaverOpen] = useState(false);

  const toggleAgent = useCallback((agentId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  }, []);

  const deployAgent = useCallback(
    (agentId: string) => {
      toggleAgent(agentId);
    },
    [toggleAgent],
  );

  // Global hotkey for screensaver
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.key === 's' || e.key === 'S') {
        setIsScreensaverOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const runningCount = tasks.filter((t) => t.status === 'running' || t.status === 'queued').length;

  return (
    <div className={`app${isElectron ? ' app--electron' : ''}`}>
      <div className="app__dashboard">
        <Header
          tab={tab}
          onTab={setTab}
          health={health}
          runningCount={runningCount}
          selectedCount={selected.size}
          onOpenScreensaver={() => setIsScreensaverOpen(true)}
        />
        <main className="main">
          {tab === 'control' && (
            <ControlCenter
              health={health}
              tasks={tasks}
              onNavigate={setTab}
              onOpenScreensaver={() => setIsScreensaverOpen(true)}
            />
          )}
          {tab === 'graphy' && <Graphy />}
          {tab === 'gemini95' && <GeminiClassicOS />}
          {tab === 'ultracode' && <UltracodeStudio />}
          {tab === 'pipeline' && <MissionControlPipeline />}
          {tab === 'odoo' && <OdooEcommerceHub />}
          {tab === 'papermates' && <PaperMatesPanel onNavigate={setTab} />}
          {tab === 'library' && (
            <AgentLibrary agents={agents} categories={categories} selected={selected} onDeploy={deployAgent} />
          )}
          {tab === 'swarm' && (
            <SwarmEngine
              agents={agents}
              selected={selected}
              onToggleAgent={toggleAgent}
              tasks={tasks}
              health={health}
              onGoLibrary={() => setTab('library')}
            />
          )}
          {tab === 'board' && <KanbanBoard tasks={tasks} />}
          {tab === 'services' && <ServicesPanel />}
          {tab === 'brain' && <BrainPanel />}
          {tab === 'bridge' && <BridgePanel />}
          {tab === 'council' && <CouncilPanel />}
        </main>
        <footer className="footer">
          <span>
            MISSION CONTROL v{health?.version ?? '5.0.0'} — {health?.edition ?? 'CO-FOUNDER GALAXY EDITION'}
          </span>
          <span>
            TARGET NODES: SABRETOOTH (MASTER) & 9020 NODE (LOCAL OLLAMA) · REAL OUTPUT ONLY — NO SIMULATED DATA
          </span>
        </footer>
      </div>
      {isElectron && <BrowserPanel />}

      {/* Global 3D Screensaver Modal Overlay */}
      {isScreensaverOpen && (
        <div className="fixed inset-0 z-50 bg-black">
          <Graphy initialScreensaver={true} onCloseScreensaver={() => setIsScreensaverOpen(false)} />
        </div>
      )}
    </div>
  );
}
