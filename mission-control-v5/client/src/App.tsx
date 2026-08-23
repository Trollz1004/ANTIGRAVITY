import { useCallback, useEffect, useRef, useState } from 'react';
import { api, subscribeEvents } from './api';
import AgentLibrary from './components/AgentLibrary';
import BrainPanel from './components/BrainPanel';
import BrowserPanel from './components/BrowserPanel';
import BridgePanel from './components/BridgePanel';
import CouncilPanel from './components/CouncilPanel';
import ControlCenter from './components/ControlCenter';
import DateAppPanel from './components/DateAppPanel';
import PreviewPanel from './components/PreviewPanel';
import PaperMatesPanel from './components/PaperMatesPanel';
import Header from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import ServicesPanel from './components/ServicesPanel';
import SupportPanel from './components/SupportPanel';
import SwarmEngine from './components/SwarmEngine';
import Graphy from './components/Graphy';
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
  const isElectron = typeof window !== 'undefined' && !!window.mcElectron;

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

  const runningCount = tasks.filter((t) => t.status === 'running' || t.status === 'queued').length;

  return (
    <div className={`app${isElectron ? ' app--electron' : ''}`}>
      <div className="app__dashboard">
        <Header tab={tab} onTab={setTab} health={health} runningCount={runningCount} selectedCount={selected.size} />
        <main className="main">
          {tab === 'control' && <ControlCenter health={health} tasks={tasks} onNavigate={setTab} />}
          {tab === 'papermates' && <PaperMatesPanel onNavigate={setTab} />}
          {tab === 'graphy' && <Graphy />}
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
          {tab === 'dateapp' && <DateAppPanel />}
          {tab === 'support' && <SupportPanel />}
          {tab === 'preview' && <PreviewPanel />}
        </main>
        <footer className="footer">
          <span>
            MISSION CONTROL v{health?.version ?? '5.0.0'} — {health?.edition ?? 'HAIKU-SONNET 3.5 EDITION'}
          </span>
          <span>
            OMNIROUTE: {health?.routerLive ? 'LIVE' : 'OFFLINE'} · TASKS: {tasks.length} · REAL OUTPUT ONLY — NO
            SIMULATED DATA
          </span>
        </footer>
      </div>
      {isElectron && <BrowserPanel />}
    </div>
  );
}
