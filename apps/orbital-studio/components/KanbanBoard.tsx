import React from 'react';
import type { Column, SwarmTask } from '../types';

interface Props {
  tasks: SwarmTask[];
}

const COLUMNS: Array<{ id: Column; title: string }> = [
  { id: 'NOW', title: 'NOW (IN FLIGHT)' },
  { id: 'NEXT', title: 'NEXT (QUEUED)' },
  { id: 'BLOCKED', title: 'BLOCKED / REVIEW' },
  { id: 'DONE', title: 'DONE (VERIFIED)' },
];

const DEFAULT_TASKS: SwarmTask[] = [
  {
    id: 'TSK-101',
    title: 'OmniRoute Direct Endpoint Verification',
    prompt: 'Verify that all GenAI API connections bypass middleware directly.',
    agentIds: ['gemini-architect'],
    mode: 'reasoning',
    column: 'DONE',
    status: 'done',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    results: [
      {
        agentId: 'gemini-architect',
        status: 'done',
        output: 'Direct Google GenAI SDK channel verified. Response latency < 350ms.',
      },
    ],
  },
  {
    id: 'TSK-102',
    title: 'PaperMates Trust Desk & Moderation Rails',
    prompt: 'Implement zero-hallucination report & block workflows with human review queue.',
    agentIds: ['claude-architect'],
    mode: 'reasoning',
    column: 'NOW',
    status: 'running',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    results: [],
  },
  {
    id: 'TSK-103',
    title: 'Antigravity Multi-Node Sync & Memory Gate',
    prompt: 'Initialize memory/semantic, episodic, and working directory topologies.',
    agentIds: ['manus-orchestrator', 'codex-executor'],
    mode: 'reasoning',
    column: 'DONE',
    status: 'done',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    results: [],
  },
];

export default function KanbanBoard({ tasks = [] }: Props) {
  const displayTasks = tasks.length > 0 ? tasks : DEFAULT_TASKS;

  return (
    <div className="kanban-board p-6 space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
        <div>
          <span className="label">AUTONOMOUS DISPATCH</span>
          <h2 className="text-xl font-black uppercase tracking-wider text-white">Work Board</h2>
        </div>
        <span className="text-xs font-mono text-neutral-400">
          Total Tracked Tasks: <strong className="text-cyan-400">{displayTasks.length}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = displayTasks.filter((t) => t.column === col.id);
          return (
            <div key={col.id} className="p-4 border border-neutral-800 bg-neutral-900/50 flex flex-col min-h-[480px]">
              <div className="flex justify-between items-center pb-3 mb-3 border-b border-neutral-800">
                <h3 className="text-xs font-mono font-bold tracking-wider text-neutral-200">{col.title}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral-800 text-neutral-400">
                  {colTasks.length}
                </span>
              </div>
              <div className="flex-1 space-y-3">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 border border-neutral-700/70 bg-neutral-950/80 space-y-2 hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">{task.id}</span>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-neutral-800 text-neutral-300">
                        {task.mode}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white leading-snug">{task.title}</h4>
                    <p className="text-[11px] text-neutral-400 line-clamp-2">{task.prompt}</p>
                    {task.results && task.results.length > 0 && (
                      <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 p-1.5 border border-emerald-900/40">
                        ✓ {task.results[0].output}
                      </div>
                    )}
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="h-24 flex items-center justify-center text-[11px] font-mono text-neutral-600">
                    EMPTY
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
