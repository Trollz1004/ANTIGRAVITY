/**
 * SWARM ORCHESTRATOR — plan → delegate → validate → journal.
 *
 * The four agents are orchestrators, not workers. For every task each selected
 * orchestrator:
 *   1. PLAN     — reads its journal + the skill catalog, decomposes the task into
 *                 subtasks and picks EVERY skill that helps each one.
 *   2. DELEGATE — a sub-agent completion runs each subtask with those skill
 *                 bodies loaded. The orchestrator writes briefs, not deliverables.
 *   3. VALIDATE — the orchestrator judges each deliverable against its acceptance
 *                 criteria by content. One revision round on failure.
 *   4. JOURNAL  — writes what it learned back to its STATE journal.
 *
 * Ornith exception: when its chain is exhausted (cloud + gateway down), ornith is
 * permitted to execute directly as worker of last resort — that is the entire
 * point of a local floor. Every other orchestrator fails closed instead.
 *
 * Lifecycle: queued (NEXT) -> running (NOW) -> done (DONE) | error (BLOCKED).
 * Zero fabricated output: a phase that cannot run reports why and blocks.
 */
import { randomUUID } from 'node:crypto';
import { AGENT_INDEX, CATEGORY_INDEX, ORCHESTRATOR_CONTRACT } from './agents.js';
import { loadCatalog, getCatalogEntry, type BrainSkill } from './catalog.js';
import { readJournal, writeJournal } from './brainStore.js';
import { materializeTask } from './materialize.js';
import { OmniRouteError, isExecutor, route } from './omniroute.js';
import { addTask, allTasks, getTask, persist, removeTask } from './store.js';
import type { AgentResult, Column, Mode, PhaseNote, SwarmTask } from './types.js';

type Listener = (event: { type: string; task?: SwarmTask }) => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(type: string, task?: SwarmTask): void {
  for (const fn of listeners) {
    try {
      fn({ type, task });
    } catch {
      /* listener errors never break the engine */
    }
  }
}

const CONCURRENCY = Math.max(1, Number(process.env.SWARM_CONCURRENCY ?? 3) || 3);
const MAX_TOKENS = Math.max(256, Number(process.env.SWARM_MAX_TOKENS ?? 4096) || 4096);
/** Subtask ceiling per orchestrator — keeps fan-out honest on a single box. */
const MAX_SUBTASKS = Math.max(1, Number(process.env.SWARM_MAX_SUBTASKS ?? 4) || 4);
/** Skills loaded per sub-agent. "All that help" — but bounded by context reality. */
const MAX_SKILLS_PER_SUBTASK = Math.max(1, Number(process.env.SWARM_MAX_SKILLS ?? 6) || 6);
/** Chars of each skill body handed to a sub-agent. */
const SKILL_BODY_CHARS = Math.max(400, Number(process.env.SWARM_SKILL_BODY_CHARS ?? 2400) || 2400);
/**
 * Orchestrator reasoning (plan + validate) always runs on the deep tier. These
 * phases must emit strict JSON, and the fast tier resolved to a thinking model
 * that wraps its answer in commentary — the planning that steers every sub-agent
 * is the wrong place to economize.
 */
const PLANNING_MODE: Mode = 'reasoning';

let active = 0;
const queue: string[] = [];

// ── Orchestrator prompts ──────────────────────────────────────────────────────

function orchestratorIdentity(agentId: string): string {
  const agent = AGENT_INDEX.get(agentId);
  if (!agent) return 'You are an orchestrator in Mission Control: Agency Swarm v5.';
  const division = CATEGORY_INDEX.get(agent.category)?.label ?? agent.category.toUpperCase();
  return [
    `You are ${agent.name} — a ${division} orchestrator in Mission Control: Agency Swarm v5.`,
    `Harness: ${agent.harness ?? 'n/a'}`,
    `Role: ${agent.description}`,
    '',
    ORCHESTRATOR_CONTRACT,
  ].join('\n');
}

/**
 * Compact skill index — what the orchestrator chooses from during PLAN.
 *
 * Deliberately terse. The gateway's prompt-cache layer swaps large prompts for
 * a content hash, and a cache miss delivers an EMPTY prompt to the model
 * ("CCR cache miss ... Found 0 chars"), which then correctly refuses to invent
 * a plan. Keeping the planning prompt small keeps it off that path.
 */
function skillMenu(compact = false): string {
  const { skills } = loadCatalog();
  if (skills.length === 0) {
    return '(The skill catalog returned no entries. Say so in your plan and give each subtask an empty skillIds list.)';
  }
  if (compact) return skills.map((s) => s.id).join(', ');
  return skills.map((s) => `- ${s.id}: ${s.description.slice(0, 70)}`).join('\n');
}

/** Marker that the gateway cache dropped the prompt rather than the model failing. */
function looksLikeCacheMiss(text: string): boolean {
  return /cache miss|not found in available memory|expected \d+ chars/i.test(text);
}

const PLAN_SHAPE = `Reply with ONLY a JSON object, no prose, no code fence:
{"subtasks":[{"title":"short label","brief":"complete instructions for the sub-agent — it sees ONLY this brief and its skills, never the original conversation","skillIds":["catalog-id",...],"acceptance":"how a reviewer proves this is done, checkable by content"}],"notes":"one line on your decomposition"}
Rules: 1-${MAX_SUBTASKS} subtasks. skillIds must come from the catalog list verbatim; include EVERY skill that helps, not just the closest one; use [] if none apply.`;

/** Journal excerpt carried into planning — enough to recall, small enough to send. */
const JOURNAL_PLAN_CHARS = 400;
/**
 * Hard ceiling on the planning prompt.
 *
 * Measured against the live gateway 2026-08-03: prompts of ~3.4 KB and ~5.7 KB
 * were both swallowed by its CCR prompt-cache layer, which handed the model a
 * content hash it could not resolve ("Found 0 chars", "CCR retrieve command").
 * A few hundred bytes passes through untouched. Staying well under the
 * threshold by construction is more reliable than retrying into it.
 */
const PLAN_PROMPT_MAX_CHARS = Math.max(
  600,
  Number(process.env.SWARM_PLAN_PROMPT_MAX ?? 1800) || 1800,
);

function buildPlanPrompt(task: SwarmTask, journal: string, compactSkills: boolean): string {
  const memory = journal.replace(/<!-- updated:.*?-->\n?/g, '').trim().slice(0, JOURNAL_PLAN_CHARS);
  return [
    memory ? `JOURNAL: ${memory}` : '',
    `SKILLS: ${skillMenu(compactSkills)}`,
    `TASK: ${task.prompt}`,
    'PLAN ONLY — do not solve it. ' + PLAN_SHAPE,
  ]
    .filter(Boolean)
    .join('\n');
}

function planPrompt(task: SwarmTask, journal: string): string {
  const full = buildPlanPrompt(task, journal, false);
  if (full.length <= PLAN_PROMPT_MAX_CHARS) return full;
  const compact = buildPlanPrompt(task, journal, true);
  if (compact.length <= PLAN_PROMPT_MAX_CHARS) return compact;
  // Still over: drop the journal and clamp the task text. Skill ids stay —
  // they are what the plan is chosen from.
  return buildPlanPrompt(
    { ...task, prompt: task.prompt.slice(0, 900) } as SwarmTask,
    '',
    true,
  ).slice(0, PLAN_PROMPT_MAX_CHARS);
}

/**
 * Last-resort planning prompt: no journal, skill ids only. Used when the first
 * attempt comes back as a gateway cache miss, which means the model never saw
 * the prompt at all — resending a smaller one is the fix, not rephrasing.
 */
function compactPlanPrompt(task: SwarmTask): string {
  return [
    `TASK: ${task.prompt.slice(0, 1200)}`,
    `SKILL IDS: ${skillMenu(true)}`,
    PLAN_SHAPE,
  ].join('\n');
}

function workerSystem(subtask: PlannedSubtask, skills: BrainSkill[], orchestratorName: string): string {
  const loaded = skills.length
    ? skills
        .map(
          (s) =>
            `── SKILL: ${s.label} (${s.id}) ──\n${s.body.slice(0, SKILL_BODY_CHARS)}${
              s.body.length > SKILL_BODY_CHARS ? '\n…[skill truncated]' : ''
            }`,
        )
        .join('\n\n')
    : '(No skills matched this subtask. Work from first principles and say what you would have wanted.)';
  return [
    `You are a sub-agent executing one subtask delegated by ${orchestratorName}. You do the actual work.`,
    'Follow the loaded skills below as operating instructions — they are your method.',
    '',
    '=== LOADED SKILLS ===',
    loaded,
    '',
    '=== YOU HAVE NO TOOLS ===',
    'You cannot run shells, read disk, clone repos, or call any tool. Emitting tool-call',
    'markup produces literal text, not an action — it is a failed subtask. There is no',
    'working directory to inspect and no repo to open; everything you need is in this',
    'brief. Never claim to have run, tested, installed, or verified anything.',
    '',
    '=== HOW YOUR WORK IS SAVED ===',
    'A separate step extracts your files and commits them. It only sees this exact shape:',
    '',
    'File: `relative/path/name.ext`',
    '```lang',
    '<complete file contents>',
    '```',
    '',
    'Rules that decide whether your work survives:',
    '  - The path line goes immediately before the fence, nothing between them.',
    '  - Paths are RELATIVE, always. A leading / or a drive letter is discarded —',
    '    "/home/user/app/main.py" and "C:\\app\\main.py" are wrong; "app/main.py" is right.',
    '  - Every file gets its own path line and its own fence. Full contents, never a',
    '    diff, never "unchanged" or "...". A fence with no path line above it is read',
    '    as an example and thrown away.',
    '  - Prose outside the fences is fine and is not saved. Put it there, not inside.',
    '',
    '=== OUTPUT RULES ===',
    'Produce the finished deliverable itself — no preamble, no plan, no filler.',
    `It must satisfy the acceptance criteria: ${subtask.acceptance}`,
    'If the deliverable is code, config, or a document, it MUST be emitted as files in',
    'the shape above — an explanation of a file is not the file.',
    'If a fact is unverified, label it unverified. Never fabricate data, metrics, or results.',
  ].join('\n');
}

const VERDICT_SHAPE =
  '{"verdicts":[{"index":1,"pass":true,"checked":"what you actually verified","gap":"what is missing if pass is false"}],"summary":"one paragraph the operator can act on","overallPass":true}';

function validatePrompt(task: SwarmTask, reviews: { subtask: PlannedSubtask; output: string }[]): string {
  const blocks = reviews
    .map(
      (r, i) =>
        [
          `--- DELIVERABLE ${i + 1}: ${r.subtask.title} ---`,
          `Acceptance: ${r.subtask.acceptance}`,
          `Skills used: ${r.subtask.skillIds.join(', ') || 'none'}`,
          'Output:',
          // Bounded for the same reason planning is: oversized prompts hit the
          // gateway cache path and can arrive empty.
          r.output.slice(0, 2500),
        ].join('\n'),
    )
    .join('\n\n');
  return [
    '=== ORIGINAL TASK ===',
    task.prompt,
    '',
    '=== SUB-AGENT DELIVERABLES ===',
    blocks,
    '',
    '=== YOUR JOB: VALIDATE ONLY ===',
    'You did not write these. Judge them by content against each acceptance line.',
    'Reply with ONLY a JSON object, no prose, no code fence:',
    VERDICT_SHAPE,
  ].join('\n');
}

function revisionBrief(subtask: PlannedSubtask, gap: string, previous: string): string {
  return [
    subtask.brief,
    '',
    '=== REVISION ===',
    'A reviewer rejected the previous attempt. Fix exactly this gap and return the full corrected deliverable:',
    `Gap: ${gap}`,
    '',
    'Previous attempt (for reference — do not repeat its mistake):',
    previous.slice(0, 3000),
  ].join('\n');
}

// ── Plan parsing ──────────────────────────────────────────────────────────────

interface PlannedSubtask {
  title: string;
  brief: string;
  skillIds: string[];
  acceptance: string;
}

function tryParse(slice: string): any | null {
  try {
    return JSON.parse(slice);
  } catch {
    try {
      // Trailing-comma tolerance.
      return JSON.parse(slice.replace(/,\s*([}\]])/g, '$1'));
    } catch {
      return null;
    }
  }
}

/**
 * Tolerant JSON extraction.
 *
 * Naive first-`{`-to-last-`}` fails on reasoning models: their thinking prose
 * often contains braces, so the slice spans commentary + answer and never
 * parses. Instead, collect every balanced top-level object (string- and
 * escape-aware) and return the LAST one that carries an expected key — the
 * answer follows the reasoning.
 */
function extractJson(text: string, expectKey?: string): any | null {
  const cleaned = text.replace(/```(?:json)?/gi, '');
  const candidates: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        candidates.push(cleaned.slice(start, i + 1));
        start = -1;
      } else if (depth < 0) {
        depth = 0;
        start = -1;
      }
    }
  }

  // Prefer the last candidate that actually has the key we asked for.
  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    const parsed = tryParse(candidates[i]);
    if (parsed && (!expectKey || parsed[expectKey] !== undefined)) return parsed;
  }
  // Fall back to the widest span — covers a single object truncated mid-prose.
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first >= 0 && last > first) return tryParse(cleaned.slice(first, last + 1));
  return null;
}

/** Ask a model that answered in prose to re-emit the same content as JSON. */
function repairPrompt(previous: string, shape: string): string {
  return [
    'Your previous reply was not valid JSON and could not be parsed.',
    'Re-express the SAME content as a single JSON object. No prose, no markdown, no code fence — the reply must start with { and end with }.',
    '',
    shape,
    '',
    '=== YOUR PREVIOUS REPLY ===',
    previous.slice(0, 4000),
  ].join('\n');
}

interface ParsedPlan {
  subtasks: PlannedSubtask[];
  notes: string;
  /** True when the planner really produced subtasks; false means we degraded. */
  ok: boolean;
  /** Why it failed — 'unparseable' vs 'empty' are different problems. */
  reason?: 'unparseable' | 'empty';
}

function parsePlan(text: string, task: SwarmTask): ParsedPlan {
  const parsed = extractJson(text, 'subtasks');
  const raw = Array.isArray(parsed?.subtasks) ? parsed.subtasks : [];
  const subtasks: PlannedSubtask[] = raw
    .slice(0, MAX_SUBTASKS)
    .map((s: any, i: number) => ({
      title: String(s?.title ?? `Subtask ${i + 1}`).slice(0, 120),
      brief: String(s?.brief ?? '').trim(),
      skillIds: Array.isArray(s?.skillIds)
        ? s.skillIds.map((x: any) => String(x)).slice(0, MAX_SKILLS_PER_SUBTASK)
        : [],
      acceptance: String(s?.acceptance ?? 'Fulfills the task as written.').slice(0, 400),
    }))
    .filter((s: PlannedSubtask) => s.brief.length > 0);

  if (subtasks.length === 0) {
    // The planner produced nothing usable. Delegate the task verbatim rather
    // than inventing a decomposition — and say exactly which failure it was.
    const reason: 'unparseable' | 'empty' = parsed === null ? 'unparseable' : 'empty';
    return {
      subtasks: [
        {
          title: task.title || 'Task',
          brief: task.prompt,
          skillIds: [],
          acceptance: 'Fulfills the task as written.',
        },
      ],
      notes:
        reason === 'unparseable'
          ? 'Planner reply was not parseable JSON — delegated the task verbatim, unplanned.'
          : 'Planner returned an empty subtask list — delegated the task verbatim, unplanned.',
      ok: false,
      reason,
    };
  }
  return { subtasks, notes: String(parsed?.notes ?? '').slice(0, 400), ok: true };
}

function resolveSkills(ids: string[]): BrainSkill[] {
  const out: BrainSkill[] = [];
  for (const id of ids) {
    const entry = getCatalogEntry(id);
    if (entry) out.push(entry);
  }
  return out;
}

// ── Task API ──────────────────────────────────────────────────────────────────

export interface CreateTaskInput {
  title?: string;
  prompt: string;
  agentIds: string[];
  mode: Mode;
  executor?: string;
}

export function createTask(input: CreateTaskInput): SwarmTask {
  const prompt = (input.prompt ?? '').trim();
  if (!prompt) throw new Error('Task prompt is required.');
  const agentIds = [...new Set(input.agentIds ?? [])];
  if (agentIds.length === 0) throw new Error('Select at least one orchestrator.');
  const unknown = agentIds.filter((id) => !AGENT_INDEX.has(id));
  if (unknown.length > 0) throw new Error(`Unknown orchestrator(s): ${unknown.join(', ')}`);
  // No low-quality mode: good models are the default. The API still accepts an
  // explicit 'speed', but nothing in the UI asks for one — OmniRoute decides.
  const mode: Mode = input.mode === 'speed' ? 'speed' : 'reasoning';
  const executor = (input.executor ?? 'auto').trim() || 'auto';
  if (!isExecutor(executor)) throw new Error(`Unknown executor: ${executor}`);

  const now = new Date().toISOString();
  const task: SwarmTask = {
    id: randomUUID(),
    title: (input.title ?? '').trim() || prompt.slice(0, 64),
    prompt,
    agentIds,
    mode,
    executor,
    column: 'NEXT',
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    results: agentIds.map((agentId) => ({ agentId, status: 'pending', phases: [] })),
  };
  addTask(task);
  emit('task:created', task);
  queue.push(task.id);
  pump();
  return task;
}

export function retryTask(id: string): SwarmTask {
  const task = getTask(id);
  if (!task) throw new Error('Task not found.');
  if (task.status === 'running' || task.status === 'queued') return task;
  task.status = 'queued';
  task.column = 'NEXT';
  task.error = undefined;
  task.artifacts = undefined;
  task.results = task.agentIds.map((agentId) => ({ agentId, status: 'pending', phases: [] }));
  task.updatedAt = new Date().toISOString();
  persist();
  emit('task:updated', task);
  queue.push(task.id);
  pump();
  return task;
}

export function moveTask(id: string, column: Column): SwarmTask {
  const task = getTask(id);
  if (!task) throw new Error('Task not found.');
  // Dragging a failed card back into the flow re-queues it for real.
  if ((column === 'NEXT' || column === 'NOW') && task.status === 'error') {
    return retryTask(id);
  }
  task.column = column;
  task.updatedAt = new Date().toISOString();
  persist();
  emit('task:updated', task);
  return task;
}

export function deleteTask(id: string): boolean {
  const removed = removeTask(id);
  if (removed) emit('task:deleted');
  return removed;
}

export function listTasks(): SwarmTask[] {
  return allTasks();
}

export function activeCount(): number {
  return active + queue.length;
}

function pump(): void {
  while (active < CONCURRENCY && queue.length > 0) {
    const id = queue.shift()!;
    const task = getTask(id);
    if (!task || task.status !== 'queued') continue;
    active += 1;
    void execute(task).finally(() => {
      active -= 1;
      pump();
    });
  }
}

// ── Execution ─────────────────────────────────────────────────────────────────

async function execute(task: SwarmTask): Promise<void> {
  task.status = 'running';
  task.column = 'NOW';
  task.updatedAt = new Date().toISOString();
  persist();
  emit('task:updated', task);

  await Promise.all(task.results.map((result) => runOrchestrator(task, result)));

  // ── DELIVER ────────────────────────────────────────────────────────────────
  // Everything above this line only produces text. This is the step that makes
  // a task real: files onto disk, committed, pushed. A task that materializes
  // nothing says so plainly instead of looking finished.
  try {
    task.artifacts = await materializeTask({
      taskId: task.id,
      title: task.title,
      outputs: task.results
        .filter((r) => r.status === 'done' && r.output)
        .map((r) => ({ agentId: r.agentId, text: r.output! })),
    });
  } catch (err) {
    task.artifacts = {
      workspace: null,
      files: [],
      skipped: [],
      committed: false,
      pushed: false,
      note: `Materializer threw: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
  for (const result of task.results) {
    if (result.status !== 'done') continue;
    (result.phases ??= []).push({
      phase: 'deliver',
      detail: task.artifacts.files.length
        ? `${task.artifacts.files.length} file(s) → ${task.artifacts.workspace}${
            task.artifacts.committed ? ' · committed' : ''
          }${task.artifacts.pushed ? ' · pushed' : ''}`
        : task.artifacts.note,
    });
  }

  const failed = task.results.filter((r) => r.status === 'error');
  if (failed.length === 0) {
    task.status = 'done';
    task.column = 'DONE';
  } else {
    task.status = 'error';
    task.column = 'BLOCKED';
    task.error =
      failed.length === task.results.length
        ? failed[0]?.error ?? 'All orchestrators failed.'
        : `${failed.length}/${task.results.length} orchestrators failed. See per-agent errors.`;
  }
  task.updatedAt = new Date().toISOString();
  persist();
  emit('task:updated', task);
  void mirrorToAgentHub(task);
}

async function runOrchestrator(task: SwarmTask, result: AgentResult): Promise<void> {
  const agent = AGENT_INDEX.get(result.agentId);
  const identity = orchestratorIdentity(result.agentId);
  const platformId = agent?.platformId;
  // The orchestrator's own reasoning runs on its pinned brain chain unless the
  // operator explicitly chose an executor other than auto for this task.
  const brainExecutor =
    task.executor && task.executor !== 'auto' ? task.executor : agent?.brainExecutor ?? 'auto';
  const phases: PhaseNote[] = [];
  result.phases = phases;
  result.status = 'running';
  const touch = () => {
    task.updatedAt = new Date().toISOString();
    persist();
    emit('task:updated', task);
  };
  touch();

  const note = (phase: PhaseNote['phase'], detail: string, ms?: number) => {
    phases.push({ phase, detail, ms });
    touch();
  };

  try {
    // ── 1. PLAN ───────────────────────────────────────────────────────────────
    const journal = platformId ? readJournal(platformId)?.content ?? '' : '';
    note('plan', `journal ${journal ? `${journal.length} chars` : 'empty'} · catalog ${loadCatalog().skills.length} entries`);

    const planned = await route({
      mode: PLANNING_MODE,
      executor: brainExecutor,
      system: identity,
      prompt: planPrompt(task, journal),
      maxTokens: MAX_TOKENS,
    });
    let plan = parsePlan(planned.text, task);

    // Reasoning models answer with prose around the JSON. One repair round-trip
    // asking for the same content as bare JSON recovers most of those.
    if (!plan.ok) {
      // Two different failures need two different retries. A gateway cache miss
      // means the model never received the prompt at all, so re-send it smaller;
      // anything else means it answered in prose, so ask for JSON only.
      const cacheMiss = looksLikeCacheMiss(planned.text);
      const repaired = await route({
        mode: PLANNING_MODE,
        executor: brainExecutor,
        system: identity,
        prompt: cacheMiss ? compactPlanPrompt(task) : repairPrompt(planned.text, PLAN_SHAPE),
        maxTokens: MAX_TOKENS,
      });
      const retry = parsePlan(repaired.text, task);
      if (retry.ok) {
        plan = retry;
        note(
          'plan',
          cacheMiss
            ? 'gateway cache miss dropped the first prompt - compact re-send produced a valid plan'
            : 'repair round-trip recovered a valid plan',
          repaired.ms,
        );
      } else {
        note(
          'plan',
          `planner failed twice (${retry.reason}${cacheMiss ? ', gateway cache miss' : ''}) - proceeding unplanned. First reply began: "${planned.text
            .slice(0, 160)
            .replace(/\s+/g, ' ')}"`,
          repaired.ms,
        );
      }
    }
    note(
      'plan',
      `${plan.subtasks.length} subtask(s) via ${planned.provider}/${planned.model}${
        plan.notes ? ` — ${plan.notes}` : ''
      }`,
      planned.ms,
    );

    // ── 2. DELEGATE ───────────────────────────────────────────────────────────
    const work = await Promise.all(
      plan.subtasks.map(async (subtask) => {
        const skills = resolveSkills(subtask.skillIds);
        const missing = subtask.skillIds.filter((id) => !skills.some((s) => s.id === id));
        const routed = await route({
          mode: task.mode,
          executor: task.executor ?? 'auto',
          system: workerSystem(subtask, skills, agent?.name ?? result.agentId),
          prompt: subtask.brief,
          maxTokens: MAX_TOKENS,
        });
        note(
          'work',
          `"${subtask.title}" · skills [${skills.map((s) => s.id).join(', ') || 'none'}]${
            missing.length ? ` · unresolved [${missing.join(', ')}]` : ''
          } · ${routed.provider}/${routed.model}`,
          routed.ms,
        );
        return { subtask, output: routed.text, provider: routed.provider, model: routed.model };
      }),
    );

    // ── 3. VALIDATE ───────────────────────────────────────────────────────────
    const validated = await route({
      mode: PLANNING_MODE,
      executor: brainExecutor,
      system: identity,
      prompt: validatePrompt(task, work),
      maxTokens: MAX_TOKENS,
    });
    let verdictDoc = extractJson(validated.text, 'verdicts');
    if (!Array.isArray(verdictDoc?.verdicts) || verdictDoc.verdicts.length === 0) {
      const repaired = await route({
        mode: PLANNING_MODE,
        executor: brainExecutor,
        system: identity,
        prompt: repairPrompt(validated.text, VERDICT_SHAPE),
        maxTokens: MAX_TOKENS,
      });
      const retry = extractJson(repaired.text, 'verdicts');
      if (Array.isArray(retry?.verdicts) && retry.verdicts.length > 0) {
        verdictDoc = retry;
        note('validate', 'repair round-trip recovered the verdicts', repaired.ms);
      }
    }
    const verdicts: any[] = Array.isArray(verdictDoc?.verdicts) ? verdictDoc.verdicts : [];
    const verdictFor = (i: number) => verdicts.find((v) => Number(v?.index) === i + 1);
    note(
      'validate',
      verdicts.length
        ? verdicts
            .map((v) => `#${v?.index}: ${v?.pass ? 'PASS' : 'FAIL'} — ${String(v?.checked ?? '').slice(0, 120)}`)
            .join(' | ')
        : 'validator returned no parseable verdicts — deliverables reported unvalidated',
      validated.ms,
    );

    // One revision round: re-brief only what failed. The orchestrator still
    // does not fix anything itself.
    for (let i = 0; i < work.length; i += 1) {
      const verdict = verdictFor(i);
      if (!verdict || verdict.pass !== false) continue;
      const gap = String(verdict.gap ?? 'Unspecified gap.').slice(0, 800);
      const redo = await route({
        mode: task.mode,
        executor: task.executor ?? 'auto',
        system: workerSystem(work[i].subtask, resolveSkills(work[i].subtask.skillIds), agent?.name ?? result.agentId),
        prompt: revisionBrief(work[i].subtask, gap, work[i].output),
        maxTokens: MAX_TOKENS,
      });
      work[i] = { ...work[i], output: redo.text, provider: redo.provider, model: redo.model };
      note('work', `revision of "${work[i].subtask.title}" after FAIL — ${redo.provider}/${redo.model}`, redo.ms);
      verdict.revised = true;
    }

    // ── Assemble the operator-facing output ──────────────────────────────────
    const summary = String(verdictDoc?.summary ?? '').trim();
    const overall =
      typeof verdictDoc?.overallPass === 'boolean'
        ? verdictDoc.overallPass
        : verdicts.length > 0
          ? verdicts.every((v) => v?.pass !== false)
          : null;
    result.output = [
      `## ${agent?.name ?? result.agentId} — orchestrated (${plan.subtasks.length} subtask${plan.subtasks.length === 1 ? '' : 's'})`,
      plan.notes ? `_Plan: ${plan.notes}_` : '',
      summary ? `\n**Validation:** ${summary}` : '',
      overall === null
        ? '\n**Validation:** unverified — validator output was not parseable.'
        : `\n**Verdict:** ${overall ? 'PASS' : 'GAPS REMAIN'}`,
      '',
      ...work.map((w, i) => {
        const v = verdictFor(i);
        const badge = !v
          ? 'unvalidated'
          : v.pass === false
            ? v.revised
              ? 'revised after FAIL'
              : 'FAIL'
            : 'validated';
        return [
          `### ${i + 1}. ${w.subtask.title} — ${badge}`,
          `_skills: ${w.subtask.skillIds.join(', ') || 'none'} · ${w.provider}/${w.model}_`,
          '',
          w.output,
        ].join('\n');
      }),
    ]
      .filter(Boolean)
      .join('\n');
    result.provider = planned.provider;
    result.model = planned.model;
    result.ms = phases.reduce((sum, p) => sum + (p.ms ?? 0), 0);
    result.status = 'done';

    // ── 4. JOURNAL ────────────────────────────────────────────────────────────
    if (platformId) {
      const entry = [
        `# ${agent?.name ?? result.agentId} STATE`,
        '',
        `Last task: ${task.title}`,
        `Plan: ${plan.subtasks.length} subtask(s) — ${plan.subtasks.map((s) => s.title).join('; ')}`,
        `Skills used: ${[...new Set(plan.subtasks.flatMap((s) => s.skillIds))].join(', ') || 'none'}`,
        `Validation: ${overall === null ? 'unverified (unparseable)' : overall ? 'pass' : 'gaps remain'}`,
        summary ? `Learned: ${summary}` : '',
        journal.trim() ? `\nPrevious:\n${journal.replace(/<!-- updated:.*?-->\n?/g, '').trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      const written = writeJournal(platformId, entry);
      note('journal', written ? `wrote ${written.bytes}B to ${platformId}${written.truncated ? ' (truncated)' : ''}` : `platform ${platformId} not registered — journal skipped`);
    } else {
      note('journal', 'no platform bound — journal skipped');
    }
    touch();
  } catch (err) {
    const message =
      err instanceof OmniRouteError
        ? `[${err.code}] ${err.message}`
        : err instanceof Error
          ? err.message
          : String(err);

    // Ornith is the floor: when its chain is exhausted it is allowed to do the
    // work itself. Every other orchestrator fails closed — no silent worker.
    if (result.agentId === 'ornith') {
      try {
        note('work', `orchestration failed (${message}) — ornith executing directly as worker of last resort`);
        const direct = await route({
          mode: task.mode,
          executor: 'ornith',
          system: [
            orchestratorIdentity('ornith'),
            '',
            'DEGRADED MODE: no sub-agent capacity is available. You are permitted to do this work yourself. Label it as produced in degraded mode.',
          ].join('\n'),
          prompt: task.prompt,
          maxTokens: MAX_TOKENS,
        });
        result.output = [
          '## ORNITH — degraded mode (direct execution, unvalidated)',
          `_Orchestration unavailable: ${message}_`,
          '',
          direct.text,
        ].join('\n');
        result.provider = direct.provider;
        result.model = direct.model;
        result.ms = direct.ms;
        result.status = 'done';
        note('validate', 'skipped — degraded mode output is unvalidated by design', direct.ms);
        touch();
        return;
      } catch (fallbackErr) {
        result.status = 'error';
        result.error = `${message} | degraded-mode fallback also failed: ${
          fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
        }`;
        touch();
        return;
      }
    }

    result.status = 'error';
    result.error = message;
    touch();
  }
}

/**
 * Optional bridge: mirror finished tasks to an external AgentTask API.
 * Fully disabled unless BOTH env values are present (fail-closed).
 */
async function mirrorToAgentHub(task: SwarmTask): Promise<void> {
  const url = (process.env.AGENT_HUB_URL ?? '').trim();
  const apiKey = (process.env.AGENT_HUB_API_KEY ?? '').trim();
  if (!url || !apiKey) return;
  try {
    await fetch(`${url.replace(/\/+$/, '')}/api/entities/AgentTask`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', api_key: apiKey },
      body: JSON.stringify({
        external_id: task.id,
        title: task.title,
        status: task.status,
        column: task.column,
        mode: task.mode,
        agents: task.agentIds,
        updated_at: task.updatedAt,
      }),
    });
  } catch (err) {
    console.error('[agent-hub-bridge] mirror failed:', err instanceof Error ? err.message : err);
  }
}
