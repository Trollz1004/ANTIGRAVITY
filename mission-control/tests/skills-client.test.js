import { describe, it, expect, vi, beforeEach } from 'vitest';

const byId = {};
beforeEach(() => {
  byId['skills-panel'] = { innerHTML: '' };
  global.document = { getElementById: (id) => byId[id] || null, querySelectorAll: () => [], addEventListener: vi.fn() };
});

async function load() { return await import('../js/jarvis/skills.js'); }

const FIXTURE = {
  plugins: [{ id: 'github@claude-plugins-official', version: '1.2.3' }],
  mcpServers: [{ name: 'claude.ai Claude Docs', state: 'Connected', connected: true }],
  userSkills: [{ id: 'ab-testing', name: 'ab-testing', description: 'A/B testing playbook' }],
  projectSkills: [{ id: 'archify', name: 'archify', description: 'diagrams' }],
  obsidianCommands: [{ id: 'obsidian-daily', description: "Create today's daily note" }],
  loadOnRestart: { skill: 'sabretooth-node', relatedSkills: ['judge-house', 'fables-house'] },
  counts: { plugins: 1, mcpServers: 1, userSkills: 1, projectSkills: 1 },
};

describe('skills client — renderSkillsPanel', () => {
  it('renders plugins, MCP servers, user skills, obsidian commands, and load-on-restart', async () => {
    const { renderSkillsPanel } = await load();
    const el = { innerHTML: '' };
    renderSkillsPanel(el, FIXTURE);
    expect(el.innerHTML).toContain('github@claude-plugins-official');
    expect(el.innerHTML).toContain('claude.ai Claude Docs');
    expect(el.innerHTML).toContain('ab-testing');
    expect(el.innerHTML).toContain('obsidian-daily');
    expect(el.innerHTML).toContain('sabretooth-node');
    expect(el.innerHTML).toContain('judge-house');
  });

  it('never repeats the full project skills tree (points at the Agents tab instead)', async () => {
    const { renderSkillsPanel } = await load();
    const el = { innerHTML: '' };
    renderSkillsPanel(el, FIXTURE);
    expect(el.innerHTML).toContain('Agents');
    expect(el.innerHTML).not.toContain('archify');
  });

  it('is honest about an empty section', async () => {
    const { renderSkillsPanel } = await load();
    const el = { innerHTML: '' };
    renderSkillsPanel(el, { ...FIXTURE, mcpServers: [], counts: { ...FIXTURE.counts, mcpServers: 0 } });
    expect(el.innerHTML).toContain('No MCP servers configured');
  });
});

describe('skills client — loadSkillsPanel', () => {
  it('fetches and renders', async () => {
    const { loadSkillsPanel } = await load();
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => FIXTURE }));
    await loadSkillsPanel(fetchImpl);
    expect(byId['skills-panel'].innerHTML).toContain('github@claude-plugins-official');
  });

  it('reports an honest error on failure', async () => {
    const { loadSkillsPanel } = await load();
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({ error: 'nope' }) }));
    await loadSkillsPanel(fetchImpl);
    expect(byId['skills-panel'].innerHTML).toContain('unavailable');
  });
});
