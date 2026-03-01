import React, { useState } from 'react';
import { LayoutDashboard, Bot, Globe, Brain, Settings as SettingsIcon, CreditCard, Pen, Palette, MessageSquare, Megaphone, Crown } from 'lucide-react';
import { View, Agent, ContentDraft, ResearchItem, MediaTrack } from './types';
import { REAL_AGENTS, RESEARCH_ITEMS } from './constants';
import Dashboard from './components/Dashboard';
import AgentMonitor from './components/AgentMonitor';
import BrowserView from './components/BrowserView';
import ResearchHub from './components/ResearchHub';
import SettingsView from './components/Settings';
import PaymentLinks from './components/PaymentLinks';
import ContentStudio from './components/ContentStudio';
import CreativeStudio from './components/CreativeStudio';
import ChatCommander from './components/ChatCommander';
import MediaPlayer from './components/MediaPlayer';
import AdsManager from './components/AdsManager';
import RoyaltyDeck from './components/RoyaltyDeck';

const NAV_ITEMS = [
  { view: View.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
  { view: View.HIVE, icon: Bot, label: 'Agent Hive' },
  { view: View.BROWSER, icon: Globe, label: 'Browser' },
  { view: View.INTELLIGENCE, icon: Brain, label: 'Intelligence' },
  { view: View.ADS, icon: Megaphone, label: 'Ads' },
  { view: View.ROYALTY, icon: Crown, label: 'Royalty Deck' },
  { view: View.SETTINGS, icon: SettingsIcon, label: 'Settings' },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [agents, setAgents] = useState<Agent[]>(REAL_AGENTS);
  const [research, setResearch] = useState<ResearchItem[]>(RESEARCH_ITEMS);
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [showPayments, setShowPayments] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showCreative, setShowCreative] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MediaTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerMinimized, setPlayerMinimized] = useState(false);

  const renderView = () => {
    if (showPayments) return <PaymentLinks onNavigate={() => setShowPayments(false)} />;
    if (showContent) return <ContentStudio drafts={drafts} setDrafts={setDrafts} />;
    if (showCreative) return <CreativeStudio />;

    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard agents={agents} />;
      case View.HIVE:
        return <AgentMonitor agents={agents} setAgents={setAgents} />;
      case View.BROWSER:
        return <BrowserView />;
      case View.INTELLIGENCE:
        return <ResearchHub items={research} setItems={setResearch} />;
      case View.ADS:
        return <AdsManager />;
      case View.ROYALTY:
        return <RoyaltyDeck />;
      case View.SETTINGS:
        return <SettingsView />;
      default:
        return <Dashboard agents={agents} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100 font-sans">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <h1 className="text-sm font-mono font-bold tracking-wider text-red-400">
            REVENUE COMMAND
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setShowPayments(!showPayments); setShowContent(false); setShowCreative(false); }}
            className={`px-3 py-1 text-xs rounded border ${showPayments ? 'bg-red-500/20 border-red-500 text-red-300' : 'border-slate-700 text-slate-400 hover:text-slate-200'}`}
          >
            <CreditCard className="w-3 h-3 inline mr-1" /> Payments
          </button>
          <button
            onClick={() => { setShowContent(!showContent); setShowPayments(false); setShowCreative(false); }}
            className={`px-3 py-1 text-xs rounded border ${showContent ? 'bg-red-500/20 border-red-500 text-red-300' : 'border-slate-700 text-slate-400 hover:text-slate-200'}`}
          >
            <Pen className="w-3 h-3 inline mr-1" /> Content
          </button>
          <button
            onClick={() => { setShowCreative(!showCreative); setShowPayments(false); setShowContent(false); }}
            className={`px-3 py-1 text-xs rounded border ${showCreative ? 'bg-red-500/20 border-red-500 text-red-300' : 'border-slate-700 text-slate-400 hover:text-slate-200'}`}
          >
            <Palette className="w-3 h-3 inline mr-1" /> Creative
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`px-3 py-1 text-xs rounded border ${showChat ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'border-slate-700 text-slate-400 hover:text-slate-200'}`}
          >
            <MessageSquare className="w-3 h-3 inline mr-1" /> Chat
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-14 flex flex-col items-center py-4 gap-4 border-r border-slate-800 bg-[#0f172a]/60">
          {NAV_ITEMS.map(({ view, icon: Icon, label }) => (
            <button
              key={view}
              onClick={() => { setCurrentView(view); setShowPayments(false); setShowContent(false); setShowCreative(false); }}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                currentView === view && !showPayments && !showContent && !showCreative
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
              title={label}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderView()}
        </main>

        {/* Chat Panel */}
        {showChat && (
          <aside className="w-80 border-l border-slate-800 bg-[#0f172a]/60">
            <ChatCommander />
          </aside>
        )}
      </div>

      {/* Media Player */}
      {currentTrack && (
        <MediaPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onNext={() => {}}
          onPrev={() => {}}
          minimized={playerMinimized}
          onToggleMinimize={() => setPlayerMinimized(!playerMinimized)}
        />
      )}

      {/* Legal Footer */}
      <footer className="px-4 py-2 border-t border-slate-800 bg-[#0f172a]/60 text-center">
        <p className="text-[10px] text-slate-600">
          &copy; 2026 Trash or Treasure Online Recycler LLC &mdash; Revenue Operations Dashboard &mdash; Internal Use
        </p>
      </footer>
    </div>
  );
};

export default App;
