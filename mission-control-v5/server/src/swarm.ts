/**
 * SWARM ORCHESTRATOR — Adversarial Judge Edition.
 *
 * WORKFLOW:
 * 1. TRI-EXECUTION: For every task, THREE orchestrators (OpenClaw, FCC-Claude, Hermes)
 *    must execute the task independently using their best skills.
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
import { AGENT_INDEX, CATEGORY_INDEX, ORCHESTRATOR_CONTRACT } from './agents.js';
import { loadCatalog, getCatalogEntry, type BrainSkill } from './catalog.js';
import { readJournal, writeJournal } from './brainStore.js';
import { materializeTask } from './materialize.js';
import { isExecutor, route } from './omniroute.js';
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
const JUDGE_SHAPE =
  '{\"decision\":\"accept|deny\",\"index\":1,\"reason\":\"one-line justification\",\"editedOutput\":\"full corrected deliverable, or empty string to ship as-is\"}';

async function execute(task: SwarmTask): Promise<void> {
  // Run the agents the TASK asked for. The old hardcoded trio ignored
  // task.agentIds and included 'fcc-opus', which is not an agent id, so one
  // judge "version" was always undefined.
  const requested = (task.agentIds ?? []).filter(id => AGENT_INDEX.has(id));
  const activeAgents = requested.length > 0
    ? requested
    : ['openclaw', 'hermes'].filter(id => AGENT_INDEX.has(id));

  try {
    await Promise.all(activeAgents.map(async (agentId) => {
      const res = await runOrchestrationCycle(task, agentId);
      const existing = task.results.find(r => r.agentId === agentId);
      if (existing) Object.assign(existing, res);
      else task.results.push(res);
    }));

    // Only outputs that exist compete; a failed cycle must not poison the
    // judge with "undefined".
    const contenders = task.results.filter(r => r.status === 'done' && r.output && r.output.trim());

    if (contenders.length === 0) {
      task.status = 'error';
      task.error = task.results.map(r => `[${r.agentId}] ${r.error ?? 'no output'}`).join(' | ');
    } else {
      // THE JUDGE IS A GATE (owner directive 2026-08-16): every deliverable —
      // even a lone contender — needs an explicit ACCEPT from the judge lane
      // before it lands. DENY or an unreachable judge sends the task BLOCKED
      // for human review. Nothing ships by default anymore; only judge-accepted
      // work may ever be pushed or merged, and workers never push.
      try {
        const judgeResult = await route({
          mode: 'reasoning',
          system: [
            'You are THE JUDGE — the highest-reasoning gate of the swarm, and you are not any of the workers.',
            'You alone decide what ships. Accept the best version (optionally with your edits), or deny all.',
            'Deny anything unverified, fabricated, off-doctrine, or below the acceptance bar.',
          ].join(' '),
          prompt: [
            `Compare these ${contenders.length} version(s) of the same task.`,
            `TASK: ${task.prompt}`,
            '',
            ...contenders.map((c, k) => `VERSION ${k + 1} (${c.agentId}): ${c.output}`),
            '',
            'Reply with ONLY JSON:',
            JUDGE_SHAPE,
          ].join(String.fromCharCode(10)),
          executor: isExecutor('judge') ? 'judge' : 'auto',
        });
        const verdict = extractJson(judgeResult.text, 'decision');
        const decision = String(verdict?.decision ?? '').toLowerCase();
        const idx = Number(verdict?.index);

        if (decision === 'accept' && Number.isFinite(idx) && idx >= 1 && idx <= contenders.length) {
          const winner = contenders[idx - 1];
          const edited = typeof verdict?.editedOutput === 'string' && verdict.editedOutput.trim().length > 0;
          const finalText = edited ? verdict.editedOutput : (winner.output ?? '');
          (winner.phases ??= []).push({
            phase: 'validate',
            detail: `judge (${judgeResult.model}) ACCEPTED version ${idx} (${winner.agentId})${edited ? ' WITH EDITS' : ''}${verdict?.reason ? ` — ${verdict.reason}` : ''}`,
          });
          task.artifacts = await materializeTask({
            taskId: task.id,
            title: task.title,
            outputs: [{ agentId: winner.agentId, text: finalText }]
          });
          task.status = 'done';
          task.column = 'DONE';
        } else {
          task.status = 'error';
          task.column = 'BLOCKED';
          task.error = `JUDGE DENIED all ${contenders.length} version(s)${verdict?.reason ? `: ${verdict.reason}` : ' (no parseable accept)'} — needs human review.`;
        }
      } catch (judgeErr) {
        task.status = 'error';
        task.column = 'BLOCKED';
        task.error = `JUDGE UNREACHABLE — ${judgeErr instanceof Error ? judgeErr.message : String(judgeErr)}. Nothing ships without the judge; task held for human review.`;
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
    
    // JOURNAL
    if (agent.platformId) writeJournal(agent.platformId, `Task ${task.id} completed: ${result.output?.slice(0, 200)}`);
    result.phases?.push({ phase: 'journal', detail: 'Journal updated.', ms: 0 });
    
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
    agentIds: ['openclaw', 'fcc-opus', 'hermes'],
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
