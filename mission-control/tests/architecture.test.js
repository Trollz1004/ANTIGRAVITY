import { describe, it, expect } from 'vitest'
import { EventEmitter } from 'node:events'
import {
  parseStages, splitStageName, slugify, guessType, healthPortStatus,
  buildArchitectureJson, buildArchitecture, fallbackHtml,
  renderArchitectureHtml, readStageTextAtRef, renderArchitectureDiff,
} from '../lib/architecture.mjs'

const FIXTURE_PS1 = `
$Stages = @(
    @{ Name = 'PostgreSQL :5432'; Required = \$true
       Probe = { \$true } }
    @{ Name = 'OmniRoute :20128'; Required = \$true
       Probe = { \$true } }
    @{ Name = 'JARVIS (Mission Control) :9150'; Required = \$true
       Probe = { \$true } }
    @{ Name = 'Hermes :9119'; Required = \$false
       Probe = { \$true } }
    @{ Name = 'OpenClaw :18789'; Required = \$false
       Probe = { \$true } }
    @{ Name = "FABLE'S SENTRY :9140 (wall display)"; Required = \$false
       Probe = { \$true } }
    @{ Name = 'Cloudflared tunnel (site PUBLIC)'; Required = \$true
       Probe = { \$true } }
    @{ Name = 'Frontend :3200 (production bundle)'; Required = \$true
       Probe = { \$true } }
    @{ Name = 'Backend API :8000 (db connected)'; Required = \$true
       Probe = { \$true } }
    @{ Name = 'Housekeeping (wakes + logs)'; Required = \$false
       Probe = { \$true } }
)
`;

const FIXTURE_HEALTH = {
  required: { postgres_5432: { status: 'UP' }, omniroute_20128: { status: 'UP' } },
  optional: { hermes_9119: { status: 'UP' } },
};

describe('lib/architecture.mjs — parseStages / splitStageName', () => {
  it('parses every stage with its required flag', () => {
    const stages = parseStages(FIXTURE_PS1);
    expect(stages.length).toBe(10);
    expect(stages[0]).toEqual({ rawName: 'PostgreSQL :5432', required: true });
    expect(stages.find((s) => s.rawName.includes('Hermes')).required).toBe(false);
  })
  it('strips the port token and parens from the label; handles double-quoted names', () => {
    expect(splitStageName('JARVIS (Mission Control) :9150')).toEqual({ label: 'JARVIS', port: '9150' });
    expect(splitStageName("FABLE'S SENTRY :9140 (wall display)")).toEqual({ label: "FABLE'S SENTRY", port: '9140' });
    expect(splitStageName('Cloudflared tunnel (site PUBLIC)')).toEqual({ label: 'Cloudflared tunnel', port: null });
  })
})

describe('lib/architecture.mjs — slugify / guessType / healthPortStatus', () => {
  it('slugify produces a stable, non-empty id', () => {
    expect(slugify('PostgreSQL')).toBe('postgresql');
    expect(slugify('')).toBe('x');
  })
  it('guessType maps known labels to archify\'s enum', () => {
    expect(guessType('PostgreSQL')).toBe('database');
    expect(guessType('Frontend')).toBe('frontend');
    expect(guessType('JARVIS')).toBe('frontend');
    expect(guessType('Cloudflared tunnel')).toBe('cloud');
    expect(guessType('Hermes')).toBe('backend');
  })
  it('healthPortStatus flattens required+optional by trailing _<port>', () => {
    expect(healthPortStatus(FIXTURE_HEALTH)).toEqual({ '5432': 'UP', '20128': 'UP', '9119': 'UP' });
    expect(healthPortStatus(null)).toEqual({});
  })
})

describe('lib/architecture.mjs — buildArchitectureJson (pure)', () => {
  const json = buildArchitectureJson({ stageText: FIXTURE_PS1, health: FIXTURE_HEALTH });

  it('produces the required top-level archify shape', () => {
    expect(json.schema_version).toBe(1);
    expect(json.diagram_type).toBe('architecture');
    expect(Array.isArray(json.components)).toBe(true);
    expect(Array.isArray(json.connections)).toBe(true);
    expect(Array.isArray(json.boundaries)).toBe(true);
  })

  it('nodes = Sabertooth and Alienware, each with at least one member', () => {
    const labels = json.boundaries.map((b) => b.label).sort();
    expect(labels).toEqual(['Alienware', 'Sabertooth']);
    for (const b of json.boundaries) expect(b.wraps.length).toBeGreaterThan(0);
  })

  it('edge count > 0 and every edge references a real component id', () => {
    expect(json.connections.length).toBeGreaterThan(0);
    const ids = new Set(json.components.map((c) => c.id));
    for (const e of json.connections) { expect(ids.has(e.from)).toBe(true); expect(ids.has(e.to)).toBe(true); }
  })

  it('merges live health status into the required-stages card (PostgreSQL is not one of the wired primary nodes, but still appears with its live status)', () => {
    const card = json.cards.find((c) => c.title === 'Required House stages');
    expect(card.items.some((i) => i.includes('PostgreSQL') && i.includes('UP'))).toBe(true);
  })

  it('the wired primary components also carry live status in their tag', () => {
    const omni = json.components.find((c) => c.label === 'OmniRoute');
    expect(omni.tag).toContain('UP');
  })

  it('every House stage appears somewhere — as a component or in the cards — none dropped', () => {
    const stageLabels = parseStages(FIXTURE_PS1).map((s) => splitStageName(s.rawName).label);
    const componentLabels = new Set(json.components.map((c) => c.label));
    const cardText = JSON.stringify(json.cards);
    for (const label of stageLabels) {
      expect(componentLabels.has(label) || cardText.includes(label)).toBe(true);
    }
  })

  it('never sends a null/empty tag (archify requires tag to be a non-empty string when present)', () => {
    for (const c of json.components) if ('tag' in c) expect(typeof c.tag).toBe('string');
  })
})

describe('lib/architecture.mjs — buildArchitecture (live wrapper)', () => {
  it('honest empty stage text when the House script is missing: only the 3 fixed non-stage components remain, no fabricated stage nodes', () => {
    const r = buildArchitecture({ housePath: '/nope.ps1', healthPath: '/nope.json', exists: () => false });
    expect(r.archify.components.map((c) => c.id).sort()).toEqual(['alienware-host', 'crosslisting', 'health-probe']);
    expect(r.sources.healthLoaded).toBe(false);
  })
  it('keeps metadata (at/sources) outside the archify-schema object', () => {
    const r = buildArchitecture({ housePath: '/x.ps1', healthPath: '/x.json', exists: () => true, readFile: (p) => (p === '/x.ps1' ? FIXTURE_PS1 : JSON.stringify(FIXTURE_HEALTH)) });
    expect(r.archify.at).toBeUndefined();
    expect(r.archify.sources).toBeUndefined();
    expect(r.at).toBeTruthy();
    expect(r.sources.healthLoaded).toBe(true);
  })
})

describe('lib/architecture.mjs — fallbackHtml', () => {
  it('never an empty frame: lists nodes, services, and edges as text', () => {
    const json = buildArchitectureJson({ stageText: FIXTURE_PS1, health: FIXTURE_HEALTH });
    const html = fallbackHtml(json);
    expect(html).toContain('<html');
    expect(html).toContain('Sabertooth');
    expect(html).toContain('PostgreSQL');
  })
  it('renders something sane even for an empty graph', () => {
    const html = fallbackHtml({ components: [], connections: [], boundaries: [], cards: [] });
    expect(html).toContain('<html');
  })
})

function fakeChild({ exitCode = 0, stderr = '' } = {}) {
  const child = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = () => {};
  setTimeout(() => {
    if (stderr) child.stderr.emit('data', stderr);
    child.emit('close', exitCode);
  }, 0);
  return child;
}

describe('lib/architecture.mjs — renderArchitectureHtml (CLI shell-out, injected spawn)', () => {
  const json = { schema_version: 1, diagram_type: 'architecture', meta: { title: 't' }, components: [], connections: [], boundaries: [] };

  it('never an empty iframe: falls back to plain HTML when the CLI binary is missing', async () => {
    const r = await renderArchitectureHtml({ json, archifyBin: '/nope/archify.mjs', workDir: '/tmp/x', exists: () => false });
    expect(r.ok).toBe(false);
    expect(r.html).toContain('<html');
    expect(r.reason).toMatch(/not found/);
  })

  it('serves the CLI-produced HTML on a clean exit', async () => {
    const spawnImpl = () => fakeChild({ exitCode: 0 });
    const r = await renderArchitectureHtml({
      json, archifyBin: '/x/archify.mjs', workDir: '/tmp/x', exists: () => true,
      spawnImpl, writeFile: () => {}, mkdir: () => {}, readFile: () => '<html>rendered</html>',
    });
    expect(r.ok).toBe(true);
    expect(r.html).toContain('rendered');
  })

  it('falls back to plain HTML (never empty) on a non-zero exit', async () => {
    const spawnImpl = () => fakeChild({ exitCode: 2, stderr: 'schema error' });
    const r = await renderArchitectureHtml({
      json, archifyBin: '/x/archify.mjs', workDir: '/tmp/x', exists: () => true,
      spawnImpl, writeFile: () => {}, mkdir: () => {},
    });
    expect(r.ok).toBe(false);
    expect(r.html).toContain('<html');
    expect(r.reason).toMatch(/exited 2/);
  })
})

describe('lib/architecture.mjs — readStageTextAtRef / renderArchitectureDiff (git show, injected exec)', () => {
  it('readStageTextAtRef shells out to `git show <ref>:<path>` read-only', () => {
    const exec = (cwd, args) => { expect(args[0]).toBe('show'); expect(args[1]).toBe('main:scripts/fables-house/FABLES-HOUSE.ps1'); return FIXTURE_PS1; };
    const r = readStageTextAtRef({ repoPath: '/repo', ref: 'main', exec });
    expect(r.ok).toBe(true);
    expect(r.text).toContain('PostgreSQL');
  })

  it('renderArchitectureDiff shells out to `archify compare` and reports the CLI output', async () => {
    const exec = () => FIXTURE_PS1;
    const spawnImpl = () => fakeChild({ exitCode: 0 });
    const r = await renderArchitectureDiff({
      repoPath: '/repo', base: 'main', head: 'feature', healthPath: '/x.json', archifyBin: '/x/archify.mjs',
      workDir: '/tmp/x', exec, spawnImpl, exists: () => true, readFile: () => '<html>delta</html>', writeFile: () => {}, mkdir: () => {},
    });
    expect(r.ok).toBe(true);
    expect(r.html).toContain('delta');
    expect(r.healthIsLive).toBe(true);
  })

  it('reports a clean error (not a throw) when a ref cannot be read', async () => {
    const exec = () => { throw new Error('unknown revision'); };
    const r = await renderArchitectureDiff({ repoPath: '/repo', base: 'nope', head: 'feature', healthPath: '/x.json', archifyBin: '/x/archify.mjs', workDir: '/tmp/x', exec });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/unknown revision/);
  })
})
