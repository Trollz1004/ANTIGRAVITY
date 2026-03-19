import { NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

type ServiceState = 'live' | 'degraded' | 'down';

type ServiceCard = {
  name: string;
  status: ServiceState;
  detail: string;
  meta?: string[];
};

async function runCommand(command: string) {
  const { stdout } = await execFileAsync('cmd.exe', ['/d', '/s', '/c', command], {
    cwd: path.resolve(process.cwd(), '..'),
    windowsHide: true,
    timeout: 8000,
    maxBuffer: 1024 * 1024,
  });

  return stdout.trim();
}

async function runSshCommand(host: string, command: string) {
  const { stdout } = await execFileAsync(
    'ssh.exe',
    ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=3', host, command],
    {
      cwd: path.resolve(process.cwd(), '..'),
      windowsHide: true,
      timeout: 8000,
      maxBuffer: 1024 * 1024,
    },
  );

  return stdout.trim();
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(url, {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getOpenClawCard(): Promise<ServiceCard> {
  const configPath = path.join(process.env.USERPROFILE ?? '', '.openclaw', 'openclaw.json');
  const [healthResponse, uiResponse] = await Promise.all([
    fetchWithTimeout('http://127.0.0.1:18789/healthz').then((res) => res.ok ? res.json() : null),
    fetchWithTimeout('http://127.0.0.1:18789/').catch(() => null),
  ]);

  let version = 'Unknown';
  let primaryModel = 'Unknown';
  let workspace = 'Unknown';
  let concurrency = 'Unknown';

  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as {
      meta?: { lastTouchedVersion?: string };
      agents?: { defaults?: { workspace?: string; maxConcurrent?: number; model?: { primary?: string } } };
    };
    version = config.meta?.lastTouchedVersion ?? version;
    primaryModel = config.agents?.defaults?.model?.primary ?? primaryModel;
    workspace = config.agents?.defaults?.workspace ?? workspace;
    concurrency = String(config.agents?.defaults?.maxConcurrent ?? 'Unknown');
  }

  const isLive = Boolean(healthResponse?.ok) && Boolean(uiResponse?.ok);

  return {
    name: 'Sabretooth OpenClaw',
    status: isLive ? 'live' : 'down',
    detail: isLive ? 'Gateway health and local control UI both respond.' : 'Gateway health or UI is unavailable.',
    meta: [
      `Version: ${version}`,
      `Primary model: ${primaryModel}`,
      `Workspace: ${workspace}`,
      `Max concurrent: ${concurrency}`,
      'Control UI: http://127.0.0.1:18789',
    ],
  };
}

async function getOllamaCard(): Promise<ServiceCard> {
  const response = await fetchWithTimeout('http://127.0.0.1:11434/api/tags');
  if (!response.ok) {
    return {
      name: 'Sabretooth Ollama',
      status: 'down',
      detail: `Local Ollama returned HTTP ${response.status}.`,
    };
  }

  const payload = await response.json();
  const models = Array.isArray(payload.models) ? payload.models : [];

  return {
    name: 'Sabretooth Ollama',
    status: models.length > 0 ? 'live' : 'degraded',
    detail: models.length > 0 ? `${models.length} local models visible.` : 'Ollama responded but no models were listed.',
    meta: models.slice(0, 4).map((item: { name?: string }) => item.name ?? 'unknown'),
  };
}

async function getCrossfireCard(): Promise<ServiceCard> {
  let backend = await fetchWithTimeout('http://192.168.0.5:8000/api/health').catch(() => null);
  const frontend = await fetchWithTimeout('http://192.168.0.5:5173').catch(() => null);

  let backendLive = backend?.ok ?? false;
  const frontendLive = frontend?.ok ?? false;
  let backendProbe = backend?.status ? `HTTP ${backend.status}` : 'offline';

  if (!backendLive) {
    try {
      const sshProbe = await runSshCommand('9020', 'curl -s http://localhost:8000/api/health');
      if (sshProbe.includes('"status":"ok"')) {
        backendLive = true;
        backendProbe = 'ok via SSH local probe';
      }
    } catch {
      // Keep the original degraded/down state if the SSH fallback also fails.
    }
  }

  return {
    name: '9020 Crossfire',
    status: backendLive && frontendLive ? 'live' : backendLive || frontendLive ? 'degraded' : 'down',
    detail:
      backendLive && frontendLive
        ? 'Backend and frontend both respond on node 9020.'
        : backendLive
          ? 'Backend is live, frontend is not responding.'
          : frontendLive
            ? 'Frontend is live, backend is not responding.'
            : 'No crossfire response detected from node 9020.',
    meta: [
      `Backend: ${backendProbe}`,
      `Frontend: ${frontend?.status ?? 'offline'}`,
      'Node: 192.168.0.5',
    ],
  };
}

async function getT5500Card(): Promise<ServiceCard> {
  try {
    const hostname = await runSshCommand('t5500', 'hostname');
    return {
      name: 'T5500 Reachability',
      status: 'live',
      detail: 'Sabretooth can reach the reserved date-app/build node over SSH.',
      meta: [
        `Host: ${hostname || 't5500'}`,
        'Role: date-app recovery and build lane',
      ],
    };
  } catch {
    return {
      name: 'T5500 Reachability',
      status: 'degraded',
      detail: 'T5500 did not answer over SSH during this check.',
      meta: ['Role: date-app recovery and build lane'],
    };
  }
}

async function getProductionCard(): Promise<ServiceCard> {
  const response = await fetchWithTimeout('https://youandinotai.com/api/v1/health').catch(() => null);

  if (!response?.ok) {
    return {
      name: 'YouAndINotAI Production',
      status: 'down',
      detail: 'Live production health endpoint is unavailable.',
      meta: [`HTTP: ${response?.status ?? 'offline'}`],
    };
  }

  const payload = await response.json();

  return {
    name: 'YouAndINotAI Production',
    status: payload.status === 'ok' ? 'live' : 'degraded',
    detail: 'Cloudflare Pages and Cloud Run health endpoint responded.',
    meta: [
      `DB: ${payload.db_connected ? 'connected' : 'down'}`,
      `Square: ${payload.square_connected ? 'connected' : 'down'}`,
      `Users: ${payload.user_count ?? 'unknown'}`,
    ],
  };
}

async function getRepoCard(): Promise<ServiceCard> {
  const [branch, head, porcelain] = await Promise.all([
    runCommand('git branch --show-current'),
    runCommand('git rev-parse --short HEAD'),
    runCommand('git status --porcelain'),
  ]);

  const clean = porcelain.length === 0;

  return {
    name: 'Repo State',
    status: clean ? 'live' : 'degraded',
    detail: clean ? 'main is clean and ready.' : 'Worktree has uncommitted changes.',
    meta: [
      `Branch: ${branch || 'unknown'}`,
      `Head: ${head || 'unknown'}`,
      `Worktree: ${clean ? 'clean' : 'dirty'}`,
    ],
  };
}

async function getHeartbeatCard(): Promise<ServiceCard> {
  const configPath = path.join(process.env.USERPROFILE ?? '', '.openclaw', 'openclaw.json');

  if (!fs.existsSync(configPath)) {
    return {
      name: 'Telegram Heartbeat',
      status: 'down',
      detail: 'OpenClaw config file was not found.',
    };
  }

  const raw = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(raw) as {
    agents?: { defaults?: { heartbeat?: { target?: string; every?: string; to?: string } } };
  };

  const heartbeat = config.agents?.defaults?.heartbeat;
  const configured = heartbeat?.target === 'telegram' && Boolean(heartbeat?.to);

  return {
    name: 'Telegram Heartbeat',
    status: configured ? 'live' : 'degraded',
    detail: configured ? 'Hourly Telegram heartbeat is configured in OpenClaw.' : 'Telegram heartbeat is not fully configured.',
    meta: [
      `Target: ${heartbeat?.target ?? 'unset'}`,
      `Cadence: ${heartbeat?.every ?? 'unset'}`,
      `Channel: ${configured ? 'configured' : 'unset'}`,
    ],
  };
}

export async function GET() {
  try {
    const cards = await Promise.all([
      getRepoCard(),
      getOpenClawCard(),
      getOllamaCard(),
      getCrossfireCard(),
      getT5500Card(),
      getProductionCard(),
      getHeartbeatCard(),
    ]);

    const liveCount = cards.filter((card) => card.status === 'live').length;

    return NextResponse.json({
      cards,
      summary: {
        liveCount,
        total: cards.length,
        status: liveCount === cards.length ? 'green' : liveCount >= cards.length - 1 ? 'mostly-green' : 'attention',
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to build node watch status:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        cards: [],
        summary: {
          liveCount: 0,
          total: 0,
          status: 'attention',
          lastUpdated: new Date().toISOString(),
        },
      },
      { status: 500 },
    );
  }
}
