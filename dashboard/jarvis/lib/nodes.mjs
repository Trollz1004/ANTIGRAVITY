/**
 * God's-eye data: the LAN nodes and the services that live on them, each probed
 * with an identity check (a 200 from the wrong process is not "up"). Pure module:
 * the caller injects fetch, so tests never touch the network.
 */
export const NODES = [
  { id: 'alienware', name: 'Alienware', ip: '192.168.0.40', role: 'JARVIS host · Dream Online MMO · Hermes · Ollama (RX 6800)' },
  { id: 'sabertooth', name: 'Sabertooth', ip: '192.168.0.8', role: 'OmniRoute router · Sentry · Mission Control' },
];

const A = '127.0.0.1';
const S = '192.168.0.8';
const obj = (j) => j && typeof j === 'object' && !Array.isArray(j);

export const SERVICES = [
  { id: 'jarvis', label: 'JARVIS HUD', node: 'alienware', port: 9150, url: `http://${A}:9150/health`, identity: ({ json }) => obj(json) && json.service === 'airi-dashboard' },
  { id: 'hermes', label: 'Hermes dashboard', node: 'alienware', port: 9119, url: `http://${A}:9119/api/health`, identity: ({ json }) => obj(json) && json.ok === true && 'version' in json },
  { id: 'ollama', label: 'Ollama (Vulkan)', node: 'alienware', port: 11434, url: `http://${A}:11434/api/tags`, identity: ({ json }) => obj(json) && Array.isArray(json.models) },
  { id: 'live-npc-lab', label: 'Dream Live NPC Lab', node: 'alienware', port: 9127, url: `http://${A}:9127/health`, identity: ({ status, json }) => status === 200 && obj(json) && (json.ok === true || json.status === 'ok' || /npc/i.test(String(json.service || json.name || ''))) },
  { id: 'dreamops', label: 'DreamOps Bridge', node: 'alienware', port: 9133, url: `http://${A}:9133/health`, identity: ({ status, json }) => status === 200 && obj(json) && (json.ok === true || json.status === 'ok' || /dreamops/i.test(String(json.service || json.name || ''))) },
  { id: 'crosslisting', label: 'Crosslisting OS', node: 'alienware', port: 3000, url: `http://${A}:3000/`, identity: ({ status, text }) => status === 200 && /<html|<!doctype/i.test(text) },
  { id: 'obsidian', label: 'Obsidian Local REST', node: 'alienware', port: 27123, url: `http://${A}:27123/`, identity: ({ text }) => /Obsidian Local REST API/.test(text) },
  { id: 'omniroute', label: 'OmniRoute', node: 'sabertooth', port: 20128, url: `http://${S}:20128/v1/models`, identity: ({ status, json }) => status === 401 || status === 403 || (status === 200 && obj(json) && Array.isArray(json.data)) },
  { id: 'sentry', label: "Fable's Sentry", node: 'sabertooth', port: 9140, url: `http://${S}:9140/api/status`, identity: ({ status, json }) => status === 200 && obj(json) },
  { id: 'mission-control', label: 'Mission Control', node: 'sabertooth', port: 3151, url: `http://${S}:3151/`, identity: ({ status, text }) => status === 200 && text.length > 0 },
];

export async function probeService(svc, { fetch: fetchImpl = globalThis.fetch, timeoutMs = 4000 } = {}) {
  const c = new AbortController();
  const timer = setTimeout(() => c.abort(), timeoutMs);
  const t0 = Date.now();
  const base = { id: svc.id, label: svc.label, node: svc.node, port: svc.port, url: svc.url };
  try {
    const r = await fetchImpl(svc.url, { signal: c.signal, headers: { accept: 'application/json, text/html;q=0.9, */*;q=0.1' } });
    const text = await r.text();
    let json = null; try { json = JSON.parse(text); } catch {}
    const latencyMs = Date.now() - t0;
    if (r.status >= 500) return { ...base, up: false, state: 'DOWN', latencyMs, detail: 'HTTP ' + r.status };
    const ok = Boolean(svc.identity({ status: r.status, text: String(text || ''), json }));
    return { ...base, up: ok, state: ok ? 'UP' : 'WRONG SERVICE', latencyMs, detail: ok ? 'identity ok' : `HTTP ${r.status} answered but the identity check failed` };
  } catch (e) {
    const latencyMs = Date.now() - t0;
    const detail = c.signal.aborted ? `timeout after ${timeoutMs} ms` : String((e && e.message) || e);
    return { ...base, up: false, state: 'DOWN', latencyMs, detail };
  } finally {
    clearTimeout(timer);
  }
}

export async function probeAll(opts = {}) {
  const results = await Promise.all(SERVICES.map((s) => probeService(s, opts)));
  const nodes = NODES.map((n) => {
    const services = results.filter((r) => r.node === n.id);
    return { ...n, services, up: services.filter((s) => s.up).length, total: services.length };
  });
  return { nodes, services: results, at: new Date().toISOString() };
}
