import React, { useState, useEffect, useRef } from 'react';
import { JulesCodeCheck } from '../components/JulesCodeCheck';
import { GitPanel } from '../components/GitPanel';
import { LaunchPanel } from '../components/LaunchPanel';
import Editor from '@monaco-editor/react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Files, GitBranch, Rocket, Palette } from 'lucide-react';
import 'xterm/css/xterm.css';

const TERMINAL_THEMES = {
  opus: { background: '#111827', foreground: '#e8f0ff', cursor: '#00d4ff', selectionBackground: '#00d4ff40' },
  hacker: { background: '#050505', foreground: '#00ff00', cursor: '#00ff00', selectionBackground: '#00ff0040' },
  monokai: { background: '#272822', foreground: '#f8f8f2', cursor: '#f8f8f0', selectionBackground: '#49483e' },
  dracula: { background: '#282a36', foreground: '#f8f8f2', cursor: '#ff79c6', selectionBackground: '#44475a' },
  powershell: { background: '#012456', foreground: '#ffffff', cursor: '#ffffff', selectionBackground: '#ffffff40' },
  solarized: { background: '#002b36', foreground: '#839496', cursor: '#93a1a1', selectionBackground: '#073642' },
  gruvbox: { background: '#282828', foreground: '#ebdbb2', cursor: '#ebdbb2', selectionBackground: '#504945' }
};

export default function CodeMode() {
  const [code, setCode] = useState("function hello() {\n  console.log('world');\n}");
  const [showCheck, setShowCheck] = useState(true);
  const [files, setFiles] = useState<{name: string, isDirectory: boolean}[]>([]);
  const [activeTab, setActiveTab] = useState<'files' | 'git' | 'launch'>('files');
  const [activeTheme, setActiveTheme] = useState<keyof typeof TERMINAL_THEMES>('opus');
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (window.opuspawclaw) {
      window.opuspawclaw.listDir('.').then(setFiles).catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (terminalRef.current && window.opuspawclaw && !xtermRef.current) {
      const term = new Terminal({
        theme: TERMINAL_THEMES[activeTheme],
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 13,
        cursorBlink: true,
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();
      xtermRef.current = term;

      window.opuspawclaw.spawnTerminal();

      term.onData(data => {
        window.opuspawclaw.writeToTerminal(data);
      });

      window.opuspawclaw.onTerminalData((data: string) => {
        term.write(data);
      });

      const handleResize = () => fitAddon.fit();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        term.dispose();
        xtermRef.current = null;
        window.opuspawclaw.killTerminal();
      };
    }
  }, []); // Run once on mount

  // Update theme dynamically without recreating terminal
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = TERMINAL_THEMES[activeTheme];
    }
  }, [activeTheme]);

  const loadFile = async (name: string) => {
    if (window.opuspawclaw) {
      const content = await window.opuspawclaw.readFile(name);
      setCode(content);
    }
  };

  const executeCommand = (cmd: string) => {
    if (window.opuspawclaw) {
      window.opuspawclaw.writeToTerminal(cmd);
    } else if (xtermRef.current) {
      // Fallback visual feedback if offline
      xtermRef.current.write(`\r\n$ ${cmd.replace('\r', '')}\r\nCommand not executed: Terminal integration disabled in preview.\r\n`);
    }
  };

  return (
    <div className="flex h-full bg-[#0a0f1a] text-[#e8f0ff] overflow-hidden">
      {/* Side Tool Pane */}
      <div className="w-72 border-r border-[#2a3a52] bg-[#111827] flex flex-col overflow-hidden">
        {/* Tab Switcher */}
        <div className="flex border-b border-[#2a3a52]">
          <button 
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${activeTab === 'files' ? 'text-[#00d4ff] bg-[#1a2332] border-b-2 border-[#00d4ff]' : 'text-[#6b82a6] hover:text-[#e8f0ff] hover:bg-[#1a2332]'}`}
          >
            <Files size={14} /> <span className="hidden sm:inline">Files</span>
          </button>
          <button 
            onClick={() => setActiveTab('git')}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${activeTab === 'git' ? 'text-[#00d4ff] bg-[#1a2332] border-b-2 border-[#00d4ff]' : 'text-[#6b82a6] hover:text-[#e8f0ff] hover:bg-[#1a2332]'}`}
          >
            <GitBranch size={14} /> <span className="hidden sm:inline">Git</span>
          </button>
          <button 
            onClick={() => setActiveTab('launch')}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${activeTab === 'launch' ? 'text-[#e040fb] bg-[#1a2332] border-b-2 border-[#e040fb]' : 'text-[#6b82a6] hover:text-[#e8f0ff] hover:bg-[#1a2332]'}`}
          >
            <Rocket size={14} /> <span className="hidden sm:inline">Launch</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'files' && (
            <div className="p-2 overflow-y-auto custom-scrollbar flex-1">
              <div className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-3 px-2 mt-2">Workspace Files</div>
              {files.length > 0 ? files.map((f, i) => (
                <div 
                  key={i} 
                  onClick={() => !f.isDirectory && loadFile(f.name)}
                  className={`text-sm hover:bg-[#2a3a52] px-2 py-1.5 rounded-md cursor-pointer flex items-center gap-2 transition-colors ${f.isDirectory ? 'text-[#6b82a6]' : 'text-[#e8f0ff]'}`}
                >
                  <span className="opacity-70 text-xs">{f.isDirectory ? '📁' : '📄'}</span>
                  <span className="truncate">{f.name}</span>
                </div>
              )) : (
                <div className="text-sm text-[#6b82a6] px-2 italic">No files found.</div>
              )}
            </div>
          )}
          {activeTab === 'git' && <GitPanel />}
          {activeTab === 'launch' && <LaunchPanel onExecute={executeCommand} />}
        </div>
      </div>
      
      {/* Editor Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        <div className="flex-1 relative">
          <Editor
            height="100%"
            defaultLanguage="typescript"
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{ 
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              padding: { top: 16 }
            }}
          />
        </div>
        
        {/* Terminal / Output */}
        <div className="h-56 flex flex-col border-t border-[#2a3a52]">
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: TERMINAL_THEMES[activeTheme].background }}>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TERMINAL_THEMES[activeTheme].cursor }}>Integrated Terminal</span>
            <div className="flex items-center gap-2">
              <Palette size={12} className="text-[#6b82a6]" />
              <select 
                value={activeTheme}
                onChange={(e) => setActiveTheme(e.target.value as any)}
                className="bg-transparent border-none text-[10px] text-[#6b82a6] font-bold uppercase tracking-widest outline-none cursor-pointer focus:ring-0"
              >
                <option value="opus" className="bg-[#111827]">Opus Default</option>
                <option value="hacker" className="bg-[#111827]">Hacker Green</option>
                <option value="monokai" className="bg-[#111827]">Monokai</option>
                <option value="dracula" className="bg-[#111827]">Dracula</option>
                <option value="powershell" className="bg-[#111827]">PowerShell</option>
                <option value="solarized" className="bg-[#111827]">Solarized Dark</option>
                <option value="gruvbox" className="bg-[#111827]">Gruvbox Dark</option>
              </select>
            </div>
          </div>
          
          {/* Terminal Body */}
          <div className="flex-1 p-2 pl-4 pb-0 relative" style={{ backgroundColor: TERMINAL_THEMES[activeTheme].background }}>
            <div ref={terminalRef} className="absolute inset-0 pl-4 py-2" />
          </div>
        </div>

        {/* Jules Code Check Integration */}
        {showCheck && (
          <div className="absolute bottom-60 right-6 w-96 z-10 pointer-events-none">
            <div className="pointer-events-auto">
              <JulesCodeCheck 
                code={code}
                onApprove={() => console.log('Code approved')}
                onFail={(feedback) => console.log('Code failed:', feedback)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
