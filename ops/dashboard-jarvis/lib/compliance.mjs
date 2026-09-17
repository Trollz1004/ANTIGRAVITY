/**
 * Compliance check (Phase C, unit 3a) — runs proposed copy against the
 * SAME restricted-word list the repo already enforces at commit time
 * (.githooks/pre-commit-canonical's BANNED_WORDS / BANNED_SPLITS), parsed
 * live so JARVIS never carries a second, driftable copy of the list.
 *
 * The list itself never reaches the client: a result carries only a
 * pass/fail, the index of the rule that matched (its position in the
 * combined BANNED_WORDS + BANNED_SPLITS alternation, in file order), and
 * the actual offending text found in the submitted copy (never the whole
 * catalogue of words that could have matched).
 */
import { readFileSync } from 'node:fs';

/** Parse BANNED_WORDS and BANNED_SPLITS out of the hook file's shell source. */
export function loadRules(hookPath) {
  const text = readFileSync(hookPath, 'utf8');
  const words = /^BANNED_WORDS='(.*)'$/m.exec(text);
  const splits = /^BANNED_SPLITS='(.*)'$/m.exec(text);
  if (!words || !splits) throw new Error('could not parse BANNED_WORDS/BANNED_SPLITS from ' + hookPath);
  // Each rule is one '|'-delimited alternative from the shell regex, in file
  // order, BANNED_WORDS first — this ordering is the "rule index" contract.
  return [...words[1].split('|'), ...splits[1].split('|')];
}

/**
 * Check `text` against the rules. Returns {pass, ruleIndex, matched} — never
 * the rule list. ruleIndex is null when pass is true.
 */
export function checkCompliance(text, { hookPath, rules } = {}) {
  const ruleList = rules || loadRules(hookPath);
  const haystack = String(text || '');
  for (let i = 0; i < ruleList.length; i++) {
    let re;
    try { re = new RegExp(ruleList[i], 'i'); } catch { continue; }
    const m = re.exec(haystack);
    if (m) return { pass: false, ruleIndex: i, matched: m[0] };
  }
  return { pass: true, ruleIndex: null, matched: null };
}
