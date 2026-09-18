import { describe, it, expect, vi } from 'vitest';
import {
  BRIDGE_IDS, RUNNABLE_BRIDGE_IDS,
  probeHermes, probeOpenclaw, probeClaude, probeCodex, probeOllama, probeOmniroute,
  probeObsidian, probeBrowserCdp, probeBuzz, probeUnreal,
  buildBridges, findBridge, createBridgeRunProposal, executeBridgeRun, askOmniRoute,
} from '../lib/bridges.mjs';

function fakeFetch(map) {
  return async (url) => {
    for (const [pattern, resp] of map) {
      if (pattern.test(url)) return resp;
    }
    throw new Error('unmocked url: ' + url);
  };
}
function textResp(status, text) { return { status, text: async () => text }; }

describe('bridges — identity probes', () => {
  it('hermes UP from the dashboard marker', async () => {
    const fetchImpl = fakeFetch([
      [/:9119/, textResp(200, '<script>window.__HERMES_SESSION_TOKEN__="x";</script>')],
      [/:8642/, textResp(200, '{}')],
    ]);
    const r = await probeHermes({ fetchImpl, exec: () => 'usage: hermes chat --oneshot' });
    expect(r.status).toBe('UP');
    expect(r.canRun).toBe(true);
  });

  it('hermes UP from the gateway marker alone', async () => {
    const fetchImpl = fakeFetch([
      [/:9119/, textResp(500, 'nope')],
      [/:8642/, textResp(200, '{"status":"ok","platform":"hermes-agent","version":"0.21.3"}')],
    ]);
    const r = await probeHermes({ fetchImpl, exec: () => 'ok' });
    expect(r.status).toBe('UP');
    expect(r.identity).toMatch(/gateway marker ok/);
  });

  it('hermes DOWN when neither marker answers', async () => {
    const fetchImpl = async () => { throw new Error('ECONNREFUSED'); };
    const r = await probeHermes({ fetchImpl, exec: () => { throw new Error('not found'); } });
    expect(r.status).toBe('DOWN');
    expect(r.canRun).toBe(false);
  });

  it('openclaw UP from the "OpenClaw Control" title marker, never a run capability', async () => {
    const fetchImpl = fakeFetch([[/:18789/, textResp(200, '<title>OpenClaw Control</title>')]]);
    const r = await probeOpenclaw({ fetchImpl });
    expect(r.status).toBe('UP');
    expect(r.canRun).toBe(false);
  });

  it('openclaw DOWN when the marker is absent even with a 200', async () => {
    const fetchImpl = fakeFetch([[/:18789/, textResp(200, '<html>something else</html>')]]);
    const r = await probeOpenclaw({ fetchImpl });
    expect(r.status).toBe('DOWN');
  });

  it('claude UP + canRun when the CLI answers --version', () => {
    const r = probeClaude({ exec: () => '2.1.275 (Claude Code)' });
    expect(r.status).toBe('UP');
    expect(r.canRun).toBe(true);
    expect(r.identity).toContain('Claude Code');
  });

  it('claude NOT CONFIGURED when the binary is missing', () => {
    const r = probeClaude({ exec: () => { throw new Error('ENOENT'); } });
    expect(r.status).toBe('NOT CONFIGURED');
    expect(r.canRun).toBe(false);
  });

  it('codex UP + canRun when both --version and exec --help answer', () => {
    const r = probeCodex({ exec: () => 'codex-cli 0.153.4' });
    expect(r.status).toBe('UP');
    expect(r.canRun).toBe(true);
  });

  it('codex NOT CONFIGURED when the binary is missing', () => {
    const r = probeCodex({ exec: () => { throw new Error('ENOENT'); } });
    expect(r.status).toBe('NOT CONFIGURED');
  });

  it('ollama reports models and labels itself fail-safe only', async () => {
    const fetchImpl = fakeFetch([[/api\/tags/, { status: 200, text: async () => JSON.stringify({ models: [{ name: 'gemma4:e4b' }] }) }]]);
    const r = await probeOllama({ fetchImpl });
    expect(r.status).toBe('UP');
    expect(r.canRun).toBe(true);
    expect(r.identity).toMatch(/fail-safe only/);
  });

  it('ollama DOWN when unreachable', async () => {
    const fetchImpl = async () => { throw new Error('ECONNREFUSED'); };
    const r = await probeOllama({ fetchImpl });
    expect(r.status).toBe('DOWN');
  });

  it('omniroute UP with a model count, key stays out of the identity string', async () => {
    const fetchImpl = fakeFetch([
      [/api\/health/, { status: 200, text: async () => JSON.stringify({ status: 'ok' }) }],
      [/v1\/models/, { status: 200, text: async () => JSON.stringify({ data: [{ id: 'auto/best-coding' }, { id: 'auto/best-fast' }] }) }],
    ]);
    const r = await probeOmniroute({ fetchImpl, key: 'testkey-secret-value-should-not-appear' });
    expect(r.status).toBe('UP');
    expect(r.modelCount).toBe(2);
    expect(r.identity).not.toContain('testkey-secret-value-should-not-appear');
  });

  it('omniroute DOWN when /api/health does not report ok', async () => {
    const fetchImpl = async () => { throw new Error('ECONNREFUSED'); };
    const r = await probeOmniroute({ fetchImpl });
    expect(r.status).toBe('DOWN');
  });

  it('obsidian reports a note count and REST identity', async () => {
    const r = await probeObsidian({ vaultPath: '', restProbe: async () => ({ up: false, detail: 'not probed' }) });
    expect(r.status).toBe('DOWN'); // no vault path exists
    expect(r.fileCount).toBeNull();
  });

  it('browser-cdp NOT CONFIGURED when Chrome is not open with the debug port', async () => {
    const fetchImpl = async () => { throw new Error('ECONNREFUSED'); };
    const r = await probeBrowserCdp({ fetchImpl });
    expect(r.status).toBe('NOT CONFIGURED');
  });

  it('browser-cdp UP with the browser identity string when reachable', async () => {
    const fetchImpl = fakeFetch([[/json\/version/, { status: 200, text: async () => JSON.stringify({ Browser: 'Chrome/128.0' }) }]]);
    const r = await probeBrowserCdp({ fetchImpl });
    expect(r.status).toBe('UP');
    expect(r.identity).toBe('Chrome/128.0');
  });

  it('buzz reports UP from a successful ledger read', async () => {
    const r = await probeBuzz({ readLedger: async () => ({ ok: true, lines: ['a', 'b'] }) });
    expect(r.status).toBe('UP');
    expect(r.identity).toContain('2 ledger line');
  });

  it('buzz reports NOT CONFIGURED with no ledger reader', async () => {
    const r = await probeBuzz({});
    expect(r.status).toBe('NOT CONFIGURED');
  });

  it('unreal is always PARKED with the toolchain note', () => {
    const r = probeUnreal();
    expect(r.status).toBe('PARKED');
    expect(r.identity).toMatch(/2026-07-08/);
    expect(r.canRun).toBe(false);
  });
});

describe('buildBridges', () => {
  it('returns all ten bridges, each with id/name/lastChecked, and never throws on a dead adapter', async () => {
    const deps = {
      hermes: { fetchImpl: async () => { throw new Error('down'); }, exec: () => { throw new Error('down'); } },
      openclaw: { fetchImpl: async () => { throw new Error('down'); } },
      claude: { exec: () => { throw new Error('down'); } },
      codex: { exec: () => { throw new Error('down'); } },
      ollama: { fetchImpl: async () => { throw new Error('down'); } },
      omniroute: { fetchImpl: async () => { throw new Error('down'); } },
      obsidian: { vaultPath: '' },
      browserCdp: { fetchImpl: async () => { throw new Error('down'); } },
      buzz: {},
    };
    const { bridges, at } = await buildBridges(deps);
    expect(bridges).toHaveLength(BRIDGE_IDS.length);
    expect(bridges.map((b) => b.id).sort()).toEqual([...BRIDGE_IDS].sort());
    for (const b of bridges) {
      expect(b.name).toBeTruthy();
      expect(b.lastChecked).toBe(at);
      expect(typeof b.canRun).toBe('boolean');
    }
    expect(findBridge(bridges, 'unreal').status).toBe('PARKED');
  });
});

describe('createBridgeRunProposal', () => {
  function fakeStore() {
    const created = [];
    return { created, create: (rec) => { const r = { id: 'p1', state: 'PROPOSED', ...rec }; created.push(r); return r; } };
  }

  it('creates a bridge.run proposal for a runnable bridge with a prompt', () => {
    const store = fakeStore();
    const r = createBridgeRunProposal({ store, id: 'claude', prompt: 'what is the House stage table?', bridgeRow: { canRun: true } });
    expect(r.status).toBe(201);
    expect(r.body.proposal.kind).toBe('bridge.run');
    expect(r.body.proposal.bridge).toBe('claude');
    expect(store.created[0].source).toBe('judge');
  });

  it('refuses an unknown bridge id', () => {
    const store = fakeStore();
    const r = createBridgeRunProposal({ store, id: 'nope', prompt: 'hi' });
    expect(r.status).toBe(404);
  });

  it('refuses a read-only bridge', () => {
    const store = fakeStore();
    const r = createBridgeRunProposal({ store, id: 'omniroute', prompt: 'hi', bridgeRow: { canRun: true } });
    expect(r.status).toBe(400);
  });

  it('refuses an empty prompt', () => {
    const store = fakeStore();
    const r = createBridgeRunProposal({ store, id: 'claude', prompt: '   ' });
    expect(r.status).toBe(400);
  });

  it('refuses when the bridge itself reports canRun:false', () => {
    const store = fakeStore();
    const r = createBridgeRunProposal({ store, id: 'codex', prompt: 'hi', bridgeRow: { canRun: false, reason: 'codex CLI not found' } });
    expect(r.status).toBe(409);
    expect(r.body.error).toMatch(/codex CLI not found/);
  });
});

describe('executeBridgeRun', () => {
  it('runs ollama via the injected streamOllamaChat', async () => {
    const proposal = { bridge: 'ollama', prompt: 'ping' };
    const r = await executeBridgeRun({ proposal, deps: { streamOllamaChatImpl: async () => ({ text: 'pong' }) } });
    expect(r.ok).toBe(true);
    expect(r.output).toBe('pong');
  });

  it('runs claude via the injected runClaude, collecting the result text', async () => {
    const proposal = { bridge: 'claude', prompt: 'status?' };
    const runClaudeImpl = ({ onEvent }) => { onEvent({ type: 'result', text: 'all green' }); onEvent({ type: 'exit', code: 0 }); return { child: {} }; };
    const r = await executeBridgeRun({ proposal, deps: { runClaudeImpl } });
    expect(r.ok).toBe(true);
    expect(r.output).toBe('all green');
  });

  it('reports failure honestly when a bridge has no executor', async () => {
    const proposal = { bridge: 'openclaw', prompt: 'hi' };
    const r = await executeBridgeRun({ proposal, deps: {} });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/no executor/);
  });
});

describe('askOmniRoute', () => {
  it('answers with auto/best-fast, key never in the response body', async () => {
    const fetchImpl = async (url, opts) => {
      expect(opts.headers.authorization).toBe('Bearer testkey-should-not-leak');
      return { ok: true, json: async () => ({ model: 'auto/best-fast', choices: [{ message: { content: 'hi there' } }] }) };
    };
    const r = await askOmniRoute({ key: 'testkey-should-not-leak', question: 'ping', fetchImpl });
    expect(r.status).toBe(200);
    expect(r.body.answer).toBe('hi there');
    expect(JSON.stringify(r.body)).not.toContain('testkey-should-not-leak');
  });

  it('503s honestly when no key is configured', async () => {
    const r = await askOmniRoute({ key: '', question: 'ping' });
    expect(r.status).toBe(503);
  });

  it('400s an empty question', async () => {
    const r = await askOmniRoute({ key: 'k', question: '  ' });
    expect(r.status).toBe(400);
  });
});
