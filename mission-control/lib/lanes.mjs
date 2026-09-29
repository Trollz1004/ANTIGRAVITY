/**
 * Board Room lane registry (2026-09-29, Joshua: "a universal hermes mcp
 * dashboard of whatever we called jarvis with every acp ai platform lane").
 * One record per AI platform lane: how it connects, which node it lives on,
 * which bridge row and fleet row (if any) describe it, and where its journal
 * is. This is data plus one pure join; it probes nothing itself.
 *
 *   connects: 'official CLI' | 'gateway' | 'ACP' | 'API' | 'browser' | 'hosted link' | 'relay'
 *   node:     an array of 'sabretooth' | 'alienware' | 'pi' | 'cloud' | 'browser'
 *             (a lane can live on more than one)
 *
 * Rulings of 2026-09-29 in force here: Hermes is JARVIS, no extras; the
 * official Claude CLI and the official Codex CLI are the only agent runtimes;
 * no third-party relay or runtime (Buzz, Paperclip) is added, so Buzz is
 * listed as a relay whose catalog may be read and which never executes;
 * Gemini is browser-side in Joshua's Chrome, never an API key on a node;
 * Emergent is a hosted link and is never reported "up".
 *
 * joinLaneStatus attaches each lane's live rows (from the shapes /api/bridges
 * and /api/fleet already return) and never invents one: a lane with neither
 * row is NOT CONFIGURED with detail 'no probe on this node'.
 *
 * The Board Room is the mission's think tank (Joshua, 2026-09-29): every AI lane
 * has a seat, files its own trust record, and reviews the drift the others leave
 * behind; the collab tracks are TRACKS below. It is not a vote room: the vote
 * stays with the founder's ClawX board (FOUNDER_BOARD points there).
 *
 * composeBoardRoom is the one function that assembles the GET /api/boardroom
 * payload (and the MCP boardroom tool's). Every read is injected, so the server
 * passes the same bridge and fleet builders its other routes call and this
 * module holds no second set of probes; the record and TRUST.md checks take an
 * injected fs. It lives here, not in server.mjs, because the privacy guard in
 * tests/claude-bridge-hardening.test.js forbids the word "drift" anywhere in
 * server.mjs (it is the operator's launcher command).
 */
import { existsSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDriftBoard } from './drift.mjs';

export const LANES = [
  {
    id: 'claude', name: 'Claude Code', role: 'judge lane', connects: 'official CLI',
    node: ['sabretooth', 'alienware', 'cloud'], bridgeId: 'claude',
    journal: '.agents/journals/claude-judge/STATE.md',
    note: 'Official signed-in Claude CLI. Branches, tests, merges and pushes; never routed through OmniRoute.',
  },
  {
    id: 'codex', name: 'Codex', role: 'judge lane', connects: 'official CLI',
    node: ['sabretooth'], bridgeId: 'codex',
    note: 'Official Codex CLI. The second judge lane beside Claude Code.',
  },
  {
    id: 'hermes', name: 'Hermes', role: 'is JARVIS: the brain behind Driftus', connects: 'gateway',
    node: ['sabretooth'], bridgeId: 'hermes', fleetId: 'hermes',
    journal: '.agents/journals/hermes/STATE.md',
    note: 'Gateway :9119 on Sabretooth. Runs the official Claude and Codex CLIs; no extras.',
  },
  {
    id: 'opencode', name: 'OpenCode', role: 'ACP lane', connects: 'ACP',
    node: ['sabretooth'], fleetId: 'opencode',
    journal: '.agents/journals/opencode/STATE.md',
    note: 'No probe port is named anywhere in this repo, so its fleet row stays NOT CONFIGURED until one is.',
  },
  {
    id: 'openclaw', name: 'OpenClaw', role: 'API lane on the Pi', connects: 'API',
    node: ['pi'], bridgeId: 'openclaw', fleetId: 'openclaw',
    journal: '.agents/journals/openclaw/STATE.md',
    note: 'Joshua: "have to use apis and i use them on pi". The probe reads OPENCLAW_URL from this node, so DOWN here does not by itself mean the Pi copy is down.',
  },
  {
    id: 'gemini', name: 'Gemini', role: 'browser lane', connects: 'browser',
    node: ['browser'], bridgeId: 'gemini',
    note: 'Gemini in Chrome, in Joshua\'s own signed-in browser. The Pi API lane is his by his word. No API key is held on Sabretooth or Alienware.',
  },
  {
    id: 'emergent', name: 'Emergent wing', role: 'affiliate swarm', connects: 'hosted link',
    node: ['cloud'], bridgeId: 'emergent', fleetId: 'emergent',
    journal: '.agents/journals/emergent/STATE.md',
    note: 'Hosted workspace. LINKED means a link is configured, never that it is up; nothing here probes it and no key is held for it.',
  },
  {
    id: 'genspark', name: 'Genspark', role: 'helper lane', connects: 'hosted link',
    node: ['cloud'], fleetId: 'genspark',
    journal: '.agents/journals/genspark/STATE.md',
    note: 'Hosted helper (research, sheets). No probe target exists, so its fleet row stays NOT CONFIGURED.',
  },
  {
    id: 'buzz', name: 'Buzz relay', role: 'relay (read only)', connects: 'relay',
    node: ['cloud'], bridgeId: 'buzz',
    note: 'not a runtime by ruling 2026-09-29; its ACP catalog may be read, it never executes',
  },
];

// The bridges and fleet arguments are the whole payloads the routes return
// ({ bridges: [...] } and { rows: [...] }); a bare array is accepted too.
function rowsOf(payload, key) {
  if (Array.isArray(payload)) return payload;
  return payload && Array.isArray(payload[key]) ? payload[key] : [];
}

function pickBridge(row) {
  if (!row) return null;
  const out = { id: row.id, status: row.status, identity: row.identity };
  if (row.url) out.url = row.url;
  if (row.lastChecked) out.lastChecked = row.lastChecked;
  return out;
}

function pickFleet(row) {
  if (!row) return null;
  return { status: row.status, currentTask: row.currentTask ?? null, queueDepth: row.queueDepth ?? 0 };
}

function fleetDetail(row) {
  if (row.status === 'UP') return 'fleet probe answered';
  if (row.status === 'DOWN') return 'fleet probe did not answer';
  return 'fleet row reports ' + row.status;
}

/**
 * The lane's own status. The identity-checked bridge row wins when it says
 * anything other than NOT CONFIGURED, then the fleet row; otherwise the lane
 * is NOT CONFIGURED, with the bridge row's own reason when there is one.
 */
function laneStatus(bridge, fleetRow) {
  if (bridge && bridge.status && bridge.status !== 'NOT CONFIGURED') {
    return { status: bridge.status, detail: bridge.identity || '', source: 'bridge' };
  }
  if (fleetRow && fleetRow.status && fleetRow.status !== 'NOT CONFIGURED') {
    return { status: fleetRow.status, detail: fleetDetail(fleetRow), source: 'fleet' };
  }
  if (bridge) return { status: 'NOT CONFIGURED', detail: bridge.identity || 'no probe on this node', source: 'bridge' };
  if (fleetRow) return { status: 'NOT CONFIGURED', detail: 'no probe target configured for this lane', source: 'fleet' };
  return { status: 'NOT CONFIGURED', detail: 'no probe on this node', source: null };
}

/**
 * Attach each lane's live bridge row and fleet row. Returns new objects; the
 * registry and the payloads are never mutated.
 */
export function joinLaneStatus(lanes, { bridges, fleet } = {}) {
  const bridgeRows = rowsOf(bridges, 'bridges');
  const fleetRows = rowsOf(fleet, 'rows');
  return (lanes || []).map((lane) => {
    const bridge = lane.bridgeId ? bridgeRows.find((b) => b && b.id === lane.bridgeId) || null : null;
    const fleetRow = lane.fleetId ? fleetRows.find((r) => r && r.lane === lane.fleetId) || null : null;
    return { ...lane, ...laneStatus(bridge, fleetRow), bridge: pickBridge(bridge), fleet: pickFleet(fleetRow) };
  });
}

export const AFFILIATE_BRIEF = 'ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md';
export const AFFILIATE_TERMS = 'Founding Member $14.99/mo, 3 months $39.99, 12 months $99.99; up to 50% of net, lifetime of the referred subscription';
export const FOUNDER_BOARD = { tab: 'board', note: "the founder's ClawX board is the Supreme Court; votes stay there, never here. This room is the House. Claude and Codex validate the code's security first, then the rabbit gets to debate (Joshua, 2026-09-29)" };

/**
 * The think tank's tracks. `record` is a repo-relative file that holds the
 * track's own record; a track with no record on disk is reported NOT
 * CONFIGURED, and nothing is written for it here.
 */
export const TRACKS = [
  { id: 'mission', name: '#UntilNoKidInNeed', kind: 'mission', lead: 'joshua', record: 'domains/untilnokidinneed.com/dao/index.html' },
  { id: 'marketing', name: 'Marketing collab', kind: 'collab', lead: 'emergent', record: 'ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md' },
  { id: 'education', name: 'Education collab', kind: 'collab', lead: null, record: null },
  { id: 'pet-saving', name: 'Pet saving collab', kind: 'collab', lead: null, record: null },
  { id: 'joshua-learning', name: 'Joshua is learning collab', kind: 'collab', lead: null, record: null },
];

const repoPath = (repoRoot, rel) => join(repoRoot || '', ...String(rel).split('/'));

/** Each track with `recordExists` (a disk check, only when a record is named) and an honest status. */
export function resolveTracks(tracks, { repoRoot, exists = existsSync } = {}) {
  return (tracks || []).map((t) => {
    const recordExists = Boolean(t.record) && exists(repoPath(repoRoot, t.record));
    return recordExists
      ? { ...t, recordExists: true, status: 'ON RECORD' }
      : { ...t, recordExists: false, status: 'NOT CONFIGURED', detail: 'no record on disk yet' };
  });
}

/** Where a lane files its own trust record: beside its journal, else .agents/journals/<lane id>/. */
export function trustPathOf(lane) {
  const dir = lane.journal ? lane.journal.split('/').slice(0, -1).join('/') : '.agents/journals/' + lane.id;
  return dir + '/TRUST.md';
}

/**
 * One attestation per lane: { lane, status: 'FILED', at, lines } when the lane's
 * TRUST.md exists and holds something, else { lane, status: 'NOT FILED' } (with a
 * detail when the file is empty or unreadable). `filedAt` is the date on the file's own
 * "Filed <date>" line when it has one; `modifiedAt` is the checkout's file time and is
 * never presented as the filing date.
 * Nothing is ever written here: each seat files its own; nobody files for another.
 */
/**
 * The date the lane itself wrote into its TRUST.md ("Filed 2026-09-29"), or null.
 * Git does not keep file times, so a checkout's mtime is the checkout time, never
 * the filing date; only the file's own line says when the seat filed.
 */
export function filedDateOf(text) {
  const m = /^\s*(?:[-*]\s*)?Filed\s+(\d{4}-\d{2}-\d{2})\b/im.exec(String(text || ''));
  return m ? m[1] : null;
}

export function readAttestations(lanes, { repoRoot, exists = existsSync, stat = statSync, readFile = readFileSync } = {}) {
  return (lanes || []).map((lane) => {
    const file = repoPath(repoRoot, trustPathOf(lane));
    if (!exists(file)) return { lane: lane.id, status: 'NOT FILED' };
    try {
      const text = String(readFile(file, 'utf8'));
      if (!text.trim()) return { lane: lane.id, status: 'NOT FILED', detail: 'TRUST.md is empty' };
      const lines = text.replace(/\r?\n$/, '').split(/\r?\n/).length;
      const out = { lane: lane.id, status: 'FILED', lines, modifiedAt: new Date(stat(file).mtimeMs).toISOString() };
      const filed = filedDateOf(text);
      if (filed) out.filedAt = filed;
      return out;
    } catch (e) {
      return { lane: lane.id, status: 'NOT FILED', detail: 'TRUST.md could not be read (' + ((e && e.code) || 'error') + ')' };
    }
  });
}

/**
 * The Board Room payload: { lanes, attestations, tracks, drift, affiliate, founderBoard, cloud, at }.
 *   getBridges / getFleet  async readers returning the /api/bridges and /api/fleet shapes
 *   token, fetchImpl       for the GitHub read (the token is used as a header there and never returned)
 *   wingUrl, cloudUrl      the configured Emergent wing link and cloud dashboard address
 *   repoRoot, fs           where the track records, the affiliate brief and the TRUST.md files are checked
 * A reader that throws is not swallowed (that would print a crashed probe as "no probe on this node"); the caller answers with the error.
 */
export async function composeBoardRoom({ getBridges, getFleet, token, fetchImpl, wingUrl, cloudUrl, repoRoot, fs = {}, now = () => Date.now() } = {}) {
  const [bridges, fleet, drift] = await Promise.all([
    getBridges ? getBridges() : null,
    getFleet ? getFleet() : null,
    buildDriftBoard({ token, fetchImpl, now }),
  ]);
  const exists = fs.exists || existsSync;
  return {
    lanes: joinLaneStatus(LANES, { bridges, fleet }),
    attestations: readAttestations(LANES, { repoRoot, exists, stat: fs.stat, readFile: fs.readFile }),
    tracks: resolveTracks(TRACKS, { repoRoot, exists }),
    drift,
    affiliate: { wing: wingUrl || null, brief: AFFILIATE_BRIEF, briefExists: exists(repoPath(repoRoot, AFFILIATE_BRIEF)), terms: AFFILIATE_TERMS },
    founderBoard: { ...FOUNDER_BOARD },
    cloud: cloudUrl || null,
    at: new Date(now()).toISOString(),
  };
}
