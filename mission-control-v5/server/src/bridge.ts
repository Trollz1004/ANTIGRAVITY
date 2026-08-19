/**
 * BRIDGE HUB — operational bridges and official-platform visibility.
 *
 * Official governance votes are deliberately not proxied through OmniRoute or
 * any general bridge. The dashboard may show their connection state, but vote
 * execution remains on each platform's designated official bridge.
 */
import type { Express } from 'express';

export const BRIDGE_TARGET_IDS = [
  'hermes',
  'openclaw',
  'claude',
  'gemini',
  'github-copilot',
  'meta-ai',
  'chatgpt',
  'manus',
] as const;

export type BridgeTargetId = (typeof BRIDGE_TARGET_IDS)[number];
export type BridgeState = 'ready' | 'unavailable' | 'not-configured';

export interface BridgeStatus {
  id: BridgeTargetId;
  label: string;
  kind: 'operational' | 'official-governance';
  state: BridgeState;
  sendEnabled: boolean;
  lastSeen: string | null;
  detail: string;
}

interface BridgeDefinition {
  id: BridgeTargetId;
  label: string;
  kind: BridgeStatus['kind'];
  url?: string;
  sendEnabled: boolean;
}

function configuredUrl(name: string, fallback?: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || fallback;
}

function definitions(): BridgeDefinition[] {
  const openclawPort = Number(process.env.OPENCLAW_PORT ?? 18789) || 18789;
  const hermesPort = Number(process.env.HERMES_PORT ?? 9119) || 9119;
  return [
    {
      id: 'hermes',
      label: 'HERMES',
      kind: 'operational',
      url: configuredUrl('HERMES_BRIDGE_URL', `http://127.0.0.1:${hermesPort}/api/chat`),
      sendEnabled: Boolean(process.env.HERMES_BRIDGE_URL?.trim()),
    },
    {
      id: 'openclaw',
      label: 'OPENCLAW',
      kind: 'operational',
      url: configuredUrl('OPENCLAW_BRIDGE_URL', `http://127.0.0.1:${openclawPort}/api/chat`),
      sendEnabled: true,
    },
    { id: 'claude', label: 'CLAUDE', kind: 'official-governance', sendEnabled: false },
    { id: 'gemini', label: 'GEMINI', kind: 'official-governance', sendEnabled: false },
    { id: 'github-copilot', label: 'GITHUB COPILOT', kind: 'official-governance', sendEnabled: false },
    { id: 'meta-ai', label: 'META AI', kind: 'official-governance', sendEnabled: false },
    { id: 'chatgpt', label: 'CHATGPT / OPENAI', kind: 'official-governance', sendEnabled: false },
    { id: 'manus', label: 'MANUS', kind: 'official-governance', sendEnabled: false },
  ];
}

async function reachability(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.status > 0;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Status does not send prompts, mutate configuration, or resolve model routes. */
export async function getBridgeStatuses(): Promise<BridgeStatus[]> {
  const now = new Date().toISOString();
  return Promise.all(
    definitions().map(async (definition): Promise<BridgeStatus> => {
      if (definition.kind === 'official-governance') {
        return {
          ...definition,
          state: 'not-configured',
          sendEnabled: false,
          lastSeen: null,
          detail: 'official bridge required; not routed through OmniRoute',
        };
      }

      if (!definition.url || (definition.id === 'hermes' && !definition.sendEnabled)) {
        return {
          ...definition,
          state: 'not-configured',
          lastSeen: null,
          detail: 'bridge URL not configured',
        };
      }

      const available = await reachability(definition.url);
      return {
        ...definition,
        state: available ? 'ready' : 'unavailable',
        lastSeen: available ? now : null,
        detail: available ? 'operational bridge reachable' : 'operational bridge unavailable',
      };
    }),
  );
}

function bridgeDefinition(target: string): BridgeDefinition | undefined {
  return definitions().find((definition) => definition.id === target);
}

function cleanPrompt(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

async function forwardOperationalPrompt(definition: BridgeDefinition, prompt: string): Promise<{ sender: string; text: string }> {
  if (!definition.url) throw new Error('bridge not configured');
  const response = await fetch(definition.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: prompt }),
  });
  if (!response.ok) throw new Error('bridge request failed');
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const text = typeof data.reply === 'string' ? data.reply : typeof data.text === 'string' ? data.text : null;
  if (!text) throw new Error('bridge response invalid');
  return { sender: definition.id, text };
}

export function registerBridgeRoutes(app: Express): void {
  app.get('/api/bridge/status', async (_req, res) => {
    res.json({ bridges: await getBridgeStatuses() });
  });

  app.post('/api/bridge/:target', async (req, res) => {
    const definition = bridgeDefinition(req.params.target);
    if (!definition) return res.status(404).json({ error: 'Unknown bridge target.' });
    if (definition.kind === 'official-governance') {
      return res.status(409).json({ error: 'Official governance votes require their designated platform bridge.' });
    }
    if (!definition.sendEnabled) return res.status(409).json({ error: 'Operational bridge is not configured.' });

    const prompt = cleanPrompt(req.body?.prompt);
    if (!prompt) return res.status(400).json({ error: 'Missing prompt.' });
    try {
      const reply = await forwardOperationalPrompt(definition, prompt);
      return res.json({ ...reply, timestamp: new Date().toISOString() });
    } catch {
      return res.status(502).json({ error: 'Bridge request failed. Check its operational status.' });
    }
  });
}
