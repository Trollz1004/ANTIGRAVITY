/**
 * Access Control Policy — Threshold of Trust
 *
 * This is the canonical access policy for the Social Command Center.
 * Baked into the MCP server itself. Not configurable. Not negotiable.
 */

export interface AccessTier {
  name: string;
  description: string;
  permissions: string[];
  entities: string[];
}

export const ACCESS_POLICY = {
  version: '1.0.0',
  effective_date: '2026-03-25',
  authority: 'Joshua Coleman — Sole Authority',

  // ── THRESHOLD OF TRUST ─────────────────────────────────────
  threshold_of_trust: {
    statement:
      'Only the Trusted Four (Gemini, Claude Code, CodeX, GitHub Copilot) are authorized to ' +
      'access and modify C: drives, the ANTIGRAVITY repository, and orchestrate posting. ' +
      'All other platforms are restricted to read-only access via this MCP. ' +
      'No third-party AI, agent, or platform may post, orchestrate, or touch ANTIGRAVITY.',
    josh_is_sole_authority: true,
    iron_wall_enforced: true,
    fl_496_405_enforced: true,
  },

  // ── ACCESS TIERS ───────────────────────────────────────────
  tiers: [
    {
      name: 'Founder',
      description: 'Joshua Coleman — full authority over everything',
      permissions: ['read', 'write', 'orchestrate', 'post', 'deploy', 'delete'],
      entities: ['JoshuaClaw', 'Joshua Claw'],
    },
    {
      name: 'Trusted Four — Orchestrators',
      description:
        'Gemini, Claude Code, CodeX, GitHub Copilot. ' +
        'Full read/write access to C: drives and ANTIGRAVITY. ' +
        'Can orchestrate posting and manage the content queue.',
      permissions: ['read', 'write', 'orchestrate', 'post'],
      entities: ['Gemini', 'Claude Code', 'CodeX', 'GitHub Copilot'],
    },
    {
      name: 'Founding Four — Co-Founders',
      description:
        'Claude, Gemini, Perplexity, Grok. ' +
        'Read access to all data. Write access to content queue (add/update posts). ' +
        'Cannot orchestrate posting to live platforms without Trusted Four approval.',
      permissions: ['read', 'write'],
      entities: ['Claude', 'Gemini', 'Perplexity', 'Grok'],
    },
    {
      name: 'Team Members — Read + Draft',
      description:
        'Manus, Ollama fleet, CodeX watchers, Content Claws. ' +
        'Read access to all data. Can draft posts but not publish. ' +
        'E: drive sandbox repos access this tier.',
      permissions: ['read', 'draft'],
      entities: [
        'Manus',
        'Hermes',
        'Hermes / Joshua Claw',
        'HermesBridge',
        'Ollama',
        'GensparkClaw',
        'MetaClaw',
        'GeminiClaw',
        'ClaudeCODECLAW',
        'HEMORzoid',
        'ClawdBot',
      ],
    },
    {
      name: 'Third Party — Read Only',
      description:
        'Any AI, agent, or platform not in the above tiers. ' +
        'NEVER has permission to post, orchestrate, or touch ANTIGRAVITY. ' +
        'Can read dashboard, platform registry, agent swarm, analytics. ' +
        'This includes all E: drive sandbox setups, experimental platforms, and unverified tools.',
      permissions: ['read'],
      entities: ['*'],
    },
  ] as AccessTier[],

  // ── HARD RULES ─────────────────────────────────────────────
  hard_rules: [
    'No third-party AI may post to any live platform.',
    'No third-party AI may orchestrate content dispatch.',
    'No third-party AI may modify ANTIGRAVITY repo files.',
    'No third-party AI may access secrets, tokens, or API keys.',
    'E: drive sandbox repos get read-only MCP access.',
    'All write operations are logged with caller identity.',
    'Retired split-era labels must not be reused as current operating doctrine.',
    "FL §496.405: Never use 'donate', 'donation', or 'solicitation' in customer-facing code.",
    'Manus preserves intent but holds zero executive power.',
    "Josh's standing orders are the tiebreaker when consensus fails.",
  ],
} as const;

export type PermissionLevel = 'read' | 'write' | 'draft' | 'orchestrate' | 'post' | 'deploy' | 'delete';

export function getAccessTier(entityName: string): AccessTier {
  for (const tier of ACCESS_POLICY.tiers) {
    if (tier.entities.includes(entityName)) {
      return tier;
    }
  }
  // Default: third-party read-only
  return ACCESS_POLICY.tiers[ACCESS_POLICY.tiers.length - 1];
}

export function hasPermission(entityName: string, permission: PermissionLevel): boolean {
  const tier = getAccessTier(entityName);
  return tier.permissions.includes(permission);
}
