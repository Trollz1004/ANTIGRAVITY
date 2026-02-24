
import { Agent, MediaTrack, ResearchItem } from './types';

export const MOCK_AGENTS: Agent[] = Array.from({ length: 50 }, (_, i) => ({
  id: `agent-${i + 1}`,
  name: `Revenue-Unit ${i + 1}`,
  role: i < 15 ? 'Research' : i < 30 ? 'Poster' : i < 45 ? 'Engager' : 'Analyst',
  status: i % 20 === 0 ? 'Healing' : i % 15 === 0 ? 'Idle' : 'Active',
  health: Math.floor(Math.random() * 20) + 80,
  task: 'Optimizing Pre-Order LTV',
  workflowStage: (i % 4) + 1,
  load: Math.floor(Math.random() * 100)
}));

export const MOCK_RESEARCH: ResearchItem[] = [
  { id: '1', url: 'r/dating_advice/threads/928...', source: 'Thread', title: 'Bot Detection Feedback', engagementScore: 98, status: 'Analyzed', followers: 120000, isPersonal: false, lastScraped: '10m ago' },
  { id: '2', url: 'threads.net/post/B3x9kL...', source: 'Social', title: 'Human-Only USP Validation', engagementScore: 85, status: 'New', followers: 8500, isPersonal: true, lastScraped: '1h ago' },
  { id: '3', url: 'tiktok.com/tag/datingbots...', source: 'Social', title: 'Viral Bot Scam Trends', engagementScore: 92, status: 'Actioned', followers: 2000000, isPersonal: false, lastScraped: '2h ago' },
];

export const MOCK_PLAYLIST: MediaTrack[] = [
  { id: '1', title: 'Revenue Blitz FM', artist: 'Protocol Omega', type: 'audio', url: 'https://media.w3.org/2010/05/sintel/trailer.mp4', duration: 300 },
];
