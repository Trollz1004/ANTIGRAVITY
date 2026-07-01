#!/usr/bin/env node
// paperclip-memory MCP bridge: read/write per-agent STATE.md with Supabase mirror.
// Usage: node scripts/paperclip/mcp-memory-bridge.js read <agent_id> <node_id>
//        node scripts/paperclip/mcp-memory-bridge.js write <agent_id> <node_id> "delta markdown"
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const AGENTS_DIR = path.join('paperclip', 'agents');

const CAPS = {
  ceo: 16 * 1024,
  cfo: 12 * 1024,
  cmo: 12 * 1024,
  cto: 14 * 1024,
  'mission-guardian': 10 * 1024,
  hermes: 10 * 1024,
};

function loadEnvFile(envPath, env) {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const m = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const [, key, raw] = m;
    let value = raw.trim();
    if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    if (env[key] === undefined || env[key] === '') env[key] = value;
  }
}

function loadEnv() {
  const env = { ...process.env };
  // Source-of-truth master env first, then stable repo-local override, then vault/briefings fallbacks.
  loadEnvFile("C:\\Users\\joshl\\OneDrive\\JOSHUA's-DO-NOT-COMMIT-TO-GITHUB\\MASTER-ANTIGRAVITY-ENV-2026-06-29T041901Z.env", env);
  loadEnvFile(path.resolve('.env.paperclip'), env);
  loadEnvFile('C:\\Users\\joshl\\OneDrive\\Personal Vault-Sabretooth\\MASTER-UNIVERSAL-ENV-TROLLZ1004.env', env);
  loadEnvFile(path.join('briefings', 'MASTER-UNIVERSAL-ENV-TROLLZ1004.env'), env);
  loadEnvFile(path.resolve('.env'), env);
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.SUPABASE_URL || env.SUPABASE_PROJECT_URL;
const SUPABASE_KEY = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;

function slugFromId(agentId) {
  return agentId.replace(/^paperclip-agents-/, '');
}

function statePath(agentId) {
  return path.join(AGENTS_DIR, slugFromId(agentId), 'STATE.md');
}

function nowIso() {
  return new Date().toISOString();
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function readLocalState(agentId) {
  const p = statePath(agentId);
  if (!fs.existsSync(p)) return { content: null, mtime: null };
  const stat = fs.statSync(p);
  return { content: fs.readFileSync(p, 'utf8'), mtime: stat.mtime.toISOString() };
}

function enforceCap(content, agentId) {
  const slug = slugFromId(agentId);
  const cap = CAPS[slug] || 12 * 1024;
  const buf = Buffer.byteLength(content, 'utf8');
  if (buf <= cap) return content;
  // Simple compression: collapse everything below the most recent `## Recent Decisions` to a summary placeholder.
  const lines = content.split(/\r?\n/);
  const keep = [];
  let inHistory = false;
  for (const line of lines) {
    if (line.startsWith('## Recent Decisions') || line.startsWith('## Next Actions')) {
      inHistory = true;
    }
    if (inHistory) keep.push(line);
    else if (line.startsWith('# ')) keep.push(line);
  }
  const compressed = [
    keep[0],
    '',
    '> STATE.md exceeded its size cap. Older history was summarized.',
    '> Full history is in Supabase `paperclip_agent_state` if the brain is connected.',
    '',
    ...keep.slice(1),
  ].join('\n');
  if (Buffer.byteLength(compressed, 'utf8') > cap) {
    // Last resort truncation with marker.
    return compressed.substring(0, cap - 200) + '\n\n[truncated by memory bridge]\n';
  }
  return compressed;
}

async function supabaseRequest(method, path, body) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'resolution=merge-duplicated-columns' : undefined,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`Supabase ${method} ${path} failed: ${res.status} ${err}`);
      return null;
    }
    if (method === 'GET') return await res.json();
    return true;
  } catch (e) {
    console.error(`Supabase request error: ${e.message}`);
    return null;
  }
}

async function readBrainState(agentId) {
  const rows = await supabaseRequest('GET', `/paperclip_agent_state?agent_id=eq.${encodeURIComponent(agentId)}&select=state_md,updated_at,session_count&order=updated_at.desc&limit=1`);
  if (!rows || rows.length === 0) return null;
  return rows[0];
}

async function writeBrainState(agentId, content, nodeId) {
  const slug = slugFromId(agentId);
  const cap = CAPS[slug] || 12 * 1024;
  const row = {
    agent_id: agentId,
    state_md: content,
    checksum: sha256(content),
    updated_at: nowIso(),
    node_id: nodeId || 'unknown',
    session_count: 1,
  };
  const existing = await readBrainState(agentId);
  if (existing && existing.session_count) {
    row.session_count = existing.session_count + 1;
  }
  return await supabaseRequest('POST', '/paperclip_agent_state', row);
}

async function readState(agentId, nodeId) {
  const local = readLocalState(agentId);
  const brain = await readBrainState(agentId);
  let content = local.content || '';
  let source = 'local';
  if (brain && (!local.mtime || new Date(brain.updated_at) > new Date(local.mtime))) {
    content = brain.state_md;
    source = 'supabase';
    if (local.content !== content) {
      fs.writeFileSync(statePath(agentId), content, 'utf8');
    }
  }
  if (!content) {
    console.log(`No STATE.md or brain row for ${agentId}. Agent should initialize from AGENTS.md.`);
    return;
  }
  console.log(`STATE source: ${source}`);
  console.log('---');
  console.log(content);
}

async function writeState(agentId, nodeId, delta) {
  const local = readLocalState(agentId);
  let content = local.content || `# ${agentId} — STATE.md\n\n**Agent ID:** ${agentId}\n**Cap:** ${(CAPS[slugFromId(agentId)] || 12*1024)/1024} KB\n`;
  const entry = `\n- ${nowIso()} (${nodeId || 'unknown'}): ${delta}`;
  // Append under Recent Decisions if present, else append at end.
  const marker = '## Recent Decisions';
  if (content.includes(marker)) {
    content = content.replace(marker, `${marker}${entry}`);
  } else {
    content += `\n${marker}\n${entry}\n`;
  }
  content = enforceCap(content, agentId);
  fs.writeFileSync(statePath(agentId), content, 'utf8');
  const brainOk = await writeBrainState(agentId, content, nodeId);
  console.log(`STATE written: ${statePath(agentId)} (${Buffer.byteLength(content, 'utf8')} bytes)`);
  console.log(`Supabase mirror: ${brainOk ? 'OK' : 'FAILED (fallback to local)'}`);
}

async function main() {
  const [cmd, agentId, nodeId, ...deltaParts] = process.argv.slice(2);
  if (!cmd || !agentId || !nodeId) {
    console.error('Usage: mcp-memory-bridge.js read <agent_id> <node_id>');
    console.error('       mcp-memory-bridge.js write <agent_id> <node_id> "delta markdown"');
    process.exit(1);
  }
  if (cmd === 'read') {
    await readState(agentId, nodeId);
  } else if (cmd === 'write') {
    const delta = deltaParts.join(' ');
    if (!delta) {
      console.error('No delta provided for write.');
      process.exit(1);
    }
    await writeState(agentId, nodeId, delta);
  } else {
    console.error(`Unknown command: ${cmd}`);
    process.exit(1);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
