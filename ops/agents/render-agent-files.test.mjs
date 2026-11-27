import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT_PATH = path.join(__dirname, 'render-agent-files.ps1');

function findPowerShell() {
  for (const exe of ['powershell.exe', 'pwsh']) {
    const check = spawnSync(exe, ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.ToString()'], {
      encoding: 'utf8',
    });
    if (check.status === 0) return exe;
  }
  return null;
}

const PS_EXE = findPowerShell();

function makeTempFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'render-agent-node-'));
  const repo = path.join(root, 'repo');
  const profile = path.join(root, 'UserProfile');
  const localApp = path.join(profile, 'AppData', 'Local');
  const freebuff = path.join(root, 'freebuff-leadgen');

  fs.mkdirSync(path.join(repo, '.agents', 'skills', 'demo', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(repo, '.agents', 'skills', 'hallmark', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'docs', 'house'), { recursive: true });
  fs.mkdirSync(path.join(profile, '.gemini', 'config'), { recursive: true });
  fs.mkdirSync(path.join(profile, '.codex'), { recursive: true });
  fs.mkdirSync(path.join(profile, '.claude'), { recursive: true });
  fs.mkdirSync(path.join(profile, '.openclaw', 'workspace'), { recursive: true });
  fs.mkdirSync(path.join(localApp, 'hermes'), { recursive: true });
  fs.mkdirSync(freebuff, { recursive: true });

  const hr =
    '- House rules: `docs/house/HOUSE-MOTION-RULE.md`, `docs/house/THE-HOUSE.md` and `docs/house/PAYMENT-ACCOUNTS-RULE.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.';
  const cb =
    '- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).';

  fs.writeFileSync(path.join(repo, 'AGENTS.md'), `# AGENTS\n\nCustom text.\n${hr}\n${cb}\n`, 'utf8');
  fs.writeFileSync(
    path.join(repo, '.agents', 'skills', 'demo', 'skill.json'),
    JSON.stringify({ house_rules: 'docs/house/HOUSE-MOTION-RULE.md', name: 'demo' }, null, 2) + '\n',
    'utf8',
  );
  fs.writeFileSync(
    path.join(repo, '.agents', 'skills', 'demo', 'agents', 'gemini.toml'),
    'name = "demo"\nhouse_rules = "docs/house/HOUSE-MOTION-RULE.md"\n',
    'utf8',
  );
  fs.writeFileSync(
    path.join(repo, '.agents', 'skills', 'demo', 'agents', 'openai.yaml'),
    'name: demo\nhouse_rules: "docs/house/HOUSE-MOTION-RULE.md"\n',
    'utf8',
  );
  fs.writeFileSync(path.join(repo, '.agents', 'skills', 'hallmark', 'SKILL.md'), 'vendored\n', 'utf8');
  fs.writeFileSync(path.join(repo, 'wrangler.toml'), 'name = "w"\n', 'utf8');

  const fakeToken = 'ghp_' + 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5';
  fs.writeFileSync(
    path.join(profile, '.gemini', 'settings.json'),
    JSON.stringify({ trustedWorkspaces: ['x'], secretVal: fakeToken }, null, 2) + '\n',
    'utf8',
  );
  fs.writeFileSync(
    path.join(profile, '.gemini', 'config', 'mcp_config.json'),
    JSON.stringify({ mcpServers: { existing: { command: 'node', args: ['a.mjs'] } } }, null, 2) + '\n',
    'utf8',
  );
  fs.writeFileSync(path.join(profile, '.codex', 'config.toml'), 'model = "gpt-6-astra"\n', 'utf8');
  fs.writeFileSync(path.join(repo, 'CLAUDE.md'), 'D:\\mira private session\n', 'utf8');
  fs.writeFileSync(path.join(localApp, 'hermes', 'SOUL.md'), 'D:\\mira private session\n', 'utf8');

  return { root, repo, profile, localApp, freebuff, fakeToken };
}

test(
  'render-agent-files.ps1 exists and passes PowerShell end-to-end JSON/TOML/YAML/MD + dry-run + secret-redaction checks',
  { skip: !PS_EXE },
  () => {
    assert.ok(fs.existsSync(SCRIPT_PATH));
    const fx = makeTempFixture();
    try {
      const dryOut = execFileSync(
        PS_EXE,
        [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          SCRIPT_PATH,
          '-Node',
          'alienware',
          '-Scope',
          'all',
          '-RepoRoot',
          fx.repo,
          '-SpineSourceRepo',
          REPO_ROOT,
          '-UserProfileRoot',
          fx.profile,
          '-LocalAppDataRoot',
          fx.localApp,
          '-FreebuffRoot',
          fx.freebuff,
        ],
        { encoding: 'utf8' },
      );

      assert.match(dryOut, /\[DRY RUN\]/);
      assert.equal(dryOut.includes(fx.fakeToken), false, 'Dry run must never print secret token');
      assert.equal(dryOut.includes(fx.profile), false, 'Dry run must normalize UserProfileRoot to %USERPROFILE%');
      assert.match(dryOut, /\[SKIP private-project\].*CLAUDE\.md/);
      assert.doesNotMatch(dryOut, /hermes[\\/]/i);

      const applyOut = execFileSync(
        PS_EXE,
        [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          SCRIPT_PATH,
          '-Node',
          'alienware',
          '-Scope',
          'all',
          '-RepoRoot',
          fx.repo,
          '-SpineSourceRepo',
          REPO_ROOT,
          '-UserProfileRoot',
          fx.profile,
          '-LocalAppDataRoot',
          fx.localApp,
          '-FreebuffRoot',
          fx.freebuff,
          '-Apply',
        ],
        { encoding: 'utf8' },
      );
      assert.match(applyOut, /\[SKIP private-project\].*CLAUDE\.md/);
      assert.doesNotMatch(applyOut, /hermes[\\/]/i);

      // Every rendered JSON must parse cleanly in Node JSON.parse
      for (const jsonPath of [
        path.join(fx.repo, '.agents', 'skills', 'demo', 'skill.json'),
        path.join(fx.profile, '.gemini', 'settings.json'),
        path.join(fx.profile, '.gemini', 'config', 'mcp_config.json'),
      ]) {
        const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        assert.equal(parsed._trollz1004_spine_start, 'managed-by-render-agent-files');
        assert.equal(parsed._trollz1004_spine_end, 'managed-by-render-agent-files');
        assert.ok(parsed.trollz1004_spine);
      }

      const mcp = JSON.parse(fs.readFileSync(path.join(fx.profile, '.gemini', 'config', 'mcp_config.json'), 'utf8'));
      assert.equal(mcp.mcpServers.existing.command, 'node');
      assert.equal(mcp.mcpServers.kit.command, 'cmd.exe');
      assert.equal(mcp.mcpServers.kit.timeoutSeconds, 120);

      const codexToml = fs.readFileSync(path.join(fx.profile, '.codex', 'config.toml'), 'utf8');
      assert.match(codexToml, /\[trollz1004_spine\]/);
      assert.match(codexToml, /\[mcp_servers\.kit\]/);

      // Verify private-project repo file and Alienware Hermes folder remain untouched
      assert.equal(fs.readFileSync(path.join(fx.repo, 'CLAUDE.md'), 'utf8'), 'D:\\mira private session\n');
      assert.equal(fs.readFileSync(path.join(fx.localApp, 'hermes', 'SOUL.md'), 'utf8'), 'D:\\mira private session\n');
      assert.deepEqual(fs.readdirSync(path.join(fx.localApp, 'hermes')), ['SOUL.md']);

      // Verify dry-run t5500 output
      const t5500Dry = execFileSync(
        PS_EXE,
        [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          SCRIPT_PATH,
          '-Node',
          't5500',
          '-Scope',
          'node',
          '-RepoRoot',
          fx.repo,
          '-SpineSourceRepo',
          REPO_ROOT,
          '-UserProfileRoot',
          fx.profile,
          '-LocalAppDataRoot',
          fx.localApp,
          '-FreebuffRoot',
          fx.freebuff,
        ],
        { encoding: 'utf8' },
      );
      assert.match(t5500Dry, /ssh t5500/);
      assert.match(t5500Dry, /192\.168\.0\.15/);
      assert.match(t5500Dry, /%LOCALAPPDATA%\\hermes\\SOUL\.md/);
      assert.match(t5500Dry, /%LOCALAPPDATA%\\hermes\\profiles\\t5500\\SOUL\.md/);
    } finally {
      fs.rmSync(fx.root, { recursive: true, force: true });
    }
  },
);

test(
  'render-agent-files.ps1 renders boundary-stating GrinDroid notes, skips genuine Mira persona markers, and works standalone with fleet-map.json only',
  { skip: !PS_EXE },
  () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'render-agent-standalone-'));
    try {
      const repo = path.join(root, 'standalone-repo');
      const profile = path.join(root, 'EmptyProfile');
      const localApp = path.join(profile, 'AppData', 'Local');
      const freebuff = path.join(root, 'freebuff-leadgen');

      fs.mkdirSync(path.join(repo, 'ops', 'fleet'), { recursive: true });
      fs.mkdirSync(path.join(profile, '.claude'), { recursive: true });
      fs.mkdirSync(path.join(localApp, 'hermes'), { recursive: true });
      fs.mkdirSync(freebuff, { recursive: true });

      fs.copyFileSync(
        path.join(REPO_ROOT, 'ops', 'fleet', 'fleet-map.json'),
        path.join(repo, 'ops', 'fleet', 'fleet-map.json'),
      );

      const hr =
        '- House rules: `docs/house/HOUSE-MOTION-RULE.md`, `docs/house/THE-HOUSE.md` and `docs/house/PAYMENT-ACCOUNTS-RULE.md`.';
      const cb = '- Current beats existing: fetch and pull main first.';
      fs.writeFileSync(path.join(repo, 'AGENTS.md'), `# Standalone\n${hr}\n${cb}\n`, 'utf8');
      fs.writeFileSync(path.join(repo, 'CLAUDE.md'), "# Persona File\nYou're **Mira** in private mode.\n", 'utf8');

      const boundaryNote = 'Never touch anything named grin-droid or GrinDroid.\n';
      fs.writeFileSync(path.join(profile, '.claude', 'CLAUDE.md'), `# Claude\n${boundaryNote}`, 'utf8');
      fs.writeFileSync(path.join(localApp, 'hermes', 'ALIENWARE-SOUL.md'), `# Alienware Soul\n${boundaryNote}`, 'utf8');
      fs.writeFileSync(path.join(freebuff, 'AGENTS.md'), `# Freebuff\n${boundaryNote}`, 'utf8');
      fs.writeFileSync(path.join(localApp, 'hermes', 'SOUL.md'), 'Workspace D:\\mira — Legal NSFW only.\n', 'utf8');
      fs.writeFileSync(path.join(localApp, 'hermes', 'profile.yaml'), 'title: Mira\n', 'utf8');

      // Run without -SpineSourceRepo and without docs/house/SPINE.md
      const withoutExplicit = execFileSync(
        PS_EXE,
        [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          SCRIPT_PATH,
          '-Node',
          'alienware',
          '-Scope',
          'repo',
          '-RepoRoot',
          repo,
          '-UserProfileRoot',
          profile,
          '-LocalAppDataRoot',
          localApp,
          '-FreebuffRoot',
          freebuff,
          '-Apply',
        ],
        { encoding: 'utf8' },
      );
      assert.match(withoutExplicit, /AGENTS\.md/);
      assert.match(withoutExplicit, /\[SKIP private-project\].*CLAUDE\.md/);

      // Reset AGENTS.md and force standalone fleet-map.json-only path via -SpineSourceRepo repo (no SPINE.md)
      fs.writeFileSync(path.join(repo, 'AGENTS.md'), `# Standalone\n${hr}\n${cb}\n`, 'utf8');
      const standaloneOut = execFileSync(
        PS_EXE,
        [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          SCRIPT_PATH,
          '-Node',
          'alienware',
          '-Scope',
          'all',
          '-RepoRoot',
          repo,
          '-SpineSourceRepo',
          repo,
          '-UserProfileRoot',
          profile,
          '-LocalAppDataRoot',
          localApp,
          '-FreebuffRoot',
          freebuff,
          '-Apply',
        ],
        { encoding: 'utf8' },
      );

      const renderedAgents = fs.readFileSync(path.join(repo, 'AGENTS.md'), 'utf8');
      assert.match(renderedAgents, /<!-- TROLLZ1004-SPINE:START -->/);
      assert.match(renderedAgents, /ADDRESS-DOCTRINE\.md, NODES\.md, PIPELINE\.md, TRUSTED-MODELS\.md, THE-HOUSE\.md/);
      assert.match(
        renderedAgents,
        /First read: the house index, https:\/\/github\.com\/Trollz1004\/dream-online\/blob\/main\/docs\/house\/INDEX\.md, then the newest rulings in the claude\.ai project Ai-Dream-Team as the index describes\./,
      );
      assert.match(renderedAgents, /Funding comes first and game work is paused \(ruled 2026-11-13\)\./);
      assert.match(
        renderedAgents,
        /The wheel: tickets in the \.fable-kitchen inbox on the Alienware; runner ops\/router\/inbox-runner\.ts in dream-online; lane rules in orders\/RULES\.md in the kitchen\./,
      );
      assert.match(
        renderedAgents,
        /Merging \(ruled 2026-11-16\): nothing merges with a failing required check; platform and marketing changes need the checks plus one trusted review; game and engine work keeps two offerings and two judges; whoever merges looks at the files and leaves a one-line verdict\./,
      );
      assert.match(
        renderedAgents,
        /Public text passes the go gate: the product does what the text says, stop-slop plus a humanizer pass, only what is true, every outside fact links the exact page\./,
      );
      assert.match(
        renderedAgents,
        /Marketing team log: https:\/\/github\.com\/Trollz1004\/ANTIGRAVITY\/tree\/main\/marketing\/team \(public; nothing private goes in\)\./,
      );
      assert.equal(
        fs.readFileSync(path.join(repo, 'CLAUDE.md'), 'utf8'),
        "# Persona File\nYou're **Mira** in private mode.\n",
      );

      assert.match(
        fs.readFileSync(path.join(profile, '.claude', 'CLAUDE.md'), 'utf8'),
        /<!-- TROLLZ1004-SPINE:START -->/,
      );
      assert.match(fs.readFileSync(path.join(freebuff, 'AGENTS.md'), 'utf8'), /<!-- TROLLZ1004-SPINE:START -->/);

      assert.equal(
        fs.readFileSync(path.join(localApp, 'hermes', 'ALIENWARE-SOUL.md'), 'utf8'),
        `# Alienware Soul\n${boundaryNote}`,
      );
      assert.equal(
        fs.readFileSync(path.join(localApp, 'hermes', 'SOUL.md'), 'utf8'),
        'Workspace D:\\mira — Legal NSFW only.\n',
      );
      assert.equal(fs.readFileSync(path.join(localApp, 'hermes', 'profile.yaml'), 'utf8'), 'title: Mira\n');
      assert.deepEqual(fs.readdirSync(path.join(localApp, 'hermes')).sort(), [
        'ALIENWARE-SOUL.md',
        'SOUL.md',
        'profile.yaml',
      ]);
      assert.doesNotMatch(standaloneOut, /hermes[\\/]/i);
      assert.doesNotMatch(standaloneOut, /ALIENWARE-SOUL\.md/);
      assert.doesNotMatch(standaloneOut, /SOUL\.md/);
      assert.doesNotMatch(standaloneOut, /profile\.yaml/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  },
);

test(
  'render-agent-files.ps1 never targets or modifies Alienware hermes files while keeping t5500 hermes targets',
  { skip: !PS_EXE },
  () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'render-agent-aw-isolated-'));
    try {
      const repo = path.join(root, 'repo');
      const profile = path.join(root, 'UserProfile');
      const localApp = path.join(profile, 'AppData', 'Local');
      const freebuff = path.join(root, 'freebuff-leadgen');
      const hermesDir = path.join(localApp, 'hermes');
      const hermesDefaultProfileDir = path.join(hermesDir, 'profiles', 'default');

      fs.mkdirSync(repo, { recursive: true });
      fs.mkdirSync(path.join(profile, '.claude'), { recursive: true });
      fs.mkdirSync(hermesDefaultProfileDir, { recursive: true });
      fs.mkdirSync(freebuff, { recursive: true });

      const claudeContent = '# Claude\n';
      const alienwareSoulContent = '# Custom Alienware Soul\nDo not touch.\n';
      const hermesSoulContent = '# Default Hermes Soul\nUntouched even without private markers.\n';
      const hermesProfileYaml = 'model: hermes-local\n';
      const defaultProfileSoulContent = '# Default Profile Soul\nUntouched.\n';

      fs.writeFileSync(path.join(profile, '.claude', 'CLAUDE.md'), claudeContent, 'utf8');
      fs.writeFileSync(path.join(hermesDir, 'ALIENWARE-SOUL.md'), alienwareSoulContent, 'utf8');
      fs.writeFileSync(path.join(hermesDir, 'SOUL.md'), hermesSoulContent, 'utf8');
      fs.writeFileSync(path.join(hermesDir, 'profile.yaml'), hermesProfileYaml, 'utf8');
      fs.writeFileSync(path.join(hermesDefaultProfileDir, 'SOUL.md'), defaultProfileSoulContent, 'utf8');

      const psProbe = [
        '. $env:TEST_SCRIPT_PATH -NoRun',
        "$awPreview = @(Get-NodeTargetFiles -TargetNode 'alienware' -ProfileRoot $env:TEST_PROFILE -LocalAppRoot $env:TEST_LOCALAPP -FreebuffDir $env:TEST_FREEBUFF -IncludeAbsentDirsForPreview $true)",
        "$awExisting = @(Get-NodeTargetFiles -TargetNode 'alienware' -ProfileRoot $env:TEST_PROFILE -LocalAppRoot $env:TEST_LOCALAPP -FreebuffDir $env:TEST_FREEBUFF -IncludeAbsentDirsForPreview $false)",
        "$t5Preview = @(Get-NodeTargetFiles -TargetNode 't5500' -ProfileRoot $env:TEST_PROFILE -LocalAppRoot $env:TEST_LOCALAPP -FreebuffDir '' -IncludeAbsentDirsForPreview $true)",
        '[PSCustomObject]@{',
        '  awPreview = @($awPreview | ForEach-Object { $_.FullPath })',
        '  awExisting = @($awExisting | ForEach-Object { $_.FullPath })',
        '  t5Preview = @($t5Preview | ForEach-Object { $_.FullPath })',
        '} | ConvertTo-Json -Depth 4',
      ].join('\n');

      const probeJson = execFileSync(PS_EXE, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psProbe], {
        encoding: 'utf8',
        env: {
          ...process.env,
          TEST_SCRIPT_PATH: SCRIPT_PATH,
          TEST_PROFILE: profile,
          TEST_LOCALAPP: localApp,
          TEST_FREEBUFF: freebuff,
        },
      });
      const targets = JSON.parse(probeJson);

      for (const list of [targets.awPreview, targets.awExisting]) {
        assert.ok(Array.isArray(list) && list.length > 0);
        const hermesMatches = list.filter(
          (p) => /hermes/i.test(p) || p.toLowerCase().startsWith(localApp.toLowerCase()),
        );
        assert.deepEqual(hermesMatches, []);
        assert.equal(
          list.some((p) => /ALIENWARE-SOUL\.md|profile\.yaml|\bprofiles\b/i.test(p)),
          false,
        );
        assert.equal(list.filter((p) => !p.includes('.openclaw') && /SOUL\.md/i.test(p)).length, 0);
      }

      assert.ok(targets.t5Preview.includes(path.join(hermesDir, 'SOUL.md')));
      assert.ok(targets.t5Preview.includes(path.join(hermesDir, 'profiles', 't5500', 'SOUL.md')));

      const commonArgs = [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        SCRIPT_PATH,
        '-Node',
        'alienware',
        '-Scope',
        'node',
        '-RepoRoot',
        repo,
        '-SpineSourceRepo',
        REPO_ROOT,
        '-UserProfileRoot',
        profile,
        '-LocalAppDataRoot',
        localApp,
        '-FreebuffRoot',
        freebuff,
      ];

      const dryOut = execFileSync(PS_EXE, commonArgs, { encoding: 'utf8' });
      const applyOut = execFileSync(PS_EXE, [...commonArgs, '-Apply'], { encoding: 'utf8' });

      assert.match(dryOut, /\[DRY RUN\].*\.claude\\CLAUDE\.md/);
      assert.match(applyOut, /\[APPLY\].*\.claude\\CLAUDE\.md/);

      for (const out of [dryOut, applyOut]) {
        assert.doesNotMatch(out, /hermes[\\/]/i);
        assert.doesNotMatch(out, /ALIENWARE-SOUL\.md/);
        assert.doesNotMatch(out, /SOUL\.md/);
        assert.doesNotMatch(out, /profile\.yaml/);
        assert.doesNotMatch(out, /\bprofiles\b/);
      }

      assert.equal(fs.readFileSync(path.join(hermesDir, 'ALIENWARE-SOUL.md'), 'utf8'), alienwareSoulContent);
      assert.equal(fs.readFileSync(path.join(hermesDir, 'SOUL.md'), 'utf8'), hermesSoulContent);
      assert.equal(fs.readFileSync(path.join(hermesDir, 'profile.yaml'), 'utf8'), hermesProfileYaml);
      assert.equal(fs.readFileSync(path.join(hermesDefaultProfileDir, 'SOUL.md'), 'utf8'), defaultProfileSoulContent);

      assert.deepEqual(fs.readdirSync(hermesDir).sort(), ['ALIENWARE-SOUL.md', 'SOUL.md', 'profile.yaml', 'profiles']);
      assert.deepEqual(fs.readdirSync(path.join(hermesDir, 'profiles')).sort(), ['default']);
      assert.deepEqual(fs.readdirSync(hermesDefaultProfileDir).sort(), ['SOUL.md']);

      const t5500Dry = execFileSync(
        PS_EXE,
        [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          SCRIPT_PATH,
          '-Node',
          't5500',
          '-Scope',
          'node',
          '-RepoRoot',
          repo,
          '-SpineSourceRepo',
          REPO_ROOT,
          '-UserProfileRoot',
          profile,
          '-LocalAppDataRoot',
          localApp,
          '-FreebuffRoot',
          freebuff,
        ],
        { encoding: 'utf8' },
      );
      assert.match(t5500Dry, /%LOCALAPPDATA%\\hermes\\SOUL\.md/);
      assert.match(t5500Dry, /%LOCALAPPDATA%\\hermes\\profiles\\t5500\\SOUL\.md/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  },
);
