import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

export const OFFICIAL_PLATFORM_IDS = ['claude', 'gemini', 'github-copilot', 'grok', 'openai-codex'] as const;
export type OfficialPlatformId = (typeof OFFICIAL_PLATFORM_IDS)[number];
export type VoteDecision = 'approve' | 'reject' | 'abstain';
export type RosterState = 'missing' | 'invalid' | 'signed';
export type JudgeLaneState =
  | 'AVAILABLE'
  | 'CAPACITY LIMITED'
  | 'BLOCKED'
  | 'AUTH MISSING'
  | 'AUTH REJECTED'
  | 'NOT CONFIGURED';

export interface JudgeLaneDefinition {
  platform: OfficialPlatformId;
  label: string;
  officialClient: string;
  requestedModel: string;
}

export const JUDGE_LANES: readonly JudgeLaneDefinition[] = Object.freeze([
  { platform: 'claude', label: 'Anthropic Claude', officialClient: 'Official Claude account-authenticated client', requestedModel: 'ACCOUNT_TIER_HIGHEST_REASONING' },
  { platform: 'gemini', label: 'Google Gemini', officialClient: 'Official Gemini account-authenticated client', requestedModel: 'ACCOUNT_TIER_HIGHEST_REASONING' },
  { platform: 'github-copilot', label: 'GitHub Copilot', officialClient: 'Official GitHub account-authenticated client', requestedModel: 'ACCOUNT_TIER_HIGHEST_REASONING' },
  { platform: 'grok', label: 'xAI Grok', officialClient: 'Official Grok CLI — account authentication', requestedModel: 'ACCOUNT_TIER_HIGHEST_REASONING' },
  { platform: 'openai-codex', label: 'OpenAI Codex — gpt-5.6-sol — official account authentication', officialClient: 'Official Codex account-authenticated client', requestedModel: 'gpt-5.6-sol' },
]);

export interface OfficialBridgeIdentity {
  platform: OfficialPlatformId;
  accountId: string;
  officialClient: string;
  state: Extract<JudgeLaneState, 'AVAILABLE' | 'CAPACITY LIMITED'>;
  actualModel: string | null;
}

export interface OfficialBridgeIdentityResolver {
  resolve(platform: OfficialPlatformId): Promise<OfficialBridgeIdentity | null>;
}

export interface VoteSubmission {
  platform: OfficialPlatformId;
  voterIdentity: string;
  subject: string;
  decision: VoteDecision;
  requestedModel: string;
  actualModel: string;
  evidenceSummary: string;
}

export interface ImmutableVoteEvent {
  id: string;
  actor: string;
  platform: OfficialPlatformId;
  officialClient: string;
  laneState: JudgeLaneState;
  requestedModel: string;
  actualModel: string;
  timestamp: string;
  subject: string;
  decision: VoteDecision;
  evidenceSummary: string;
  binding: false;
}

export interface SignedRosterMember {
  platform: OfficialPlatformId;
  accountId: string;
}

export interface SignedRoster {
  version: 2;
  signoff: {
    authority: 'joshua';
    signedAt: string;
  };
  members: SignedRosterMember[];
}

export interface OfficialVoteEngineOptions {
  eventFile?: string;
  rosterPath?: string;
  resolver: OfficialBridgeIdentityResolver;
  now?: () => Date;
}

export class OfficialVoteError extends Error {
  constructor(
    public readonly code:
      | 'OFFICIAL_IDENTITY_UNAVAILABLE'
      | 'OFFICIAL_IDENTITY_MISMATCH'
      | 'ROSTER_MEMBER_REQUIRED'
      | 'MODEL_MISMATCH'
      | 'INVALID_SUBMISSION',
    message: string,
  ) {
    super(message);
  }
}

function defaultEventFile(): string {
  const root = process.env.MISSION_CONTROL_VOTE_STATE_DIR?.trim() || join(process.cwd(), '.mission-control');
  return join(root, 'official-judge-events.ndjson');
}

function defaultRosterPath(): string {
  const root = process.env.MISSION_CONTROL_VOTE_STATE_DIR?.trim() || join(process.cwd(), '.mission-control');
  return process.env.OFFICIAL_VOTE_ROSTER_PATH?.trim() || join(root, 'official-judge-roster.json');
}

export function getJudgeLane(platform: OfficialPlatformId): JudgeLaneDefinition {
  return JUDGE_LANES.find((lane) => lane.platform === platform)!;
}

export function isOfficialPlatform(value: unknown): value is OfficialPlatformId {
  return typeof value === 'string' && OFFICIAL_PLATFORM_IDS.includes(value as OfficialPlatformId);
}

function clean(value: unknown, max = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function sameIdentity(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function validRoster(value: unknown): value is SignedRoster {
  if (!value || typeof value !== 'object') return false;
  const roster = value as Partial<SignedRoster>;
  if (roster.version !== 2 || !roster.signoff || roster.signoff.authority !== 'joshua') return false;
  if (!Number.isFinite(Date.parse(roster.signoff.signedAt))) return false;
  if (!Array.isArray(roster.members)) return false;
  return roster.members.every((member) => isOfficialPlatform(member?.platform) && Boolean(clean(member?.accountId, 200)));
}

function readRoster(path: string): { state: RosterState; roster: SignedRoster | null } {
  if (!existsSync(path)) return { state: 'missing', roster: null };
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
    return validRoster(parsed) ? { state: 'signed', roster: parsed } : { state: 'invalid', roster: null };
  } catch {
    return { state: 'invalid', roster: null };
  }
}

function freezeEvent(event: ImmutableVoteEvent): ImmutableVoteEvent {
  return Object.freeze({ ...event });
}

export class OfficialVoteEngine {
  private readonly eventFile: string;
  private readonly rosterPath: string;
  private readonly now: () => Date;

  constructor(private readonly options: OfficialVoteEngineOptions) {
    this.eventFile = options.eventFile ?? defaultEventFile();
    this.rosterPath = options.rosterPath ?? defaultRosterPath();
    this.now = options.now ?? (() => new Date());
  }

  rosterStatus(): { state: RosterState; bindingEnabled: false } {
    const { state } = readRoster(this.rosterPath);
    // Individual model ballots are advisory evidence only. Repository landing
    // is a separate protected judge-lane operation and never derives from this
    // event stream alone.
    return { state, bindingEnabled: false };
  }

  async laneStatus(platform: OfficialPlatformId): Promise<{
    platform: OfficialPlatformId;
    label: string;
    officialClient: string;
    state: JudgeLaneState;
    requestedModel: string;
    actualModel: string | null;
    detail: string;
  }> {
    const lane = getJudgeLane(platform);
    const identity = await this.options.resolver.resolve(platform).catch(() => null);
    if (!identity || identity.platform !== platform || !clean(identity.accountId, 200)) {
      return { ...lane, state: 'NOT CONFIGURED', actualModel: null, detail: 'Official account-authenticated client identity is not verified.' };
    }
    if (platform === 'openai-codex' && identity.actualModel !== 'gpt-5.6-sol') {
      return { ...lane, state: 'BLOCKED', actualModel: identity.actualModel, detail: 'Codex did not verify gpt-5.6-sol; no model substitution is permitted.' };
    }
    return {
      ...lane,
      officialClient: identity.officialClient || lane.officialClient,
      state: identity.state,
      actualModel: identity.actualModel,
      detail: identity.state === 'AVAILABLE' ? 'Official client, account state, and model identity verified.' : 'Official client is authenticated but currently capacity-limited.',
    };
  }

  async submit(input: VoteSubmission): Promise<ImmutableVoteEvent> {
    if (
      !isOfficialPlatform(input.platform) ||
      !clean(input.voterIdentity, 200) ||
      !clean(input.subject) ||
      !clean(input.requestedModel, 120) ||
      !clean(input.actualModel, 120) ||
      !clean(input.evidenceSummary) ||
      !['approve', 'reject', 'abstain'].includes(input.decision)
    ) {
      throw new OfficialVoteError('INVALID_SUBMISSION', 'official judge ballot is incomplete or invalid');
    }

    const lane = getJudgeLane(input.platform);
    const bridgeIdentity = await this.options.resolver.resolve(input.platform);
    if (!bridgeIdentity || bridgeIdentity.platform !== input.platform || !clean(bridgeIdentity.accountId, 200)) {
      throw new OfficialVoteError('OFFICIAL_IDENTITY_UNAVAILABLE', 'official account-authenticated client identity is unavailable');
    }
    if (!sameIdentity(bridgeIdentity.accountId, input.voterIdentity)) {
      throw new OfficialVoteError('OFFICIAL_IDENTITY_MISMATCH', 'submitted voter identity does not match the official client identity');
    }
    if (bridgeIdentity.state !== 'AVAILABLE') {
      throw new OfficialVoteError('OFFICIAL_IDENTITY_UNAVAILABLE', 'official client is capacity-limited and may only abstain outside this submission route');
    }
    if (input.requestedModel !== lane.requestedModel || input.actualModel !== bridgeIdentity.actualModel) {
      throw new OfficialVoteError('MODEL_MISMATCH', 'requested or actual model does not match the verified official client state');
    }
    if (input.platform === 'openai-codex' && (input.requestedModel !== 'gpt-5.6-sol' || input.actualModel !== 'gpt-5.6-sol')) {
      throw new OfficialVoteError('MODEL_MISMATCH', 'OpenAI Codex must use gpt-5.6-sol unless Joshua explicitly records a substitute');
    }

    const roster = readRoster(this.rosterPath);
    if (roster.roster && !roster.roster.members.some((member) => member.platform === input.platform && sameIdentity(member.accountId, bridgeIdentity.accountId))) {
      throw new OfficialVoteError('ROSTER_MEMBER_REQUIRED', 'official client identity is not a signed roster member');
    }

    const event = freezeEvent({
      id: randomUUID(),
      actor: 'ACCOUNT_AUTHENTICATED',
      platform: input.platform,
      officialClient: clean(bridgeIdentity.officialClient || lane.officialClient, 200),
      laneState: 'AVAILABLE',
      requestedModel: clean(input.requestedModel, 120),
      actualModel: clean(input.actualModel, 120),
      timestamp: this.now().toISOString(),
      subject: clean(input.subject),
      decision: input.decision,
      evidenceSummary: clean(input.evidenceSummary),
      binding: false,
    });
    mkdirSync(dirname(this.eventFile), { recursive: true });
    appendFileSync(this.eventFile, `${JSON.stringify(event)}\n`, 'utf8');
    return event;
  }

  events(): readonly ImmutableVoteEvent[] {
    if (!existsSync(this.eventFile)) return Object.freeze([]);
    return Object.freeze(
      readFileSync(this.eventFile, 'utf8')
        .split(/\r?\n/)
        .filter(Boolean)
        .flatMap((line) => {
          try {
            const event = JSON.parse(line) as ImmutableVoteEvent;
            return isOfficialPlatform(event.platform) && typeof event.requestedModel === 'string' ? [freezeEvent(event)] : [];
          } catch {
            return [];
          }
        }),
    );
  }
}
