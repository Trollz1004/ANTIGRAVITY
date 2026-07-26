import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const APP_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(APP_DIR, "..", "..");
const DIST_DIR = path.join(APP_DIR, "dist");
const MEMORY_DIR = path.join(REPO_ROOT, "memory");
const MEMORY_LOG = path.join(MEMORY_DIR, "mission-control-agent-memory.jsonl");
const BOOTSTRAP_FILE = path.join(MEMORY_DIR, "MISSION-CONTROL-AGENT-MEMORY.md");
const TASK_LOG = path.join(REPO_ROOT, "services", "mission-control-api", "data", "tasks.log");
const PROGRESS_TASKS = path.join(MEMORY_DIR, "mission-control-progress-tasks.json");
const PORT = Number(process.env.PORT || 8787);
const execFileAsync = promisify(execFile);

const ALLOWED_AGENTS = [
  "codex",
  "openai",
  "claude",
  "gemini",
  "hermes",
  "meta-llama",
  "manus",
  "fcc",
  "opencode",
  "ollama",
  "nvidia",
  "openclaw",
  "grok",
];

const SCOPES = ["global", "repo", "node", "agent", "support", "deployment", "customer-surface"];

const LANES = [
  ["codex", "Codex / OpenAI", "OpenAI", "repo files, Mission Control API, shared memory", "ready"],
  ["claude", "Claude", "Anthropic", "AGENTS.md, CLAUDE.md, shared memory", "ready"],
  ["gemini", "Gemini", "Google", "repo prompt files and shared memory bootstrap", "manual"],
  ["hermes", "Hermes", "local router", "Hermes route plus shared memory bootstrap", "ready"],
  ["meta-llama", "Meta / Llama", "local model lane", "repo prompt files and shared memory bootstrap", "manual"],
  ["manus", "Manus", "external agent", "handoff prompt plus shared memory bootstrap", "manual"],
  ["fcc", "FCC", "worker lane", "evidence/proposal lane plus shared memory bootstrap", "manual"],
  ["opencode", "OpenCode", "worker lane", "repo checkout plus shared memory bootstrap", "manual"],
  ["ollama", "Ollama", "local inference", "local models plus shared memory bootstrap", "ready"],
  ["nvidia", "NVIDIA", "GPU/local tooling", "worker lane plus shared memory bootstrap", "manual"],
  ["openclaw", "OpenClaw", "support-only", "support memory only; no doctrine/payment control", "support"],
  ["grok", "Grok", "external model lane", "handoff prompt plus shared memory bootstrap", "manual"],
].map(([id, label, provider, access, status]) => ({ id, label, provider, access, status }));

const NODES = [
  {
    id: "sabretooth",
    label: "Sabretooth",
    host: "192.168.0.8",
    role: "brain/operator node",
    api: "http://127.0.0.1:8787/memory/bootstrap",
    memory_path: String.raw`C:\antigravity\memory\mission-control-agent-memory.jsonl`,
  },
  {
    id: "t5500",
    label: "T5500",
    host: "192.168.0.15",
    role: "public front-door/runtime node",
    api: "http://192.168.0.15:8787/memory/bootstrap",
    memory_path: String.raw`C:\antigravity\memory\mission-control-agent-memory.jsonl`,
  },
  {
    id: "9020",
    label: "9020",
    host: "192.168.0.5",
    role: "dev/support checkout",
    api: "http://192.168.0.5:8787/memory/bootstrap",
    memory_path: String.raw`C:\antigravity\memory\mission-control-agent-memory.jsonl`,
  },
];

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(body, null, 2));
}

function sendText(response, statusCode, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, {
    "content-type": contentType,
    "cache-control": "no-store",
  });
  response.end(body);
}

async function readRequestJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text.trim()) return {};
  return JSON.parse(text);
}


async function runCommand(command, args = [], options = {}) {
  try {
    const result = await execFileAsync(command, args, {
      timeout: options.timeout || 12000,
      cwd: options.cwd || REPO_ROOT,
      windowsHide: true,
      maxBuffer: 1024 * 256,
    });
    return { ok: true, out: String(result.stdout || "").trim(), err: String(result.stderr || "").trim() };
  } catch (error) {
    return { ok: false, out: String(error.stdout || "").trim(), err: String(error.stderr || error.message || "").trim() };
  }
}

function parseHermesStatus(text) {
  const parsed = { model: "unknown", provider: "unknown", gateway: "unknown" };
  for (const line of String(text || "").split(/\r?\n/)) {
    if (line.includes("Model:")) parsed.model = line.split("Model:").pop().trim();
    if (line.includes("Provider:")) parsed.provider = line.split("Provider:").pop().trim();
    if (line.includes("Status:") && parsed.gateway === "unknown") parsed.gateway = line.split("Status:").pop().trim();
  }
  return parsed;
}

async function localNodeProgress() {
  const hermes = await runCommand("hermes", ["status"], { timeout: 20000 });
  const head = await runCommand("git", ["-C", REPO_ROOT, "rev-parse", "HEAD"]);
  const branches = await runCommand("git", ["-C", REPO_ROOT, "branch", "-a", "--no-color"]);
  return {
    name: "Sabretooth / local",
    online: hermes.ok,
    hermes: parseHermesStatus(hermes.out),
    repoHead: head.out.split(/\r?\n/).find((line) => /^[0-9a-f]{40}$/.test(line.trim())) || "",
    branches: branches.out.split(/\r?\n/).filter(Boolean).slice(0, 12),
    error: hermes.ok ? "" : hermes.err,
  };
}

async function sshWindowsNodeProgress(name, host) {
  const remote = `hermes status | findstr /C:"Model:" /C:"Provider:" /C:"Status:" & git -C E:/ANTIGRAVITY rev-parse HEAD & git -C E:/ANTIGRAVITY branch -a --no-color`;
  const result = await runCommand("ssh", ["-o", "BatchMode=yes", "-o", "ConnectTimeout=5", `joshl@${host}`, remote], { timeout: 30000 });
  const lines = result.out.split(/\r?\n/).filter(Boolean);
  return {
    name,
    online: result.ok,
    hermes: parseHermesStatus(lines.filter((line) => line.includes("Model:") || line.includes("Provider:") || line.includes("Status:")).join("\n")),
    repoHead: lines.find((line) => /^[0-9a-f]{40}$/.test(line.trim())) || "",
    branches: lines.filter((line) => line.includes("origin/") || line.trim().startsWith("*")).slice(0, 12),
    error: result.ok ? "" : result.err,
  };
}

async function readProgressTasks() {
  try {
    return JSON.parse(await fs.readFile(PROGRESS_TASKS, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const seed = [
      { id: "mission-gui", title: "Mission Control owns the progression board", status: "doing", owner: "Hermes", note: "Integrated into http://127.0.0.1:8787/ Mission Progress", updatedAt: Date.now() / 1000 },
      { id: "repo-sync", title: "Repo/model aligned across nodes", status: "done", owner: "Hermes", note: "All nodes on origin/main + gpt-5.5/OpenAI Codex", updatedAt: Date.now() / 1000 },
    ];
    await writeProgressTasks(seed);
    return seed;
  }
}

async function writeProgressTasks(tasks) {
  await fs.mkdir(path.dirname(PROGRESS_TASKS), { recursive: true });
  await fs.writeFile(PROGRESS_TASKS, `${JSON.stringify(tasks, null, 2)}\n`, "utf8");
}

async function activeSignals() {
  const processes = await runCommand("bash", ["-lc", "ps -eo pid,comm,args --sort=-etime | grep -E 'hermes|codex|claude|openclaw|paperclip|fcc-claude|free-claude-code' | grep -v grep | head -60"], { timeout: 12000 });
  return processes.out.split(/\r?\n/).filter(Boolean).map((line) => line.slice(0, 260));
}

async function recentHermesSessions() {
  const sessions = await runCommand("bash", ["-lc", "hermes sessions list 2>/dev/null | head -25"], { timeout: 12000 });
  return sessions.out.split(/\r?\n/).filter((line) => line.trim()).slice(0, 25);
}

async function progressStatus() {
  const nodes = await Promise.all([
    localNodeProgress(),
    sshWindowsNodeProgress("T5500", "192.168.0.15"),
    sshWindowsNodeProgress("9020", "192.168.0.5"),
  ]);
  const tasks = await readProgressTasks();
  const columns = { todo: [], doing: [], blocked: [], done: [] };
  for (const task of tasks) {
    const status = ["todo", "doing", "blocked", "done"].includes(task.status) ? task.status : "todo";
    columns[status].push(task);
  }
  const heads = new Set(nodes.map((node) => node.repoHead).filter(Boolean));
  return {
    ok: true,
    updatedAt: Date.now() / 1000,
    sameRepoHead: heads.size === 1,
    nodes,
    columns,
    signals: await activeSignals(),
    sessions: await recentHermesSessions(),
  };
}

async function updateProgressTask(input) {
  const tasks = await readProgressTasks();
  const action = String(input.action || "add");
  const now = Date.now() / 1000;
  if (action === "add") {
    const title = String(input.title || "").trim();
    if (title.length < 1 || title.length > 180) throw new Error("title must be 1-180 characters");
    tasks.push({
      id: String(input.id || `task-${Math.round(now)}`).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40),
      title,
      status: ["todo", "doing", "blocked", "done"].includes(input.status) ? input.status : "todo",
      owner: String(input.owner || "").slice(0, 80),
      note: String(input.note || "").slice(0, 500),
      updatedAt: now,
    });
  } else if (action === "update") {
    const id = String(input.id || "");
    for (const task of tasks) {
      if (task.id !== id) continue;
      for (const key of ["title", "status", "owner", "note"]) {
        if (Object.hasOwn(input, key)) task[key] = String(input[key]).slice(0, key === "note" ? 500 : 180);
      }
      if (!["todo", "doing", "blocked", "done"].includes(task.status)) task.status = "todo";
      task.updatedAt = now;
    }
  } else if (action === "delete") {
    const id = String(input.id || "");
    await writeProgressTasks(tasks.filter((task) => task.id !== id));
    return { ok: true };
  } else {
    throw new Error("unsupported action");
  }
  await writeProgressTasks(tasks);
  return { ok: true, tasks };
}

function hasSecretLikeValue(value) {
  const text = String(value || "").toLowerCase();
  return ["api_key=", "secret=", "password=", "private_key=", "-----begin", "sk-", "xoxb-", "sq0a", "sq0c"].some((hint) =>
    text.includes(hint),
  );
}

function seedEntry() {
  return {
    id: "seed-active-lead-rule",
    created_at: "2026-06-26T00:00:00+00:00",
    title: "Mission Control shared memory is non-Paperclip",
    body:
      "Use AGENTS.md, CLAUDE.md, agent.md, and this shared memory. Joshua's direct assignment chooses the active lead. This memory mesh is direct Mission Control state, not a Paperclip dependency.",
    scope: "global",
    source_agent: "codex",
    agents: ALLOWED_AGENTS,
    nodes: NODES.map((node) => node.id),
    tags: ["mission-control", "memory", "active-lead"],
    visibility: "all-agents",
  };
}

async function readJsonl(filePath, fallback = []) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return text
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function appendJsonl(filePath, record) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(record)}\n`, "utf8");
}

async function memoryEntries(limit = 50) {
  const records = await readJsonl(MEMORY_LOG, [seedEntry()]);
  return records.slice(-limit).reverse();
}

async function bootstrapText(limit = 8) {
  let base = "# Mission Control Agent Memory\n\nRead AGENTS.md, CLAUDE.md, agent.md, then load /memory/bootstrap before acting.";
  try {
    base = (await fs.readFile(BOOTSTRAP_FILE, "utf8")).trim();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const recent = (await memoryEntries(limit))
    .map((entry) => `- [${entry.created_at}] ${entry.title} (${entry.scope}; ${entry.source_agent}): ${entry.body}`)
    .join("\n");
  return `${base}\n\n## Recent Shared Memory\n\n${recent}\n`;
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  const tags = [];
  for (const item of value.slice(0, 10)) {
    const tag = String(item).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
    if (tag && !tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

function validateMemoryPayload(input) {
  const title = String(input.title || "").trim();
  const body = String(input.body || "").trim();
  const scope = String(input.scope || "global");
  const source_agent = String(input.source_agent || "codex");
  if (title.length < 3 || title.length > 120) throw new Error("title must be 3-120 characters");
  if (body.length < 5 || body.length > 2400) throw new Error("body must be 5-2400 characters");
  if (hasSecretLikeValue(title) || hasSecretLikeValue(body)) throw new Error("memory entries must not contain secrets");
  if (!SCOPES.includes(scope)) throw new Error(`scope must be one of: ${SCOPES.join(", ")}`);
  if (!ALLOWED_AGENTS.includes(source_agent)) throw new Error(`source_agent must be one of: ${ALLOWED_AGENTS.join(", ")}`);
  return {
    id: crypto.randomBytes(6).toString("hex"),
    created_at: new Date().toISOString(),
    title,
    body,
    scope,
    source_agent,
    agents: Array.isArray(input.agents) ? input.agents.filter((agent) => ALLOWED_AGENTS.includes(agent)) : [],
    nodes: Array.isArray(input.nodes) ? input.nodes.filter((node) => NODES.some((item) => item.id === node)) : [],
    tags: normalizeTags(input.tags),
    visibility: "all-agents",
  };
}

async function serveStatic(response, pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const safePath = path.normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const absolutePath = path.join(DIST_DIR, safePath);
  const distRoot = `${DIST_DIR}${path.sep}`;

  if (!absolutePath.startsWith(distRoot)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(absolutePath);
    const contentType = MIME_TYPES[path.extname(absolutePath)] || "application/octet-stream";
    response.writeHead(200, {
      "content-type": contentType,
      "cache-control": "no-store",
    });
    response.end(file);
  } catch (error) {
    if (error.code === "ENOENT") {
      const index = await fs.readFile(path.join(DIST_DIR, "index.html"));
      response.writeHead(200, { "content-type": MIME_TYPES[".html"], "cache-control": "no-store" });
      response.end(index);
      return;
    }
    sendText(response, 500, error.message);
  }
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`);

  try {
    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { ok: true, app: "mission-control-memory-gui", paperclip_excluded: true });
      return;
    }

    if (request.method === "GET" && url.pathname === "/memory/status") {
      const entries = await memoryEntries(200);
      sendJson(response, 200, {
        ok: true,
        memory_log: MEMORY_LOG,
        bootstrap_file: BOOTSTRAP_FILE,
        entries: entries.length,
        nodes: NODES,
        lanes: LANES,
        scopes: SCOPES,
        paperclip_excluded: true,
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/memory/entries") {
      const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || 50)));
      sendJson(response, 200, { entries: await memoryEntries(limit) });
      return;
    }

    if (request.method === "POST" && url.pathname === "/memory/entries") {
      const entry = validateMemoryPayload(await readRequestJson(request));
      await appendJsonl(MEMORY_LOG, entry);
      sendJson(response, 200, { entry, stored: true });
      return;
    }

    if (request.method === "GET" && url.pathname === "/memory/bootstrap") {
      const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 12)));
      sendJson(response, 200, {
        text: await bootstrapText(limit),
        entries: await memoryEntries(limit),
        nodes: NODES,
        lanes: LANES,
        source_files: ["AGENTS.md", "CLAUDE.md", "agent.md", "memory/MISSION-CONTROL-AGENT-MEMORY.md"],
      });
      return;
    }


    if (request.method === "GET" && url.pathname === "/progress/status") {
      sendJson(response, 200, await progressStatus());
      return;
    }

    if (request.method === "POST" && url.pathname === "/progress/tasks") {
      sendJson(response, 200, await updateProgressTask(await readRequestJson(request)));
      return;
    }

    if (request.method === "GET" && url.pathname === "/tasks") {
      sendJson(response, 200, { tasks: (await readJsonl(TASK_LOG, [])).slice(-50).reverse() });
      return;
    }

    if (request.method === "POST" && url.pathname === "/tasks/dispatch") {
      const input = await readRequestJson(request);
      const brief = String(input.brief || "").trim();
      const agents = Array.isArray(input.agents) ? input.agents.filter((agent) => ALLOWED_AGENTS.includes(agent)) : [];
      if (!brief || brief.length > 500) throw new Error("brief must be 1-500 characters");
      const task = {
        task_id: crypto.randomBytes(6).toString("hex"),
        queued_at: new Date().toISOString(),
        brief,
        agents,
        status: "queued",
      };
      await appendJsonl(TASK_LOG, task);
      sendJson(response, 200, { task_id: task.task_id, queued: true });
      return;
    }

    if (request.method === "GET") {
      await serveStatic(response, url.pathname);
      return;
    }

    sendText(response, 405, "Method not allowed");
  } catch (error) {
    sendJson(response, 500, { error: error.message, safety: "No destructive action was attempted." });
  }
}

if (process.argv.includes("--check")) {
  await fs.access(path.join(DIST_DIR, "index.html"));
  console.log(JSON.stringify({ ok: true, dist: DIST_DIR, memoryLog: MEMORY_LOG, lanes: LANES.length }, null, 2));
  process.exit(0);
}

http.createServer(handleRequest).listen(PORT, "127.0.0.1", () => {
  console.log(`Mission Control memory GUI listening on http://127.0.0.1:${PORT}`);
});
