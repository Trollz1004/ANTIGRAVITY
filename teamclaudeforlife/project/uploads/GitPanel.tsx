import React, { useState, useEffect } from 'react';
import { GitBranch, GitCommit, GitPullRequest, ArrowUp, ArrowDown, RefreshCw, FileText, Check, AlertCircle, Sparkles, Plus, Undo2, Github } from 'lucide-react';

export function GitPanel() {
  const [status, setStatus] = useState<any>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [diff, setDiff] = useState<string | null>(null);
  const [showBranchInput, setShowBranchInput] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  const refreshStatus = async () => {
    if (!window.opuspawclaw) return;
    setLoading(true);
    try {
      const s = await window.opuspawclaw.gitStatus();
      setStatus(s);
      
      const b = await window.opuspawclaw.gitBranch();
      setBranches(b.all);
      
      const d = await window.opuspawclaw.gitDiff();
      setDiff(d);
    } catch (err) {
      console.error('Git status error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleCheckout = async (branch: string) => {
    if (!window.opuspawclaw) return;
    setLoading(true);
    try {
      await window.opuspawclaw.gitCheckout(branch);
      await refreshStatus();
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName || !window.opuspawclaw) return;
    setLoading(true);
    try {
      await window.opuspawclaw.gitCreateBranch(newBranchName);
      setNewBranchName('');
      setShowBranchInput(false);
      await refreshStatus();
    } catch (err) {
      console.error('Create branch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageAll = async () => {
    if (!window.opuspawclaw) return;
    setLoading(true);
    try {
      await window.opuspawclaw.gitStageAll();
      await refreshStatus();
    } catch (err) {
      console.error('Stage all error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage || !window.opuspawclaw) return;
    setLoading(true);
    try {
      await window.opuspawclaw.gitCommit(commitMessage);
      setCommitMessage('');
      await refreshStatus();
    } catch (err) {
      console.error('Commit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    if (!window.opuspawclaw) return;
    setLoading(true);
    try {
      await window.opuspawclaw.gitPush();
      await refreshStatus();
    } catch (err) {
      console.error('Push error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    if (!window.opuspawclaw) return;
    setLoading(true);
    try {
      await window.opuspawclaw.gitPull();
      await refreshStatus();
    } catch (err) {
      console.error('Pull error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!status) return (
    <div className="p-4 text-[#6b82a6] text-xs flex flex-col items-center gap-2">
      <RefreshCw className="animate-spin" size={16} />
      Scanning for repository...
    </div>
  );

  const changedFiles = [
    ...status.modified.map((f: string) => ({ name: f, status: 'modified' })),
    ...status.not_added.map((f: string) => ({ name: f, status: 'new' })),
    ...status.deleted.map((f: string) => ({ name: f, status: 'deleted' })),
  ];

  return (
    <div className="flex flex-col h-full bg-[#111827] text-[#e8f0ff]">
      <div className="p-4 border-b border-[#2a3a52] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch size={16} className="text-[#00d4ff]" />
            <select 
              value={status.current}
              onChange={(e) => handleCheckout(e.target.value)}
              disabled={loading}
              className="bg-transparent text-xs font-bold uppercase tracking-wider text-[#00d4ff] outline-none cursor-pointer border-none focus:ring-0 max-w-[120px] truncate"
            >
              {branches.map(b => (
                <option key={b} value={b} className="bg-[#111827] text-[#e8f0ff]">{b}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowBranchInput(!showBranchInput)}
              disabled={loading}
              className={`p-1.5 rounded transition-colors ${showBranchInput ? 'bg-[#00e676]/20 text-[#00e676]' : 'hover:bg-[#1a2332] text-[#6b82a6] hover:text-[#00e676]'}`}
              title="New Branch"
            >
              <Plus size={14} />
            </button>
            <button 
              onClick={refreshStatus} 
              disabled={loading}
              className="p-1.5 hover:bg-[#1a2332] rounded transition-colors text-[#6b82a6] hover:text-[#00d4ff]"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        
        {showBranchInput && (
          <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
            <input 
              type="text"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="Branch name..."
              className="flex-1 bg-[#0a0f1a] border border-[#2a3a52] rounded px-2 py-1 text-xs text-[#e8f0ff] focus:border-[#00e676] focus:ring-1 focus:ring-[#00e676]/20 outline-none transition-all placeholder:text-[#4a5568]"
            />
            <button 
              onClick={handleCreateBranch}
              disabled={!newBranchName || loading}
              className="p-1.5 bg-[#00e676] hover:bg-[#00c853] disabled:opacity-30 text-[#0a0f1a] rounded transition-colors"
            >
              <Check size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
        {/* Changes List */}
        <div>
          <div className="px-2 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Changes ({changedFiles.length})</span>
            <button 
              onClick={handleStageAll}
              disabled={loading || changedFiles.length === 0}
              className="text-[9px] font-bold text-[#6b82a6] hover:text-[#00d4ff] disabled:opacity-50 disabled:hover:text-[#6b82a6] uppercase tracking-widest flex items-center gap-1 transition-colors"
            >
               Stage All
            </button>
          </div>
          <div className="space-y-1">
            {changedFiles.map((file, i) => (
              <div key={i} className="group flex items-center gap-2 px-2 py-1.5 hover:bg-[#1a2332] rounded-md text-xs transition-colors cursor-pointer border border-transparent hover:border-[#2a3a52]">
                <FileText size={12} className={file.status === 'new' ? 'text-[#00e676]' : file.status === 'deleted' ? 'text-red-400' : 'text-yellow-400'} />
                <span className="flex-1 truncate text-[#6b82a6] group-hover:text-[#e8f0ff]">{file.name}</span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-[#4a5568] mr-2">{file.status[0]}</span>
                
                {/* Inline Code Actions */}
                <div className="hidden group-hover:flex items-center gap-1">
                  <button className="p-1 hover:bg-[#00d4ff]/10 hover:text-[#00d4ff] text-[#6b82a6] rounded" title="Stage File">
                    <Plus size={12} />
                  </button>
                  <button className="p-1 hover:bg-red-400/10 hover:text-red-400 text-[#6b82a6] rounded" title="Revert Changes">
                    <Undo2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            {changedFiles.length === 0 && (
              <div className="px-2 py-4 text-[10px] text-[#4a5568] text-center italic">
                Your workspace is clean
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Diff View with Code Actions */}
        {diff && diff.trim().length > 0 && (
          <div className="px-2 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Diff Preview</span>
              <button 
                title="Integrates with Ollama GitHub Copilot"
                className="text-[#00e676] hover:text-[#0a0f1a] px-2 py-1 bg-[#00e676]/10 hover:bg-[#00e676] rounded border border-[#00e676]/20 flex items-center gap-1.5 transition-colors text-[9px] font-bold uppercase tracking-widest"
              >
                <Github size={10} /> Copilot Diff
              </button>
            </div>
            
            <div className="text-[10px] font-mono bg-[#0a0f1a] rounded-lg border border-[#2a3a52] overflow-x-auto max-h-[300px] custom-scrollbar flex flex-col shadow-inner">
              {diff.split('\n').slice(0, 150).map((line, idx) => {
                let lineClass = 'text-[#6b82a6] px-3 py-0.5 whitespace-pre';
                
                if (line.startsWith('+') && !line.startsWith('+++')) {
                  lineClass = 'bg-[#00e676]/10 text-[#00e676] px-3 py-0.5 whitespace-pre border-l-2 border-[#00e676]';
                } else if (line.startsWith('-') && !line.startsWith('---')) {
                  lineClass = 'bg-red-500/10 text-red-400 px-3 py-0.5 whitespace-pre border-l-2 border-red-500';
                } else if (line.startsWith('@@')) {
                  lineClass = 'bg-[#00d4ff]/10 text-[#00d4ff] px-3 py-1.5 font-bold mt-2 whitespace-pre border-y border-[#00d4ff]/20';
                } else if (line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('---') || line.startsWith('+++')) {
                  lineClass = 'text-[#4a5568] px-3 py-0.5 whitespace-pre font-bold';
                }

                return (
                  <div key={idx} className={`flex ${lineClass}`}>
                    <span className="flex-1">{line || ' '}</span>
                  </div>
                );
              })}
              {diff.split('\n').length > 150 && (
                <div className="text-[#4a5568] px-3 py-2 text-center border-t border-[#2a3a52] bg-[#111827]">
                  ... truncated for preview ...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Git Actions Footer */}
      <div className="p-3 border-t border-[#2a3a52] bg-[#0a0f1a] space-y-3 z-10 relative">
        <div className="space-y-2">
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message..."
            className="w-full h-16 bg-[#111827] border border-[#2a3a52] rounded-lg p-2.5 text-xs text-[#e8f0ff] focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/20 outline-none transition-all placeholder:text-[#4a5568] resize-none"
          />
          <button
            onClick={handleCommit}
            disabled={loading || !commitMessage || changedFiles.length === 0}
            className="w-full bg-[#00d4ff] hover:bg-[#00b8e6] disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed text-[#0a0f1a] py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,212,255,0.2)] hover:scale-[1.02] active:scale-95"
          >
            <GitCommit size={16} /> Commit
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handlePush}
            disabled={loading}
            className="group flex items-center justify-center gap-2 p-2 bg-[#1a2332] hover:bg-[#2a3a52] text-[#6b82a6] hover:text-[#00d4ff] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-[#2a3a52]"
          >
            <ArrowUp size={14} className="group-hover:-translate-y-0.5 transition-transform" /> Push
          </button>
          <button 
            onClick={handlePull}
            disabled={loading}
            className="group flex items-center justify-center gap-2 p-2 bg-[#1a2332] hover:bg-[#2a3a52] text-[#6b82a6] hover:text-[#00d4ff] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-[#2a3a52]"
          >
            <ArrowDown size={14} className="group-hover:translate-y-0.5 transition-transform" /> Pull
          </button>
        </div>
      </div>
    </div>
  );
}
