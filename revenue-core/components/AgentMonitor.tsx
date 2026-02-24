import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RefreshCcw, 
  Settings, 
  Network, 
  ArrowRight, 
  Activity, 
  Shield, 
  Zap,
  Cpu,
  Link as LinkIcon,
  Search,
  Plus,
  X,
  LayoutGrid,
  Brain,
  AlertCircle
} from 'lucide-react';
import { Agent } from '../types';

interface AgentMonitorProps {
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
}

const AgentMonitor: React.FC<AgentMonitorProps> = ({ agents, setAgents }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingDep, setIsAddingDep] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'graph'>('graph');

  // Graph Layout State
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);

  const selectedAgent = useMemo(() => 
    agents.find(a => a.id === selectedAgentId), 
    [agents, selectedAgentId]
  );

  const upstreamAgents = useMemo(() => 
    selectedAgent?.dependencies?.map(depId => agents.find(a => a.id === depId)).filter(Boolean) as Agent[] || [],
    [selectedAgent, agents]
  );

  const downstreamAgents = useMemo(() => 
    agents.filter(a => a.dependencies?.includes(selectedAgentId || '')),
    [selectedAgentId, agents]
  );

  const availableDependencies = useMemo(() => {
    if (!selectedAgent) return [];
    const currentDeps = selectedAgent.dependencies || [];
    const downstreamIds = agents.filter(a => a.dependencies?.includes(selectedAgent.id)).map(a => a.id);
    return agents.filter(a => 
      a.id !== selectedAgent.id && 
      !currentDeps.includes(a.id) &&
      !downstreamIds.includes(a.id)
    );
  }, [agents, selectedAgent]);

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.task.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Graph Layout Calculation ---
  const graphLayout = useMemo(() => {
    const COL_WIDTH = 300;
    const ROW_HEIGHT = 160;
    const PADDING_TOP = 40;
    const PADDING_LEFT = 40;

    const stages: Record<number, Agent[]> = { 1: [], 2: [], 3: [], 4: [] };
    filteredAgents.forEach(a => {
        if (stages[a.workflowStage]) stages[a.workflowStage].push(a);
    });

    const positions: Record<string, { x: number, y: number }> = {};
    
    Object.entries(stages).forEach(([stageStr, stageAgents]) => {
        const stageNum = parseInt(stageStr);
        stageAgents.forEach((agent, index) => {
            positions[agent.id] = {
                x: (stageNum - 1) * COL_WIDTH + PADDING_LEFT,
                y: index * ROW_HEIGHT + PADDING_TOP
            };
        });
    });

    // Calculate canvas size
    const maxStageCount = Math.max(...Object.values(stages).map(s => s.length));
    const width = 4 * COL_WIDTH;
    const height = Math.max(800, maxStageCount * ROW_HEIGHT + 100);

    return { positions, width, height };
  }, [filteredAgents]);

  // --- Actions ---

  const toggleAgentStatus = (id: string) => {
    setAgents(prev => prev.map(a => 
      a.id === id ? { ...a, status: a.status === 'Paused' ? 'Active' : 'Paused' } : a
    ));
  };

  const updateAgentStage = (id: string, stage: number) => {
    setAgents(prev => prev.map(a => 
      a.id === id ? { ...a, workflowStage: stage } : a
    ));
  };

  const addDependency = (targetId: string) => {
    if (!selectedAgentId) return;
    setAgents(prev => prev.map(a => 
      a.id === selectedAgentId ? { ...a, dependencies: [...(a.dependencies || []), targetId] } : a
    ));
    setIsAddingDep(false);
  };

  const removeDependency = (targetId: string) => {
    if (!selectedAgentId) return;
    setAgents(prev => prev.map(a => 
      a.id === selectedAgentId ? { ...a, dependencies: (a.dependencies || []).filter(d => d !== targetId) } : a
    ));
  };

  const healAgent = (id: string) => {
      setAgents(prev => prev.map(a => 
        a.id === id ? { ...a, health: 100, status: 'Active' } : a
      ));
  };

  // --- Helpers ---

  const getStageColor = (stage: number) => {
    switch(stage) {
      case 1: return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      case 2: return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
      case 3: return 'text-pink-400 border-pink-400/30 bg-pink-400/10';
      case 4: return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
      default: return 'text-slate-400 border-slate-400/30 bg-slate-400/10';
    }
  };

  const getStageName = (stage: number) => {
    switch(stage) {
      case 1: return 'Research';
      case 2: return 'Synthesis';
      case 3: return 'Distribution';
      case 4: return 'Analytics';
      default: return 'Unknown';
    }
  };

  const getHealthColor = (health: number) => {
      if (health > 80) return 'text-emerald-400';
      if (health > 50) return 'text-yellow-400';
      return 'text-rose-500 animate-pulse';
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in">
      {/* Orchestration Header */}
      <div className="bg-surface p-6 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Network className="text-primary" /> Orchestration Dashboard
          </h2>
          <p className="text-slate-400 text-sm">Managing dependencies and workflow pipelines for 50 autonomous agents.</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-slate-900 rounded-lg p-1 flex border border-slate-700 mr-4">
             <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
             >
                <LayoutGrid size={16} /> Grid
             </button>
             <button 
                onClick={() => setViewMode('graph')}
                className={`p-2 rounded flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'graph' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
             >
                <Network size={16} /> Graph
             </button>
           </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">
            <RefreshCcw size={16} /> Global Reset
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
            <Play size={16} /> Resume Pipeline
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Main Visualization Area */}
        <div className="flex-1 bg-surface rounded-xl border border-slate-700 flex flex-col min-w-0 overflow-hidden relative">
          <div className="p-4 border-b border-slate-700 flex items-center gap-4 z-10 bg-surface">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search agent hive..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary"
              />
            </div>
            {viewMode === 'graph' && (
                <div className="flex gap-8 text-xs font-bold text-slate-500 uppercase tracking-widest ml-8">
                    <span className="text-blue-400">01 Research</span>
                    <span className="text-purple-400">02 Synthesis</span>
                    <span className="text-pink-400">03 Distribution</span>
                    <span className="text-emerald-400">04 Analytics</span>
                </div>
            )}
          </div>
          
          <div className="flex-1 overflow-auto bg-[#0f172a] relative scroll-smooth" ref={containerRef}>
            {viewMode === 'grid' ? (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredAgents.map(agent => (
                    <div 
                    key={agent.id}
                    onClick={() => {
                        setSelectedAgentId(agent.id);
                        setIsAddingDep(false);
                    }}
                    className={`
                        p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden
                        ${selectedAgentId === agent.id ? 'border-primary bg-primary/5 ring-1 ring-primary/50' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}
                    `}
                    >
                    {/* Simplified Card Content for Grid */}
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${agent.status === 'Active' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-500'}`} />
                        <span className="text-sm font-bold text-white truncate">{agent.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">#{agent.id.split('-')[1]}</span>
                    </div>
                     <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-slate-400">{agent.role}</span>
                        <div className={`flex items-center gap-1 ${getHealthColor(agent.health)}`}>
                            <Brain size={12} /> {agent.health}%
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                // GRAPH VIEW IMPLEMENTATION
                <div style={{ width: graphLayout.width, height: graphLayout.height }} className="relative">
                    {/* Connections Layer (SVG) */}
                    <svg className="absolute inset-0 pointer-events-none w-full h-full">
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
                            </marker>
                            <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                            </marker>
                        </defs>
                        {filteredAgents.map(agent => 
                            agent.dependencies?.map(depId => {
                                const start = graphLayout.positions[depId];
                                const end = graphLayout.positions[agent.id];
                                if (!start || !end) return null;

                                // Offset for node center approximately (card width ~240, height ~120)
                                const startX = start.x + 220; 
                                const startY = start.y + 60;
                                const endX = end.x;
                                const endY = end.y + 60;

                                const isHighlighted = hoveredAgentId === agent.id || hoveredAgentId === depId || selectedAgentId === agent.id;
                                const color = isHighlighted ? '#6366f1' : '#334155';
                                const opacity = isHighlighted ? 1 : 0.4;
                                const width = isHighlighted ? 2 : 1;

                                return (
                                    <path 
                                        key={`${depId}-${agent.id}`}
                                        d={`M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth={width}
                                        opacity={opacity}
                                        markerEnd={isHighlighted ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                                    />
                                );
                            })
                        )}
                    </svg>

                    {/* Nodes Layer */}
                    {filteredAgents.map(agent => {
                        const pos = graphLayout.positions[agent.id];
                        if (!pos) return null;
                        const isSelected = selectedAgentId === agent.id;
                        const isHovered = hoveredAgentId === agent.id;

                        return (
                            <div
                                key={agent.id}
                                style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
                                className={`absolute w-[220px] transition-all duration-200`}
                                onMouseEnter={() => setHoveredAgentId(agent.id)}
                                onMouseLeave={() => setHoveredAgentId(null)}
                                onClick={() => { setSelectedAgentId(agent.id); setIsAddingDep(false); }}
                            >
                                <div className={`
                                    relative p-3 rounded-xl border backdrop-blur-sm
                                    ${isSelected ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-surface/80 border-slate-700 hover:border-slate-500'}
                                    ${agent.health < 50 ? 'border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : ''}
                                `}>
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className={`shrink-0 w-2 h-2 rounded-full ${agent.status === 'Active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                                            <span className="text-xs font-bold text-white truncate">{agent.name}</span>
                                        </div>
                                        <div className={`flex items-center gap-1 text-[10px] font-mono ${getHealthColor(agent.health)}`}>
                                            <Brain size={10} />
                                            {agent.health}%
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="space-y-2">
                                        <div className="text-[10px] text-slate-400 bg-slate-900/50 p-1.5 rounded truncate">
                                            {agent.task}
                                        </div>
                                        
                                        {/* Activity Bar */}
                                        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${agent.load > 90 ? 'bg-rose-500' : 'bg-primary'}`}
                                                style={{ width: `${agent.load}%` }}
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Connection Node Points (Visual only) */}
                                    <div className="absolute top-1/2 -left-1 w-2 h-2 bg-slate-600 rounded-full -translate-y-1/2" />
                                    <div className="absolute top-1/2 -right-1 w-2 h-2 bg-slate-600 rounded-full -translate-y-1/2" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
          </div>
        </div>

        {/* Inspector Panel */}
        <div className="w-96 bg-surface rounded-xl border border-slate-700 flex flex-col animate-slide-in-right shadow-2xl z-20">
          {selectedAgent ? (
            <div className="flex-1 flex flex-col">
              <div className="p-6 border-b border-slate-700 bg-slate-900/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-4 rounded-2xl ${selectedAgent.health < 50 ? 'bg-rose-500/20 text-rose-500' : 'bg-primary/10 text-primary'}`}>
                    {selectedAgent.health < 50 ? <AlertCircle size={32} /> : <Cpu size={32} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white leading-tight">{selectedAgent.name}</h3>
                    <p className="text-slate-400 text-sm uppercase tracking-wider">{selectedAgent.role} Core</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleAgentStatus(selectedAgent.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all ${selectedAgent.status === 'Paused' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                  >
                    {selectedAgent.status === 'Paused' ? <Play size={16} /> : <Pause size={16} />}
                    {selectedAgent.status === 'Paused' ? 'Resume' : 'Pause'}
                  </button>
                  <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                    <Settings size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-8">
                {/* Health Monitor */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                            <Brain size={14} /> Context Integrity
                        </h4>
                        <span className={`text-sm font-bold ${getHealthColor(selectedAgent.health)}`}>
                            {selectedAgent.health}%
                        </span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                        <div 
                            className={`h-full transition-all duration-500 ${selectedAgent.health < 50 ? 'bg-rose-500' : selectedAgent.health < 80 ? 'bg-yellow-400' : 'bg-emerald-400'}`}
                            style={{ width: `${selectedAgent.health}%` }}
                        />
                    </div>
                    {selectedAgent.health < 60 && (
                        <div className="flex items-start gap-2 mt-3 p-2 bg-rose-500/10 rounded text-rose-300 text-xs">
                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                            <div>
                                <p className="font-bold">Low Context Warning</p>
                                <p>Agent is suffering from "Fish Brain" amnesia. Context window is fragmented.</p>
                                <button 
                                    onClick={() => healAgent(selectedAgent.id)}
                                    className="mt-2 px-3 py-1 bg-rose-500 hover:bg-rose-400 text-white rounded-md w-full transition-colors"
                                >
                                    Initiate Memory Repair
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Workflow Config */}
                <div>
                   <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Zap size={12} /> Workflow Stage
                  </h4>
                  <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-700">
                    <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map(stage => (
                            <button
                                key={stage}
                                onClick={() => updateAgentStage(selectedAgent.id, stage)}
                                className={`h-8 rounded text-xs font-bold transition-all ${
                                    selectedAgent.workflowStage === stage 
                                    ? getStageColor(stage) + ' border' 
                                    : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                }`}
                                title={getStageName(stage)}
                            >
                                {stage}
                            </button>
                        ))}
                    </div>
                    <div className="mt-2 text-center text-xs text-slate-500 flex justify-between px-1">
                        <span>Current:</span>
                        <span className="text-white font-medium">{getStageName(selectedAgent.workflowStage)}</span>
                    </div>
                  </div>
                </div>

                {/* Workflow Dependencies */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <LinkIcon size={12} /> Pipeline Dependencies
                  </h4>
                  <div className="space-y-6 relative">
                    {/* Upstream */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-slate-500 font-medium">UPSTREAM (REQUIRES)</p>
                        <button 
                            onClick={() => setIsAddingDep(!isAddingDep)}
                            className="text-[10px] bg-slate-800 hover:bg-primary hover:text-white px-2 py-0.5 rounded text-slate-400 transition-colors flex items-center gap-1"
                        >
                            <Plus size={10} /> Add
                        </button>
                      </div>
                      
                      {/* Add Dependency Dropdown */}
                      {isAddingDep && (
                          <div className="p-2 bg-slate-800 rounded border border-slate-600 animate-in fade-in zoom-in-95 duration-200">
                              <div className="text-xs text-white mb-2 font-medium">Select Source Agent:</div>
                              <div className="max-h-32 overflow-auto space-y-1">
                                  {availableDependencies.length > 0 ? availableDependencies.map(agent => (
                                      <button 
                                        key={agent.id}
                                        onClick={() => addDependency(agent.id)}
                                        className="w-full text-left text-xs p-1.5 hover:bg-primary/20 hover:text-primary text-slate-300 rounded truncate"
                                      >
                                          {agent.name}
                                      </button>
                                  )) : (
                                      <div className="text-xs text-slate-500 italic p-1">No eligible agents found.</div>
                                  )}
                              </div>
                          </div>
                      )}

                      {upstreamAgents.length > 0 ? upstreamAgents.map(dep => (
                        <div key={dep.id} className="flex items-center justify-between p-2 bg-background/50 rounded border border-slate-700 group/dep">
                          <div className="flex items-center gap-2 overflow-hidden">
                             <div className={`w-1.5 h-1.5 rounded-full ${dep.status === 'Active' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                             <span className="text-xs text-slate-300 truncate">{dep.name}</span>
                          </div>
                          <button 
                            onClick={() => removeDependency(dep.id)}
                            className="text-slate-600 hover:text-rose-400 opacity-0 group-hover/dep:opacity-100 transition-opacity"
                          >
                              <X size={12} />
                          </button>
                        </div>
                      )) : (
                        !isAddingDep && <p className="text-xs text-slate-600 italic border border-dashed border-slate-800 p-2 rounded text-center">No dependencies defined.</p>
                      )}
                    </div>

                    <div className="flex justify-center text-slate-700">
                      <ArrowRight className="rotate-90" size={16} />
                    </div>

                    {/* This Agent */}
                    <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg text-center shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                      <span className="text-xs font-bold text-primary">{selectedAgent.name} (ACTIVE)</span>
                    </div>

                    <div className="flex justify-center text-slate-700">
                      <ArrowRight className="rotate-90" size={16} />
                    </div>

                    {/* Downstream */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-500 font-medium">DOWNSTREAM (TRIGGERS)</p>
                      {downstreamAgents.length > 0 ? downstreamAgents.map(child => (
                        <div key={child.id} className="flex items-center justify-between p-2 bg-background/50 rounded border border-slate-700 opacity-75">
                          <span className="text-xs text-slate-300">{child.name}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${child.status === 'Active' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        </div>
                      )) : (
                        <p className="text-xs text-slate-600 italic border border-dashed border-slate-800 p-2 rounded text-center">Terminal node.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Network size={32} />
              </div>
              <h3 className="font-bold text-slate-300">Agent Configuration</h3>
              <p className="text-sm mt-2">Select an agent node to configure dependencies, workflow stages, and check memory health.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentMonitor;