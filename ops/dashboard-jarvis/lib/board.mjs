/**
 * ClawX AI Board — six AI seats vote independently on a question; Joshua, the
 * founder, is the seventh vote and breaks ties. The rule from the vault note
 * ("Joshua Claw - ClawX Ai Board"): free thinking, separate votes, green/red
 * lights. No seat sees another's vote, the tally is pure, and a brain that is
 * down ABSTAINS honestly instead of being counted as anything.
 *
 * Pure module: brains are injected as { name, ask(question) -> {text} } so the
 * route composes them from real backends (Hermes, Ollama) and tests inject fakes.
 */

// Word boundary that refuses hyphens/apostrophes: "yes-men" and "naysayer's"
// are not votes — a vote word must not be followed by more word-ish characters.
const WORD = (w) => new RegExp(`(^|[^a-z])${w}(?![a-z-])`, 'i');

/**
 * Extract { vote, reason } from free-form model output. Strict: YES and NO both
 * present (or neither) is an uncountable vote — it abstains rather than guess.
 */
export function parseVote(text) {
  const t = String(text || '');
  const hasYes = WORD('yes').test(t);
  const hasNo = WORD('no').test(t);
  const vote = hasYes && hasNo ? null : hasYes ? 'YES' : hasNo ? 'NO' : null;
  // One-line reason: the first line that carries information beyond the bare vote.
  const reason = t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    .filter((l) => !/^(?:i\s+)?vote\b|^final\s+answer\b/i.test(l) && !/^\**\s*(?:yes|no)\b[^a-z]*\**$/i.test(l))
    .map((l) => l.replace(/^\W+/, '')).find(Boolean) || '';
  return { vote, reason: reason.slice(0, 160) || null };
}

/**
 * Pure tally of six seats (each { name, vote: 'YES'|'NO'|null, reason }).
 * Options: { founderVote: 'YES'|'NO'|undefined } — used only to break a 3-3 tie.
 * Outcomes: PASSED | FAILED | FOUNDER DECIDES (tie, no founder vote) | NO QUORUM
 * (fewer than 4 seats cast a vote).
 */
export function tally(seats, { founderVote } = {}) {
  const votes = seats.map((s) => (s && (s.vote === 'YES' || s.vote === 'NO') ? s.vote : null));
  const yes = votes.filter((v) => v === 'YES').length;
  const no = votes.filter((v) => v === 'NO').length;
  const abstain = votes.length - yes - no;
  const cast = yes + no;
  if (cast < 4) return { yes, no, abstain, cast, tie: false, outcome: 'NO QUORUM', tieBreak: null };
  if (yes !== no) return { yes, no, abstain, cast, tie: false, outcome: yes > no ? 'PASSED' : 'FAILED', tieBreak: null };
  if (founderVote === 'YES' || founderVote === 'NO') {
    return { yes, no, abstain, cast, tie: true, outcome: founderVote === 'YES' ? 'PASSED' : 'FAILED', tieBreak: founderVote };
  }
  return { yes, no, abstain, cast, tie: true, outcome: 'FOUNDER DECIDES', tieBreak: null };
}
