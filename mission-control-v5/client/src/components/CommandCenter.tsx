import { useState } from 'react';
import { api, getSccApprovalToken, setSccApprovalToken } from '../api';
import type { SccPost, SccState, SccTarget } from '../types';

interface Props {
  scc: SccState | null;
  onChanged: () => void;
}

/**
 * SOCIAL COMMAND CENTER — where the founder sees every surface agents can
 * post to, and approves or rejects every draft before it goes anywhere.
 * This UI never publishes; approval is a recorded decision the node's
 * social engine (or Josh by hand) executes under platform_policy.
 */
export default function CommandCenter({ scc, onChanged }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState(() => getSccApprovalToken());

  if (!scc) {
    return <div className="empty">Loading command center…</div>;
  }

  const targetName = (id: string) => scc.targets.find((t) => t.id === id)?.name ?? id;
  const pending = scc.posts.filter((p) => p.status === 'pending');
  const decided = scc.posts
    .filter((p) => p.status !== 'pending')
    .sort((a, b) => (b.decidedAt ?? '').localeCompare(a.decidedAt ?? ''))
    .slice(0, 12);

  const decide = async (post: SccPost, decision: 'approve' | 'reject') => {
    setBusy(post.id);
    setError(null);
    try {
      await api.sccDecide(post.id, decision, noteFor === post.id ? note : undefined);
      setNote('');
      setNoteFor(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${decision} this draft.`);
    } finally {
      setBusy(null);
      onChanged();
    }
  };

  const saveToken = () => {
    setSccApprovalToken(tokenInput.trim());
    setError(null);
  };

  const toggleNote = (postId: string) => {
    setNoteFor((prev) => (prev === postId ? null : postId));
    setNote('');
  };

  const socialTargets = scc.targets.filter((t) => t.kind === 'social');
  const directoryTargets = scc.targets.filter((t) => t.kind === 'directory');

  return (
    <div className="scc">
      <div className="scc__banner">
        <strong>{scc.summary.targets} TARGETS</strong>
        <span>
          {scc.summary.live} LIVE-POST ENABLED · {scc.summary.targets - scc.summary.live} DRAFT-ONLY
        </span>
        <span className="scc__banner-note">
          Nothing publishes from this board. Approvals are recorded decisions; the node's social
          engine enforces platform_policy.py before anything goes live.
        </span>
        <div className="scc__token">
          <input
            className="input scc__token-input"
            type="password"
            placeholder="APPROVAL TOKEN (only if SCC_APPROVAL_TOKEN is set on the server)"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
          <button className="btn" onClick={saveToken}>
            SAVE TOKEN
          </button>
        </div>
      </div>

      {error && (
        <div className="scc__error">
          {error}
          {error.toLowerCase().includes('token') && ' — set the approval token above.'}
        </div>
      )}

      <section className="scc__section">
        <h2 className="scc__heading">
          APPROVAL QUEUE {pending.length > 0 ? `· ${pending.length} WAITING` : '· EMPTY'}
        </h2>
        {pending.length === 0 && (
          <div className="empty">
            No drafts waiting. Agents submit via POST /api/scc/posts and they appear here for
            founder review.
          </div>
        )}
        {pending.map((post) => (
          <article key={post.id} className="scc-post">
            <header className="scc-post__head">
              <span className="scc-post__target">{targetName(post.targetId)}</span>
              <span className="scc-post__author">by {post.author}</span>
              <span className="scc-post__time">{new Date(post.createdAt).toLocaleString()}</span>
            </header>
            <div className="scc-post__title">{post.title}</div>
            <pre className="scc-post__body">{post.body}</pre>
            <footer className="scc-post__actions">
              {noteFor === post.id && (
                <input
                  className="input scc-post__note"
                  placeholder="Decision note (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              )}
              <button
                className="btn"
                disabled={busy === post.id}
                onClick={() => toggleNote(post.id)}
              >
                NOTE
              </button>
              <button
                className="btn btn--approve"
                disabled={busy === post.id}
                onClick={() => decide(post, 'approve')}
              >
                APPROVE
              </button>
              <button
                className="btn btn--reject"
                disabled={busy === post.id}
                onClick={() => decide(post, 'reject')}
              >
                REJECT
              </button>
            </footer>
          </article>
        ))}
      </section>

      {decided.length > 0 && (
        <section className="scc__section">
          <h2 className="scc__heading">RECENT DECISIONS</h2>
          {decided.map((post) => (
            <div key={post.id} className={`scc-decided scc-decided--${post.status}`}>
              <span className="scc-decided__status">{post.status.toUpperCase()}</span>
              <span className="scc-decided__target">{targetName(post.targetId)}</span>
              <span className="scc-decided__title">{post.title}</span>
              {post.decisionNote && <span className="scc-decided__note">“{post.decisionNote}”</span>}
            </div>
          ))}
        </section>
      )}

      <section className="scc__section">
        <h2 className="scc__heading">SOCIAL PLATFORMS · {socialTargets.length}</h2>
        <div className="scc-grid">
          {socialTargets.map((t) => (
            <TargetCard key={t.id} target={t} />
          ))}
        </div>
      </section>

      <section className="scc__section">
        <h2 className="scc__heading">LAUNCH DIRECTORIES · {directoryTargets.length}</h2>
        <div className="scc-grid">
          {directoryTargets.map((t) => (
            <TargetCard key={t.id} target={t} />
          ))}
        </div>
      </section>
    </div>
  );
}

function TargetCard({ target }: { target: SccTarget }) {
  return (
    <div className="scc-target" title={target.reason}>
      <div className="scc-target__head">
        <span className="scc-target__name">{target.name}</span>
        <span
          className={`scc-target__pill ${
            target.livePostAllowed ? 'scc-target__pill--live' : 'scc-target__pill--draft'
          }`}
        >
          {target.livePostAllowed ? 'LIVE' : 'DRAFT-ONLY'}
        </span>
      </div>
      <div className="scc-target__mode">{target.mode.replace(/_/g, ' ')}</div>
      <div className="scc-target__owner">{target.owner}</div>
    </div>
  );
}
