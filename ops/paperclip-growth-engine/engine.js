/**
 * Paperclip growth engine — daily routine entry point for the "5 ways".
 *
 * Mirrors the Date App engine's conventions and reuses its rotation pick:
 *   1. Load per-way rotation state (persisted across runs).
 *   2. Rotate: pick up to 3 topics/angles for the way (no repeats within
 *      the recent window).
 *   3. Draft 3 variants, each carrying a different 3-tag set
 *      (brand tag + two topic tags).
 *   4. Write one dated DRAFT markdown per way into the marketing inbox —
 *      never direct publishing.
 *
 * CLI: node engine.js --way <id> [--state <dir>] [--inbox <dir>]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { WAYS, BRAND_TAG } from "./data.js";
import { pick } from "../dateapp-marketing-engine/rotation.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_STATE_DIR = path.join(__dirname, "state");
const DEFAULT_INBOX_DIR = path.join(__dirname, "..", "..", "ops", "marketing-inbox");

const WINDOW = 6; // 3 picks x 2 days before reuse

const OPENINGS = [
  "Draft angle:",
  "Working idea:",
  "Test concept:",
];

const CLOSERS = [
  "Human-first, no AI filler.",
  "Real humans only — the product promise, in practice.",
  "Ground it in a real city scene before posting.",
];

function loadState(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return { cursor: 0, recent: [] };
  }
}

function saveState(file, state) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2), "utf8");
}

/**
 * @param {string} wayId  one of WAYS[].id
 * @param {{inboxDir?: string, stateDir?: string, now?: Date}} opts
 * @returns {{outputs: string[], picked: Array, variants: Array}}
 */
export function runWay(wayId, { inboxDir = DEFAULT_INBOX_DIR, stateDir = DEFAULT_STATE_DIR, now = new Date() } = {}) {
  const way = WAYS.find((w) => w.id === wayId);
  if (!way) {
    throw new Error(`unknown way: ${wayId} (known: ${WAYS.map((w) => w.id).join(", ")})`);
  }

  const stateFile = path.join(stateDir, `${wayId}.json`);
  const state = loadState(stateFile);

  const pickResult = pick(way.pool, 3, WINDOW, state);
  saveState(stateFile, pickResult.state);

  const picked = pickResult.picked;

  const variants = picked.map((item, i) => {
    const tags = [BRAND_TAG, item.tags[0], item.tags[1]];
    const text = `${OPENINGS[i % OPENINGS.length]} ${item.title} (${way.platform}). ${CLOSERS[i % CLOSERS.length]} ${way.angle}.`;
    return { variant: i + 1, tags, text };
  });

  const date = now.toISOString().slice(0, 10);
  const lines = [];
  lines.push(`# Paperclip Growth — ${way.name} (${date})`);
  lines.push("");
  lines.push(`**Drafted:** ${now.toISOString()} · **Status:** DRAFT — approval required, never publish directly`);
  lines.push("");
  lines.push("## Rotation");
  lines.push("");
  lines.push(`- **Way:** ${way.id} — ${way.name}`);
  lines.push(`- **Platform:** ${way.platform}`);
  lines.push(`- **Brand tag:** ${BRAND_TAG}`);
  lines.push(`- **Topics (${picked.length}/3):** ${picked.map((p) => p.title).join(" · ")}`);
  lines.push("");
  lines.push("## Variants");
  lines.push("");

  for (const v of variants) {
    lines.push(`### Variant ${v.variant}`);
    lines.push("");
    lines.push(v.text);
    lines.push("");
    lines.push(`Tags: ${v.tags.join(" ")}`);
    lines.push("");
  }

  lines.push("## Execution notes");
  lines.push("");
  lines.push("- Drafts only. Route through the marketing-inbox approval flow before any use.");
  lines.push("- Faceless / animated / avatar formats are allowed; keep the human-first promise in the copy.");
  lines.push("- Ground every piece in a real city singles scene or real dating behavior; no invented claims.");
  lines.push("- Keep platform activity within the organic cap of 3 posts-or-comments/day/account/platform.");
  lines.push("- X execution remains Grok-lane only and blocked until Grok cap clearance is evidenced.");

  fs.mkdirSync(inboxDir, { recursive: true });
  const outFile = path.join(inboxDir, `${date}-paperclip-${way.id}-batch.md`);
  fs.writeFileSync(outFile, lines.join("\n"), "utf8");

  return { outputs: [outFile], picked, variants };
}

// CLI entry: node engine.js --way <id>
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const wayIdx = args.indexOf("--way");
  const wayId = wayIdx >= 0 && args[wayIdx + 1] ? args[wayIdx + 1] : null;
  if (!wayId) {
    console.error(`usage: node engine.js --way <id> [--state <dir>] [--inbox <dir>] (ways: ${WAYS.map((w) => w.id).join(", ")})`);
    process.exit(2);
  }
  const opts = {};
  const stateIdx = args.indexOf("--state");
  if (stateIdx >= 0 && args[stateIdx + 1]) opts.stateDir = path.resolve(args[stateIdx + 1]);
  const inboxIdx = args.indexOf("--inbox");
  if (inboxIdx >= 0 && args[inboxIdx + 1]) opts.inboxDir = path.resolve(args[inboxIdx + 1]);
  const result = runWay(wayId, opts);
  console.log(`Paperclip ${wayId} batch written: ${result.outputs[0]}`);
}
