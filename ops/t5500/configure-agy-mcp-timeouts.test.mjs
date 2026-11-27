import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');
const REPO_MCP_CONFIG_PATH = path.join(REPO_ROOT, '.agents', 'mcp_config.json');
const SCRIPT_PATH = path.join(HERE, 'configure-agy-mcp-timeouts.ps1');

const FORBIDDEN_USERS = ['josh' + 'l', 'josh' + 'i', 'NSFW_' + 'BOTS'];
const HARDCODED_USER_PATH_RE = new RegExp(
  `(?:[A-Za-z]:\\\\+Users\\\\+|/Users/)(?:${FORBIDDEN_USERS.join('|')})\\b`,
  'i',
);

function runScript(args = [], extraEnv = {}) {
  return spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', SCRIPT_PATH, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
  });
}

function makeFixtureConfig() {
  return {
    mcpServers: {
      'custom-tool': {
        command: 'node',
        args: ['tool.js'],
        singleArg: ['--flag'],
        emptyArr: [],
        emptyObj: {},
        env: {
          API_TOKEN: '${CUSTOM_API_TOKEN}',
        },
      },
      'low-timeout-tool': {
        type: 'http',
        url: 'https://example.invalid/mcp?a=1&b=2',
        timeoutSeconds: 30,
        headers: {
          Authorization: 'Bearer ${LOW_TIMEOUT_SECRET}',
          'X-Special': 'a&b<c>',
        },
      },
      omniroute: {
        type: 'http',
        url: 'http://192.168.0.15:20128/api/mcp/stream',
        headers: {
          Authorization: 'Bearer ${OMNIROUTE_API_KEY}',
        },
      },
      'omniroute-cli': {
        command: 'cmd',
        args: ['/c', 'omniroute', 'mcp'],
        timeoutSeconds: 120,
      },
      rea: {
        command: 'npx',
        args: ['-y', 'rea-agents', 'mcp'],
      },
      remake: {
        command: 'node',
        args: ['remake.js'],
      },
      supermemory: {
        command: 'node',
        args: ['supermemory.js'],
      },
      playwright: {
        command: 'npx',
        args: ['-y', '@playwright/mcp'],
        timeoutSeconds: 900,
      },
      supabase: {
        command: 'npx',
        args: ['-y', '@supabase/mcp-server-supabase'],
      },
      kit: {
        command: 'node',
        args: ['kit.js'],
      },
      'mission-mcp': {
        type: 'http',
        url: 'http://192.168.0.15:3901/mcp',
      },
      'ai-memory': {
        command: 'node',
        args: ['ai-memory.js'],
        timeout: 5000,
      },
      'generous-default': {
        command: 'node',
        args: ['generous.js'],
        timeoutSeconds: 600,
      },
    },
  };
}

test('.agents/mcp_config.json is valid JSON with generous integer timeoutSeconds on every mcpServer', () => {
  assert.ok(fs.existsSync(REPO_MCP_CONFIG_PATH), '.agents/mcp_config.json must exist');
  const raw = fs.readFileSync(REPO_MCP_CONFIG_PATH, 'utf8');
  assert.doesNotMatch(raw, HARDCODED_USER_PATH_RE, '.agents/mcp_config.json must not hardcode user paths');

  const parsed = JSON.parse(raw);
  assert.ok(parsed && typeof parsed === 'object' && !Array.isArray(parsed), 'Root config must be an object');
  assert.ok(
    parsed.mcpServers && typeof parsed.mcpServers === 'object' && !Array.isArray(parsed.mcpServers),
    'mcpServers must be an object',
  );

  const entries = Object.entries(parsed.mcpServers);
  assert.ok(entries.length >= 3, 'Expected at least 3 servers in .agents/mcp_config.json');

  for (const [name, cfg] of entries) {
    assert.ok(cfg && typeof cfg === 'object' && !Array.isArray(cfg), `${name} must be an object`);
    assert.ok(
      Number.isInteger(cfg.timeoutSeconds),
      `${name} must define integer timeoutSeconds (got ${JSON.stringify(cfg.timeoutSeconds)})`,
    );
    assert.ok(cfg.timeoutSeconds >= 60, `${name}.timeoutSeconds must be >= 60 (got ${cfg.timeoutSeconds})`);
  }

  assert.ok(
    parsed.mcpServers['gemini-node-mcp'].timeoutSeconds >= 120,
    `gemini-node-mcp.timeoutSeconds should be >= 120 (got ${parsed.mcpServers['gemini-node-mcp'].timeoutSeconds})`,
  );
  assert.ok(
    parsed.mcpServers.omniroute.timeoutSeconds >= 300,
    `omniroute.timeoutSeconds must be >= 300 (got ${parsed.mcpServers.omniroute.timeoutSeconds})`,
  );
  assert.ok(
    parsed.mcpServers['omniroute-cli'].timeoutSeconds >= 300,
    `omniroute-cli.timeoutSeconds must be >= 300 (got ${parsed.mcpServers['omniroute-cli'].timeoutSeconds})`,
  );
});

test('configure-agy-mcp-timeouts.ps1 exists, uses $env:USERPROFILE, has no hardcoded usernames, and never opens .env files', () => {
  assert.ok(fs.existsSync(SCRIPT_PATH), 'ops/t5500/configure-agy-mcp-timeouts.ps1 must exist');
  const src = fs.readFileSync(SCRIPT_PATH, 'utf8');

  assert.match(src, /\$env:USERPROFILE\b/, 'Script must use $env:USERPROFILE');
  assert.match(
    src,
    /Join-Path\s+\$env:USERPROFILE\s+['"]\.gemini\\config\\mcp_config\.json['"]/,
    "Script must default -ConfigPath to (Join-Path $env:USERPROFILE '.gemini\\config\\mcp_config.json')",
  );
  assert.doesNotMatch(src, HARDCODED_USER_PATH_RE, 'Script must not contain hardcoded user paths');
  assert.doesNotMatch(
    src,
    /(?:Get-Content|Import-Csv|ReadAllText|ReadAllLines|Select-String|StreamReader)[^\r\n]*\.env\b/i,
    'Script must never read .env files',
  );
  assert.doesNotMatch(src, /['"][^'"\r\n]*(?:\\|\/)\.env['"]/i, 'Script must never reference literal .env file paths');
});

test('default -ConfigPath resolves under $env:USERPROFILE/.gemini/config/mcp_config.json in dry-run without mutating', () => {
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-mcp-home-'));
  try {
    const defaultCfgDir = path.join(tmpHome, '.gemini', 'config');
    fs.mkdirSync(defaultCfgDir, { recursive: true });
    const defaultCfgPath = path.join(defaultCfgDir, 'mcp_config.json');
    const originalText = JSON.stringify(
      {
        mcpServers: {
          omniroute: { type: 'http', url: 'http://192.168.0.15:20128/api/mcp/stream' },
          panel: { serverUrl: 'http://192.168.0.15:3130/mcp' },
        },
      },
      null,
      2,
    );
    fs.writeFileSync(defaultCfgPath, originalText, 'utf8');
    const beforeBytes = fs.readFileSync(defaultCfgPath);

    const res = runScript([], { USERPROFILE: tmpHome });
    assert.equal(res.status, 0, `Expected exit 0, got ${res.status}. stderr:\n${res.stderr}\nstdout:\n${res.stdout}`);
    assert.match(res.stdout, /DRY-RUN/i);
    assert.match(res.stdout, /omniroute.*300/i);
    assert.match(res.stdout, /panel.*180/i);

    const afterBytes = fs.readFileSync(defaultCfgPath);
    assert.equal(Buffer.compare(beforeBytes, afterBytes), 0, 'Dry-run must not modify default config file');
    const backups = fs.readdirSync(defaultCfgDir).filter((name) => name.includes('.bak-'));
    assert.deepEqual(backups, [], 'Dry-run must not create backup files');
  } finally {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('dry-run on temp fixture prints proposed timeoutSeconds additions/updates without modifying file or creating backup', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-mcp-dryrun-'));
  try {
    const cfgPath = path.join(tmpDir, 'mcp_config.json');
    // Compact single-line formatting ensures byte-level comparison catches any rewrite.
    const originalText = JSON.stringify(makeFixtureConfig());
    fs.writeFileSync(cfgPath, originalText, 'utf8');
    const beforeBytes = fs.readFileSync(cfgPath);

    const res = runScript(['-ConfigPath', cfgPath]);
    assert.equal(res.status, 0, `Expected exit 0, got ${res.status}. stderr:\n${res.stderr}\nstdout:\n${res.stdout}`);

    assert.match(res.stdout, /DRY-RUN/i, 'Expected DRY-RUN indicator in output');
    assert.match(res.stdout, /custom-tool.*180/i, 'Expected proposed timeoutSeconds=180 for custom-tool');
    assert.match(res.stdout, /low-timeout-tool.*30\s*->\s*180/i, 'Expected proposed update 30 -> 180');
    assert.match(res.stdout, /omniroute.*300/i, 'Expected proposed timeoutSeconds=300 for omniroute');
    assert.match(res.stdout, /omniroute-cli.*120\s*->\s*300/i, 'Expected proposed update 120 -> 300');
    assert.match(res.stdout, /ai-memory.*300/i, 'Expected proposed timeoutSeconds=300 for ai-memory');
    assert.match(res.stdout, /generous-default.*600/i, 'Expected existing 600 timeoutSeconds to be preserved');
    assert.doesNotMatch(res.stdout, /\$\{CUSTOM_API_TOKEN\}/, 'Dry-run output must not leak env values');
    assert.doesNotMatch(res.stdout, /\$\{LOW_TIMEOUT_SECRET\}/, 'Dry-run output must not leak header values');

    const afterBytes = fs.readFileSync(cfgPath);
    assert.equal(Buffer.compare(beforeBytes, afterBytes), 0, 'Dry-run must leave file bytes untouched');

    const backups = fs.readdirSync(tmpDir).filter((name) => name.includes('.bak-'));
    assert.deepEqual(backups, [], 'Dry-run must not create any .bak-* files');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('-Apply creates byte-for-byte .bak-* backup first, preserves all fields, applies timeouts, and is idempotent', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-mcp-apply-'));
  try {
    const cfgPath = path.join(tmpDir, 'mcp_config.json');
    const fixture = makeFixtureConfig();
    // Use 4-space indentation so original bytes are distinct from normalized 2-space output.
    const originalText = JSON.stringify(fixture, null, 4) + '\r\n';
    fs.writeFileSync(cfgPath, originalText, 'utf8');
    const originalBytes = fs.readFileSync(cfgPath);

    const firstApply = runScript(['-ConfigPath', cfgPath, '-Apply']);
    assert.equal(
      firstApply.status,
      0,
      `First -Apply failed (${firstApply.status}). stderr:\n${firstApply.stderr}\nstdout:\n${firstApply.stdout}`,
    );
    assert.match(firstApply.stdout, /APPLY/i);

    const backupsAfterFirst = fs.readdirSync(tmpDir).filter((name) => /^mcp_config\.json\.bak-\d+/.test(name));
    assert.equal(
      backupsAfterFirst.length,
      1,
      `Expected 1 timestamped .bak-* file, got ${JSON.stringify(backupsAfterFirst)}`,
    );

    const backupBytes = fs.readFileSync(path.join(tmpDir, backupsAfterFirst[0]));
    assert.equal(
      Buffer.compare(backupBytes, originalBytes),
      0,
      'Backup .bak-* file must match original mcp_config.json byte-for-byte',
    );

    const updatedBytes = fs.readFileSync(cfgPath);
    assert.notEqual(updatedBytes[0], 0xef, 'Written JSON must not include a UTF-8 BOM');
    const updated = JSON.parse(updatedBytes.toString('utf8'));

    assert.equal(updated.mcpServers['custom-tool'].timeoutSeconds, 180);
    assert.equal(updated.mcpServers['custom-tool'].command, 'node');
    assert.deepEqual(updated.mcpServers['custom-tool'].args, ['tool.js']);
    assert.deepEqual(updated.mcpServers['custom-tool'].singleArg, ['--flag']);
    assert.deepEqual(updated.mcpServers['custom-tool'].emptyArr, []);
    assert.deepEqual(updated.mcpServers['custom-tool'].emptyObj, {});
    assert.deepEqual(updated.mcpServers['custom-tool'].env, { API_TOKEN: '${CUSTOM_API_TOKEN}' });

    assert.equal(updated.mcpServers['low-timeout-tool'].timeoutSeconds, 180);
    assert.equal(updated.mcpServers['low-timeout-tool'].url, 'https://example.invalid/mcp?a=1&b=2');
    assert.deepEqual(updated.mcpServers['low-timeout-tool'].headers, {
      Authorization: 'Bearer ${LOW_TIMEOUT_SECRET}',
      'X-Special': 'a&b<c>',
    });

    const expectedLong = [
      'omniroute',
      'omniroute-cli',
      'rea',
      'remake',
      'supermemory',
      'supabase',
      'kit',
      'mission-mcp',
      'ai-memory',
    ];
    for (const serverName of expectedLong) {
      assert.equal(updated.mcpServers[serverName].timeoutSeconds, 300, `${serverName}.timeoutSeconds should be 300`);
    }
    assert.equal(
      updated.mcpServers['ai-memory'].timeout,
      5000,
      'Existing non-timeoutSeconds fields must remain untouched',
    );
    assert.equal(
      updated.mcpServers.playwright.timeoutSeconds,
      900,
      'Existing >= 300 timeoutSeconds must not be lowered',
    );
    assert.equal(
      updated.mcpServers['generous-default'].timeoutSeconds,
      600,
      'Existing >= 180 timeoutSeconds must not be lowered',
    );

    // Second pass must be idempotent.
    const secondApply = runScript(['-ConfigPath', cfgPath, '-Apply']);
    assert.equal(
      secondApply.status,
      0,
      `Second -Apply failed (${secondApply.status}). stderr:\n${secondApply.stderr}\nstdout:\n${secondApply.stdout}`,
    );
    const bytesAfterSecond = fs.readFileSync(cfgPath);
    assert.equal(
      Buffer.compare(bytesAfterSecond, updatedBytes),
      0,
      'Second -Apply pass must be byte-for-byte idempotent',
    );
    const backupsAfterSecond = fs.readdirSync(tmpDir).filter((name) => /^mcp_config\.json\.bak-\d+/.test(name));
    assert.equal(backupsAfterSecond.length, 1, 'Idempotent second -Apply pass should not create redundant backups');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('supports custom -DefaultTimeoutSeconds and -LongTimeoutSeconds overrides with -Apply', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-mcp-custom-'));
  try {
    const cfgPath = path.join(tmpDir, 'mcp_config.json');
    fs.writeFileSync(
      cfgPath,
      JSON.stringify(
        {
          mcpServers: {
            other: { command: 'node', args: ['other.js'], timeoutSeconds: 180 },
            omniroute: { type: 'http', url: 'http://192.168.0.15:20128/api/mcp/stream', timeoutSeconds: 300 },
          },
        },
        null,
        2,
      ),
      'utf8',
    );

    const res = runScript([
      '-ConfigPath',
      cfgPath,
      '-DefaultTimeoutSeconds',
      '240',
      '-LongTimeoutSeconds',
      '450',
      '-Apply',
    ]);
    assert.equal(res.status, 0, `Custom override run failed: ${res.stderr}\n${res.stdout}`);

    const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    assert.equal(parsed.mcpServers.other.timeoutSeconds, 240);
    assert.equal(parsed.mcpServers.omniroute.timeoutSeconds, 450);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
