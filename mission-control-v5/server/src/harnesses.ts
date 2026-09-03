/**
 * HARNESSES — the only standing agents in Mission Control.
 *
 * There are exactly three: Hermes, OpenClaw, and OpenCode. Nothing else runs
 * continuously.
 *
 * The 148 entries in agents.ts are NOT agents. They are ROLE SKILLS — a pool the
 * harnesses draw from when they spawn a sub-agent for a task. Historically they
 * were each backed by a Haiku or Sonnet model ("Agency Swarm v5, Haiku-Sonnet 3.5
 * Edition"), which is why the old UI listed them as agents. That is legacy. No
 * lower-tier model is used anymore: reasoning and coding tiers only.
 *
 * Sub-agent skills come from the ANTIGRAVITY skill library at .agents/skills/
 * (185+ agency-* skills plus the rest), and others as needed — find-skill
 * first, create-skill when nothing fits.
 *
 * Doctrine encoded here (Josh, 2026-08-05; harness set + skill floor updated
 * per Josh, 2026-08-11):
 *   - Three harnesses (Hermes, OpenClaw, OpenCode), no standing agent sprawl.
 *   - Highest reasoning or coding tier only — never a "fast"/"free"/"flash" tier.
 *   - All harnesses preload the same base skills, every session, without being asked.
 *   - Sub-agents get NO FEWER THAN 5 skills each, drawn from the agency library
 *     and others as needed.
 *   - Every sub-agent's work is validated at least once and improved at least once.
 *     Nothing is ever accepted on the first try.
 *   - Only when a result is verified clean does it go to the repo: push, merge,
 *     delete the branch. One repo, one branch (main).
 *   - Every harness writes its session state to the journal / STATE.md files at
 *     the end of a task. Not optional. (Pieces LTM retired 2026-08-10 — no longer free.)
 */

import type { HarnessDef, SubAgentPolicy } from './types.js';

/** Loaded into BOTH harnesses at the start of every session, without being asked. */
export const BASE_SKILLS: string[] = [
  'agent-reach',        // reach the internet / platforms — research, lookup, fetch
  'superpowers',        // process discipline: brainstorming, systematic debugging
  'brainstorming',      // design before build (part of superpowers; named explicitly)
  'agent-browser',      // drive a real browser — MUST take screenshots, never trust 200 OK
  'find-skill',         // locate an existing skill before writing a new one
  'create-skill',       // author a new skill when none exists
  'graph-view',         // read AND see the HTML 3D graph — files agents can look at
  'workspace-memory',   // journal + STATE.md: read at session start, write at session end. Mandatory.
];

/**
 * How sub-agents are dispatched. These are floors, not targets.
 * Raising them is fine; going below them is not.
 */
export const SUB_AGENT_POLICY: SubAgentPolicy = {
  minSkillsPerSubAgent: 5,
  minValidationPasses: 1,
  minImprovementPasses: 1,
  // A first attempt is never the deliverable. Re-dispatch with skills swapped or
  // updated based on what the validation pass found.
  redispatchOnFindings: true,
  // Only after verified-clean: push, merge, delete branch.
  autoLandWhenClean: true,
  branchPolicy: 'one-branch-main',
};

export const HARNESSES: HarnessDef[] = [
  {
    id: 'hermes',
    name: 'Hermes',
    role: 'Primary. Orchestration, research, marketing, and general task execution.',
    url: 'http://127.0.0.1:9119',
    // Hermes holds its own provider auth (Nous Portal, xAI Grok OAuth on Josh's
    // SuperGrok sub, others) and uses those FIRST. OmniRoute is its fallback, not
    // its primary — there is no Nous in OmniRoute, and routing his Grok
    // subscription through a metered gateway would waste what he already pays flat for.
    routing: 'own-providers-first-then-omniroute',
    baseSkills: BASE_SKILLS,
    writesToJournal: true,
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    role: 'Support and overflow. Runs whatever is asked; covers when Hermes is down.',
    // ClawX owns this gateway. Never start a second one — dual gateways clobber
    // openclaw.json. Port is ALWAYS 18789.
    url: 'http://127.0.0.1:18789',
    routing: 'omniroute',
    baseSkills: BASE_SKILLS,
    writesToJournal: true,
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    role: 'Coding harness. Repo work, refactors, and build/test loops.',
    // OpenCode has no standalone gateway — it rides OmniRoute directly
    // (same routing the agent-hub dispatcher uses for the opencode platform).
    url: 'http://192.168.0.8:20128',
    routing: 'omniroute',
    baseSkills: BASE_SKILLS,
    writesToJournal: true,
  },
];

export const HARNESS_INDEX = new Map(HARNESSES.map((h) => [h.id, h]));
