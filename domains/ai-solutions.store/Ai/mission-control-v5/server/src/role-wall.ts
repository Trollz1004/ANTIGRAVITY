import { HARNESS_LANE_IDS } from './agents.js';

export { HARNESS_LANE_IDS };
export type HarnessLaneId = (typeof HARNESS_LANE_IDS)[number];

export type JudgeGitAction = 'push' | 'merge' | 'branch-delete';

export interface JudgeApproval {
  role: 'judge';
  actor: string;
  action: JudgeGitAction;
  approvedAt: string;
}

/**
 * The server never performs push, merge, or branch deletion itself. This guard
 * exists for any future judge-only adapter and rejects a harness-shaped request.
 */
export function requireJudgeApproval(approval: JudgeApproval | undefined, action: JudgeGitAction): JudgeApproval {
  if (!approval || approval.role !== 'judge' || approval.action !== action || !approval.actor.trim() || Number.isNaN(Date.parse(approval.approvedAt))) {
    throw new Error(`judge approval required for ${action}`);
  }
  return Object.freeze({ ...approval });
}

export function harnessLanes(): readonly HarnessLaneId[] {
  return HARNESS_LANE_IDS;
}
