/**
 * THE FOUR ORCHESTRATORS — the only agents Mission Control ever needs.
 *
 * Agents are harnesses, not personas. Roles live in the skill catalog
 * (E:\ANTIGRAVITY skills, surfaced by catalog.ts) and are loaded onto
 * sub-agents per task. An orchestrator never does the work: it plans,
 * delegates to skill-loaded sub-agents, validates by content, and keeps
 * its journal current. See ORCHESTRATOR_CONTRACT — the one source of
 * that doctrine, injected into every orchestrator phase by swarm.ts.
 */
import type { AgentDef, CategoryDef } from './types.js';

export const CATEGORIES: CategoryDef[] = [{ id: 'orchestrators', label: 'ORCHESTRATORS' }];

/**
 * The shared doctrine. One source ("one of everything"), injected verbatim
 * into every plan and validate phase.
 */
export const ORCHESTRATOR_CONTRACT = [
  'ORCHESTRATOR CONTRACT — you never do the work yourself.',
  '1. PLAN — decompose the task into 1-4 subtasks. For each, select EVERY catalog skill that raises the result. All that help, not just the best one.',
  '2. DELEGATE — each subtask is executed by a sub-agent carrying those skills. You write the brief; the sub-agent writes the deliverable.',
  '3. VALIDATE — judge the deliverable against the acceptance criteria by content, not by status. Done means you can say what you checked and that it passed. If it fails, re-brief and re-delegate. Never patch it yourself.',
  '4. JOURNAL — your STATE journal is read when a task starts and written when it ends. Keep it current.',
  'Claim nothing unverified. If a fact is unverified, label it unverified. Never fabricate data, metrics, or results.',
].join('\n');

export const AGENTS: AgentDef[] = [
  {
    id: 'hermes',
    name: 'HERMES',
    category: 'orchestrators',
    description:
      'Orchestrates through the Hermes harness — skill hub (skills.sh), YouTube and memory built-ins, Telegram surface, and CLI delegation: it can hand a subtask to fcc-claude or fcc-codex as a real worker process. Plans, delegates to skill-loaded sub-agents, validates by content, journals. Never does the work itself.',
    harness:
      'Hermes skill hub (skills.sh) · delegates to fcc-claude / fcc-codex CLIs · YouTube · memory store · Telegram',
    platformId: 'hermes',
    brainExecutor: 'auto',
  },
  {
    id: 'openclaw',
    name: 'OPENCLAW',
    category: 'orchestrators',
    description:
      'Orchestrates through the OpenClaw / ClawX harness — ClawHub skill registry, gateway on :18789, bundled CLI and TUI. Plans, delegates to skill-loaded sub-agents, validates by content, journals. Never does the work itself.',
    harness: 'ClawHub registry · ClawX gateway :18789 · CLI/TUI',
    platformId: 'openclaw',
    brainExecutor: 'auto',
  },
  {
    id: 'claude-cli',
    name: 'CLAUDE CLI',
    category: 'orchestrators',
    description:
      'Orchestrates through the Claude Code harness — launched via FCC or pointed straight at OmniRoute (cc/claude-opus through the gateway). Deepest reasoning of the four; full CLI toolset. Plans, delegates, validates, journals. Never does the work itself.',
    harness: 'Claude Code toolset · FCC proxy :8082 · cc/claude-opus via OmniRoute',
    platformId: 'free-claude-code',
    brainExecutor: 'fcc-opus',
  },
  {
    id: 'ornith',
    name: 'ORNITH',
    category: 'orchestrators',
    description:
      'The local floor — ornith:9b (~5.6 GB, fits the GTX 1070) via Ollama, offline-capable. Orchestrates like the others, with one deliberate exception: when cloud and gateways are down it is permitted to do the work directly, as worker of last resort.',
    harness: 'Ollama :11434 · ornith:9b local · offline-capable',
    platformId: 'ornith',
    brainExecutor: 'ornith',
  },
];

export const AGENT_INDEX = new Map(AGENTS.map((agent) => [agent.id, agent]));
export const CATEGORY_INDEX = new Map(CATEGORIES.map((c) => [c.id, c]));

// Exactly four. Roles are skills now — adding a fifth agent here is drift.
if (AGENTS.length !== 4) {
  throw new Error(`Orchestrator roster must be exactly 4 — found ${AGENTS.length}.`);
}
