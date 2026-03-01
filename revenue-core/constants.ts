
import { Agent, ResearchItem, MediaTrack } from './types';

// REAL agents — the actual AI formation running this operation
export const REAL_AGENTS: Agent[] = [
  {
    id: 'opus-4.6',
    name: 'Claude Opus 4.6',
    role: 'Commander',
    status: 'Active',
    health: 100,
    task: 'Revenue Core CLI — strategy, code, deployment',
    workflowStage: 1,
    load: 0,
    model: 'claude-opus-4-6',
    provider: 'Anthropic',
    node: 'T5500',
  },
  {
    id: 'gemini-3.1',
    name: 'Gemini 3.1',
    role: 'Builder',
    status: 'Active',
    health: 100,
    task: 'ANTIGRAVITY admin, React app, search/research',
    workflowStage: 2,
    load: 0,
    model: 'gemini-3.1-flash',
    provider: 'Google',
    node: 'T5500',
  },
  {
    id: 'comet-perplexity',
    name: 'Comet (Perplexity)',
    role: 'Researcher',
    status: 'Standby',
    health: 100,
    task: 'Browser research, context briefs, live audits',
    workflowStage: 3,
    load: 0,
    model: 'sonar-pro',
    provider: 'Perplexity',
    node: 'Browser',
  },
];

// Research items — empty until real data comes in
export const RESEARCH_ITEMS: ResearchItem[] = [];

// No fake playlists
export const PLAYLIST: MediaTrack[] = [];
