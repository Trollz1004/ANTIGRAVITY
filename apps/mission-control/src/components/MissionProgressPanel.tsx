import React, { useEffect, useMemo, useState } from 'react';

type TaskStatus = 'todo' | 'doing' | 'blocked' | 'done';

type ProgressTask = {
  id: string;
  title: string;
  status: TaskStatus;
  owner?: string;
  note?: string;
  updatedAt?: number;
};

type NodeStatus = {
  name: string;
  online: boolean;
  hermes: { model: string; provider: string; gateway: string };
  repoHead?: string;
  branches?: string[];
  error?: string;
};

type ProgressPayload = {
  ok: boolean;
  updatedAt: number;
  sameRepoHead: boolean;
  nodes: NodeStatus[];
  columns: Record<TaskStatus, ProgressTask[]>;
  signals: string[];
  sessions: string[];
};

const statuses: TaskStatus[] = ['todo', 'doing', 'blocked', 'done'];
const statusLabel: Record<TaskStatus, string> = {
  todo: 'Todo',
  doing: 'Doing',
  blocked: 'Blocked',
  done: 'Done',
};

async function fetchProgress(): Promise<ProgressPayload> {
  const response = await fetch('/progress/status', { cache: 'no-store' });
  if (!response.ok) throw new Error(`progress status failed: ${response.status}`);
  return response.json();
}

async function postTask(body: Record<string, unknown>): Promise<void> {
  const response = await fetch('/progress/tasks', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`task update failed: ${response.status}`);
}

export const MissionProgressPanel: React.FC = () => {
  const [data, setData] = useState<ProgressPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setData(await fetchProgress());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const totalTasks = useMemo(() => {
    if (!data) return 0;
    return statuses.reduce((sum, key) => sum + (data.columns[key]?.length || 0), 0);
  }, [data]);

  const addTask = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await postTask({ action: 'add', title: trimmed, status, owner: 'Josh/Hermes' });
    setTitle('');
    await load();
  };

  const moveTask = async (id: string, nextStatus: TaskStatus) => {
    await postTask({ action: 'update', id, status: nextStatus });
    await load();
  };

  const deleteTask = async (id: string) => {
    await postTask({ action: 'delete', id });
    await load();
  };

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-accentCyan/30 bg-panel/80 p-4 shadow-lg shadow-cyan-950/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-white">Hermes Mission Progress</h1>
            <p className="text-sm text-gray-400">One board for work progression across Sabretooth, T5500, and 9020. Paperclip is not required.</p>
          </div>
          <div className="flex gap-2 text-xs font-mono">
            <span className={`rounded-full border px-3 py-1 ${data?.sameRepoHead ? 'border-green-400/40 bg-green-400/10 text-green-300' : 'border-yellow-400/40 bg-yellow-400/10 text-yellow-200'}`}>
              {data?.sameRepoHead ? 'repo synced' : 'repo drift'}
            </span>
            <span className="rounded-full border border-border bg-background px-3 py-1 text-gray-300">{totalTasks} tasks</span>
            <button onClick={() => void load()} className="rounded border border-accentCyan/40 px-3 py-1 text-accentCyan hover:bg-accentCyan/10">
              {loading ? 'refreshing…' : 'refresh'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}

      <div className="grid gap-3 lg:grid-cols-3">
        {(data?.nodes || []).map((node) => (
          <article key={node.name} className="rounded-xl border border-border bg-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-white">{node.name}</h2>
              <span className={`rounded-full px-2 py-1 text-xs ${node.online ? 'bg-green-400/10 text-green-300' : 'bg-red-400/10 text-red-300'}`}>
                {node.online ? 'online' : 'down'}
              </span>
            </div>
            <dl className="grid grid-cols-[72px_1fr] gap-2 text-xs">
              <dt className="text-gray-500">Model</dt><dd className="text-gray-200">{node.hermes.model}</dd>
              <dt className="text-gray-500">Provider</dt><dd className="text-gray-200">{node.hermes.provider}</dd>
              <dt className="text-gray-500">Gateway</dt><dd className="text-gray-200">{node.hermes.gateway}</dd>
              <dt className="text-gray-500">Commit</dt><dd className="font-mono text-violet-300">{node.repoHead?.slice(0, 12) || 'unknown'}</dd>
            </dl>
          </article>
        ))}
      </div>

      <div className="flex gap-2 rounded-xl border border-border bg-panel p-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') void addTask(); }}
          placeholder="Add the next task or progress item"
          className="min-w-0 flex-1 rounded border border-border bg-background px-3 py-2 text-sm text-white outline-none focus:border-accentCyan"
        />
        <select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)} className="rounded border border-border bg-background px-3 py-2 text-sm text-white">
          {statuses.map((item) => <option key={item} value={item}>{statusLabel[item]}</option>)}
        </select>
        <button onClick={() => void addTask()} className="rounded bg-accentCyan px-4 py-2 text-sm font-semibold text-background hover:opacity-90">Add</button>
      </div>

      <div className="grid gap-3 xl:grid-cols-4">
        {statuses.map((column) => (
          <section key={column} className="min-h-64 rounded-xl border border-border bg-panel/90 p-3">
            <h2 className="mb-3 text-xs font-mono uppercase tracking-widest text-accentCyan">
              {statusLabel[column]} ({data?.columns[column]?.length || 0})
            </h2>
            <div className="space-y-2">
              {(data?.columns[column] || []).map((task) => (
                <article key={task.id} className="rounded-lg border border-border bg-background/80 p-3">
                  <div className="font-medium text-white">{task.title}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-400">
                    <span>{task.id}</span>
                    {task.owner && <span>{task.owner}</span>}
                    {task.updatedAt && <span>{new Date(task.updatedAt * 1000).toLocaleString()}</span>}
                  </div>
                  {task.note && <p className="mt-2 text-xs text-gray-400">{task.note}</p>}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {statuses.map((item) => (
                      <button key={item} onClick={() => void moveTask(task.id, item)} className="rounded border border-border px-2 py-1 text-[11px] text-gray-300 hover:border-accentCyan hover:text-accentCyan">
                        {item}
                      </button>
                    ))}
                    <button onClick={() => void deleteTask(task.id)} className="rounded border border-red-500/40 px-2 py-1 text-[11px] text-red-300 hover:bg-red-500/10">delete</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-panel p-3">
          <h2 className="mb-2 text-sm font-semibold text-white">Live agent/process signals</h2>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded bg-background p-3 text-[11px] text-gray-300">{(data?.signals || []).join('\n') || 'No process signals yet.'}</pre>
        </section>
        <section className="rounded-xl border border-border bg-panel p-3">
          <h2 className="mb-2 text-sm font-semibold text-white">Recent Hermes sessions</h2>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded bg-background p-3 text-[11px] text-gray-300">{(data?.sessions || []).join('\n') || 'No sessions found.'}</pre>
        </section>
      </div>
    </section>
  );
};
