/**
 * God's-eye data: the LAN nodes and the services that live on them, each probed
 * with an identity check (a 200 from the wrong process is not "up"). Pure module:
 * the caller injects fetch, so tests never touch the network.
 */
export const NODES = [
  { id: 'alienware', name: 'Alienware', ip: '192.168.0.40', role: 'JARVIS host · Dream Online MMO · Hermes · Ollama (RX 6800)' },
  { id: 'sabertooth', name: 'Sabertooth', ip: '192.168.0.8', role: 'OmniRoute router · Sentry · Revenue stack (Date App, Directus, Ludus)' },
  { id: 'public-web', name: 'Public web', ip: 'internet', role: 'Landing pages · DNS should be Cloudflare' },
];

import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

const A = '127.0.0.1';
const S = '192.168.0.8';
const obj = (j) => j && typeof j === 'object' && !Array.isArray(j);

/**
 * TLS-tolerant transport for node-local probes of services with self-signed
 * certificates (the Obsidian Local REST plugin serves https with its own cert).
 * Same response shape as fetch: { status, text }. Honours an AbortSignal.
 */
export function insecureTransport(url, { signal } = {}) {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) return reject(new Error('aborted'));
    const mod = url.startsWith('https:') ? httpsRequest : httpRequest;
    const req = mod(url, { rejectUnauthorized: false, timeout: 0 }, (r) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => resolve({ status: r.statusCode, text: () => Promise.resolve(Buffer.concat(chunks).toString('utf8')) }));
    });
    req.on('timeout', () => req.destroy(new Error('socket timeout')));
    req.on('error', reject);
    if (signal) signal.addEventListener('abort', () => req.destroy(new Error('aborted')), { once: true });
    req.end();
  });
}

export const SERVICES = [
  { id: 'jarvis', label: 'JARVIS HUD', node: 'alienware', port: 9150, url: `http://${A}:9150/health`, identity: ({ json }) => obj(json) && json.service === 'airi-dashboard' },
  { id: 'hermes', label: 'Hermes dashboard', node: 'alienware', port: 9119, url: `http://${A}:9119/api/health`, identity: ({ json }) => obj(json) && json.ok === true && 'version' in json },
  { id: 'ollama', label: 'Ollama (Vulkan)', node: 'alienware', port: 11434, url: `http://${A}:11434/api/tags`, identity: ({ json }) => obj(json) && Array.isArray(json.models) },
  { id: 'live-npc-lab', label: 'Dream Live NPC Lab', node: 'alienware', port: 9127, url: `http://${A}:9127/health`, identity: ({ status, json }) => status === 200 && obj(json) && (json.ok === true || json.status === 'ok' || /npc/i.test(String(json.service || json.name || ''))) },
  { id: 'dreamops', label: 'DreamOps Bridge', node: 'alienware', port: 9133, url: `http://${A}:9133/health`, identity: ({ status, json }) => status === 200 && obj(json) && (json.ok === true || json.status === 'ok' || /dreamops/i.test(String(json.service || json.name || ''))) },
  { id: 'crosslisting', label: 'Crosslisting OS', node: 'alienware', port: 3000, url: `http://${A}:3000/api/trpc/system.health?input=%7B%22json%22%3A%7B%22timestamp%22%3A0%7D%7D`, identity: ({ status, json }) => status === 200 && obj(json) && json.result?.data?.json?.ok === true },
  { id: 'obsidian', label: 'Obsidian Local REST', node: 'alienware', port: 27124, url: `https://${A}:27124/`, insecure: true, identity: ({ text }) => /Obsidian Local REST API/.test(text) },
  { id: 'omniroute', label: 'OmniRoute', node: 'sabertooth', port: 20128, url: `http://${S}:20128/v1/models`, identity: ({ status, json }) => status === 401 || status === 403 || (status === 200 && obj(json) && Array.isArray(json.data)) },
  { id: 'sentry', label: "Fable's Sentry", node: 'sabertooth', port: 9140, url: `http://${S}:9140/api/status`, identity: ({ status, json }) => status === 200 && obj(json) },
  // Revenue stack on Sabertooth (Sentry watches these; the ports are HTTP so they probe honestly).
  // For third-party APIs we don't own, "an HTTP server answered with a non-5xx" is the honest identity —
  // guessing deeper health paths would render real services as WRONG SERVICE (seen live: Date App 404s /api/health).
  { id: 'date-app', label: 'Date App API', node: 'sabertooth', port: 8080, url: `http://${S}:8080/api/health`, identity: ({ status }) => status > 0 && status < 500 },
  { id: 'directus', label: 'Directus CMS', node: 'sabertooth', port: 8055, url: `http://${S}:8055/server/health`, identity: ({ status, text }) => status === 200 && /ok|healthy|no_content|""/i.test(String(text || '')) },
  { id: 'ludus', label: 'Ludus AI', node: 'sabertooth', port: 3010, url: `http://${S}:3010/`, identity: ({ status }) => status > 0 && status < 500 },
  // Public domains: real landing pages, probed from the open internet.
  { id: 'dream-online-net', label: 'dream-online.net', node: 'public-web', port: 443, url: 'https://dream-online.net/', identity: ({ status }) => status > 0 && status < 500 },
  { id: 'youandinotai-com', label: 'youandinotai.com', node: 'public-web', port: 443, url: 'https://youandinotai.com/', identity: ({ status }) => status > 0 && status < 500 },
  { id: 'onlinerecycle-net', label: 'onlinerecycle.net', node: 'public-web', port: 443, url: 'https://onlinerecycle.net/', identity: ({ status }) => status > 0 && status < 500 },
  { id: 'joshlcoleman-io', label: 'joshlcoleman.io', node: 'public-web', port: 443, url: 'https://joshlcoleman.io/', identity: ({ status }) => status > 0 && status < 500 },
  // No mission-control entry: THIS dashboard is mission control (the board you are looking at).
];

export async function probeService(svc, { fetch, timeoutMs = 4000 } = {}) {
  const c = new AbortController();
  const timer = setTimeout(() => c.abort(), timeoutMs);
  const t0 = Date.now();
  const base = { id: svc.id, label: svc.label, node: svc.node, port: svc.port, url: svc.url };
  try {
    // Self-signed local services (obsidian) need the tls-tolerant transport when the
    // caller did not inject fetch (tests inject theirs so DI stays total).
    const fetchImpl = fetch || (svc.insecure ? insecureTransport : globalThis.fetch);
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
  const { nameservers = true, fetch: fetchImpl = globalThis.fetch, ...rest } = opts;
  const results = await Promise.all(SERVICES.map((s) => probeService(s, { ...rest, fetch: fetchImpl })));
  const dns = nameservers ? await checkNameservers(PUBLIC_DOMAINS, { fetch: fetchImpl }) : null;
  const nodes = NODES.map((n) => {
    const services = results.filter((r) => r.node === n.id).map((r) => {
      if (n.id !== 'public-web') return r;
      const info = dns && dns[new URL(r.url).hostname];
      return info ? { ...r, ns: info.provider } : r;
    });
    return { ...n, services, up: services.filter((s) => s.up).length, total: services.length };
  });
  return { nodes, services: results, dns, at: new Date().toISOString() };
}

/** Public domains whose DNS should live on Cloudflare. */
export const PUBLIC_DOMAINS = ['dream-online.net', 'youandinotai.com', 'onlinerecycle.net', 'joshlcoleman.io'];

/**
 * Live NS lookup per domain via DNS-over-HTTPS (Cloudflare's 1.1.1.1). Classifies
 * the registrar of record honestly: cloudflare | ionos | other | none | unknown.
 */
export async function checkNameservers(domains, { doh, fetch: fetchImpl = globalThis.fetch, timeoutMs = 4000 } = {}) {
  const ask = doh || (async (name, { signal } = {}) => {
    const r = await fetchImpl(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=NS`, { signal, headers: { accept: 'application/dns-json' } });
    return r.json();
  });
  const out = {};
  await Promise.all(domains.map(async (d) => {
    const controller = new AbortController();
    let timer;
    try {
      const answer = Promise.resolve().then(() => ask(d, { signal: controller.signal }));
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error(`timeout after ${timeoutMs} ms`)); }, timeoutMs);
      });
      const j = await Promise.race([answer, timeout]);
      const ns = (j.Answer || []).filter((a) => a.type === 2).map((a) => String(a.data || '').toLowerCase());
      if (!ns.length) out[d] = { provider: 'none', nameservers: [] };
      else if (ns.every((n) => n.includes('cloudflare'))) out[d] = { provider: 'cloudflare', nameservers: ns };
      else if (ns.some((n) => n.includes('ui-dns') || n.includes('ionos') || n.includes('1and1') || n.includes('kundenserver'))) out[d] = { provider: 'ionos', nameservers: ns };
      else out[d] = { provider: 'other', nameservers: ns };
    } catch (e) {
      out[d] = { provider: 'unknown', error: String((e && e.message) || e) };
    } finally {
      clearTimeout(timer);
    }
  }));
  return out;
}
