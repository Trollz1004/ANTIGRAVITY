#!/usr/bin/env node
/**
 * dateapp-desk-mcp — the support desk and marketing approval surface as MCP tools.
 *
 * WHY THIS EXISTS: nothing exposed the support operator queue or the marketing
 * approval inbox as tools, so agents shelled out to curl and had to *remember*
 * the draft-only rule. Here the rule is structural: there is NO publish tool and
 * no send tool. An agent using this server cannot reach a customer directly,
 * because the capability is absent rather than merely discouraged.
 *
 * Zero dependencies — raw JSON-RPC over stdio, Node built-ins only. Deliberate:
 * this repo already carries two MCP servers with their own node_modules.
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO = process.env.ANTIGRAVITY_ROOT || 'C:/ANTIGRAVITY';
const INBOX = join(REPO, 'ops', 'marketing-inbox');
const API = process.env.DATEAPP_API || 'http://127.0.0.1:8000';
const MC = process.env.MISSION_CONTROL_API || 'http://127.0.0.1:3151';

const send = (m) => process.stdout.write(JSON.stringify(m) + '\n');
const ok = (id, result) => send({ jsonrpc: '2.0', id, result });
const err = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } });
const text = (s) => ({ content: [{ type: 'text', text: s }] });

async function get(url, ms = 10000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { signal: c.signal });
    return { status: r.status, body: await r.text() };
  } catch (e) {
    return { status: 0, body: String(e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

const TOOLS = [
  {
    name: 'desk_health',
    description:
      'Verify the date-app backend and Mission Control are the services they claim to be, not just open ports. Returns identity plus status for each. Run this before trusting any other tool here.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'support_queue',
    description:
      'Read the support operator ticket queue (GET /api/v1/support/operator/tickets). Read-only. Use to see what is waiting before drafting anything.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'approval_queue',
    description:
      'Read the marketing/support approval queue and its verdicts (GET :3151/api/marketing/queue). Shows what is PENDING, APPROVED, or DENIED. Read-only.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'submit_draft',
    description:
      'Submit a customer-facing DRAFT for Joshua to approve. This does NOT publish or send — it queues the text for a human decision. There is deliberately no publish tool on this server. Writes a dated JSON file into ops/marketing-inbox/.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short label, max 300 chars' },
        body: { type: 'string', description: 'The copy exactly as it would send, max 20000 chars' },
        kind: { type: 'string', enum: ['post', 'reply', 'campaign', 'listing', 'other'] },
        platform: { type: 'string', description: 'e.g. support, instagram, email, whatsapp' },
      },
      required: ['title', 'body'],
    },
  },
];

// The banned-vocabulary list is NOT duplicated here. It is read at runtime from
// .githooks/pre-commit-canonical, which is the single source of truth and the one
// place the repo's own guard excludes from scanning. Duplicating it would (a)
// drift from the guard and (b) make this file trip the guard on every commit --
// which is exactly what happened on the first draft.
const GUARD = join(REPO, '.githooks', 'pre-commit-canonical');

function bannedPattern() {
  try {
    const src = readFileSync(GUARD, 'utf8');
    const parts = [];
    for (const key of ['BANNED_WORDS', 'BANNED_SPLITS']) {
      const m = src.match(new RegExp('^' + key + "='([^']*)'", 'm'));
      if (m && m[1]) parts.push(m[1]);
    }
    if (!parts.length) return null;
    return new RegExp('(' + parts.join('|') + ')', 'i');
  } catch {
    return null;
  }
}

async function call(name, args) {
  if (name === 'desk_health') {
    const a = await get(API + '/');
    const m = await get(MC + '/api/marketing/queue');
    let ident = 'unknown';
    try {
      ident = JSON.parse(a.body).service || 'unknown';
    } catch {}
    const backendOk = a.status === 200 && /YouAndINotAI/i.test(ident);
    const backendVerdict = backendOk
      ? 'UP (identity confirmed)'
      : a.status === 0
        ? 'DOWN'
        : 'WRONG SERVICE — a port answered but it is not the date-app API';
    const mcVerdict = m.status === 200 ? 'UP' : m.status === 0 ? 'DOWN' : 'REACHABLE but not serving the queue';
    return text(
      'date-app backend ' + API + '\n  status: ' + a.status + '\n  identity: ' + ident +
      '\n  verdict: ' + backendVerdict + '\n\nmission control ' + MC +
      '\n  /api/marketing/queue: ' + m.status + '\n  verdict: ' + mcVerdict
    );
  }

  if (name === 'support_queue') {
    const r = await get(API + '/api/v1/support/operator/tickets');
    if (r.status === 0) return text('BLOCKED: date-app backend unreachable at ' + API + '. ' + r.body);
    if (r.status === 401 || r.status === 403) {
      return text(
        'AUTH REJECTED (' + r.status + '). The operator queue requires an authenticated operator session; ' +
        'this server holds no credentials by design.'
      );
    }
    return text('HTTP ' + r.status + '\n' + r.body.slice(0, 4000));
  }

  if (name === 'approval_queue') {
    const r = await get(MC + '/api/marketing/queue');
    if (r.status === 0) return text('BLOCKED: Mission Control unreachable at ' + MC + '. ' + r.body);
    return text('HTTP ' + r.status + '\n' + r.body.slice(0, 6000));
  }

  if (name === 'submit_draft') {
    const a = args || {};
    const title = a.title;
    const body = a.body;
    const kind = a.kind || 'reply';
    const platform = a.platform || 'support';

    if (!title || !body) return text('REJECTED: both `title` and `body` are required.');
    if (title.length > 300) return text('REJECTED: title is ' + title.length + ' chars, limit is 300.');
    if (body.length > 20000) return text('REJECTED: body is ' + body.length + ' chars, limit is 20000.');

    const re = bannedPattern();
    if (!re) {
      return text(
        'BLOCKED: could not read the canonical word list from ' + GUARD + '.\n' +
        'Failing closed rather than submitting unscreened customer copy.'
      );
    }
    const hit = (title + '\n' + body).match(re);
    if (hit) {
      return text(
        'REJECTED by the compliance wall: customer-facing copy must not use that framing.\n' +
        'This is a Florida compliance wall, not style. A sentence DENYING it still trips -- ' +
        'rephrasing around it does not help; the words simply never appear.\n' +
        'Load the product-copy-business-only skill and rewrite. The authoritative list is in ' +
        '.githooks/pre-commit-canonical.'
      );
    }

    if (!existsSync(INBOX)) mkdirSync(INBOX, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = resolve(join(INBOX, stamp + '-desk-' + kind + '.json'));
    if (!file.startsWith(resolve(INBOX))) return text('REJECTED: refusing to write outside the inbox.');

    const payload = { source: 'dateapp-desk-mcp', platform, kind, title, body };
    writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');

    return text(
      'QUEUED FOR APPROVAL — not sent, not published.\n  file: ' + file +
      '\n  kind: ' + kind + '  platform: ' + platform +
      '\n\nJoshua approves or denies it. Read the verdict with approval_queue. ' +
      'This server has no publish or send tool.'
    );
  }

  throw new Error('unknown tool: ' + name);
}

let buf = '';
process.stdin.on('data', async (chunk) => {
  buf += chunk;
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }
    const id = msg.id;
    const method = msg.method;
    try {
      if (method === 'initialize') {
        ok(id, {
          protocolVersion: '2024-11-05',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'dateapp-desk-mcp', version: '1.0.0' },
          instructions:
            'Support desk and approval surface for YouAndINotAI. Read the support queue, read approval ' +
            'verdicts, and submit customer-facing text as a DRAFT. There is no publish or send tool here on ' +
            'purpose: everything customer-facing is decided by Joshua. Run desk_health first — a port ' +
            'answering is not identity.',
        });
      } else if (method === 'tools/list') {
        ok(id, { tools: TOOLS });
      } else if (method === 'tools/call') {
        ok(id, await call(msg.params && msg.params.name, msg.params && msg.params.arguments));
      } else if (method && method.startsWith('notifications/')) {
        // notifications take no response
      } else if (id !== undefined) {
        err(id, -32601, 'method not found: ' + method);
      }
    } catch (e) {
      if (id !== undefined) err(id, -32603, String(e.message || e));
    }
  }
});
