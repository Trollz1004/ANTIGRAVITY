import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import type { BrainConfig, ShaStatus, WorktreeState } from './config.js';

export interface SessionRecord {
  sessionId: string;
  platformId: string;
  nodeId: string;
  intent: string;
  estimatedScope: string;
  gitSha: string;
  worktreeState: WorktreeState;
  shaStatus: ShaStatus;
  baselineTag: string;
  targetPaths: string[];
  clientIp?: string;
  participationMode: string;
  certificationAuthority: boolean;
  startedAt: string;
  lastHeartbeatAt: string;
  endedAt?: string;
  status: 'active' | 'closed' | 'timed_out';
  exitReason?: string;
  summary?: string;
  committed: boolean;
  pushed: boolean;
  commitHash?: string;
  testsRun: boolean;
  testsPassed?: boolean;
  filesTouched: string[];
}

export interface AuditEvent {
  eventId: number;
  at: string;
  eventType: string;
  sessionId?: string;
  platformId?: string;
  details: Record<string, unknown>;
}

interface EnterSessionInput {
  platformId: string;
  nodeId: string;
  intent: string;
  estimatedScope: string;
  gitSha: string;
  worktreeState: WorktreeState;
  shaStatus: ShaStatus;
  baselineTag: string;
  targetPaths: string[];
  clientIp?: string;
  participationMode: string;
  certificationAuthority: boolean;
}

interface ExitSessionInput {
  sessionId: string;
  summary: string;
  filesTouched: string[];
  testsRun: boolean;
  testsPassed?: boolean;
  committed: boolean;
  pushed: boolean;
  commitHash?: string;
  exitReason: 'normal' | 'handoff' | 'timeout' | 'crash';
}

export class BrainStateStore {
  private readonly db: DatabaseSync;

  public constructor(private readonly config: BrainConfig) {
    fs.mkdirSync(config.dataDir, { recursive: true });
    fs.mkdirSync(config.auditDir, { recursive: true });

    this.db = new DatabaseSync(config.databasePath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        platform_id TEXT NOT NULL,
        node_id TEXT NOT NULL,
        intent TEXT NOT NULL,
        estimated_scope TEXT NOT NULL,
        git_sha TEXT NOT NULL,
        worktree_state TEXT NOT NULL,
        sha_status TEXT NOT NULL,
        baseline_tag TEXT NOT NULL,
        target_paths_json TEXT NOT NULL,
        client_ip TEXT,
        participation_mode TEXT NOT NULL,
        certification_authority INTEGER NOT NULL,
        started_at TEXT NOT NULL,
        last_heartbeat_at TEXT NOT NULL,
        ended_at TEXT,
        status TEXT NOT NULL,
        exit_reason TEXT,
        summary TEXT,
        committed INTEGER NOT NULL DEFAULT 0,
        pushed INTEGER NOT NULL DEFAULT 0,
        commit_hash TEXT,
        tests_run INTEGER NOT NULL DEFAULT 0,
        tests_passed INTEGER,
        files_touched_json TEXT NOT NULL DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        at TEXT NOT NULL,
        action_type TEXT NOT NULL,
        path TEXT NOT NULL,
        summary TEXT NOT NULL,
        metadata_json TEXT NOT NULL DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        at TEXT NOT NULL,
        event_type TEXT NOT NULL,
        session_id TEXT,
        platform_id TEXT,
        details_json TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
      CREATE INDEX IF NOT EXISTS idx_actions_session_id ON actions(session_id);
      CREATE INDEX IF NOT EXISTS idx_audit_events_at ON audit_events(at);
    `);
  }

  public expireTimedOutSessions(): number {
    const cutoff = new Date(Date.now() - this.config.sessionTtlMs).toISOString();
    const rows = this.db
      .prepare(
        `
        SELECT session_id, platform_id
        FROM sessions
        WHERE status = 'active' AND last_heartbeat_at < ?
        `,
      )
      .all(cutoff) as Array<{ session_id: string; platform_id: string }>;

    const update = this.db.prepare(
      `
      UPDATE sessions
      SET status = 'timed_out', ended_at = ?, exit_reason = 'timeout'
      WHERE session_id = ?
      `,
    );

    const endedAt = new Date().toISOString();
    for (const row of rows) {
      update.run(endedAt, row.session_id);
      this.recordAudit('session_timed_out', {
        sessionId: row.session_id,
        platformId: row.platform_id,
      });
    }

    return rows.length;
  }

  public enterSession(input: EnterSessionInput): SessionRecord {
    this.expireTimedOutSessions();
    const now = new Date().toISOString();
    const sessionId = randomUUID();

    this.db
      .prepare(
        `
        INSERT INTO sessions (
          session_id, platform_id, node_id, intent, estimated_scope, git_sha,
          worktree_state, sha_status, baseline_tag, target_paths_json, client_ip,
          participation_mode, certification_authority, started_at, last_heartbeat_at,
          status, files_touched_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', '[]')
        `,
      )
      .run(
        sessionId,
        input.platformId,
        input.nodeId,
        input.intent,
        input.estimatedScope,
        input.gitSha,
        input.worktreeState,
        input.shaStatus,
        input.baselineTag,
        JSON.stringify(input.targetPaths),
        input.clientIp ?? null,
        input.participationMode,
        input.certificationAuthority ? 1 : 0,
        now,
        now,
      );

    const session = this.getSession(sessionId);
    this.recordAudit('session_entered', {
      sessionId,
      platformId: input.platformId,
      nodeId: input.nodeId,
      targetPaths: input.targetPaths,
      gitSha: input.gitSha,
      shaStatus: input.shaStatus,
    });
    return session;
  }

  public heartbeat(sessionId: string): SessionRecord {
    this.expireTimedOutSessions();
    const now = new Date().toISOString();
    const result = this.db
      .prepare(
        `
        UPDATE sessions
        SET last_heartbeat_at = ?
        WHERE session_id = ? AND status = 'active'
        `,
      )
      .run(now, sessionId);

    if (result.changes === 0) {
      throw new Error(`Active session not found: ${sessionId}`);
    }

    const session = this.getSession(sessionId);
    this.recordAudit('session_heartbeat', {
      sessionId,
      platformId: session.platformId,
    });
    return session;
  }

  public reportAction(input: {
    sessionId: string;
    actionType: string;
    path: string;
    summary: string;
    metadata?: Record<string, unknown>;
  }): SessionRecord {
    this.expireTimedOutSessions();
    const session = this.getSession(input.sessionId);
    if (session.status !== 'active') {
      throw new Error(`Session is not active: ${input.sessionId}`);
    }

    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO actions (session_id, at, action_type, path, summary, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
      )
      .run(input.sessionId, now, input.actionType, input.path, input.summary, JSON.stringify(input.metadata ?? {}));

    this.db
      .prepare(
        `
        UPDATE sessions
        SET last_heartbeat_at = ?
        WHERE session_id = ?
        `,
      )
      .run(now, input.sessionId);

    this.recordAudit('session_action', {
      sessionId: input.sessionId,
      platformId: session.platformId,
      actionType: input.actionType,
      path: input.path,
      summary: input.summary,
    });

    return this.getSession(input.sessionId);
  }

  public exitSession(input: ExitSessionInput): SessionRecord {
    this.expireTimedOutSessions();
    const existing = this.getSession(input.sessionId);
    const endedAt = new Date().toISOString();

    this.db
      .prepare(
        `
        UPDATE sessions
        SET status = 'closed',
            ended_at = ?,
            exit_reason = ?,
            summary = ?,
            committed = ?,
            pushed = ?,
            commit_hash = ?,
            tests_run = ?,
            tests_passed = ?,
            files_touched_json = ?
        WHERE session_id = ?
        `,
      )
      .run(
        endedAt,
        input.exitReason,
        input.summary,
        input.committed ? 1 : 0,
        input.pushed ? 1 : 0,
        input.commitHash ?? null,
        input.testsRun ? 1 : 0,
        typeof input.testsPassed === 'boolean' ? (input.testsPassed ? 1 : 0) : null,
        JSON.stringify(input.filesTouched),
        input.sessionId,
      );

    this.recordAudit('session_exited', {
      sessionId: input.sessionId,
      platformId: existing.platformId,
      exitReason: input.exitReason,
      committed: input.committed,
      pushed: input.pushed,
      commitHash: input.commitHash,
    });

    return this.getSession(input.sessionId);
  }

  public getSession(sessionId: string): SessionRecord {
    const row = this.db.prepare(`SELECT * FROM sessions WHERE session_id = ?`).get(sessionId) as
      | Record<string, unknown>
      | undefined;

    if (!row) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    return this.mapSession(row);
  }

  public listActiveSessions(): SessionRecord[] {
    this.expireTimedOutSessions();
    const rows = this.db
      .prepare(`SELECT * FROM sessions WHERE status = 'active' ORDER BY started_at ASC`)
      .all() as Array<Record<string, unknown>>;
    return rows.map((row) => this.mapSession(row));
  }

  public recentAudit(limit = 50): AuditEvent[] {
    const rows = this.db
      .prepare(
        `
        SELECT id, at, event_type, session_id, platform_id, details_json
        FROM audit_events
        ORDER BY id DESC
        LIMIT ?
        `,
      )
      .all(limit) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      eventId: Number(row.id),
      at: String(row.at),
      eventType: String(row.event_type),
      sessionId: row.session_id ? String(row.session_id) : undefined,
      platformId: row.platform_id ? String(row.platform_id) : undefined,
      details: JSON.parse(String(row.details_json)) as Record<string, unknown>,
    }));
  }

  public recordAudit(eventType: string, details: Record<string, unknown>): void {
    const at = new Date().toISOString();
    const sessionId = typeof details.sessionId === 'string' ? details.sessionId : undefined;
    const platformId = typeof details.platformId === 'string' ? details.platformId : undefined;

    this.db
      .prepare(
        `
        INSERT INTO audit_events (at, event_type, session_id, platform_id, details_json)
        VALUES (?, ?, ?, ?, ?)
        `,
      )
      .run(at, eventType, sessionId ?? null, platformId ?? null, JSON.stringify(details));

    const day = at.slice(0, 10);
    const logPath = path.join(this.config.auditDir, `audit-${day}.jsonl`);
    fs.appendFileSync(logPath, `${JSON.stringify({ at, eventType, sessionId, platformId, details })}\n`, 'utf8');
  }

  private mapSession(row: Record<string, unknown>): SessionRecord {
    return {
      sessionId: String(row.session_id),
      platformId: String(row.platform_id),
      nodeId: String(row.node_id),
      intent: String(row.intent),
      estimatedScope: String(row.estimated_scope),
      gitSha: String(row.git_sha),
      worktreeState: row.worktree_state as WorktreeState,
      shaStatus: row.sha_status as ShaStatus,
      baselineTag: String(row.baseline_tag),
      targetPaths: JSON.parse(String(row.target_paths_json)) as string[],
      clientIp: row.client_ip ? String(row.client_ip) : undefined,
      participationMode: String(row.participation_mode),
      certificationAuthority: Number(row.certification_authority) === 1,
      startedAt: String(row.started_at),
      lastHeartbeatAt: String(row.last_heartbeat_at),
      endedAt: row.ended_at ? String(row.ended_at) : undefined,
      status: row.status as SessionRecord['status'],
      exitReason: row.exit_reason ? String(row.exit_reason) : undefined,
      summary: row.summary ? String(row.summary) : undefined,
      committed: Number(row.committed) === 1,
      pushed: Number(row.pushed) === 1,
      commitHash: row.commit_hash ? String(row.commit_hash) : undefined,
      testsRun: Number(row.tests_run) === 1,
      testsPassed:
        row.tests_passed === null || row.tests_passed === undefined ? undefined : Number(row.tests_passed) === 1,
      filesTouched: JSON.parse(String(row.files_touched_json)) as string[],
    };
  }
}
