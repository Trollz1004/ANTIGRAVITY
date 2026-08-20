/**
 * SWARM ORCHESTRATOR — Adversarial Judge Edition.
 *
 * WORKFLOW:
 * 1. MULTI-EXECUTION: Task-selected orchestrators execute independently using
 *    their relevant skills.
 * 2. SUB-AGENT SWARM: Each orchestrator:
 *    - PLAN: Decomposes task, assigns >= 4 skills per sub-task.
 *    - WORK: Sub-agents execute with those skills preloaded.
 *    - VALIDATE: Orchestrator improves at least 1 thing, reruns, and verifies.
 * 3. ADVERSARIAL JUDGE: All final results are presented to the JUDGE executor —
 *    the highest-reasoning route available, never one of the worker models.
 * 4. DECISION: The judge ACCEPTS one version (optionally with edits), or DENIES
 *    all of them. Denied or judge-unreachable tasks go BLOCKED for human
 *    review — the judge is a GATE, not an optimizer. Only judge-accepted work
 *    may be pushed/merged; workers and orchestrators never push.
 */
import { randomUUID } from 'node:crypto';
import { AGENT_INDEX, CATEGORY_INDEX, HARNESS_LANE_IDS, ORCHESTRATOR_CONTRACT } from './agents.js';
import { loadCatalog, getCatalogEntry, type BrainSkill } from './catalog.js';
import { appendSessionCloseout, readJournal } from './brainStore.js';
import { route } from './omniroute.js';
import { addTask, allTasks, getTask, persist, removeTask } from './store.js';
import type { AgentResult, Column, Mode, SwarmTask } from './types.js';

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
    } catch {}
  }
}

const CONCURRENCY = Math.max(1, Number(process.env.SWARM_CONCURRENCY ?? 3) || 3);
const SKILL_BODY_CHARS = Math.max(400, Number(process.env.SWARM_SKILL_BODY_CHARS ?? 2400) || 2400);
const PLANNING_MODE: Mode = 'reasoning';

let active = 0;
const queue: string[] = [];

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

function skillMenu(compact = false): string {
  const { skills } = loadCatalog();
  if (skills.length === 0) return '(No skills found in catalog.)';
  if (compact) return skills.map((s) => s.id).join(', ');
  return skills.map((s) => `- ${s.id}: ${s.description.slice(0, 70)}`).join('\n');
}

const PLAN_SHAPE = `Reply with ONLY a JSON object, no prose:
{\"subtasks\":[{\"title\":\"label\",\"brief\":\"complete instructions\",\"skillIds\":[\"id\",...],\"acceptance\":\"how to prove it is done\"}],\"notes\":\"decomposition notes\"}
Rules: 1-4 subtasks. MUST assign >= 4 skills per subtask if available.`;

function buildPlanPrompt(task: SwarmTask, journal: string, compactSkills: boolean): string {
  return [
    `JOURNAL: ${journal.slice(0, 400)}`,
    `SKILLS: ${skillMenu(compactSkills)}`,
    `TASK: ${task.prompt}`,
    'PLAN ONLY. ' + PLAN_SHAPE,
  ].filter(Boolean).join('\n');
}

function workerSystem(subtask: any, skills: BrainSkill[], orchestratorName: string): string {
  const loaded = skills.length
    ? skills.map((s) => `── SKILL: ${s.label} (${s.id}) ──\n${s.body.slice(0, SKILL_BODY_CHARS)}`).join('\n\n')
    : '(No skills matched.)';
  return [
    `You are a sub-agent delegated by ${orchestratorName}.`,
    '=== LOADED SKILLS ===',
    loaded,
    '=== OUTPUT RULES ===',
    `Deliverable must satisfy: ${subtask.acceptance}`,
    'Emit files as: File: `path/name.ext`\n```lang\ncontent\n```',
  ].join('\n');
}

const VERDICT_SHAPE = '{\"verdicts\":[{\"index\":0,\"pass\":true,\"gap\":\"\"}],\"overallPass\":true}';

/** The gate verdict. accept = ship version `index` (editedOutput, when present, replaces it verbatim). deny = block all. */
// Legacy JSON shape retained as an explicit audit marker. It is never sent to a
// model because official judges cannot be selected through this worker module.
const JUDGE_SHAPE =
  '{\"decision\":\"accept|deny\",\"index\":1,\"reason\":\"one-line justification\",\"editedOutput\":\"full corrected deliverable, or empty string to ship as-is\"}';
void JUDGE_SHAPE;

async function execute(task: SwarmTask): Promise<void> {
  const activeAgents = HARNESS_LANE_IDS.filter((id) => AGENT_INDEX.has(id));

  try {
    await Promise.all(activeAgents.map(async (agentId) => {
      const res = await runOrchestrationCycle(task, agentId);
      const existing = task.results.find(r => r.agentId === agentId);
      if (existing) Object.assign(existing, res);
      else task.results.push(res);
    }));

    // Worker output is never auto-judged through OmniRoute, an API key, or a
    // model fallback. It is retained as a review packet and blocked until an
    // independent first-party account-authenticated judge records evidence.
    const contenders = task.results.filter((r) => r.status === 'done' && r.output && r.output.trim());
    if (contenders.length === 0) {
      task.status = 'error';
      task.column = 'BLOCKED';
      task.error = task.results.map((r) => `[${r.agentId}] ${r.error ?? 'no output'}`).join(' | ');
    } else {
      task.status = 'error';
      task.column = 'BLOCKED';
      task.error = `OFFICIAL JUDGE REQUIRED — ${contenders.length} worker review packet(s) are ready. No worker may approve, materialize, commit, push, merge, delete, or substitute for a judge.`;
      for (const contender of contenders) {
        (contender.phases ??= []).push({
          phase: 'validate',
          detail: 'Worker self-review complete; independent official judge evidence required before delivery.',
        });
      }
    }
  } catch (err) {
    task.status = 'error';
    task.error = err instanceof Error ? err.message : String(err);
  } finally {
    persist();
    emit('task:updated', task);
  }
}

interface PlannedSubtask {
  title: string;
  brief: string;
  skillIds: string[];
  acceptance: string;
}

async function runOrchestrationCycle(task: SwarmTask, agentId: string): Promise<AgentResult> {
  const agent = AGENT_INDEX.get(agentId)!;
  // readJournal returns { content, ... } | null - never a string. The old
  // `as string` cast made journal.slice() throw on EVERY task (2026-08-12).
  const journal = agent.platformId ? (readJournal(agent.platformId)?.content ?? '') : '';
  const result: AgentResult = { agentId, status: 'running', phases: [] };
  
  try {
    // 1. PLAN (Mandate >= 4 skills)
    const planText = await route({
      mode: PLANNING_MODE,
      system: orchestratorIdentity(agentId),
      prompt: buildPlanPrompt(task, journal, false),
      executor: agent.brainExecutor
    });
    
    let plan = extractJson(planText.text, 'subtasks');
    if (!plan || !Array.isArray(plan.subtasks) || plan.subtasks.length === 0) {
      // An unplannable task is still runnable: delegate verbatim instead of
      // failing the whole task over a formatting miss.
      plan = { subtasks: [{ title: task.title, brief: task.prompt, skillIds: [], acceptance: 'Fulfills the task as written.' }] };
      result.phases?.push({ phase: 'plan', detail: 'planner reply unparseable - delegated verbatim as one subtask', ms: 0 });
    }
    
    result.phases?.push({ phase: 'plan', detail: `Planned ${plan.subtasks.length} subtasks.`, ms: 0 });
    
    const deliverables: { subtask: PlannedSubtask, output: string }[] = [];
    
    for (const sub of plan.subtasks) {
      let attempt = 0;
      let output = '';
      let passed = false;
      let currentBrief = sub.brief;
      
      while (attempt < 2 && !passed) {
        // WORK: Sub-agents execute with preloaded skills
        const skills = (sub.skillIds || []).map((id: string) => getCatalogEntry(id)).filter(Boolean) as BrainSkill[];
        const workerText = await route({
          mode: 'speed',
          system: workerSystem(sub, skills, agent.name),
          prompt: currentBrief,
          executor: 'auto'
        });
        output = workerText.text;
        
        // VALIDATE: Orchestrator judges based on content
        const validateText = await route({
          mode: PLANNING_MODE,
          system: orchestratorIdentity(agentId),
          prompt: `Original Task: ${task.prompt}\n\nSubtask: ${sub.title}\nAcceptance: ${sub.acceptance}\n\nDeliverable:\n${output}\n\nValidate. If it fails, you MUST provide a gap. Reply with ONLY JSON: ${VERDICT_SHAPE}`
        });
        
        const verdict = extractJson(validateText.text, 'verdicts');
        if (verdict?.overallPass) {
          passed = true;
        } else {
          attempt++;
          const gap = verdict?.verdicts?.[0]?.gap ?? 'Improve the output based on acceptance criteria.';
          currentBrief = `ORIGINAL BRIEF: ${sub.brief}\n\nREVISION GAP: ${gap}\n\nFIX THIS GAP and return the full corrected deliverable.`;
        }
      }
      deliverables.push({ subtask: sub, output });
    }
    
    result.output = deliverables.map(d => `--- ${d.subtask.title} ---\n${d.output}`).join('\n\n');
    result.status = 'done';
    
    // JOURNAL — append the session evidence; never replace the required
    // start-state memory with an unstructured completion fragment.
    if (agent.platformId) {
      appendSessionCloseout(agent.platformId, {
        taskId: task.id,
        objective: task.title,
        skills: plan.subtasks.flatMap((sub: PlannedSubtask) => sub.skillIds ?? []).filter(Boolean),
        evidence: ['worker self-validation completed', `deliverables=${deliverables.length}`],
        blocker: null,
        nextAction: 'Submit the self-reviewed packet to an independent official judge lane.',
      });
    }
    result.phases?.push({ phase: 'journal', detail: 'Structured session closeout appended.', ms: 0 });
    
  } catch (err) {
    result.status = 'error';
    result.error = err instanceof Error ? err.message : String(err);
  }
  
  return result;
}

function extractJson(text: string, expectKey?: string): any | null {
  const cleaned = text.replace(/```(?:json)?/gi, '');
  const candidates: string[] = [];
  let depth = 0, start = -1, inString = false, escaped = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (escaped) escaped = false; else if (ch === '\\\\') escaped = true; else if (ch === '\"') inString = false;
      continue;
    }
    if (ch === '\"') inString = true; else if (ch === '{') {
      if (depth === 0) start = i; depth += 1;
    } else if (ch === '}') {
      depth -= 1; if (depth === 0 && start >= 0) { candidates.push(cleaned.slice(start, i + 1)); start = -1; }
    }
  }
  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    const parsed = tryParse(candidates[i]);
    if (parsed && (!expectKey || parsed[expectKey] !== undefined)) return parsed;
  }
  return null;
}

function tryParse(slice: string): any | null {
  try { return JSON.parse(slice); } catch {
    try { return JSON.parse(slice.replace(/,\\s*([}\\]])/g, '$1')); } catch { return null; }
  }
}

export function createTask(input: any): SwarmTask {
  const now = new Date().toISOString();
  const task: SwarmTask = {
    id: randomUUID(),
    title: input.title || 'Task',
    prompt: input.prompt,
    agentIds: [...HARNESS_LANE_IDS],
    mode: 'reasoning',
    executor: 'auto',
    column: 'NEXT',
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    results: [],
  };
  addTask(task);
  queue.push(task.id);
  pump();
  return task;
}

export function retryTask(id: string): SwarmTask {
  const task = getTask(id);
  if (!task) throw new Error('Task not found.');
  task.status = 'queued';
  task.column = 'NEXT';
  // A retry is a fresh attempt: stale failure text must not survive next to a
  // fresh verdict (verified live 2026-08-16 — a DONE task still showed the
  // previous attempt's provider error).
  delete task.error;
  queue.push(task.id);
  pump();
  return task;
}

export function moveTask(id: string, column: Column): SwarmTask {
  const task = getTask(id);
  if (!task) throw new Error('Task not found.');
  task.column = column;
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
