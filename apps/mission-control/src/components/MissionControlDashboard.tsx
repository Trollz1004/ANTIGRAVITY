import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Code2,
  Copy,
  ExternalLink,
  FileText,
  GitBranch,
  HeartPulse,
  ListChecks,
  Loader2,
  PlayCircle,
  RefreshCw,
  Route,
  ScrollText,
  Send,
  Server,
  ShieldCheck,
  TerminalSquare,
  Wallet,
  XCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { apiGet, apiJson, apiPost, type Envelope } from '../lib/api';
import { validateTaskBrief, validateAgentId } from '../lib/input-validation';
import { useToast } from '../lib/useToast';

type HealthSummary = { ok: number; degraded: number; unreachable: number };
type HealthAll = Record<string, Envelope<any>> & { _summary?: HealthSummary };
type RepoLastCommit = { short_sha?: string };
type RepoDetails = {
  last_commit?: RepoLastCommit;
  branch?: string;
  changed?: number;
  untracked?: number;
};
type PaperclipDetails = {
  version?: string;
  deploymentMode?: string;
  authReady?: boolean;
  json?: { version?: string; deploymentMode?: string; authReady?: boolean };
};
type OllamaDetails = {
  models?: (string | { name?: string; model?: string })[];
  model_count?: number;
  json?: { models?: (string | { name?: string; model?: string })[] };
};
type RunbookFile = { filename: string; size: number; mtime: string };
type TaskRecord = {
  task_id: string;
  queued_at: string;
  brief: string;
  agents: string[];
  status: string;
};
type OperationCommand = {
  id: string;
  title: string;
  description: string;
  command: string;
  cwd: string;
  timeout_s: number;
  caution?: string | null;
};
type OperationRun = {
  run_id: string;
  command_id: string;
  title: string;
  command: string;
  cwd: string;
  status: 'running' | 'succeeded' | 'failed' | 'queued';
  started_at: string;
  finished_at?: string | null;
  duration_s?: number | null;
  exit_code?: number | null;
  output?: string;
  error?: string | null;
};

const FALLBACK_MODELS = ['hermes', 'hermes-deep', 'cfo', 'code', 'marketing', 'kimi', 'fast'];

const AGENTS = [
  { id: 'codex', label: 'Codex' },
  { id: 'claude', label: 'Claude' },
  { id: 'hermes', label: 'Hermes' },
  { id: 'ollama', label: 'Ollama' },
  { id: 'paperclip', label: 'Paperclip' },
];

const QUICK_COMMANDS = [
  {
    id: 'autostart',
    title: 'Start Mission Stack',
    command: 'powershell -ExecutionPolicy Bypass -File C:\\ANTIGRAVITY\\scripts\\autostart-mission.ps1',
  },
  {
    id: 'api',
    title: 'Run Mission Control API',
    command:
      'python -m uvicorn mission_control_api.main:app --host 0.0.0.0 --port 8787 --app-dir C:\\ANTIGRAVITY\\services\\mission-control-api\\src',
  },
  {
    id: 'build',
    title: 'Build Dashboard',
    command: 'pnpm --dir C:\\ANTIGRAVITY\\apps\\mission-control build',
  },
  {
    id: 'guardian',
    title: 'Run Guardian',
    command: 'python C:\\ANTIGRAVITY\\scripts\\clawx-control\\opus-guardian.py',
  },
];

const SERVICE_META: Record<
  string,
  { label: string; endpoint: string; openUrl?: string; owner: string; hint: string }
> = {
  paperclip: {
    label: 'Paperclip HQ',
    endpoint: '/health/paperclip',
    openUrl: 'http://127.0.0.1:3100/',
    owner: 'Ops',
    hint: 'Worker and CEO workspace health',
  },
  hermes: {
    label: 'Hermes Router',
    endpoint: '/health/hermes',
    owner: 'Router',
    hint: 'Local routing port 11435',
  },
  ollama: {
    label: 'Ollama',
    endpoint: '/health/ollama',
    openUrl: 'http://127.0.0.1:11434/api/tags',
    owner: 'Local AI',
    hint: 'Installed local models',
  },
  openclaw: {
    label: 'OpenClaw',
    endpoint: '/health/openclaw',
    openUrl: 'http://127.0.0.1:18789/',
    owner: 'Gateway',
    hint: 'Self-hosted control surface',
  },
  youandinotai: {
    label: 'YouAndINotAI',
    endpoint: '/health/youandinotai',
    openUrl: 'https://youandinotai.com/',
    owner: 'Public',
    hint: 'Public frontend',
  },
  api_youandinotai: {
    label: 'Public API',
    endpoint: '/health/api-youandinotai',
    openUrl: 'https://api.youandinotai.com/health',
    owner: 'Public',
    hint: 'Public backend health route',
  },
  cloudflare: {
    label: 'Cloudflare',
    endpoint: '/health/cloudflare-pages',
    owner: 'Deploy',
    hint: 'Pages project access',
  },
  square: {
    label: 'Square',
    endpoint: '/health/square',
    owner: 'Revenue',
    hint: 'Read-only location check',
  },
  guardian: {
    label: 'Guardian',
    endpoint: '/health/guardian',
    owner: 'Security',
    hint: 'Core invariant sweep',
  },
  repo: {
    label: 'Repo',
    endpoint: '/health/repo',
    owner: 'Git',
    hint: 'Branch, drift, latest commit',
  },
  docker: {
    label: 'Docker',
    endpoint: '/health/docker',
    owner: 'Runtime',
    hint: 'Local containers',
  },
  treasury: {
    label: 'Treasury',
    endpoint: '/health/treasury',
    owner: 'Finance',
    hint: 'Live source required',
  },
  revenue: {
    label: 'Revenue Doctrine',
    endpoint: '/health/revenue-buckets',
    owner: 'Policy',
    hint: '10 percent cap guard',
  },
  stack: {
    label: 'Stack Integrity',
    endpoint: '/health/stack-integrity',
    owner: 'Security',
    hint: 'Guardian invariant parse',
  },
  t5500: {
    label: 'T5500',
    endpoint: '/health/t5500',
    owner: 'Node',
    hint: 'Remote production support stack',
  },
};

function summarizeHealth(health: HealthAll | null): HealthSummary {
  if (!health) return { ok: 0, degraded: 0, unreachable: 0 };
  if (health._summary) return health._summary;
  return Object.entries(health).reduce(
    (acc, [name, env]) => {
      if (name.startsWith('_')) return acc;
      if (!env || typeof env !== 'object' || !('status' in env)) return acc;
      if (env.status in acc) acc[env.status as keyof HealthSummary] += 1;
      return acc;
    },
    { ok: 0, degraded: 0, unreachable: 0 }
  );
}

function healthEntries(health: HealthAll | null): Array<[string, Envelope<any>]> {
  return Object.entries(health ?? {})
    .filter((entry): entry is [string, Envelope<any>] => {
      const [name, value] = entry;
      return !name.startsWith('_') && Boolean(value) && typeof value === 'object' && 'status' in value;
    })
    .sort(([a], [b]) => {
      const order = ['repo', 'paperclip', 'hermes', 'ollama', 'openclaw', 't5500', 'stack'];
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return a.localeCompare(b);
    });
}

function statusIcon(status: string) {
  if (status === 'ok') return <CheckCircle2 size={16} />;
  if (status === 'degraded') return <AlertTriangle size={16} />;
  return <XCircle size={16} />;
}

function statusClass(status: string) {
  if (status === 'ok') return 'border-teal-400/40 bg-teal-400/10 text-teal-200';
  if (status === 'degraded') return 'border-amber-400/40 bg-amber-400/10 text-amber-200';
  return 'border-rose-400/40 bg-rose-400/10 text-rose-200';
}

function runStatusClass(status: string) {
  if (status === 'succeeded') return 'border-teal-400/40 bg-teal-400/10 text-teal-200';
  if (status === 'running') return 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200';
  if (status === 'queued') return 'border-amber-400/40 bg-amber-400/10 text-amber-200';
  return 'border-rose-400/40 bg-rose-400/10 text-rose-200';
}

function compactDate(value?: string) {
  if (!value) return 'not checked';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatMoney(value: unknown) {
  return typeof value === 'number'
    ? value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    : 'not connected';
}

function detailLine(name: string, env: Envelope<any>) {
  const details = env.details ?? {};
  if (name === 'repo') {
    const repoDetails = details as RepoDetails;
    const last = repoDetails.last_commit;
    return `${repoDetails.branch ?? 'unknown'} | changed ${repoDetails.changed ?? 0} | untracked ${
      repoDetails.untracked ?? 0
    }${last?.short_sha ? ` | ${last.short_sha}` : ''}`;
  }
  if (name === 'paperclip') {
    const paperclipDetails = details as PaperclipDetails;
    const json = paperclipDetails.json ?? paperclipDetails;
    return `${json.version ?? 'unknown'} | ${json.deploymentMode ?? 'mode unknown'} | auth ${
      json.authReady ? 'ready' : 'unknown'
    }`;
  }
  if (name === 'ollama') {
    const ollamaDetails = details as OllamaDetails;
    const rawModels = ollamaDetails.models ?? ollamaDetails.json?.models ?? [];
    const models = Array.isArray(rawModels)
      ? rawModels.map((model: any) => (typeof model === 'string' ? model : model.name ?? model.model ?? 'unknown'))
      : [];
    const count = ollamaDetails.model_count && ollamaDetails.model_count > 0 ? ollamaDetails.model_count : models.length;
    return `${count} models | ${models.slice(0, 3).join(', ')}`;
  }
  if (name === 't5500') return `${details.ok ?? 0}/${details.total ?? 0} services | ${details.host ?? 'unknown host'}`;
  if (name === 'stack') {
    return `score ${details.score ?? 'unknown'} | ok ${details.ok_count ?? 0} | warn ${details.warn_count ?? 0}`;
  }
  if (name === 'treasury') {
    if (details.source === 'mirror') return 'Mirror feed only | live treasury source not wired';
    return details.message ?? `${formatMoney(details.balanceUsd)} | ${details.source ?? 'source unknown'}`;
  }
  if (name === 'revenue') return `reserve cap ${details.reserve_percent ?? 10}% | ${(details.buckets ?? []).length} buckets`;
  if (details.status_code) return `HTTP ${details.status_code} | ${details.url ?? ''}`;
  if (details.port) return `port ${details.port} | ${details.host ?? 'localhost'}`;
  return env.error ?? SERVICE_META[name]?.hint ?? 'No detail returned';
}

const ShellButton = ({
  children,
  className,
  onClick,
  disabled,
  testId,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  testId?: string;
  ariaLabel?: string;
}) => (
  <button
    data-testid={testId}
    type="button"
    aria-label={ariaLabel}
    onClick={onClick}
    disabled={disabled}
    className={clsx(
      'inline-flex min-h-9 items-center justify-center gap-2 rounded-md border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40',
      className ?? 'border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400/60'
    )}
  >
    {children}
  </button>
);

const Section = ({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="rounded-md border border-slate-800 bg-slate-950/70 p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
        <span className="text-cyan-300">{icon}</span>
        {title}
      </h2>
      {action}
    </div>
    {children}
  </section>
);

export const MissionControlDashboard = () => {
  const [health, setHealth] = useState<HealthAll | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [brief, setBrief] = useState('');
  const [agents, setAgents] = useState<string[]>(['codex', 'claude']);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchMessage, setDispatchMessage] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [runbooks, setRunbooks] = useState<RunbookFile[]>([]);
  const [selectedRunbook, setSelectedRunbook] = useState<string | null>(null);
  const [runbookContent, setRunbookContent] = useState('');
  const [models, setModels] = useState(FALLBACK_MODELS);
  const [activeModel, setActiveModel] = useState('hermes');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [commands, setCommands] = useState<OperationCommand[]>([]);
  const [runs, setRuns] = useState<OperationRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [operationMessage, setOperationMessage] = useState<string | null>(null);
  const { success, error } = useToast();

  const summary = useMemo(() => summarizeHealth(health), [health]);
  const entries = useMemo(() => healthEntries(health), [health]);
  const attentionEntries = useMemo(() => entries.filter(([, env]) => env.status !== 'ok'), [entries]);
  const selectedRun = useMemo(
    () => runs.find(run => run.run_id === selectedRunId) ?? runs[0] ?? null,
    [runs, selectedRunId]
  );

  const loadHealth = async () => {
    setRefreshing(true);
    const result = await apiJson<HealthAll>('/health/all', 15000);
    setRefreshing(false);
    if (result.data) {
      setHealth(result.data);
      setHealthError(null);
    } else {
      setHealthError(result.error ?? 'health/all failed');
      error(result.error ?? 'Health check failed');
    }
  };

  const loadTasks = async () => {
    const result = await apiJson<{ tasks: TaskRecord[] }>('/tasks', 5000);
    if (result.data?.tasks) setTasks(result.data.tasks);
  };

  const loadRunbooks = async () => {
    const env = await apiGet<RunbookFile[]>('/runbooks/list', 8000);
    if (env.status === 'ok' && Array.isArray(env.details)) setRunbooks(env.details);
  };

  const loadModels = async () => {
    const env = await apiGet<{ models: string[]; active: string }>('/hermes/models', 5000);
    if (env.status === 'ok') {
      setModels(env.details.models);
      setActiveModel(env.details.active);
    }
  };

  const loadOperations = async () => {
    const result = await apiJson<{ commands: OperationCommand[] }>('/ops/commands', 5000);
    if (result.data?.commands) setCommands(result.data.commands);
  };

  const loadRuns = async () => {
    const result = await apiJson<{ runs: OperationRun[] }>('/ops/runs', 5000);
    if (result.data?.runs) {
      setRuns(result.data.runs);
      setSelectedRunId(current => current ?? result.data?.runs?.[0]?.run_id ?? null);
    }
  };

  useEffect(() => {
    loadHealth();
    loadTasks();
    loadRunbooks();
    loadModels();
    loadOperations();
    loadRuns();
    const healthId = window.setInterval(loadHealth, 15000);
    const runsId = window.setInterval(loadRuns, 4000);
    return () => {
      window.clearInterval(healthId);
      window.clearInterval(runsId);
    };
  }, []);

  const toggleAgent = (id: string) => {
    setAgents(current => (current.includes(id) ? current.filter(agent => agent !== id) : [...current, id]));
  };

  const submitTask = async () => {
    setDispatchMessage(null);
    const clean = brief.trim();

    // Validate task brief against allowlist
    const briefValidation = validateTaskBrief(clean);
    if (!briefValidation.valid) {
      setDispatchMessage(`Validation Error: ${briefValidation.error}`);
      return;
    }

    // Validate all selected agent IDs against allowlist
    for (const agentId of agents) {
      const agentValidation = validateAgentId(agentId);
      if (!agentValidation.valid) {
        setDispatchMessage(`Agent Validation Error: ${agentValidation.error}`);
        return;
      }
    }

    setDispatching(true);
    const result = await apiPost<{ task_id: string; queued: boolean }>('/tasks/dispatch', { brief: clean, agents }, 8000);
    setDispatching(false);
    if (result?.queued) {
      setDispatchMessage(`Queued ${result.task_id}`);
      success(`Task queued: ${result.task_id}`);
      setBrief('');
      await loadTasks();
    } else {
      setDispatchMessage('Dispatch failed');
      error('Task dispatch failed');
    }
  };

  const copyCommand = async (id: string, command: string) => {
    await navigator.clipboard.writeText(command);
    setCopiedCommand(id);
    window.setTimeout(() => setCopiedCommand(null), 1500);
  };

  const selectRunbook = async (filename: string) => {
    setSelectedRunbook(filename);
    setRunbookContent('Loading...');
    const result = await apiJson<{ filename: string; content: string }>(`/runbooks/${filename}`, 8000);
    setRunbookContent(result.data?.content ?? result.error ?? 'Unable to read runbook.');
  };

  const swapModel = async (model: string) => {
    setActiveModel(model);
    const result = await apiPost('/hermes/active', { model }, 5000);
    if (result) {
      success(`Switched to ${model}`);
    } else {
      error(`Failed to switch to ${model}`);
    }
    await loadModels();
  };

  const startOperation = async (commandId: string) => {
    setOperationMessage('Starting operation...');
    const result = await apiPost<OperationRun>(`/ops/runs/${commandId}`, {}, 8000);
    if (result?.run_id) {
      setOperationMessage(`Started ${result.title}`);
      success(`Started: ${result.title}`);
      setRuns(current => [result, ...current.filter(run => run.run_id !== result.run_id)]);
      setSelectedRunId(result.run_id);
      window.setTimeout(loadRuns, 1200);
    } else {
      setOperationMessage('Operation failed to start');
      error('Operation failed to start');
    }
  };

  return (
    <div data-testid="mission-dashboard" className="min-h-screen bg-[#080c13] text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
              <HeartPulse size={18} />
              Antigravity Mission Control
            </div>
            <p className="mt-1 text-xs text-slate-400">Local cockpit for repo state, runtime health, runbooks, and task dispatch.</p>
          </div>
          <div data-testid="health-summary" className="grid grid-cols-3 overflow-hidden rounded-md border border-slate-800 text-center">
            <div className="bg-teal-400/10 px-4 py-2">
              <div className="text-lg font-semibold text-teal-200">{summary.ok}</div>
              <div className="text-[10px] uppercase text-slate-400">ok</div>
            </div>
            <div className="border-x border-slate-800 bg-amber-400/10 px-4 py-2">
              <div className="text-lg font-semibold text-amber-200">{summary.degraded}</div>
              <div className="text-[10px] uppercase text-slate-400">degraded</div>
            </div>
            <div className="bg-rose-400/10 px-4 py-2">
              <div className="text-lg font-semibold text-rose-200">{summary.unreachable}</div>
              <div className="text-[10px] uppercase text-slate-400">down</div>
            </div>
          </div>
        </div>
      </header>

      <main className="grid gap-4 p-4 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="space-y-4">
          <Section
            title="Operations"
            icon={<PlayCircle size={16} />}
            action={<div className="text-xs text-slate-500">{operationMessage ?? `${commands.length} ready`}</div>}
          >
            <div data-testid="operations-list" className="space-y-2">
              {commands.length === 0 ? (
                <div className="rounded-md border border-slate-800 bg-slate-900 p-3 text-sm text-slate-400">
                  Operations API unavailable. Restart the Mission Control API so /ops/commands is served by the updated backend.
                </div>
              ) : (
                commands.map(command => {
                  const latest = runs.find(run => run.command_id === command.id);
                  const isRunning = latest?.status === 'running';
                  return (
                    <div key={command.id} className="rounded-md border border-slate-800 bg-slate-900/80 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-100">{command.title}</div>
                          <p className="mt-1 text-[11px] leading-4 text-slate-400">{command.description}</p>
                        </div>
                        {latest && (
                          <span className={clsx('rounded-full border px-2 py-1 text-[10px] uppercase', runStatusClass(latest.status))}>
                            {latest.status}
                          </span>
                        )}
                      </div>
                      {command.caution && <div className="mt-2 text-[11px] text-amber-200">{command.caution}</div>}
                      <div className="mt-3 flex gap-2">
                        <ShellButton
                          onClick={() => startOperation(command.id)}
                          disabled={isRunning}
                          testId={`run-${command.id}`}
                          ariaLabel={`Run ${command.title}`}
                        >
                          {isRunning ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
                          Run
                        </ShellButton>
                        <ShellButton
                          onClick={() => copyCommand(`op-${command.id}`, command.command)}
                          ariaLabel={`Copy ${command.title} command`}
                        >
                          <Copy size={14} />
                          {copiedCommand === `op-${command.id}` ? 'Copied' : 'Copy'}
                        </ShellButton>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Section>

          <Section
            title="Actions"
            icon={<TerminalSquare size={16} />}
            action={
              <ShellButton onClick={loadHealth} disabled={refreshing}>
                {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Refresh
              </ShellButton>
            }
          >
            <div className="space-y-2">
              {QUICK_COMMANDS.map(item => (
                <button
                  key={item.id}
                  data-testid={`copy-${item.id}`}
                  type="button"
                  onClick={() => copyCommand(item.id, item.command)}
                  className="w-full rounded-md border border-slate-800 bg-slate-900/80 p-3 text-left transition hover:border-cyan-400/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-100">{item.title}</span>
                    <Copy size={14} className={copiedCommand === item.id ? 'text-teal-300' : 'text-slate-400'} />
                  </div>
                  <code className="mt-2 block overflow-hidden text-ellipsis whitespace-nowrap rounded bg-slate-950 px-2 py-1 text-[11px] text-cyan-200">
                    {item.command}
                  </code>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Hermes Route" icon={<Route size={16} />}>
            <div className="flex flex-wrap gap-2">
              {models.map(model => (
                <ShellButton
                  key={model}
                  testId={`hermes-chip-${model}`}
                  onClick={() => swapModel(model)}
                  className={
                    activeModel === model
                      ? 'border-cyan-300 bg-cyan-300/15 text-cyan-100'
                      : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-400/60'
                  }
                >
                  {model}
                </ShellButton>
              ))}
            </div>
            <div className="mt-3 text-xs text-slate-400">Active: <span className="text-cyan-200">{activeModel}</span></div>
          </Section>

          <Section title="Revenue Guard" icon={<Wallet size={16} />}>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>Operating cap</span>
                <span className="font-semibold text-cyan-200">10%</span>
              </div>
              <div className="rounded border border-slate-800 bg-slate-900 p-3 text-xs text-slate-400">
                Public surfaces stay factual and restrained. Live treasury data must be wired before balances are shown as real.
              </div>
            </div>
          </Section>
        </aside>

        <section className="space-y-4">
          <Section
            title="Task Dispatch"
            icon={<Send size={16} />}
            action={
              <ShellButton onClick={submitTask} disabled={!brief.trim() || dispatching} testId="task-send-btn">
                {dispatching ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Queue
              </ShellButton>
            }
          >
            <textarea
              data-testid="task-input"
              value={brief}
              onChange={event => setBrief(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) submitTask();
              }}
              placeholder="Type the task once. Pick agents below. Ctrl+Enter queues it."
              className="min-h-28 w-full resize-y rounded-md border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/70"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {AGENTS.map(agent => (
                <ShellButton
                  key={agent.id}
                  onClick={() => toggleAgent(agent.id)}
                  className={
                    agents.includes(agent.id)
                      ? 'border-cyan-300 bg-cyan-300/15 text-cyan-100'
                      : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-400/60'
                  }
                >
                  {agent.label}
                </ShellButton>
              ))}
            </div>
            {dispatchMessage && <div className="mt-3 text-xs text-cyan-200">{dispatchMessage}</div>}
          </Section>

          <Section title="Needs Attention" icon={<AlertTriangle size={16} />}>
            {attentionEntries.length === 0 ? (
              <div className="rounded-md border border-teal-400/30 bg-teal-400/10 p-3 text-sm text-teal-100">
                All checked services are currently green.
              </div>
            ) : (
              <div data-testid="attention-list" className="space-y-2">
                {attentionEntries.map(([name, env]) => {
                  const meta = SERVICE_META[name] ?? {
                    label: name,
                    endpoint: `/health/${name}`,
                    owner: 'Service',
                    hint: 'No metadata',
                  };
                  return (
                    <article key={name} className="rounded-md border border-slate-800 bg-slate-900 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-100">{meta.label}</h3>
                          <p className="mt-1 text-xs text-slate-400">{detailLine(name, env)}</p>
                        </div>
                        <span className={clsx('rounded-full border px-2 py-1 text-[10px] uppercase', statusClass(env.status))}>
                          {env.status}
                        </span>
                      </div>
                      {env.error && <div className="mt-2 rounded bg-slate-950 p-2 text-xs text-rose-200">{env.error}</div>}
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span>{meta.endpoint}</span>
                        {meta.openUrl && (
                          <a
                            href={meta.openUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-200 hover:text-cyan-100"
                          >
                            Open <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </Section>

          <Section
            title="Runtime Health"
            icon={<Activity size={16} />}
            action={
              <div className="text-xs text-slate-500">
                {healthError ? healthError : refreshing ? 'refreshing' : 'live'}
              </div>
            }
          >
            <div className="grid gap-3 md:grid-cols-2">
              {entries.map(([name, env]) => {
                const meta = SERVICE_META[name] ?? {
                  label: name,
                  endpoint: `/health/${name}`,
                  owner: 'Service',
                  hint: 'No metadata',
                };
                return (
                  <article key={name} className="rounded-md border border-slate-800 bg-slate-900/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={clsx('inline-flex rounded border p-1', statusClass(env.status))}>
                            {statusIcon(env.status)}
                          </span>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-100">{meta.label}</h3>
                            <p className="text-[11px] text-slate-500">{meta.owner} | {meta.hint}</p>
                          </div>
                        </div>
                      </div>
                      <span className={clsx('rounded-full border px-2 py-1 text-[10px] uppercase', statusClass(env.status))}>
                        {env.status}
                      </span>
                    </div>
                    <div className="mt-3 rounded bg-slate-950 p-2 text-xs text-slate-300">{detailLine(name, env)}</div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span>{meta.endpoint} | {env.latency_ms}ms | {compactDate(env.checked_at)}</span>
                      {meta.openUrl && (
                        <a
                          href={meta.openUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-200 hover:text-cyan-100"
                        >
                          Open <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </Section>
        </section>

        <aside className="space-y-4">
          <Section
            title="Run Logs"
            icon={<ScrollText size={16} />}
            action={
              <ShellButton onClick={loadRuns}>
                <RefreshCw size={14} />
                Reload
              </ShellButton>
            }
          >
            <div data-testid="runs-list" className="space-y-2">
              {runs.length === 0 ? (
                <div className="rounded-md border border-slate-800 bg-slate-900 p-3 text-sm text-slate-400">
                  No operations have run from this API process yet.
                </div>
              ) : (
                runs.slice(0, 6).map(run => (
                  <button
                    key={run.run_id}
                    type="button"
                    onClick={() => setSelectedRunId(run.run_id)}
                    className={clsx(
                      'w-full rounded-md border p-3 text-left transition',
                      selectedRun?.run_id === run.run_id
                        ? 'border-cyan-300 bg-cyan-300/10'
                        : 'border-slate-800 bg-slate-900 hover:border-cyan-400/60'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-100">{run.title}</span>
                      <span className={clsx('rounded-full border px-2 py-0.5 text-[10px] uppercase', runStatusClass(run.status))}>
                        {run.status}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {run.run_id} | exit {run.exit_code ?? 'pending'} | {run.duration_s ?? 0}s
                    </div>
                  </button>
                ))
              )}
            </div>
            <pre
              data-testid="run-output"
              className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-slate-800 bg-slate-950 p-3 text-xs leading-5 text-slate-300"
            >
              {selectedRun
                ? selectedRun.output || selectedRun.error || `${selectedRun.title} is ${selectedRun.status}.`
                : 'Run an operation to see captured output here.'}
            </pre>
          </Section>

          <Section
            title="Runbooks"
            icon={<FileText size={16} />}
            action={
              <ShellButton onClick={loadRunbooks}>
                <RefreshCw size={14} />
                Reload
              </ShellButton>
            }
          >
            <div data-testid="runbook-list" className="max-h-64 space-y-2 overflow-auto pr-1">
              {runbooks.map(file => (
                <button
                  key={file.filename}
                  type="button"
                  onClick={() => selectRunbook(file.filename)}
                  className={clsx(
                    'w-full rounded-md border p-3 text-left text-xs transition',
                    selectedRunbook === file.filename
                      ? 'border-cyan-300 bg-cyan-300/10 text-cyan-100'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-400/60'
                  )}
                >
                  <div className="font-semibold">{file.filename}</div>
                  <div className="mt-1 text-[11px] text-slate-500">{Math.ceil(file.size / 1024)} KB | {compactDate(file.mtime)}</div>
                </button>
              ))}
            </div>
            <pre
              data-testid="runbook-content"
              className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-slate-800 bg-slate-950 p-3 text-xs leading-5 text-slate-300"
            >
              {runbookContent || 'Select a runbook to read the current handoff or incident notes.'}
            </pre>
          </Section>

          <Section
            title="Recent Tasks"
            icon={<ListChecks size={16} />}
            action={
              <ShellButton onClick={loadTasks}>
                <RefreshCw size={14} />
                Refresh
              </ShellButton>
            }
          >
            <div data-testid="tasks-list" className="space-y-2">
              {tasks.length === 0 ? (
                <div className="rounded-md border border-slate-800 bg-slate-900 p-3 text-sm text-slate-400">No queued tasks yet.</div>
              ) : (
                tasks.slice(0, 8).map(task => (
                  <div key={task.task_id} className="rounded-md border border-slate-800 bg-slate-900 p-3">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-cyan-200">{task.task_id}</span>
                      <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase text-slate-400">{task.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-200">{task.brief}</p>
                    <div className="mt-2 text-[11px] text-slate-500">
                      {(task.agents ?? []).join(', ') || 'no agents selected'} | {compactDate(task.queued_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Section>

          <Section title="Stack Notes" icon={<ShieldCheck size={16} />}>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Server size={14} className="text-cyan-300" />
                Mission Control API serves UI and backend on :8787.
              </div>
              <div className="flex items-center gap-2">
                <GitBranch size={14} className="text-cyan-300" />
                Repo drift is visible above before any push decision.
              </div>
              <div className="flex items-center gap-2">
                <Code2 size={14} className="text-cyan-300" />
                Browser actions copy commands or queue tasks; they do not silently run shell commands.
              </div>
              <div className="flex items-center gap-2">
                <Clipboard size={14} className="text-cyan-300" />
                Runbooks are read from C:\ANTIGRAVITY\briefings\runbooks.
              </div>
            </div>
          </Section>
        </aside>
      </main>
    </div>
  );
};
