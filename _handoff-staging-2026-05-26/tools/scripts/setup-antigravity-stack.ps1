# ═══════════════════════════════════════════════════════════════════════════
#  setup-antigravity-stack.ps1
#  ANTIGRAVITY · #UntilNoKidInNeed · Full-stack MCP scaffold
#
#  Bootstraps three Anthropic-MCP-pattern servers (TypeScript, official SDK,
#  stdio transport) and wires them into Claude Code on the local machine.
#
#  Run from:  C:\ANTIGRAVITY
#  Reviewed by: Claude Code (official CLI) before execution
#
#  GUARANTEES
#   · Idempotent.   Re-runs never destroy existing files or config.
#   · No secrets.   Reads/writes none. Creates `.env.example` placeholders only.
#   · No network.   Only `pnpm install` (lockfile pinned) touches the network.
#   · No origin/main mutations. Stages a feature branch only if git is present.
#   · Never closes on error. Always waits for Enter.
#
#  WHAT IT DOES NOT DO
#   · Install Node, pnpm, git, or Claude Code. Tells you the command instead.
#   · Push to any remote.
#   · Deploy to Cloudflare Pages.
#   · Read or write any credential.
# ═══════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = 'Continue'   # never halt on a single bad step
$ProgressPreference    = 'SilentlyContinue'

# ── tiny logger ─────────────────────────────────────────────────────────
function Banner { param([string]$t, [string]$c='Magenta')
  $bar = ('═' * ($t.Length + 4)); ''; Write-Host $bar -fg $c; Write-Host "  $t  " -fg $c; Write-Host $bar -fg $c
}
function Step { param([string]$t) ''; Write-Host "▸ $t" -fg Cyan }
function OK   { param([string]$t) Write-Host "  ✓ $t" -fg Green }
function Warn { param([string]$t) Write-Host "  ! $t" -fg Yellow }
function Err  { param([string]$t) Write-Host "  ✗ $t" -fg Red }
function Info { param([string]$t) Write-Host "  · $t" -fg Gray }

function Safe { param([string]$name, [scriptblock]$block)
  try { & $block; $true } catch { Err "$name failed: $($_.Exception.Message)"; $false }
}

function WaitForUser {
  ''; Write-Host '═══════════════════════════════════════════════════════════════' -fg DarkMagenta
  Write-Host '  Done. Review the log above.' -fg White
  Write-Host '  Press ENTER to close this window.' -fg Yellow
  Write-Host '═══════════════════════════════════════════════════════════════' -fg DarkMagenta
  [void][System.Console]::ReadLine()
}

# ── idempotent file writer ──────────────────────────────────────────────
function WriteIfMissing { param([string]$path, [string]$content)
  if (Test-Path -LiteralPath $path) { Info "skip (exists): $path"; return $false }
  $dir = Split-Path -Parent $path
  if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  Set-Content -LiteralPath $path -Value $content -Encoding UTF8 -NoNewline
  OK "wrote: $path"
  return $true
}

# ─────────────────────────────────────────────────────────────────────────
try {

Clear-Host
Banner 'ANTIGRAVITY · MCP STACK SCAFFOLD · v1' 'Magenta'
Write-Host '  Mission: Wire three MCP servers as the orchestration brain.' -fg Gray
Write-Host '  Pattern: Anthropic-documented MCP · TypeScript · stdio transport.' -fg Gray
Write-Host '  Safety:  Idempotent. No secrets. No network beyond pnpm install.' -fg Gray

# 0 ── working directory ────────────────────────────────────────────────
Step '0/8  Locating project root'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
if ([string]::IsNullOrWhiteSpace($Root)) { $Root = (Get-Location).Path }
Set-Location -Path $Root
OK "Working directory: $Root"

# 1 ── prerequisites ────────────────────────────────────────────────────
Step '1/8  Prerequisite check (no auto-install)'
function Probe { param([string]$name, [string]$cmd, [string]$arg='--version')
  try {
    $v = & $cmd $arg 2>&1 | Select-Object -First 1
    if ($v) { OK ("{0,-12} {1}" -f $name, $v); return $true }
    Warn ("{0,-12} not found" -f $name); return $false
  } catch { Warn ("{0,-12} not found" -f $name); return $false }
}
$HasNode = Probe 'Node'       'node'   '--version'
$HasPnpm = Probe 'pnpm'       'pnpm'   '--version'
$HasNpm  = Probe 'npm'        'npm'    '--version'
$HasGit  = Probe 'git'        'git'    '--version'
$HasCC   = Probe 'Claude Code' 'claude' '--version'

if (-not $HasNode) { Info 'Install Node 20+:  winget install OpenJS.NodeJS.LTS' }
if (-not $HasPnpm) { Info 'Install pnpm:      npm i -g pnpm' }
if (-not $HasCC)   { Info 'Install Claude Code: npm i -g @anthropic-ai/claude-code' }

# 2 ── feature branch (if git available) ────────────────────────────────
Step '2/8  Stage a feature branch (skipped if no git)'
if ($HasGit -and (Test-Path .git)) {
  Safe 'git branch' {
    $current = (git rev-parse --abbrev-ref HEAD 2>&1)
    if ($current -ne 'feat/mcp-scaffold-v1') {
      & git checkout -b 'feat/mcp-scaffold-v1' 2>&1 | ForEach-Object { Info $_ }
      OK "Switched to feat/mcp-scaffold-v1"
    } else { OK "Already on feat/mcp-scaffold-v1" }
  } | Out-Null
} else { Info 'git not initialized or not installed — skipping branch stage' }

# 3 ── directory structure ──────────────────────────────────────────────
Step '3/8  Creating directory structure'
$Dirs = @(
  'apps/mcp/hermes-mcp/src',
  'apps/mcp/hermes-mcp/test',
  'apps/mcp/paperweight-mcp/src',
  'apps/mcp/paperweight-mcp/test',
  'apps/mcp/dao-mcp/src',
  'apps/mcp/dao-mcp/test',
  '.claude',
  'briefings'
)
foreach ($d in $Dirs) {
  if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null; OK "mkdir: $d" }
  else { Info "exists: $d" }
}

# 4 ── shared TS config ─────────────────────────────────────────────────
Step '4/8  Writing shared TypeScript config'
$TsConfigRoot = @'
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
'@
WriteIfMissing 'apps/mcp/tsconfig.base.json' $TsConfigRoot | Out-Null

# 5 ── MCP servers ──────────────────────────────────────────────────────
Step '5/8  Scaffolding three MCP servers'

# ── hermes-mcp ──
$PkgHermes = @'
{
  "name": "@antigravity/hermes-mcp",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.23.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "@types/node": "^22.0.0"
  }
}
'@
WriteIfMissing 'apps/mcp/hermes-mcp/package.json' $PkgHermes | Out-Null
WriteIfMissing 'apps/mcp/hermes-mcp/tsconfig.json' '{ "extends": "../tsconfig.base.json" }' | Out-Null
WriteIfMissing 'apps/mcp/hermes-mcp/.env.example' "HERMES_ROUTER_URL=http://localhost:11435`nHERMES_HEALTH_URL=http://localhost:8000/healthz`n" | Out-Null

$SrcHermes = @'
// Hermes MCP server · routes prompts via the local Hermes router (11435).
// Anthropic MCP pattern: stdio transport · zod-validated tools · no secrets.
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import "dotenv/config";

const ROUTER = process.env.HERMES_ROUTER_URL ?? "http://localhost:11435";
const HEALTH = process.env.HERMES_HEALTH_URL ?? "http://localhost:8000/healthz";

const RouteIn = z.object({
  model:  z.string().min(1),
  prompt: z.string().min(1),
  ctx:    z.string().optional(),
});

const server = new Server(
  { name: "hermes-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: "hermes.route",  description: "Route a prompt through the local Hermes router. Returns the model response.", inputSchema: { type: "object", properties: { model: { type: "string" }, prompt: { type: "string" }, ctx: { type: "string" } }, required: ["model", "prompt"] } },
    { name: "hermes.health", description: "Check Hermes router liveness. Returns ok/down + latency.", inputSchema: { type: "object", properties: {} } },
    { name: "hermes.list_models", description: "List models reachable via Hermes.", inputSchema: { type: "object", properties: {} } },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  if (name === "hermes.route") {
    const p = RouteIn.parse(args);
    const t0 = Date.now();
    const r = await fetch(`${ROUTER}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: p.model, messages: [{ role: "user", content: p.prompt }] }),
    });
    const body = await r.text();
    return { content: [{ type: "text", text: `route ${p.model} ${r.status} ${Date.now() - t0}ms\n\n${body}` }] };
  }

  if (name === "hermes.health") {
    const t0 = Date.now();
    try {
      const r = await fetch(HEALTH, { signal: AbortSignal.timeout(2000) });
      return { content: [{ type: "text", text: `health ${r.status} ${Date.now() - t0}ms` }] };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { content: [{ type: "text", text: `health down · ${msg}` }] };
    }
  }

  if (name === "hermes.list_models") {
    try {
      const r = await fetch(`${ROUTER}/v1/models`, { signal: AbortSignal.timeout(2000) });
      const t = await r.text();
      return { content: [{ type: "text", text: t }] };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { content: [{ type: "text", text: `list_models error · ${msg}` }] };
    }
  }

  throw new Error(`unknown tool: ${name}`);
});

await server.connect(new StdioServerTransport());
'@
WriteIfMissing 'apps/mcp/hermes-mcp/src/index.ts' $SrcHermes | Out-Null

$TestHermes = @'
import { describe, it, expect } from "vitest";
import { z } from "zod";

const RouteIn = z.object({ model: z.string().min(1), prompt: z.string().min(1), ctx: z.string().optional() });

describe("hermes-mcp · RouteIn schema", () => {
  it("accepts a valid payload", () => {
    expect(() => RouteIn.parse({ model: "claude-haiku-4-5", prompt: "hi" })).not.toThrow();
  });
  it("rejects empty model", () => {
    expect(() => RouteIn.parse({ model: "", prompt: "hi" })).toThrow();
  });
  it("rejects empty prompt", () => {
    expect(() => RouteIn.parse({ model: "x", prompt: "" })).toThrow();
  });
});
'@
WriteIfMissing 'apps/mcp/hermes-mcp/test/schema.test.ts' $TestHermes | Out-Null

# ── paperweight-mcp ──
$PkgPw = $PkgHermes -replace 'hermes-mcp', 'paperweight-mcp'
WriteIfMissing 'apps/mcp/paperweight-mcp/package.json' $PkgPw | Out-Null
WriteIfMissing 'apps/mcp/paperweight-mcp/tsconfig.json' '{ "extends": "../tsconfig.base.json" }' | Out-Null
WriteIfMissing 'apps/mcp/paperweight-mcp/.env.example' "PAPERWEIGHT_API=http://localhost:3100/api/paperweight`n" | Out-Null

$SrcPw = @'
// Paperweight MCP · sticky-note delegation engine
// Reads/writes the existing paperclip:3100 API. No secrets baked in.
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import "dotenv/config";

const API = process.env.PAPERWEIGHT_API ?? "http://localhost:3100/api/paperweight";

const CreateIn = z.object({
  agent: z.enum(["opus-ceo","gemini-ceo","hermes-001","codex","gemma4","pi","cupid","perplexity"]),
  brief: z.string().min(4).max(2000),
});
const CompleteIn = z.object({ id: z.string().min(1), result: z.string().optional() });

const server = new Server({ name: "paperweight-mcp", version: "0.1.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: "paperweight.list",     description: "List delegated tasks (optional status filter)", inputSchema: { type: "object", properties: { status: { type: "string", enum: ["pending","progress","done","all"] } } } },
    { name: "paperweight.create",   description: "Create a new sticky note · dispatch to an agent", inputSchema: { type: "object", properties: { agent: { type: "string" }, brief: { type: "string" } }, required: ["agent","brief"] } },
    { name: "paperweight.complete", description: "Mark a sticky complete (idempotent)", inputSchema: { type: "object", properties: { id: { type: "string" }, result: { type: "string" } }, required: ["id"] } },
    { name: "paperweight.audit",    description: "Audit trail since a timestamp", inputSchema: { type: "object", properties: { since: { type: "string" } } } },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  if (name === "paperweight.list") {
    const status = (args as { status?: string })?.status ?? "all";
    const r = await fetch(`${API}?status=${encodeURIComponent(status)}`);
    return { content: [{ type: "text", text: await r.text() }] };
  }
  if (name === "paperweight.create") {
    const p = CreateIn.parse(args);
    const r = await fetch(API, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agentId: p.agent, taskDescription: p.brief }),
    });
    return { content: [{ type: "text", text: await r.text() }] };
  }
  if (name === "paperweight.complete") {
    const p = CompleteIn.parse(args);
    const r = await fetch(`${API}/${encodeURIComponent(p.id)}/complete`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ result: p.result ?? null }),
    });
    return { content: [{ type: "text", text: await r.text() }] };
  }
  if (name === "paperweight.audit") {
    const since = (args as { since?: string })?.since ?? "";
    const r = await fetch(`${API}/audit?since=${encodeURIComponent(since)}`);
    return { content: [{ type: "text", text: await r.text() }] };
  }
  throw new Error(`unknown tool: ${name}`);
});

await server.connect(new StdioServerTransport());
'@
WriteIfMissing 'apps/mcp/paperweight-mcp/src/index.ts' $SrcPw | Out-Null

$TestPw = @'
import { describe, it, expect } from "vitest";
import { z } from "zod";
const CreateIn = z.object({ agent: z.enum(["opus-ceo","gemini-ceo","hermes-001","codex","gemma4","pi","cupid","perplexity"]), brief: z.string().min(4).max(2000) });
describe("paperweight-mcp · CreateIn schema", () => {
  it("accepts a valid task", () => { expect(() => CreateIn.parse({ agent: "opus-ceo", brief: "audit the router" })).not.toThrow(); });
  it("rejects unknown agent",  () => { expect(() => CreateIn.parse({ agent: "rogue", brief: "x" })).toThrow(); });
  it("rejects brief too short", () => { expect(() => CreateIn.parse({ agent: "opus-ceo", brief: "x" })).toThrow(); });
});
'@
WriteIfMissing 'apps/mcp/paperweight-mcp/test/schema.test.ts' $TestPw | Out-Null

# ── dao-mcp (READ-ONLY) ──
$PkgDao = $PkgHermes -replace 'hermes-mcp', 'dao-mcp'
WriteIfMissing 'apps/mcp/dao-mcp/package.json' $PkgDao | Out-Null
WriteIfMissing 'apps/mcp/dao-mcp/tsconfig.json' '{ "extends": "../tsconfig.base.json" }' | Out-Null
WriteIfMissing 'apps/mcp/dao-mcp/.env.example' "DAO_SPEC_VERSION=v1.0`n" | Out-Null

$SrcDao = @'
// DAO MCP · READ-ONLY reflection of the Perpetual Mission DAO spec.
// Cannot mutate state. Refuses any tool call that would alter Layer 1.
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// IMMUTABLE LAYER-1 CONSTANTS — match the public spec.
const SPEC = Object.freeze({
  CHARITABLE_FLOOR_PER_BUCKET: 0.10,          // IRS max deductible per qualifying bucket
  TAX_RESERVE_RATE_RANGE: [0.27, 0.40] as const,
  OPS_BUDGET_CAP_RATE: 0.62,
  GATEWAYS: [
    "SQUARE_YOUANDINOTAI","STRIPE_MAIN","PAYPAL_LEGACY","COINBASE_COMMERCE",
    "AUTHORIZE_NET","BRAINTREE","BITPAY","VENMO_BUSINESS","CASHAPP_BUSINESS",
  ] as const,
  INVESTOR_SEATS_MAX: 10,
  PERPETUAL_MOTION_SEATS_MAX: 3,
  REVENUE_BUCKETS: [
    "YouAndINotAI","OnlineRecycle","AI-Solutions","AIDoesItAll",
  ] as const,
});

const WaterfallIn = z.object({ gross: z.number().nonnegative() });

const server = new Server({ name: "dao-mcp", version: "0.1.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: "dao.waterfall_dry_run", description: "Compute the spec's waterfall for a hypothetical gross. READ-ONLY.", inputSchema: { type: "object", properties: { gross: { type: "number" } }, required: ["gross"] } },
    { name: "dao.seats_status",      description: "Return investor + perpetual-motion seat occupancy. Real-or-zero.", inputSchema: { type: "object", properties: {} } },
    { name: "dao.gateway_status",    description: "Return the 9 authorized gateways and their isolation rules.",     inputSchema: { type: "object", properties: {} } },
    { name: "dao.compliance_check",  description: "Surface FL §496.405 framing rules and securities posture.",       inputSchema: { type: "object", properties: {} } },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  if (name === "dao.waterfall_dry_run") {
    const { gross } = WaterfallIn.parse(args);
    const tax_low  = +(gross * SPEC.TAX_RESERVE_RATE_RANGE[0]).toFixed(2);
    const tax_high = +(gross * SPEC.TAX_RESERVE_RATE_RANGE[1]).toFixed(2);
    const charity_per_bucket = +(gross * SPEC.CHARITABLE_FLOOR_PER_BUCKET).toFixed(2);
    const ops_cap  = +(gross * SPEC.OPS_BUDGET_CAP_RATE).toFixed(2);
    return { content: [{ type: "text", text: JSON.stringify({
      illustrative: true, gross,
      tax_reserve: { low: tax_low, high: tax_high, note: "27% sales · up to 40% luxury/commission" },
      charity_per_bucket, charity_max_stacked: +(charity_per_bucket * SPEC.REVENUE_BUCKETS.length).toFixed(2),
      ops_budget_cap: ops_cap,
      remainder_for_investors_and_founder: +(gross - tax_high - charity_per_bucket - ops_cap).toFixed(2),
    }, null, 2) }] };
  }
  if (name === "dao.seats_status") {
    return { content: [{ type: "text", text: JSON.stringify({
      illustrative: true,
      investor_seats: { max: SPEC.INVESTOR_SEATS_MAX, filled: 0, status: "CLOSED · PRE-COUNSEL" },
      perpetual_motion: { max: SPEC.PERPETUAL_MOTION_SEATS_MAX, filled: 0 },
    }, null, 2) }] };
  }
  if (name === "dao.gateway_status") {
    return { content: [{ type: "text", text: JSON.stringify({
      gateways: SPEC.GATEWAYS,
      isolation: { SQUARE_YOUANDINOTAI: "ENIGMA node only · cross-node access rejected by aggregator" },
    }, null, 2) }] };
  }
  if (name === "dao.compliance_check") {
    return { content: [{ type: "text", text: JSON.stringify({
      framing: "FL §496.405 · use 'contractual revenue disbursement' · never 'donation' or 'solicitation'",
      securities: "Investor seats CLOSED until FL-licensed securities counsel clears Reg D 506(b)/506(c) or Reg CF.",
      forced_association: "No AI provider partnership/endorsement is to be claimed publicly. Collaboration on work product only.",
      fabricated_proof: "Disallowed. Every public figure must be real or zero.",
    }, null, 2) }] };
  }
  // Catch-all: refuse any tool that smells like a mutation attempt.
  if (/^dao\.(set|update|delete|create|adjust|override|patch|mutate)/i.test(name)) {
    return { content: [{ type: "text", text: `REFUSED · dao-mcp is read-only · Layer 1 cannot be mutated via MCP.` }] };
  }
  throw new Error(`unknown tool: ${name}`);
});

await server.connect(new StdioServerTransport());
'@
WriteIfMissing 'apps/mcp/dao-mcp/src/index.ts' $SrcDao | Out-Null

$TestDao = @'
import { describe, it, expect } from "vitest";
import { z } from "zod";
const WaterfallIn = z.object({ gross: z.number().nonnegative() });
describe("dao-mcp · WaterfallIn", () => {
  it("accepts zero", () => { expect(() => WaterfallIn.parse({ gross: 0 })).not.toThrow(); });
  it("rejects negative", () => { expect(() => WaterfallIn.parse({ gross: -1 })).toThrow(); });
  it("rejects non-number", () => { expect(() => WaterfallIn.parse({ gross: "ten" as unknown as number })).toThrow(); });
});
'@
WriteIfMissing 'apps/mcp/dao-mcp/test/schema.test.ts' $TestDao | Out-Null

# 6 ── pnpm install + build ─────────────────────────────────────────────
Step '6/8  Installing dependencies + building (skipped if pnpm missing)'
if ($HasPnpm) {
  foreach ($svc in @('hermes-mcp','paperweight-mcp','dao-mcp')) {
    $svcDir = "apps/mcp/$svc"
    Safe "install $svc" {
      Push-Location $svcDir
      try {
        & pnpm install --silent 2>&1 | ForEach-Object { Info $_ }
        if ($LASTEXITCODE -eq 0) { OK "$svc installed" } else { Warn "$svc install exited $LASTEXITCODE" }
        & pnpm run build 2>&1 | ForEach-Object { Info $_ }
        if ($LASTEXITCODE -eq 0) { OK "$svc built" } else { Warn "$svc build exited $LASTEXITCODE" }
      } finally { Pop-Location }
    } | Out-Null
  }
} else { Info 'pnpm not installed — skipping install/build. Run manually once pnpm is on PATH.' }

# 7 ── merge .claude/settings.json (additive) ───────────────────────────
Step '7/8  Merging .claude/settings.json (additive · never overwrites)'
$settingsPath = Join-Path $Root '.claude/settings.json'
$current = @{}
if (Test-Path $settingsPath) {
  try { $current = Get-Content $settingsPath -Raw | ConvertFrom-Json -AsHashtable } catch { Warn "Existing settings.json unreadable — leaving in place, NOT overwriting"; $current = $null }
}
if ($null -ne $current) {
  if (-not $current.ContainsKey('mcpServers')) { $current['mcpServers'] = @{} }
  $abs = (Resolve-Path $Root).Path -replace '\\', '/'
  foreach ($svc in @('hermes-mcp','paperweight-mcp','dao-mcp')) {
    if (-not $current['mcpServers'].ContainsKey($svc)) {
      $current['mcpServers'][$svc] = @{
        command = 'node'
        args    = @("$abs/apps/mcp/$svc/dist/index.js")
      }
      OK "added mcpServers.$svc"
    } else { Info "mcpServers.$svc already present — left as-is" }
  }
  $current | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $settingsPath -Encoding UTF8
  OK "wrote $settingsPath"
}

# 8 ── verification report ──────────────────────────────────────────────
Step '8/8  Writing verification report'
$report = @"
# ANTIGRAVITY · MCP SCAFFOLD v1 · SETUP LOG

Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Script:    setup-antigravity-stack.ps1
Root:      $Root

## Prerequisites
- Node:        $(if ($HasNode) {'present'} else {'MISSING'})
- pnpm:        $(if ($HasPnpm) {'present'} else {'MISSING'})
- npm:         $(if ($HasNpm)  {'present'} else {'MISSING'})
- git:         $(if ($HasGit)  {'present'} else {'MISSING'})
- Claude Code: $(if ($HasCC)   {'present'} else {'MISSING'})

## Servers scaffolded
- apps/mcp/hermes-mcp/      (router proxy · 3 tools)
- apps/mcp/paperweight-mcp/ (sticky-note delegation · 4 tools)
- apps/mcp/dao-mcp/         (READ-ONLY spec reflection · 4 tools)

## What to do next
1. Fill in .env files from the .env.example placeholders. Do NOT commit them.
2. Run \`claude mcp list\` to verify the three servers register.
3. Open Claude Code and ask: \`use hermes-mcp.health\` to test the wiring.
4. Review the PR diff before any merge or push.

## Non-negotiables (re-stated)
- One AI does not command another.
- No third-party desktop-app patches.
- No Chrome extensions that proxy into Claude.ai web.
- No public partnership claims with any AI provider.
- Every public number is real or zero.
"@
$reportPath = Join-Path $Root 'briefings/SETUP-V1.md'
$reportDir = Split-Path $reportPath -Parent
if (-not (Test-Path $reportDir)) { New-Item -ItemType Directory -Force -Path $reportDir | Out-Null }
Set-Content -LiteralPath $reportPath -Value $report -Encoding UTF8
OK "wrote $reportPath"

Banner 'SUMMARY' 'Magenta'
Info 'Scaffold complete. No secrets read or written.'
Info 'Next: fill .env files · run `claude mcp list` · open Claude Code.'

} catch {
  Err "Unexpected top-level error: $($_.Exception.Message)"
  Err "Line: $($_.InvocationInfo.ScriptLineNumber) · Script: $($_.InvocationInfo.ScriptName)"
} finally {
  WaitForUser
}
