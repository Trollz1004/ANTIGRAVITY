import React, { useEffect, useMemo, useState } from 'react';
import { Bot, BrainCircuit, ClipboardCopy, Database, Loader2, Plus, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { apiJson, apiPost } from '../lib/api';

type MemoryEntry = {
  id: string;
  created_at: string;
  title: string;
  body: string;
  scope: string;
  source_agent: string;
  agents: string[];
  nodes: string[];
  tags: string[];
  visibility: string;
};

type MemoryLane = {
  id: string;
  label: string;
  provider: string;
  access: string;
  status: string;
};

type MemoryNode = {
  id: string;
  label: string;
  host: string;
  role: string;
  api: string;
  memory_path: string;
};

type MemoryStatus = {
  ok: boolean;
  memory_log: string;
  bootstrap_file: string;
  entries: number;
  nodes: MemoryNode[];
  lanes: MemoryLane[];
  scopes: string[];
  paperclip_excluded: boolean;
};

type BootstrapPayload = {
  text: string;
  entries: MemoryEntry[];
  nodes: MemoryNode[];
  lanes: MemoryLane[];
  source_files: string[];
};

const FALLBACK_SCOPES = ['global', 'repo', 'node', 'agent', 'support', 'deployment', 'customer-surface'];
const FALLBACK_LANES = ['codex', 'openai', 'claude', 'gemini', 'hermes', 'meta-llama', 'manus', 'fcc', 'opencode', 'ollama', 'nvidia', 'openclaw', 'grok'];

function compactDate(value?: string) {
  if (!value) return 'not stamped';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === 'ready') return 'border-accentCyan/40 bg-accentCyan/10 text-accentCyan';
  if (status === 'support') return 'border-accentTeal/40 bg-accentTeal/10 text-accentTeal';
  return 'border-amber-400/40 bg-amber-400/10 text-amber-200';
}

export const AgentMemoryPanel: React.FC = () => {
  const [status, setStatus] = useState<MemoryStatus | null>(null);
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [bootstrapText, setBootstrapText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sourceAgent, setSourceAgent] = useState('codex');
  const [scope, setScope] = useState('global');
  const [tags, setTags] = useState('mission-control');

  const scopes = status?.scopes?.length ? status.scopes : FALLBACK_SCOPES;
  const laneIds = useMemo(
    () => (status?.lanes?.length ? status.lanes.map(lane => lane.id) : FALLBACK_LANES),
    [status]
  );

  const loadMemory = async () => {
    setLoading(true);
    const [statusResult, entriesResult, bootstrapResult] = await Promise.all([
      apiJson<MemoryStatus>('/memory/status', 8000),
      apiJson<{ entries: MemoryEntry[] }>('/memory/entries?limit=12', 8000),
      apiJson<BootstrapPayload>('/memory/bootstrap?limit=8', 8000),
    ]);
    setLoading(false);

    if (statusResult.data) setStatus(statusResult.data);
    if (entriesResult.data?.entries) setEntries(entriesResult.data.entries);
    if (bootstrapResult.data?.text) setBootstrapText(bootstrapResult.data.text);

    const firstError = statusResult.error ?? entriesResult.error ?? bootstrapResult.error;
    setMessage(firstError ? `Memory API unavailable: ${firstError}` : null);
  };

  useEffect(() => {
    loadMemory();
  }, []);

  const copyBootstrap = async () => {
    await navigator.clipboard.writeText(bootstrapText || 'Mission Control memory bootstrap is not loaded.');
    setMessage('Bootstrap copied for agent handoff.');
    window.setTimeout(() => setMessage(null), 1800);
  };

  const saveEntry = async () => {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (cleanTitle.length < 3 || cleanBody.length < 5) {
      setMessage('Add a title and memory body first.');
      return;
    }

    setSaving(true);
    const result = await apiPost<{ entry: MemoryEntry; stored: boolean }>(
      '/memory/entries',
      {
        title: cleanTitle,
        body: cleanBody,
        scope,
        source_agent: sourceAgent,
        tags: tags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean),
      },
      8000
    );
    setSaving(false);

    if (!result?.stored) {
      setMessage('Memory write failed. Check the API log.');
      return;
    }

    setTitle('');
    setBody('');
    setMessage(`Stored memory ${result.entry.id}.`);
    await loadMemory();
  };

  return (
    <section data-testid="agent-memory-panel" className="mb-4 rounded border border-border bg-panel p-4 text-left">
      <div className="flex flex-col gap-3 border-b border-border pb-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-mono uppercase text-white">
            <BrainCircuit size={16} className="text-accentCyan" />
            Agent Memory Mesh
          </div>
          <p className="mt-1 max-w-3xl text-xs text-gray-400">
            Direct Mission Control memory for repo agents and nodes. Paperclip is not in this path.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadMemory}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded border border-border px-3 text-xs font-mono text-gray-200 transition hover:border-accentCyan/60 disabled:opacity-40"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
          <button
            type="button"
            onClick={copyBootstrap}
            className="inline-flex min-h-10 items-center gap-2 rounded border border-accentCyan/50 bg-accentCyan/10 px-3 text-xs font-mono text-accentCyan transition hover:bg-accentCyan/20"
          >
            <ClipboardCopy size={14} />
            Copy boot context
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-3 rounded border border-accentCyan/30 bg-background px-3 py-2 text-xs text-accentCyan" role="status">
          {message}
        </div>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <div className="space-y-4">
          <div className="rounded border border-border bg-background p-3">
            <div className="mb-3 flex items-center gap-2 text-xs font-mono uppercase text-gray-300">
              <Plus size={14} className="text-accentCyan" />
              Add Shared Memory
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <label className="block text-xs text-gray-400">
                Title
                <input
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  maxLength={120}
                  className="mt-1 min-h-10 w-full rounded border border-border bg-panel px-3 text-sm text-white outline-none focus:border-accentCyan"
                  placeholder="Short operational fact"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs text-gray-400">
                  Source
                  <select
                    value={sourceAgent}
                    onChange={event => setSourceAgent(event.target.value)}
                    className="mt-1 min-h-10 w-full rounded border border-border bg-panel px-2 text-sm text-white outline-none focus:border-accentCyan"
                  >
                    {laneIds.map(agent => (
                      <option key={agent} value={agent}>
                        {agent}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs text-gray-400">
                  Scope
                  <select
                    value={scope}
                    onChange={event => setScope(event.target.value)}
                    className="mt-1 min-h-10 w-full rounded border border-border bg-panel px-2 text-sm text-white outline-none focus:border-accentCyan"
                  >
                    {scopes.map(item => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <label className="mt-3 block text-xs text-gray-400">
              Memory
              <textarea
                value={body}
                onChange={event => setBody(event.target.value)}
                maxLength={2400}
                className="mt-1 min-h-28 w-full resize-y rounded border border-border bg-panel p-3 text-sm leading-6 text-white outline-none focus:border-accentCyan"
                placeholder="Concrete fact, decision, blocker, or next action. Do not paste secrets."
              />
            </label>
            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <label className="block text-xs text-gray-400">
                Tags
                <input
                  value={tags}
                  onChange={event => setTags(event.target.value)}
                  className="mt-1 min-h-10 w-full rounded border border-border bg-panel px-3 text-sm text-white outline-none focus:border-accentCyan"
                  placeholder="mission-control, handoff"
                />
              </label>
              <button
                type="button"
                onClick={saveEntry}
                disabled={saving}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-accentTeal/50 bg-accentTeal/10 px-4 text-xs font-mono text-accentTeal transition hover:bg-accentTeal/20 disabled:opacity-40"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
                Store memory
              </button>
            </div>
          </div>

          <div className="rounded border border-border bg-background p-3">
            <div className="mb-3 flex items-center gap-2 text-xs font-mono uppercase text-gray-300">
              <Database size={14} className="text-accentCyan" />
              Recent Shared Memory
            </div>
            <div className="space-y-2">
              {entries.length === 0 ? (
                <div className="rounded border border-border bg-panel p-3 text-sm text-gray-400">No memory entries returned yet.</div>
              ) : (
                entries.map(entry => (
                  <article key={entry.id} className="rounded border border-border bg-panel p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-white">{entry.title}</h3>
                        <div className="mt-1 text-[11px] text-gray-500">
                          {entry.source_agent} | {entry.scope} | {compactDate(entry.created_at)}
                        </div>
                      </div>
                      <span className="rounded-full border border-accentCyan/30 bg-accentCyan/10 px-2 py-1 text-[10px] text-accentCyan">
                        {entry.id}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-gray-300">{entry.body}</p>
                    {entry.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {entry.tags.map(tag => (
                          <span key={tag} className="rounded border border-border bg-background px-2 py-0.5 text-[10px] text-gray-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded border border-border bg-background p-3">
            <div className="mb-3 flex items-center gap-2 text-xs font-mono uppercase text-gray-300">
              <Server size={14} className="text-accentCyan" />
              Node Access
            </div>
            <div className="space-y-2">
              {(status?.nodes ?? []).map(node => (
                <div key={node.id} className="rounded border border-border bg-panel p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-white">{node.label}</div>
                    <span className="text-[11px] text-accentCyan">{node.host}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">{node.role}</div>
                  <code className="mt-2 block overflow-hidden text-ellipsis whitespace-nowrap rounded bg-background px-2 py-1 text-[11px] text-gray-300">
                    {node.api}
                  </code>
                </div>
              ))}
            </div>
            {status && (
              <div className="mt-3 rounded border border-border bg-panel p-3 text-xs text-gray-400">
                <div className="flex items-center gap-2 text-gray-300">
                  <ShieldCheck size={13} className="text-accentTeal" />
                  {status.entries} memory records visible
                </div>
                <code className="mt-2 block overflow-hidden text-ellipsis whitespace-nowrap rounded bg-background px-2 py-1 text-[11px] text-gray-400">
                  {status.memory_log}
                </code>
              </div>
            )}
          </div>

          <div className="rounded border border-border bg-background p-3">
            <div className="mb-3 flex items-center gap-2 text-xs font-mono uppercase text-gray-300">
              <Bot size={14} className="text-accentCyan" />
              AI Platform Access
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {(status?.lanes ?? []).map(lane => (
                <div key={lane.id} className="rounded border border-border bg-panel p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-white">{lane.label}</div>
                      <div className="mt-1 text-[11px] text-gray-500">{lane.provider}</div>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-[10px] uppercase ${statusClass(lane.status)}`}>
                      {lane.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-gray-400">{lane.access}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};
