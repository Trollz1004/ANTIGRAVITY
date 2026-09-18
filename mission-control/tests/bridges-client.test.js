import { describe, it, expect, vi, beforeEach } from 'vitest';

const byId = {};
beforeEach(() => {
  byId['bridges-panel'] = { innerHTML: '' };
  byId['bridges-run-select'] = { innerHTML: '', value: '' };
  byId['bridges-run-prompt'] = { value: '' };
  byId['bridges-run-result'] = { textContent: '' };
  global.document = {
    getElementById: (id) => byId[id] || null,
    querySelectorAll: () => [],
    addEventListener: vi.fn(),
  };
});

async function load() {
  return await import('../js/jarvis/bridges.js');
}

describe('bridges client — statusClass', () => {
  it('maps UP/PARKED/NOT CONFIGURED/DOWN to dot classes', async () => {
    const { statusClass } = await load();
    expect(statusClass('UP')).toBe('ok');
    expect(statusClass('PARKED')).toBe('');
    expect(statusClass('NOT CONFIGURED')).toBe('');
    expect(statusClass('DOWN')).toBe('down');
    expect(statusClass('AUTH MISSING')).toBe('down');
  });
});

describe('bridges client — rendering', () => {
  it('renders a card per bridge with status, identity, and a run note', async () => {
    const { renderBridges } = await load();
    const el = { innerHTML: '' };
    renderBridges(el, { bridges: [
      { id: 'claude', name: 'Claude Code', status: 'UP', identity: '2.1.275', canRun: true },
      { id: 'unreal', name: 'Unreal Engine', status: 'PARKED', identity: 'Parked per toolchain decision 2026-07-08', canRun: false, reason: 'Parked per toolchain decision 2026-07-08' },
    ] });
    expect(el.innerHTML).toContain('Claude Code');
    expect(el.innerHTML).toContain('accepts a prompt');
    expect(el.innerHTML).toContain('Unreal Engine');
    expect(el.innerHTML).toContain('Parked per toolchain decision 2026-07-08');
  });

  it('shows a placeholder with no bridges', async () => {
    const { renderBridges } = await load();
    const el = { innerHTML: '' };
    renderBridges(el, { bridges: [] });
    expect(el.innerHTML).toContain('No bridges');
  });

  it('escapes HTML in identity strings', async () => {
    const { renderBridgeCard } = await load();
    const html = renderBridgeCard({ id: 'x', name: 'X', status: 'UP', identity: '<script>alert(1)</script>', canRun: false });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('bridges client — loadBridges', () => {
  it('populates the panel and the runnable-bridge select', async () => {
    const { loadBridges } = await load();
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ bridges: [
      { id: 'claude', name: 'Claude Code', status: 'UP', canRun: true },
      { id: 'omniroute', name: 'OmniRoute', status: 'UP', canRun: false },
    ] }) }));
    await loadBridges(fetchImpl);
    expect(byId['bridges-panel'].innerHTML).toContain('Claude Code');
    expect(byId['bridges-run-select'].innerHTML).toContain('Claude Code');
    expect(byId['bridges-run-select'].innerHTML).not.toContain('OmniRoute');
  });

  it('shows an honest error when the fetch fails', async () => {
    const { loadBridges } = await load();
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 502, json: async () => ({ error: 'boom' }) }));
    await loadBridges(fetchImpl);
    expect(byId['bridges-panel'].innerHTML).toContain('unavailable');
  });
});

describe('bridges client — runBridgePrompt', () => {
  it('creates a proposal and reports it, explaining it needs founder approve', async () => {
    const { runBridgePrompt } = await load();
    byId['bridges-run-select'].value = 'claude';
    byId['bridges-run-prompt'].value = 'what is down?';
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 201, json: async () => ({ proposal: { id: 'p1' } }) }));
    await runBridgePrompt(fetchImpl);
    expect(byId['bridges-run-result'].textContent).toContain('p1');
    expect(byId['bridges-run-result'].textContent).toMatch(/founder approve/);
  });

  it('refuses locally when no bridge or prompt is chosen', async () => {
    const { runBridgePrompt } = await load();
    byId['bridges-run-select'].value = '';
    byId['bridges-run-prompt'].value = '';
    const fetchImpl = vi.fn();
    await runBridgePrompt(fetchImpl);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(byId['bridges-run-result'].textContent).toMatch(/Choose a bridge/);
  });
});
