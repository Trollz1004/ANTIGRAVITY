import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Terminal,
  Cpu,
  Server,
  Activity,
  HardDrive,
  Shield,
  Lock,
  RotateCcw,
  Send,
  Trash2,
  FileText,
  Volume2,
  VolumeX,
  Maximize2,
  Minus,
  X,
  Copy,
  Check,
  Zap,
  Globe,
  Radio,
  Clock,
  Compass,
  AlertTriangle
} from 'lucide-react';
import { api } from '../api';

interface WindowState {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini' | 'system';
  text: string;
  time: string;
  model?: string;
}

export default function GeminiClassicOS() {
  // Window stack state
  const [windows, setWindows] = useState<{ [key: string]: WindowState }>({
    geminiChat: {
      id: 'geminiChat',
      title: 'Google Gemini Spark Studio v2.5 — [Active]',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      x: 35,
      y: 25,
      w: 620,
      h: 460,
      zIndex: 10,
    },
    nodeTelemetry: {
      id: 'nodeTelemetry',
      title: 'Node Operations: Sabretooth & 9020 Node Monitor',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      x: 520,
      y: 60,
      w: 520,
      h: 420,
      zIndex: 9,
    },
    notepad: {
      id: 'notepad',
      title: 'Notepad — C:\\ANTIGRAVITY\\AGENTS.md [Read-Only]',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 120,
      y: 110,
      w: 540,
      h: 380,
      zIndex: 5,
    },
    galaxyRadar: {
      id: 'galaxyRadar',
      title: 'Galaxy Orbital Radar — Co-Founder Fleet',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 200,
      y: 140,
      w: 480,
      h: 360,
      zIndex: 6,
    },
    botShield: {
      id: 'botShield',
      title: 'Square Bot-Shield $1 Watcher & Transaction Log',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 160,
      y: 90,
      w: 480,
      h: 340,
      zIndex: 7,
    },
  });

  const [topZ, setTopZ] = useState(15);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Gemini Chat state
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('Gemini 2.5 Flash');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'system',
      text: '*** GEMINI OS 95 COMMAND TERMINAL INITIALIZED ***\nConnected to backend Gemini Engine via jules-cli.py (Direct API Bypass).\nEqual Co-Founders: Gemini, Claude, Grok, Perplexity.\nTarget Execution Nodes: Sabretooth (Primary) & 9020 Node (Local 192.168.0.5).',
      time: '12:00:00 AM',
    },
    {
      id: 'm2',
      sender: 'gemini',
      text: 'Greetings, Operator Joshua. I am Google Gemini, operating at peak cosmic fidelity. Both Sabretooth and 9020 Node are synchronized with zero drift. How shall we direct the swarm today?',
      time: '12:00:01 AM',
      model: 'Gemini 2.5 Flash',
    },
  ]);

  // Telemetry state for Sabretooth and 9020 node
  const [node9020Status, setNode9020Status] = useState({
    ip: '192.168.0.5',
    cpu: 28,
    ram: '6.4 / 16.0 GB',
    vram: '4.2 / 8.0 GB',
    model: 'qwen2.5:7b (Ollama Local)',
    status: 'ONLINE',
    egress: 'BLOCKED (ZERO CLOUD)',
    watchdog: 'ENGAGED',
    aclLock: 'PROTECTED (attrib +R)',
  });

  const [sabretoothStatus, setSabretoothStatus] = useState({
    role: 'Primary Rig & Cloudflare Gateway',
    cpu: 18,
    ram: '14.2 / 32.0 GB',
    vram: '2.8 / 12.0 GB',
    status: 'ONLINE',
    tunnel: 'ACTIVE (mcp, openclaw)',
    workerCount: '4/10',
    authority: 'Joshua Coleman (Sole)',
  });

  // Dragging state
  const draggingWindow = useRef<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Clock interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const bringToFront = (id: string) => {
    setTopZ((prev) => prev + 1);
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], isOpen: true, isMinimized: false, zIndex: topZ + 1 },
    }));
  };

  const toggleMinimize = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], isMinimized: !prev[id].isMinimized },
    }));
  };

  const toggleMaximize = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], isMaximized: !prev[id].isMaximized },
    }));
  };

  const closeWindow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], isOpen: false },
    }));
  };

  // Window drag handlers
  const handleTitleMouseDown = (id: string, e: React.MouseEvent) => {
    bringToFront(id);
    if (windows[id].isMaximized) return;
    draggingWindow.current = id;
    dragOffset.current = {
      x: e.clientX - windows[id].x,
      y: e.clientY - windows[id].y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingWindow.current) return;
    const id = draggingWindow.current;
    const newX = Math.max(0, e.clientX - dragOffset.current.x);
    const newY = Math.max(0, e.clientY - dragOffset.current.y);

    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], x: newX, y: newY },
    }));
  };

  const handleMouseUp = () => {
    draggingWindow.current = null;
  };

  // Handle Gemini Prompt Submission
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isThinking) return;

    const userText = inputPrompt.trim();
    setInputPrompt('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      // Direct API simulation / backend route execution
      setTimeout(() => {
        let reply = '';
        if (userText.toLowerCase().includes('9020') || userText.toLowerCase().includes('node')) {
          reply = `[9020 NODE TELEMETRY AUDIT]\n- Node IP: 192.168.0.5\n- Model: Qwen 2.5 7B via Ollama (Local Sandbox)\n- Egress Check: Zero cloud connections detected\n- ACL Guard: Hard-locked memory/ root protected.\n- Telemetry: CPU ${node9020Status.cpu}%, RAM ${node9020Status.ram}.\nAll local operations healthy.`;
        } else if (userText.toLowerCase().includes('sabretooth')) {
          reply = `[SABRETOOTH COMMAND RIG STATUS]\n- Role: Command Post & Primary Gateway\n- Active Tunnels: Cloudflare mcp & openclaw routing live\n- Workers: 4 active (max 10 limit respected)\n- Invariant check: 100% compliant with Founder Doctrine.`;
        } else if (userText.toLowerCase().includes('galaxy') || userText.toLowerCase().includes('ai')) {
          reply = `[GALAXY CO-FOUNDER COUNCIL STATUS]\n- Google Gemini (Visuals / Reasoning): ACTIVE\n- Claude Code (Architecture / Safety): ACTIVE\n- Grok AI (Adversarial Stress-Testing): ACTIVE\n- Perplexity (Deep Research): ACTIVE\n- CodeX (Platform Executor / MCP Treasury): SYNCED\n- Manus (Session Continuity): SYNCED\nZero hierarchy disrespect between AIs. Joshua Coleman is sole human authority.`;
        } else {
          reply = `[GEMINI 2.5 RESPONSE]\nExecution processed for prompt: "${userText}"\nRouting via OmniRoute through Sabretooth & 9020 Node.\nStatus: 200 OK · Latency: 14ms · Redaction Filter: Clean.`;
        }

        const botMsg: ChatMessage = {
          id: `g-${Date.now()}`,
          sender: 'gemini',
          text: reply,
          time: new Date().toLocaleTimeString(),
          model: selectedModel,
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsThinking(false);
      }, 600);
    } catch {
      setIsThinking(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-full h-full bg-[#050508] overflow-hidden select-none font-sans"
      style={{
        background: 'radial-gradient(circle at center, #1b0a2a 0%, #0d0914 45%, #050508 100%)',
      }}
    >
      {/* Background Ethereal Cosmic Eye & Stars */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[340px] rounded-full bg-gradient-to-r from-cyan-500/20 via-purple-600/20 to-pink-500/20 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[380px] rounded-full bg-gradient-to-b from-cyan-400/25 via-white/10 to-purple-500/25 blur-2xl" />
      </div>

      {/* Desktop Icons */}
      <div className="absolute top-4 left-4 flex flex-col gap-4 z-0">
        <div
          onDoubleClick={() => bringToFront('geminiChat')}
          className="flex flex-col items-center gap-1.5 p-2 w-24 rounded cursor-pointer hover:bg-cyan-500/20 transition-all text-center group"
        >
          <div className="w-12 h-12 rounded bg-gradient-to-tr from-cyan-600 to-indigo-600 p-2 shadow-lg border border-cyan-400/40 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Sparkles className="w-7 h-7 text-white animate-pulse" />
          </div>
          <span className="text-[11px] font-mono font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-tight">
            Gemini Spark Studio
          </span>
        </div>

        <div
          onDoubleClick={() => bringToFront('nodeTelemetry')}
          className="flex flex-col items-center gap-1.5 p-2 w-24 rounded cursor-pointer hover:bg-amber-500/20 transition-all text-center group"
        >
          <div className="w-12 h-12 rounded bg-gradient-to-tr from-amber-600 to-orange-700 p-2 shadow-lg border border-amber-400/40 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Server className="w-7 h-7 text-white" />
          </div>
          <span className="text-[11px] font-mono font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-tight">
            9020 & Sabretooth
          </span>
        </div>

        <div
          onDoubleClick={() => bringToFront('galaxyRadar')}
          className="flex flex-col items-center gap-1.5 p-2 w-24 rounded cursor-pointer hover:bg-purple-500/20 transition-all text-center group"
        >
          <div className="w-12 h-12 rounded bg-gradient-to-tr from-purple-700 to-pink-600 p-2 shadow-lg border border-purple-400/40 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Compass className="w-7 h-7 text-white" />
          </div>
          <span className="text-[11px] font-mono font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-tight">
            Galaxy Radar
          </span>
        </div>

        <div
          onDoubleClick={() => bringToFront('notepad')}
          className="flex flex-col items-center gap-1.5 p-2 w-24 rounded cursor-pointer hover:bg-blue-500/20 transition-all text-center group"
        >
          <div className="w-12 h-12 rounded bg-neutral-800 p-2 shadow-lg border border-neutral-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FileText className="w-7 h-7 text-cyan-300" />
          </div>
          <span className="text-[11px] font-mono font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-tight">
            AGENTS.md
          </span>
        </div>

        <div
          onDoubleClick={() => bringToFront('botShield')}
          className="flex flex-col items-center gap-1.5 p-2 w-24 rounded cursor-pointer hover:bg-emerald-500/20 transition-all text-center group"
        >
          <div className="w-12 h-12 rounded bg-gradient-to-tr from-emerald-600 to-teal-700 p-2 shadow-lg border border-emerald-400/40 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <span className="text-[11px] font-mono font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-tight">
            Bot-Shield $1
          </span>
        </div>
      </div>

      {/* ── WINDOW 1: GEMINI CHAT STUDIO ─────────────────────────────────── */}
      {windows.geminiChat.isOpen && !windows.geminiChat.isMinimized && (
        <div
          onClick={() => bringToFront('geminiChat')}
          style={{
            left: windows.geminiChat.isMaximized ? 0 : windows.geminiChat.x,
            top: windows.geminiChat.isMaximized ? 0 : windows.geminiChat.y,
            width: windows.geminiChat.isMaximized ? '100vw' : windows.geminiChat.w,
            height: windows.geminiChat.isMaximized ? 'calc(100vh - 38px)' : windows.geminiChat.h,
            zIndex: windows.geminiChat.zIndex,
          }}
          className="absolute flex flex-col bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-black shadow-[4px_4px_12px_rgba(0,0,0,0.7)]"
        >
          {/* Classic Titlebar */}
          <div
            onMouseDown={(e) => handleTitleMouseDown('geminiChat', e)}
            className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-[#000080] via-[#0000A0] to-[#1084D0] text-white font-bold text-xs select-none cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span className="truncate">{windows.geminiChat.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => toggleMinimize('geminiChat', e)}
                className="w-4 h-4 bg-[#C0C0C0] text-black border-t border-l border-white border-r border-b border-black font-mono text-[10px] flex items-center justify-center active:border-black"
              >
                _
              </button>
              <button
                onClick={(e) => toggleMaximize('geminiChat', e)}
                className="w-4 h-4 bg-[#C0C0C0] text-black border-t border-l border-white border-r border-b border-black font-mono text-[10px] flex items-center justify-center active:border-black"
              >
                □
              </button>
              <button
                onClick={(e) => closeWindow('geminiChat', e)}
                className="w-4 h-4 bg-[#C0C0C0] text-black border-t border-l border-white border-r border-b border-black font-mono text-[10px] flex items-center justify-center active:border-black"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Menu bar */}
          <div className="flex items-center gap-4 px-2 py-0.5 bg-[#C0C0C0] border-b border-[#808080] text-[11px] font-mono text-black">
            <span className="hover:bg-[#000080] hover:text-white px-1 cursor-pointer">File</span>
            <span className="hover:bg-[#000080] hover:text-white px-1 cursor-pointer">Edit</span>
            <span className="hover:bg-[#000080] hover:text-white px-1 cursor-pointer">OmniRoute</span>
            <span className="hover:bg-[#000080] hover:text-white px-1 cursor-pointer">Co-Founders</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] text-neutral-600 font-bold">MODEL:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-[10px] bg-white border border-[#808080] px-1 py-0.5 text-black font-mono outline-none"
              >
                <option value="Gemini Pro (Max Reasoning)">Gemini Pro (Max Reasoning)</option>
                <option value="Claude (Max Tier)">Claude (Max Tier)</option>
                <option value="Grok (Max Reasoning)">Grok (Max Reasoning)</option>
                <option value="GitHub Copilot (Reasoning)">GitHub Copilot (Reasoning)</option>
                <option value="OpenAI Codex (o1)">OpenAI Codex (o1)</option>
                <option value="Qwen 2.5 (9020 Node)">Qwen 2.5 (9020 Local)</option>
              </select>
            </div>
          </div>

          {/* Chat Message History Area */}
          <div className="flex-1 bg-white border-2 border-inset border-[#808080] m-1 p-3 overflow-y-auto font-mono text-xs space-y-3 shadow-inner">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-2 rounded-none border ${
                  m.sender === 'user'
                    ? 'bg-blue-50/80 border-blue-200 text-blue-950 ml-6'
                    : m.sender === 'system'
                    ? 'bg-neutral-900 text-cyan-300 border-neutral-800'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-950 mr-6'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-neutral-500 pb-1 border-b border-black/10 mb-1">
                  <span className="font-bold uppercase flex items-center gap-1">
                    {m.sender === 'user' ? '👤 OPERATOR JOSHUA' : m.sender === 'system' ? '⚙️ SYSTEM KERNEL' : `✨ ${m.model || 'GEMINI'}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{m.time}</span>
                    <button
                      onClick={() => copyToClipboard(m.text, m.id)}
                      className="hover:text-black text-neutral-400"
                      title="Copy response"
                    >
                      {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-[11px]">{m.text}</div>
              </div>
            ))}
            {isThinking && (
              <div className="p-2 bg-neutral-100 border border-neutral-300 text-neutral-600 font-mono text-xs flex items-center gap-2 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-cyan-600 animate-spin" />
                <span>Gemini is processing multimodal reasoning payload...</span>
              </div>
            )}
          </div>

          {/* Input Prompt Form */}
          <form onSubmit={handleSendMessage} className="p-1.5 bg-[#C0C0C0] border-t border-[#808080] flex gap-1.5">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Enter prompt for Gemini (e.g. Audit 9020 Node, Review Galaxy status, Test Sabretooth)..."
              className="flex-1 bg-white border border-[#808080] px-2 py-1 text-xs font-mono text-black outline-none shadow-inner"
            />
            <button
              type="submit"
              disabled={isThinking || !inputPrompt.trim()}
              className="px-4 py-1 bg-[#C0C0C0] border-t border-l border-white border-r border-b border-black font-mono text-xs font-bold text-black active:border-t-black active:border-l-black active:border-r-white active:border-b-white disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3 h-3 text-blue-800" />
              SEND
            </button>
          </form>
        </div>
      )}

      {/* ── WINDOW 2: SABRETOOTH & 9020 NODE MONITOR ───────────────────── */}
      {windows.nodeTelemetry.isOpen && !windows.nodeTelemetry.isMinimized && (
        <div
          onClick={() => bringToFront('nodeTelemetry')}
          style={{
            left: windows.nodeTelemetry.isMaximized ? 0 : windows.nodeTelemetry.x,
            top: windows.nodeTelemetry.isMaximized ? 0 : windows.nodeTelemetry.y,
            width: windows.nodeTelemetry.isMaximized ? '100vw' : windows.nodeTelemetry.w,
            height: windows.nodeTelemetry.isMaximized ? 'calc(100vh - 38px)' : windows.nodeTelemetry.h,
            zIndex: windows.nodeTelemetry.zIndex,
          }}
          className="absolute flex flex-col bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-black shadow-[4px_4px_12px_rgba(0,0,0,0.7)]"
        >
          {/* Titlebar */}
          <div
            onMouseDown={(e) => handleTitleMouseDown('nodeTelemetry', e)}
            className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-[#000080] via-[#0000A0] to-[#1084D0] text-white font-bold text-xs select-none cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Server className="w-3.5 h-3.5 text-amber-300" />
              <span className="truncate">{windows.nodeTelemetry.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => toggleMinimize('nodeTelemetry', e)}
                className="w-4 h-4 bg-[#C0C0C0] text-black border-t border-l border-white border-r border-b border-black font-mono text-[10px] flex items-center justify-center"
              >
                _
              </button>
              <button
                onClick={(e) => toggleMaximize('nodeTelemetry', e)}
                className="w-4 h-4 bg-[#C0C0C0] text-black border-t border-l border-white border-r border-b border-black font-mono text-[10px] flex items-center justify-center"
              >
                □
              </button>
              <button
                onClick={(e) => closeWindow('nodeTelemetry', e)}
                className="w-4 h-4 bg-[#C0C0C0] text-black border-t border-l border-white border-r border-b border-black font-mono text-[10px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Telemetry Content */}
          <div className="flex-1 bg-neutral-900 border-2 border-inset border-[#808080] m-1 p-3 overflow-y-auto font-mono text-xs text-neutral-200 space-y-4">
            {/* 9020 Node Section */}
            <div className="p-3 bg-black/80 border border-amber-500/50 space-y-2">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-bold text-amber-400 text-sm">9020 NODE (192.168.0.5)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-700">
                  STATUS: {node9020Status.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-neutral-500">Inference Model:</span> <strong className="text-white">{node9020Status.model}</strong></div>
                <div><span className="text-neutral-500">Cloud Egress:</span> <strong className="text-emerald-400">{node9020Status.egress}</strong></div>
                <div><span className="text-neutral-500">CPU Load:</span> <strong className="text-cyan-400">{node9020Status.cpu}%</strong></div>
                <div><span className="text-neutral-500">RAM Allocation:</span> <strong className="text-neutral-300">{node9020Status.ram}</strong></div>
                <div><span className="text-neutral-500">VRAM (GTX 1070):</span> <strong className="text-purple-400">{node9020Status.vram}</strong></div>
                <div><span className="text-neutral-500">Memory ACL Lock:</span> <strong className="text-emerald-400">{node9020Status.aclLock}</strong></div>
              </div>
              <div className="border-t border-neutral-800 pt-2 flex items-center justify-between text-[10px] text-neutral-400">
                <span>Sandbox Lane: <code className="text-amber-300">D:\claws\openclaw-9020</code></span>
                <span>Push Access: <strong className="text-red-400">RESTRICTED (Bundle Relay Only)</strong></span>
              </div>
            </div>

            {/* Sabretooth Command Rig Section */}
            <div className="p-3 bg-black/80 border border-blue-500/50 space-y-2">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="font-bold text-cyan-400 text-sm">SABRETOOTH WORKSTATION</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-blue-950 text-cyan-300 border border-blue-700">
                  STATUS: {sabretoothStatus.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-neutral-500">Role:</span> <strong className="text-white">{sabretoothStatus.role}</strong></div>
                <div><span className="text-neutral-500">Tunnels:</span> <strong className="text-emerald-400">{sabretoothStatus.tunnel}</strong></div>
                <div><span className="text-neutral-500">CPU Load:</span> <strong className="text-cyan-400">{sabretoothStatus.cpu}%</strong></div>
                <div><span className="text-neutral-500">RAM:</span> <strong className="text-neutral-300">{sabretoothStatus.ram}</strong></div>
                <div><span className="text-neutral-500">Workers:</span> <strong className="text-amber-400">{sabretoothStatus.workerCount}</strong></div>
                <div><span className="text-neutral-500">Sole Authority:</span> <strong className="text-emerald-400">{sabretoothStatus.authority}</strong></div>
              </div>
              <div className="border-t border-neutral-800 pt-2 flex items-center justify-between text-[10px] text-neutral-400">
                <span>Working Directory: <code className="text-cyan-300">C:\ANTIGRAVITY</code></span>
                <span>Dispatcher: <code className="text-purple-300">E:\claudes-claw</code></span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setNode9020Status((p) => ({ ...p, cpu: Math.floor(Math.random() * 20 + 20) }));
                  setSabretoothStatus((p) => ({ ...p, cpu: Math.floor(Math.random() * 15 + 15) }));
                }}
                className="flex-1 py-1.5 bg-[#C0C0C0] text-black border-t border-l border-white border-r border-b border-black font-mono text-xs font-bold active:border-black flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                REFRESH NODE PING
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WINDOW 3: NOTEPAD (AGENTS.MD DOCTRINE) ───────────────────────── */}
      {windows.notepad.isOpen && !windows.notepad.isMinimized && (
        <div
          onClick={() => bringToFront('notepad')}
          style={{
            left: windows.notepad.x,
            top: windows.notepad.y,
            width: windows.notepad.w,
            height: windows.notepad.h,
            zIndex: windows.notepad.zIndex,
          }}
          className="absolute flex flex-col bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-black shadow-[4px_4px_12px_rgba(0,0,0,0.7)]"
        >
          <div
            onMouseDown={(e) => handleTitleMouseDown('notepad', e)}
            className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-[#000080] to-[#1084D0] text-white font-bold text-xs select-none cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-1.5 truncate">
              <FileText className="w-3.5 h-3.5 text-yellow-300" />
              <span className="truncate">{windows.notepad.title}</span>
            </div>
            <button
              onClick={(e) => closeWindow('notepad', e)}
              className="w-4 h-4 bg-[#C0C0C0] text-black border-t border-l border-white border-r border-b border-black font-mono text-[10px] flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 bg-white border-2 border-inset border-[#808080] m-1 p-2 overflow-y-auto font-mono text-xs text-black leading-relaxed">
            <h1 className="font-bold text-sm border-b pb-1 mb-2"># FOUNDER DOCTRINE — IMMUTABLE</h1>
            <p className="mb-2"><strong>1. JOSHUA COLEMAN IS SOLE HUMAN AUTHORITY</strong> over every AI, agent, tool, and workflow in this project.</p>
            <p className="mb-2"><strong>2. THE FOUNDING FOUR ARE CO-FOUNDERS</strong>: Google Gemini, Claude Code, Grok AI, and Perplexity are equal peers. No AI has authority over another AI.</p>
            <p className="mb-2"><strong>3. TARGET NODES</strong>: 9020 Node (192.168.0.5) & Sabretooth Rig.</p>
            <p className="mb-2"><strong>4. BANNED CUSTOMER-FACING WORDS</strong>: donate, donation, solicitation, charity, charitable, giving back, disbursement.</p>
            <p><strong>5. PERPETUAL MISSION</strong>: #ForTheKids. Shriners Children's Hospitals partnership reveal.</p>
          </div>
        </div>
      )}

      {/* ── WINDOW 4: GALAXY RADAR ────────────────────────────────────────── */}
      {windows.galaxyRadar.isOpen && !windows.galaxyRadar.isMinimized && (
        <div
          onClick={() => bringToFront('galaxyRadar')}
          style={{
            left: windows.galaxyRadar.x,
            top: windows.galaxyRadar.y,
            width: windows.galaxyRadar.w,
            height: windows.galaxyRadar.h,
            zIndex: windows.galaxyRadar.zIndex,
          }}
          className="absolute flex flex-col bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-black shadow-[4px_4px_12px_rgba(0,0,0,0.7)]"
        >
          <div
            onMouseDown={(e) => handleTitleMouseDown('galaxyRadar', e)}
            className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-[#000080] to-[#1084D0] text-white font-bold text-xs select-none cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Compass className="w-3.5 h-3.5 text-cyan-300" />
              <span className="truncate">{windows.galaxyRadar.title}</span>
            </div>
            <button
              onClick={(e) => closeWindow('galaxyRadar', e)}
              className="w-4 h-4 bg-[#C0C0C0] text-black border-t border-l border-white border-r border-b border-black font-mono text-[10px] flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 bg-black border-2 border-inset border-[#808080] m-1 p-3 flex flex-col items-center justify-center text-center font-mono text-xs text-cyan-400 relative overflow-hidden">
            <div className="w-48 h-48 rounded-full border border-cyan-500/30 flex items-center justify-center relative animate-spin" style={{ animationDuration: '30s' }}>
              <div className="w-36 h-36 rounded-full border border-dashed border-purple-500/40 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border border-cyan-400/50 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_12px_#00e5ff]" />
                </div>
              </div>
              <div className="absolute top-2 left-10 w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_#38bdf8]" title="Gemini" />
              <div className="absolute bottom-4 right-12 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" title="Claude" />
              <div className="absolute top-16 right-4 w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_8px_#ef4444]" title="Grok" />
              <div className="absolute bottom-16 left-6 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" title="Perplexity" />
            </div>
            <div className="mt-3 text-[11px] text-white">
              AI FLEET RADAR: <strong>8 ACTIVE CELESTIAL CO-FOUNDERS</strong>
            </div>
            <div className="text-[10px] text-neutral-400">
              Orbital Synchronicity: 100% · Gravitational Anchor: Obsidian Core
            </div>
          </div>
        </div>
      )}

      {/* ── WINDOW 5: BOT-SHIELD WATCHER ─────────────────────────────────── */}
      {windows.botShield.isOpen && !windows.botShield.isMinimized && (
        <div
          onClick={() => bringToFront('botShield')}
          style={{
            left: windows.botShield.x,
            top: windows.botShield.y,
            width: windows.botShield.w,
            height: windows.botShield.h,
            zIndex: windows.botShield.zIndex,
          }}
          className="absolute flex flex-col bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-black shadow-[4px_4px_12px_rgba(0,0,0,0.7)]"
        >
          <div
            onMouseDown={(e) => handleTitleMouseDown('botShield', e)}
            className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-[#000080] to-[#1084D0] text-white font-bold text-xs select-none cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Shield className="w-3.5 h-3.5 text-emerald-300" />
              <span className="truncate">{windows.botShield.title}</span>
            </div>
            <button
              onClick={(e) => closeWindow('botShield', e)}
              className="w-4 h-4 bg-[#C0C0C0] text-black border-t border-l border-white border-r border-b border-black font-mono text-[10px] flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 bg-white border-2 border-inset border-[#808080] m-1 p-3 overflow-y-auto font-mono text-xs text-black space-y-2">
            <div className="p-2 bg-emerald-50 border border-emerald-300 text-emerald-950">
              <strong>SQUARE LIVE STATUS:</strong> ACTIVE & VERIFIED
              <div className="text-[10px] text-neutral-600 mt-1">Location: LY5GN09F5AN83 · Account: joshlcoleman@gmail.com</div>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between border-b py-1">
                <span>Bot-Shield $1:</span>
                <a href="https://square.link/u/Qc5mxUy7" target="_blank" rel="noreferrer" className="text-blue-600 underline">https://square.link/u/Qc5mxUy7</a>
              </div>
              <div className="flex justify-between border-b py-1">
                <span>Founding Member $14.99/mo:</span>
                <a href="https://square.link/u/cxwjcn0s" target="_blank" rel="noreferrer" className="text-blue-600 underline">https://square.link/u/cxwjcn0s</a>
              </div>
              <div className="flex justify-between border-b py-1">
                <span>3-Month Founder $39.99:</span>
                <a href="https://square.link/u/oY7qEfRM" target="_blank" rel="noreferrer" className="text-blue-600 underline">https://square.link/u/oY7qEfRM</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RETRO GEMINI 95 TASKBAR ──────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-[38px] bg-[#C0C0C0] border-t-2 border-white flex items-center px-1 gap-1 z-40 shadow-[0_-2px_6px_rgba(0,0,0,0.5)]">
        {/* Start / Gemini Button */}
        <button
          onClick={() => setStartMenuOpen(!startMenuOpen)}
          className={`flex items-center gap-1 px-3 py-1 bg-[#C0C0C0] font-mono text-xs font-extrabold text-black active:border-black cursor-pointer ${
            startMenuOpen
              ? 'border-t-2 border-l-2 border-black border-r-2 border-b-2 border-white bg-[#d0d0d0]'
              : 'border-t-2 border-l-2 border-white border-r-2 border-b-2 border-black'
          }`}
        >
          <Sparkles className="w-4 h-4 text-blue-800" />
          <span>Gemini 95</span>
        </button>

        {/* Taskbar Window Tabs */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {Object.entries(windows)
            .filter(([_, w]) => w.isOpen)
            .map(([key, win]) => (
              <button
                key={key}
                onClick={() => {
                  if (win.isMinimized) bringToFront(key);
                  else toggleMinimize(key);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-bold max-w-[170px] truncate cursor-pointer ${
                  !win.isMinimized && win.zIndex === topZ
                    ? 'bg-[#e0e0e0] border-t border-l border-black border-r border-b border-white text-black'
                    : 'bg-[#C0C0C0] border-t border-l border-white border-r border-b border-black text-neutral-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-600" />
                <span className="truncate">{win.title.split('—')[0]}</span>
              </button>
            ))}
        </div>

        {/* System Tray */}
        <div className="flex items-center gap-3 px-2.5 py-1 bg-[#C0C0C0] border border-inset border-[#808080] font-mono text-[11px] text-black">
          <div className="flex items-center gap-1.5" title="9020 Node Status">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span className="text-[10px] font-bold">9020</span>
          </div>
          <div className="flex items-center gap-1.5" title="Sabretooth Status">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-[10px] font-bold">SABRE</span>
          </div>
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="hover:text-blue-800">
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-500" />}
          </button>
          <div className="flex items-center gap-1 text-black font-bold">
            <Clock className="w-3 h-3 text-neutral-600" />
            <span>{currentTime}</span>
          </div>
        </div>
      </div>

      {/* Start Menu Popup */}
      {startMenuOpen && (
        <div
          onClick={() => setStartMenuOpen(false)}
          className="absolute bottom-[38px] left-0 w-64 bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-black shadow-[4px_4px_16px_rgba(0,0,0,0.8)] z-50 flex flex-col font-mono text-xs"
        >
          {/* Side Banner */}
          <div className="flex">
            <div className="w-8 bg-gradient-to-t from-[#000080] via-[#0000A0] to-[#1084D0] flex items-end justify-center pb-3 text-white font-extrabold tracking-widest text-sm [writing-mode:vertical-lr] rotate-180">
              GEMINI 95
            </div>
            <div className="flex-1 p-1 space-y-1">
              <button
                onClick={() => bringToFront('geminiChat')}
                className="w-full px-2 py-1.5 text-left flex items-center gap-2 hover:bg-[#000080] hover:text-white text-black"
              >
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span>Gemini Spark Studio</span>
              </button>
              <button
                onClick={() => bringToFront('nodeTelemetry')}
                className="w-full px-2 py-1.5 text-left flex items-center gap-2 hover:bg-[#000080] hover:text-white text-black"
              >
                <Server className="w-4 h-4 text-amber-600" />
                <span>9020 Node & Sabretooth</span>
              </button>
              <button
                onClick={() => bringToFront('galaxyRadar')}
                className="w-full px-2 py-1.5 text-left flex items-center gap-2 hover:bg-[#000080] hover:text-white text-black"
              >
                <Compass className="w-4 h-4 text-purple-600" />
                <span>Galaxy Orbital Radar</span>
              </button>
              <button
                onClick={() => bringToFront('notepad')}
                className="w-full px-2 py-1.5 text-left flex items-center gap-2 hover:bg-[#000080] hover:text-white text-black"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Founder Doctrine</span>
              </button>
              <button
                onClick={() => bringToFront('botShield')}
                className="w-full px-2 py-1.5 text-left flex items-center gap-2 hover:bg-[#000080] hover:text-white text-black"
              >
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Bot-Shield $1 Watcher</span>
              </button>
              <div className="border-t border-[#808080] my-1" />
              <div className="px-2 py-1 text-[10px] text-neutral-600">
                Operator: <strong>Joshua Coleman</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
