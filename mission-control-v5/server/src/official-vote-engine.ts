import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

export const OFFICIAL_PLATFORM_IDS = ['claude', 'gemini', 'github-copilot', 'meta-ai', 'chatgpt', 'manus'] as const;
export type OfficialPlatformId = (typeof OFFICIAL_PLATFORM_IDS)[number];
export type VoteDecision = 'approve' | 'reject' | 'abstain';
export type RosterState = 'missing' | 'invalid' | 'signed';

export interface OfficialBridgeIdentity {
  platform: OfficialPlatformId;
  accountId: string;
}

export interface OfficialBridgeIdentityResolver {
  resolve(platform: OfficialPlatformId): Promise<OfficialBridgeIdentity | null>;
}

export interface VoteSubmission {
  platform: OfficialPlatformId;
  voterIdentity: string;
  subject: string;
  decision: VoteDecision;
}

export interface ImmutableVoteEvent {
  id: string;
  actor: string;
  platform: OfficialPlatformId;
  timestamp: string;
  subject: string;
  decision: VoteDecision;
  binding: boolean;
}

export interface SignedRosterMember {
  platform: OfficialPlatformId;
  accountId: string;
}

export interface SignedRoster {
  version: 1;
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
  constructor(public readonly code: 'OFFICIAL_IDENTITY_UNAVAILABLE' | 'OFFICIAL_IDENTITY_MISMATCH' | 'ROSTER_MEMBER_REQUIRED' | 'INVALID_SUBMISSION', message: string) {
    super(message);
  }
}

function defaultEventFile(): string {
  const root = process.env.MISSION_CONTROL_VOTE_STATE_DIR?.trim() || join(process.cwd(), '.mission-control');
  return join(root, 'official-vote-events.ndjson');
}

function defaultRosterPath(): string {
  const root = process.env.MISSION_CONTROL_VOTE_STATE_DIR?.trim() || join(process.cwd(), '.mission-control');
  return process.env.OFFICIAL_VOTE_ROSTER_PATH?.trim() || join(root, 'official-vote-roster.json');
}

function isOfficialPlatform(value: unknown): value is OfficialPlatformId {
  return typeof value === 'string' && OFFICIAL_PLATFORM_IDS.includes(value as OfficialPlatformId);
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function sameIdentity(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function validRoster(value: unknown): value is SignedRoster {
  if (!value || typeof value !== 'object') return false;
  const roster = value as Partial<SignedRoster>;
  if (roster.version !== 1 || !roster.signoff || roster.signoff.authority !== 'joshua') return false;
  if (!Number.isFinite(Date.parse(roster.signoff.signedAt))) return false;
  if (!Array.isArray(roster.members)) return false;
  return roster.members.every((member) => isOfficialPlatform(member?.platform) && Boolean(clean(member?.accountId)));
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

  rosterStatus(): { state: RosterState; bindingEnabled: boolean } {
    const { state } = readRoster(this.rosterPath);
    return { state, bindingEnabled: state === 'signed' };
  }

  async submit(input: VoteSubmission): Promise<ImmutableVoteEvent> {
    if (!isOfficialPlatform(input.platform) || !clean(input.voterIdentity) || !clean(input.subject) || !['approve', 'reject', 'abstain'].includes(input.decision)) {
      throw new OfficialVoteError('INVALID_SUBMISSION', 'official vote submission is incomplete or invalid');
    }

    const bridgeIdentity = await this.options.resolver.resolve(input.platform);
    if (!bridgeIdentity || bridgeIdentity.platform !== input.platform || !clean(bridgeIdentity.accountId)) {
      throw new OfficialVoteError('OFFICIAL_IDENTITY_UNAVAILABLE', 'official bridge identity is unavailable');
    }
    if (!sameIdentity(bridgeIdentity.accountId, input.voterIdentity)) {
      throw new OfficialVoteError('OFFICIAL_IDENTITY_MISMATCH', 'submitted voter identity does not match the official bridge identity');
    }

    const roster = readRoster(this.rosterPath);
    const binding = roster.state === 'signed';
    if (roster.roster && !roster.roster.members.some((member) => member.platform === input.platform && sameIdentity(member.accountId, bridgeIdentity.accountId))) {
      throw new OfficialVoteError('ROSTER_MEMBER_REQUIRED', 'official bridge identity is not a signed roster member');
    }

    const event = freezeEvent({
      id: randomUUID(),
      actor: bridgeIdentity.accountId,
      platform: input.platform,
      timestamp: this.now().toISOString(),
      subject: clean(input.subject),
      decision: input.decision,
      binding,
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
        .map((line) => freezeEvent(JSON.parse(line) as ImmutableVoteEvent)),
    );
  }
}
