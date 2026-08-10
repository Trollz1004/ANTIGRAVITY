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
 * 3. ADVERSARIAL JUDGE: All three final results are presented to a MAX Reasoning model.
 * 4. DECISION: Judge picks the best version. Only then is it pushed/merged.
 */
import { randomUUID } from 'node:crypto';
import { AGENT_INDEX, CATEGORY_INDEX, ORCHESTRATOR_CONTRACT } from './agents.js';
import { loadCatalog, getCatalogEntry, type BrainSkill } from './catalog.js';
import { readJournal, writeJournal } from './brainStore.js';
import { materializeTask } from './materialize.js';
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
  ].join('\\n');
}

function skillMenu(compact = false): string {
  const { skills } = loadCatalog();
  if (skills.length === 0) return '(No skills found in catalog.)';
  if (compact) return skills.map((s) => s.id).join(', ');
  return skills.map((s) => `- ${s.id}: ${s.description.slice(0, 70)}`).join('\\n');
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
  ].filter(Boolean).join('\\n');
}

function workerSystem(subtask: any, skills: BrainSkill[], orchestratorName: string): string {
  const loaded = skills.length
    ? skills.map((s) => `── SKILL: ${s.label} (${s.id}) ──\\n${s.body.slice(0, SKILL_BODY_CHARS)}`).join('\\n\\n')
    : '(No skills matched.)';
  return [
    `You are a sub-agent delegated by ${orchestratorName}.`,
    '=== LOADED SKILLS ===',
    loaded,
    '=== OUTPUT RULES ===',
    `Deliverable must satisfy: ${subtask.acceptance}`,
    'Emit files as: File: `path/name.ext`\\n```lang\\ncontent\\n```',
  ].join('\\n');
}

const VERDICT_SHAPE = '{\"verdicts\":[{\"index\":0,\"pass\":true,\"gap\":\"\"}],\"overallPass\":true}';

async function execute(task: SwarmTask): Promise<void> {
  const adversarialAgents = ['openclaw', 'fcc-opus', 'hermes']; 
  const activeAgents = adversarialAgents.filter(id => AGENT_INDEX.has(id));

  try {
    await Promise.all(activeAgents.map(async (agentId) => {
      const res = await runOrchestrationCycle(task, agentId);
      const existing = task.results.find(r => r.agentId === agentId);
      if (existing) Object.assign(existing, res);
      else task.results.push(res);
    }));

    const judgePrompt = `You are the FINAL JUDGE. Compare these 3 versions of the same task.
    TASK: ${task.prompt}
    
    VERSION 1 (OpenClaw): ${task.results.find(r => r.agentId === 'openclaw')?.output}
    VERSION 2 (FCC-Claude): ${task.results.find(r => r.agentId === 'fcc-opus')?.output}
    VERSION 3 (Hermes): ${task.results.find(r => r.agentId === 'hermes')?.output}

    PICK THE BEST VERSION. If all fail, BLOCK.
    Reply with ONLY JSON: ${VERDICT_SHAPE}`;

    const judgeResult = await route({
      mode: 'reasoning',
      system: 'You are the Max-Reasoning Judge. Pick the best deliverable.',
      prompt: judgePrompt,
      executor: 'judge'
    });

    const verdict = extractJson(judgeResult.text, 'verdicts');
    if (verdict?.overallPass) {
      const winnerId = verdict.verdicts[0].index === 0 ? 'openclaw' : verdict.verdicts[0].index === 1 ? 'fcc-opus' : 'hermes';
      const winner = task.results.find(r => r.agentId === winnerId);
      
      task.artifacts = await materializeTask({
        taskId: task.id,
        title: task.title,
        outputs: [{ agentId: winnerId, text: winner?.output ?? '' }]
      });
      task.status = 'done';
      task.column = 'DONE';
    } else {
      task.status = 'error';
      task.error = 'Judge rejected all versions.';
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
  const journal = (readJournal(agent.platformId!) ?? '') as string;
  const result: AgentResult = { agentId, status: 'running', phases: [] };
  
  try {
    // 1. PLAN (Mandate >= 4 skills)
    const planText = await route({
      mode: PLANNING_MODE,
      system: orchestratorIdentity(agentId),
      prompt: buildPlanPrompt(task, journal, false),
      executor: agent.brainExecutor
    });
    
    const plan = extractJson(planText.text, 'subtasks');
    if (!plan || !Array.isArray(plan.subtasks)) throw new Error('Planner failed to produce a valid JSON subtask list.');
    
    result.phases?.push({ phase: 'plan', detail: `Planned ${plan.subtasks.length} subtasks.`, ms: 0 });
    
    const deliverables: { subtask: PlannedSubtask, output: string }[] = [];
    
    for (const sub of plan.subtasks) {
      let attempt = 0;
      let output = '';
      let passed = false;
      let currentBrief = sub.brief;
      
      while (attempt < 2 && !passed) {
        // WORK: Sub-agents execute with preloaded skills
        const skills = (sub.skillIds || []).map(id => getCatalogEntry(id)).filter(Boolean) as BrainSkill[];
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
          prompt: `Original Task: ${task.prompt}\\n\\nSubtask: ${sub.title}\\nAcceptance: ${sub.acceptance}\\n\\nDeliverable:\\n${output}\\n\\nValidate. If it fails, you MUST provide a gap. Reply with ONLY JSON: ${VERDICT_SHAPE}`
        });
        
        const verdict = extractJson(validateText.text, 'verdicts');
        if (verdict?.overallPass) {
          passed = true;
        } else {
          attempt++;
          const gap = verdict?.verdicts?.[0]?.gap ?? 'Improve the output based on acceptance criteria.';
          currentBrief = `ORIGINAL BRIEF: ${sub.brief}\\n\\nREVISION GAP: ${gap}\\n\\nFIX THIS GAP and return the full corrected deliverable.`;
        }
      }
      deliverables.push({ subtask: sub, output });
    }
    
    result.output = deliverables.map(d => `--- ${d.subtask.title} ---\\n${d.output}`).join('\\n\\n');
    result.status = 'done';
    
    // JOURNAL
    writeJournal(agent.platformId!, `Task ${task.id} completed: ${result.output?.slice(0, 200)}`);
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
