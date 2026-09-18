/**
 * Operational bridge hub. This module intentionally contains operational targets
 * only; official vote handling is owned by official-vote-routes.ts.
 */
import type { Express } from 'express';

export const OPERATIONAL_BRIDGE_TARGET_IDS = ['hermes', 'openclaw', 'opencode'] as const;
export type OperationalBridgeTargetId = (typeof OPERATIONAL_BRIDGE_TARGET_IDS)[number];
export type OperationalBridgeState = 'ready' | 'unavailable' | 'not-configured';

export interface OperationalBridgeStatus {
  id: OperationalBridgeTargetId;
  label: string;
  kind: 'operational';
  state: OperationalBridgeState;
  sendEnabled: boolean;
  lastSeen: string | null;
  detail: string;
}

interface OperationalBridgeDefinition {
  id: OperationalBridgeTargetId;
  label: string;
  url?: string;
  sendEnabled: boolean;
}

function configuredUrl(name: string, fallback?: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || fallback;
}

function definitions(): OperationalBridgeDefinition[] {
  const openclawPort = Number(process.env.OPENCLAW_PORT ?? 18789) || 18789;
  const hermesPort = Number(process.env.HERMES_PORT ?? 9119) || 9119;
  return [
    { id: 'hermes', label: 'HERMES', url: configuredUrl('HERMES_BRIDGE_URL', `http://127.0.0.1:${hermesPort}/api/chat`), sendEnabled: Boolean(process.env.HERMES_BRIDGE_URL?.trim()) },
    { id: 'openclaw', label: 'OPENCLAW', url: configuredUrl('OPENCLAW_BRIDGE_URL', `http://127.0.0.1:${openclawPort}/api/chat`), sendEnabled: true },
    { id: 'opencode', label: 'OPENCODE', url: configuredUrl('OPENCODE_BRIDGE_URL', `http://127.0.0.1:${Number(process.env.OPENCODE_PORT ?? 4096) || 4096}/api/chat`), sendEnabled: Boolean(process.env.OPENCODE_BRIDGE_URL?.trim()) },
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

export async function getOperationalBridgeStatuses(): Promise<OperationalBridgeStatus[]> {
  const now = new Date().toISOString();
  return Promise.all(definitions().map(async (definition): Promise<OperationalBridgeStatus> => {
    if (!definition.url || !definition.sendEnabled) {
      return { ...definition, kind: 'operational', state: 'not-configured', lastSeen: null, detail: 'bridge URL not configured' };
    }
    const available = await reachability(definition.url);
    return { ...definition, kind: 'operational', state: available ? 'ready' : 'unavailable', lastSeen: available ? now : null, detail: available ? 'operational bridge reachable' : 'operational bridge unavailable' };
  }));
}

function definitionFor(target: string): OperationalBridgeDefinition | undefined {
  return definitions().find((definition) => definition.id === target);
}

function cleanPrompt(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

async function forwardOperationalPrompt(definition: OperationalBridgeDefinition, prompt: string): Promise<{ sender: string; text: string }> {
  if (!definition.url) throw new Error('bridge not configured');
  const response = await fetch(definition.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: prompt }) });
  if (!response.ok) throw new Error('bridge request failed');
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const text = typeof data.reply === 'string' ? data.reply : typeof data.text === 'string' ? data.text : null;
  if (!text) throw new Error('bridge response invalid');
  return { sender: definition.id, text };
}

export function registerBridgeRoutes(app: Express): void {
  app.get('/api/bridge/status', async (_req, res) => {
    res.json({ bridges: await getOperationalBridgeStatuses() });
  });
  app.post('/api/bridge/:target', async (req, res) => {
    const definition = definitionFor(req.params.target);
    if (!definition) return res.status(404).json({ error: 'Unknown operational bridge target.' });
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
