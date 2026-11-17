import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAP_PATH = path.join(HERE, 'fleet-map.json');
const PS_SCRIPT = path.join(HERE, 'Get-FleetEndpoint.ps1');
const FW_SCRIPT = path.join(HERE, 'firewall-allowlist.ps1');
const TUNNEL_SCRIPT = path.join(HERE, 'tunnel-targets.ps1');
const GUARDIAN_PY = path.resolve(HERE, '..', '..', 'scripts', 'clawx-control', 'opus-guardian.py');
const PY_MODULE = path.join(HERE, 'fleet_map.py');

const EXPECTED_T5500 = [
  ['ssh', 22, 'lan', null, '0.0.0.0'],
  ['mission-os', 3130, 'lan-guarded', 'MISSION_OS_TOKEN', '0.0.0.0'],
  ['dateapp-frontend', 3200, 'lan', null, '0.0.0.0'],
  ['postgres', 5432, 'this machine only', null, '127.0.0.1'],
  ['redis', 6379, 'this machine only', null, '127.0.0.1'],
  ['odysseus', 7011, 'lan-guarded', 'MISSION_OS_TOKEN', '0.0.0.0'],
  ['dateapp-api', 8000, 'lan', null, '0.0.0.0'],
  ['hermes-gateway', 8643, 'lan-guarded', 'MISSION_OS_TOKEN', '0.0.0.0'],
  ['hermes-dashboard', 9119, 'lan-guarded', 'MISSION_OS_TOKEN', '0.0.0.0'],
  ['domains-server', 9160, 'lan', null, '0.0.0.0'],
  ['ollama-t5500', 11434, 'lan-guarded', 'OLLAMA_GUARD_TOKEN', '0.0.0.0'],
  ['omniroute', 20128, 'lan-guarded', 'OMNIROUTE_API_KEY', '0.0.0.0'],
  ['obsidian-t5500', 27123, 'lan-guarded', 'OBSIDIAN_REST_API_KEY', '0.0.0.0'],
  ['ai-memory', 49374, 'lan-guarded', 'AI_MEMORY_TOKEN', '0.0.0.0'],
];

const EXPECTED_ALIENWARE = [
  ['ssh-alienware', 22, 'lan', null, '0.0.0.0'],
  ['preview-4315', 4315, 'lan', null, '0.0.0.0'],
  ['swarm-command', 8000, 'lan-guarded', 'SWARM_COMMAND_TOKEN', '0.0.0.0'],
  ['free-claude-code', 8082, 'lan-guarded', 'FCC_GUARD_TOKEN', '0.0.0.0'],
  ['opsis-studio', 8390, 'lan', null, '0.0.0.0'],
  ['leadgen-desk', 8392, 'lan', null, '0.0.0.0'],
  ['panda-router', 8765, 'lan-guarded', 'PANDA_ROUTER_TOKEN', '0.0.0.0'],
  ['npc-lab', 9127, 'lan', null, '0.0.0.0'],
  ['dreamops-bridge', 9133, 'lan', null, '0.0.0.0'],
  ['dream-engine', 9180, 'lan', null, '0.0.0.0'],
  ['ollama-alienware', 11434, 'lan-guarded', 'OLLAMA_GUARD_TOKEN', '0.0.0.0'],
  ['vite-hmr', 24678, 'lan', null, '0.0.0.0'],
  ['obsidian-alienware', 27123, 'lan-guarded', 'OBSIDIAN_REST_API_KEY', '0.0.0.0'],
  ['alienware-obsidian-mcp', 27200, 'lan-guarded', 'FLEET_SHARED_TOKEN', '0.0.0.0'],
];

test('fleet-map.json defines ONLY t5500 and alienware with exact services, binds, and token guards', () => {
  assert.ok(fs.existsSync(MAP_PATH), 'ops/fleet/fleet-map.json must exist');
  const raw = fs.readFileSync(MAP_PATH, 'utf8');
  assert.doesNotMatch(raw, /sabretooth/i, 'fleet-map.json must never mention retired third node');
  assert.ok(!raw.includes(['192', '168', '0', '8'].join('.')), 'fleet-map.json must never contain retired .8 IP');

  const data = JSON.parse(raw);
  assert.deepEqual(Object.keys(data.nodes).sort(), ['alienware', 't5500']);
  assert.equal(data.nodes.t5500.ip, '192.168.0.15');
  assert.equal(data.nodes.alienware.ip, '192.168.0.40');

  for (const [id, port, scope, tokenEnv, bind] of EXPECTED_T5500) {
    const svc = data.services[id];
    assert.ok(svc, `Missing t5500 service ${id}`);
    assert.equal(svc.node, 't5500');
    assert.equal(svc.port, port);
    assert.equal(svc.scope, scope);
    assert.equal(svc.tokenEnv, tokenEnv);
    assert.equal(svc.bind, bind);
    assert.equal(svc.host, scope === 'this machine only' || scope === 'local-only' ? '127.0.0.1' : '192.168.0.15');
  }

  for (const [id, port, scope, tokenEnv, bind] of EXPECTED_ALIENWARE) {
    const svc = data.services[id];
    assert.ok(svc, `Missing alienware service ${id}`);
    assert.equal(svc.node, 'alienware');
    assert.equal(svc.port, port);
    assert.equal(svc.scope, scope);
    assert.equal(svc.tokenEnv, tokenEnv);
    assert.equal(svc.bind, bind);
    assert.equal(svc.host, '192.168.0.40');
  }

  assert.equal(Object.keys(data.services).length, EXPECTED_T5500.length + EXPECTED_ALIENWARE.length);
});

test('fleet-map.mjs resolves nodes, service URLs, and bind hosts', async () => {
  const mod = await import('./fleet-map.mjs');
  assert.equal(mod.getNodeIp('t5500'), '192.168.0.15');
  assert.equal(mod.getNodeIp('alienware'), '192.168.0.40');
  assert.equal(mod.getServiceUrl('mission-os'), 'http://192.168.0.15:3130');
  assert.equal(mod.getServiceUrl('mission-os', '/api/v1/status'), 'http://192.168.0.15:3130/api/v1/status');
  assert.equal(mod.getServiceUrl('domains-server', '/health'), 'http://192.168.0.15:9160/health');
  assert.equal(mod.getServiceUrl('swarm-command', '/health'), 'http://192.168.0.40:8000/health');
  assert.equal(mod.getBindHost('mission-os'), '0.0.0.0');
  assert.equal(mod.getBindHost('postgres'), '127.0.0.1');
  assert.equal(mod.getBindHost('redis'), '127.0.0.1');
  assert.equal(mod.listServicesByNode('t5500').length, EXPECTED_T5500.length);
  assert.equal(mod.listServicesByNode('alienware').length, EXPECTED_ALIENWARE.length);
});

test('fleet_map.py resolves nodes, service URLs, and bind hosts identically', () => {
  assert.ok(fs.existsSync(PY_MODULE), 'ops/fleet/fleet_map.py must exist');
  const out = execFileSync(
    'python',
    [
      '-c',
      [
        'import json, sys',
        `sys.path.insert(0, ${JSON.stringify(HERE)})`,
        'import fleet_map',
        'print(json.dumps({',
        '  "t5500": fleet_map.get_node_ip("t5500"),',
        '  "alienware": fleet_map.get_node_ip("alienware"),',
        '  "mos": fleet_map.get_service_url("mission-os", "/api/v1/status"),',
        '  "pg_bind": fleet_map.get_bind_host("postgres"),',
        '  "mos_bind": fleet_map.get_bind_host("mission-os"),',
        '}))',
      ].join('\n'),
    ],
    { encoding: 'utf8', timeout: 8000 }
  ).trim();
  const parsed = JSON.parse(out);
  assert.deepEqual(parsed, {
    t5500: '192.168.0.15',
    alienware: '192.168.0.40',
    mos: 'http://192.168.0.15:3130/api/v1/status',
    pg_bind: '127.0.0.1',
    mos_bind: '0.0.0.0',
  });
});

test('Get-FleetEndpoint.ps1 resolves service URLs, node IPs, and bind hosts via PowerShell', () => {
  assert.ok(fs.existsSync(PS_SCRIPT), 'ops/fleet/Get-FleetEndpoint.ps1 must exist');
  const url = execFileSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', PS_SCRIPT, '-Service', 'domains-server', '-Path', '/health'],
    { encoding: 'utf8', timeout: 8000 }
  ).trim();
  assert.equal(url, 'http://192.168.0.15:9160/health');

  const pgBind = execFileSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', PS_SCRIPT, '-Service', 'postgres', '-Field', 'Bind'],
    { encoding: 'utf8', timeout: 8000 }
  ).trim();
  assert.equal(pgBind, '127.0.0.1');

  const awIp = execFileSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', PS_SCRIPT, '-Node', 'alienware', '-Field', 'Ip'],
    { encoding: 'utf8', timeout: 8000 }
  ).trim();
  assert.equal(awIp, '192.168.0.40');
});

test('dual-schema support: array-shaped services with "this machine only" and authTokenEnv parse cleanly across JS, Python, and PowerShell', async () => {
  const mod = await import('./fleet-map.mjs');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fleet-array-schema-'));
  const arrayMapPath = path.join(tmpDir, 'fleet-map.json');

  const arrayMapFixture = {
    version: '1.0.0',
    nodes: {
      alienware: { id: 'alienware', name: 'Alienware', host: '192.168.0.40', ip: '192.168.0.40', role: 'workshop' },
      t5500: { id: 't5500', name: 'T5500', host: '192.168.0.15', ip: '192.168.0.15', role: 'front-of-house' },
    },
    services: [
      {
        id: 'mission-os',
        name: 'Mission OS',
        node: 't5500',
        host: '192.168.0.15',
        port: 3130,
        protocol: 'http',
        scope: 'lan-guarded',
        bind: '0.0.0.0',
        authTokenEnv: 'MISSION_OS_TOKEN',
      },
      {
        id: 'date-app-api',
        name: 'Date App API',
        node: 't5500',
        host: '192.168.0.15',
        port: 8000,
        protocol: 'http',
        scope: 'lan',
        bind: '0.0.0.0',
        authTokenEnv: '',
      },
      {
        id: 't5500-postgres',
        name: 'Postgres',
        node: 't5500',
        host: '127.0.0.1',
        port: 5432,
        protocol: 'tcp',
        scope: 'this machine only',
        bind: '127.0.0.1',
        authTokenEnv: 'POSTGRES_PASSWORD',
      },
      {
        id: 't5500-redis',
        name: 'Redis',
        node: 't5500',
        host: '127.0.0.1',
        port: 6379,
        protocol: 'tcp',
        scope: 'this machine only',
        bind: '127.0.0.1',
        authTokenEnv: '',
      },
      {
        id: 'hermes-leadgen',
        name: 'Lead-Gen Studio',
        node: 'alienware',
        host: '192.168.0.40',
        port: 8392,
        protocol: 'http',
        scope: 'lan-guarded',
        bind: '0.0.0.0',
        authTokenEnv: 'HERMES_LEADGEN_TOKEN',
      },
    ],
  };

  try {
    fs.writeFileSync(arrayMapPath, JSON.stringify(arrayMapFixture, null, 2), 'utf8');
    const loaded = mod.loadFleetMap(arrayMapPath);

    assert.equal(mod.getServiceUrl('mission-os', '/api/v1/status', loaded), 'http://192.168.0.15:3130/api/v1/status');
    assert.equal(mod.getService('mission-os', loaded).tokenEnv, 'MISSION_OS_TOKEN');
    assert.equal(mod.getServiceUrl('dateapp-api', '/health', loaded), 'http://192.168.0.15:8000/health');
    assert.equal(mod.getServiceUrl('leadgen-desk', '', loaded), 'http://192.168.0.40:8392');
    assert.equal(mod.getBindHost('postgres', '', loaded), '127.0.0.1');
    assert.equal(mod.getBindHost('redis', '', loaded), '127.0.0.1');
    assert.equal(mod.listServicesByNode('t5500', loaded).length, 4);
    assert.equal(mod.listServicesByNode('alienware', loaded).length, 1);

    const pyOut = execFileSync(
      'python',
      [
        '-c',
        [
          'import json, sys',
          `sys.path.insert(0, ${JSON.stringify(HERE)})`,
          'import fleet_map',
          `fmap = fleet_map.load_fleet_map(${JSON.stringify(arrayMapPath)})`,
          'print(json.dumps({',
          '  "mos": fleet_map.get_service_url("mission-os", "/api/v1/status", fmap),',
          '  "mos_tok": fleet_map.get_service("mission-os", fmap)["tokenEnv"],',
          '  "api": fleet_map.get_service_url("dateapp-api", "/health", fmap),',
          '  "pg_bind": fleet_map.get_bind_host("postgres", None, fmap),',
          '  "t5500_count": len(fleet_map.list_services_by_node("t5500", fmap)),',
          '}))',
        ].join('\n'),
      ],
      { encoding: 'utf8', timeout: 8000 }
    ).trim();
    assert.deepEqual(JSON.parse(pyOut), {
      mos: 'http://192.168.0.15:3130/api/v1/status',
      mos_tok: 'MISSION_OS_TOKEN',
      api: 'http://192.168.0.15:8000/health',
      pg_bind: '127.0.0.1',
      t5500_count: 4,
    });

    const psTok = execFileSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', PS_SCRIPT, '-MapPath', arrayMapPath, '-Service', 'mission-os', '-Field', 'TokenEnv'],
      { encoding: 'utf8', timeout: 8000 }
    ).trim();
    assert.equal(psTok, 'MISSION_OS_TOKEN');

    const psPgBind = execFileSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', PS_SCRIPT, '-MapPath', arrayMapPath, '-Service', 'postgres', '-Field', 'Bind'],
      { encoding: 'utf8', timeout: 8000 }
    ).trim();
    assert.equal(psPgBind, '127.0.0.1');

    const fwOut = execFileSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', FW_SCRIPT, '-MapPath', arrayMapPath],
      { encoding: 'utf8', timeout: 8000 }
    );
    assert.match(fwOut, /Skipped local-only services.*t5500-postgres.*t5500-redis/);
    assert.match(fwOut, /token=MISSION_OS_TOKEN/);
    assert.doesNotMatch(fwOut, /-LocalPort 5432/);
    assert.doesNotMatch(fwOut, /-LocalPort 6379/);

    const cfgFixturePath = path.join(tmpDir, 'cloudflared.yml');
    const legacyLoopbackTarget = ['http://', '127.0.0.1', ':3130'].join('');
    fs.writeFileSync(
      cfgFixturePath,
      [
        'ingress:',
        '  - hostname: mos.aidoesitall.website',
        `    service: ${legacyLoopbackTarget}`,
        '  - hostname: pg.internal',
        '    service: tcp://127.0.0.1:5432',
        '  - service: http_status:404',
        '',
      ].join('\n'),
      'utf8'
    );
    const tunnelOut = execFileSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', TUNNEL_SCRIPT, '-ConfigPath', cfgFixturePath, '-MapPath', arrayMapPath, '-SkipProbe'],
      { encoding: 'utf8', timeout: 8000 }
    );
    assert.match(tunnelOut, /\+\s*service: http:\/\/192\.168\.0\.15:3130/);
    assert.doesNotMatch(tunnelOut, /192\.168\.0\.15:5432/);

    const guardianDir = path.join(tmpDir, 'ops', 'fleet');
    fs.mkdirSync(guardianDir, { recursive: true });
    fs.copyFileSync(arrayMapPath, path.join(guardianDir, 'fleet-map.json'));
    const guardianOut = execFileSync(
      'python',
      [
        '-c',
        [
          'import importlib.util, json, pathlib',
          `spec = importlib.util.spec_from_file_location("opus_guardian", ${JSON.stringify(GUARDIAN_PY)})`,
          'mod = importlib.util.module_from_spec(spec)',
          'spec.loader.exec_module(mod)',
          `mod.ROOT = pathlib.Path(${JSON.stringify(tmpDir)})`,
          'res = mod.GuardianResult()',
          'mod.check_fleet_address_doctrine(res)',
          'print(json.dumps({"passed": len(res.passed), "failures": res.failures}))',
        ].join('\n'),
      ],
      { encoding: 'utf8', timeout: 8000 }
    ).trim();
    assert.deepEqual(JSON.parse(guardianOut), { passed: 1, failures: [] });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
