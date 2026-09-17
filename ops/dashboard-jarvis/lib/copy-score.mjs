/**
 * Copy score (Phase C, unit 3b / Phase E) — a pure-JS reimplementation of a
 * subset of SlopMonster's scoring rules for machine-sounding prose.
 *
 * Source: ItsssssJack/SlopMonster, tools/deslop.py, MIT License.
 * https://github.com/ItsssssJack/SlopMonster — "Regex, no opinions, exits red."
 * The vocabulary/phrase catalogue, the em-dash/semicolon density checks, the
 * rule-of-three rhythm check, and the invented-proof-number check below are
 * a hand-ported subset of that file's rules, credited under its MIT license.
 * This module runs entirely locally: no network call, no external process.
 *
 * Score starts at 5 and loses one point per category that trips (floor 0),
 * matching the original tool's weighting.
 */

// Matched by root so inflections fire too (elevate/elevates/elevated/…).
const VOCAB = [
  'delve', 'leverage', 'seamless', 'elevate', 'robust', 'unlock', 'unleash',
  'empower', 'streamline', 'game-changer', 'game-changing', 'revolutionize',
  'revolutionise', 'transformative', 'transformation', 'innovate', 'holistic',
  'synergy', 'synergies', 'paradigm', 'bespoke', 'meticulous', 'tapestry',
  'testament', 'beacon', 'unparalleled', 'supercharge', 'turbocharge',
  'effortless', 'pivotal', 'foster', 'showcase', 'compelling', 'intuitive',
];

// Matched exactly (never by root) — these have an ordinary literal sense too.
const VOCAB_EXACT = [
  'crafted', 'curated', 'journey', 'realm', 'landscape', "in today's",
  'ever-evolving', 'fast-paced', 'look no further', 'dive in', "let's dive",
  'deep dive', 'embark', 'unlock the power', 'buckle up', 'level up',
];

function rootPattern(word) {
  const root = word.replace(/(ed|ing|ly|e)$/, '');
  if (root.length < 4) return new RegExp('(?<!\\w)' + escapeRe(word) + '(?!\\w)', 'gi');
  return new RegExp('(?<!\\w)' + escapeRe(root) + '(?:e|es|ed|ing|ion|ions|ional|ive|al|ally|s|ly|ness)?(?!\\w)', 'gi');
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

const PHRASES = [
  [/\bmore than just\b/i, "'more than just'"],
  [/\b(that|this)(?:'?s| is) where\b[^.!?]{0,30}\bcomes? in\b/i, "'that's where X comes in'"],
  [/\bsay goodbye to\b/i, "'say goodbye to'"],
  [/\bimagine (a|an|the)\b/i, "the 'imagine a…' opener"],
  [/\bwhen it comes to\b/i, "'when it comes to' filler"],
  [/\bat the end of the day\b/i, "'at the end of the day'"],
  [/\bhelps? you to\b|\bcan help you\b/i, "hedged benefit ('helps you to…')"],
  [/\bvery unique\b|\bquite literally\b/i, 'intensifier padding'],
  [/\bwhether you(?:'?re| are)\b[^.!?]{0,40}\bor\b/i, "the 'whether you're X or Y' opener"],
  [/\bhere'?s the thing\b|\blet'?s break (it|this) down\b|\bthe best part\b/i, 'throat-clearing opener'],
  [/\bready to get started\b|\blet'?s get started\b/i, 'boilerplate CTA'],
];

// Two or more em-dashes inside a 220-char window of one sentence.
function emDashHits(text) {
  const hits = [];
  for (const s of text.split(/(?<=[.!?])\s+/)) {
    for (let i = 0; i < Math.max(1, s.length); i += 220) {
      const window = s.slice(i, i + 220);
      if ((window.match(/—/g) || []).length >= 2) { hits.push(window.slice(0, 70).trim()); break; }
    }
  }
  return hits;
}

// Invented social proof: a number beside a "users/customers/…" noun.
const PROOF = /([\d][\d,]*(?:\.\d+)?)\s*\+?\s*(?:(?:happy|early|active|satisfied|verified|trusted|delighted)\s+)?(?:\w+\s+){0,1}(users?|customers?|learners?|students?|teams?|members?|companies|businesses|homeowners?|subscribers?|clients?|patients?|readers?|sites?|projects?)(?!\w)/gi;

// Rule-of-three: "faster, smarter, and better" / "reliable, trusted and built to last".
const TRICOLON = [
  /\b(\w{4,}),\s+(\w{4,}),\s+and\s+(\w{4,})\b/gi,
  /\b(\w{4,}),\s+(\w{4,})\s+and\s+((?:\w+\s+){1,2}\w+)\s*[.!?,;:]/gi,
];

/**
 * Score `text` (plain visible copy, no HTML/markdown markup expected).
 * Returns { score: 0-5, tripped: [{ category, rule }] }.
 */
export function scoreCopy(text) {
  const t = String(text || '');
  const tripped = [];

  for (const w of VOCAB) {
    if (rootPattern(w).test(t)) tripped.push({ category: 'vocab', rule: w });
  }
  for (const w of VOCAB_EXACT) {
    const re = new RegExp('(?<!\\w)' + escapeRe(w) + '(?!\\w)', 'i');
    if (re.test(t)) tripped.push({ category: 'vocab', rule: w });
  }
  for (const [re, label] of PHRASES) {
    if (re.test(t)) tripped.push({ category: 'phrases', rule: label });
  }
  for (const hit of emDashHits(t)) {
    tripped.push({ category: 'punctuation', rule: 'two or more em-dashes in one sentence: ' + hit });
  }
  const semis = (t.match(/;/g) || []).length;
  if (semis > Math.max(3, Math.floor(t.length / 1200))) {
    tripped.push({ category: 'punctuation', rule: `semicolon-heavy for web copy (${semis} found)` });
  }
  for (const re of TRICOLON) {
    const m = re.exec(t);
    if (m) tripped.push({ category: 'rhythm', rule: 'rule-of-three list: ' + m[0].slice(0, 60) });
  }
  const proofMatch = PROOF.exec(t);
  PROOF.lastIndex = 0;
  if (proofMatch) tripped.push({ category: 'proof', rule: 'possible invented proof: ' + proofMatch[0].trim() });

  const categories = new Set(tripped.map((h) => h.category));
  const score = Math.max(0, 5 - categories.size);
  return { score, tripped };
}
