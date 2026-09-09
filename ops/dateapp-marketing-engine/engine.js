/**
 * Date App marketing engine — daily routine entry point.
 *
 * Orchestrates the rotation engine + comment generator into a daily batch:
 *   1. Load rotation state (persisted across runs).
 *   2. Rotate: pick up to 3 niche tags and up to 3 cities (no repeats within
 *      the recent window).
 *   3. For each target post, generate 3 comment variants with different
 *      3-tag sets.
 *   4. Write one dated DRAFT markdown into the marketing inbox — never
 *      direct publishing.
 *
 * CLI: node engine.js --daily [--state <file>] [--inbox <dir>]
 *      (engine/engine.js as an ESM module; run from the package dir)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CITIES, NICHES, BRAND_TAG, TARGET_POSTS } from "./data.js";
import { pick } from "./rotation.js";
import { generateComments } from "./comments.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_STATE_FILE = path.join(__dirname, "state", "rotation.json");
const DEFAULT_INBOX_DIR = path.join(__dirname, "..", "..", "ops", "marketing-inbox");

const TAG_POOL = NICHES.map((n) => ({ id: n.id, tag: n.tags[0] }));
const TAG_WINDOW = 6; // 3 tags x 2 days before reuse
const CITY_WINDOW = 6; // 3 cities x 2 days before reuse

function loadState(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return { tagState: { cursor: 0, recent: [] }, cityState: { cursor: 0, recent: [] } };
  }
}

function saveState(file, state) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2), "utf8");
}

/**
 * @param {{inboxDir?: string, stateFile?: string, posts?: Array<{id:string,title:string,platform:string,url?:string}>, now?: Date}} opts
 * @returns {{outputs: string[], rotation: {tags: Array, cities: Array}}}
 */
export function runDaily({ inboxDir = DEFAULT_INBOX_DIR, stateFile = DEFAULT_STATE_FILE, posts = TARGET_POSTS, now = new Date() } = {}) {
  const state = loadState(stateFile);

  const tagPick = pick(TAG_POOL, 3, TAG_WINDOW, state.tagState);
  const cityPick = pick(CITIES, 3, CITY_WINDOW, state.cityState);
  const nextState = { tagState: tagPick.state, cityState: cityPick.state };
  saveState(stateFile, nextState);

  const rotation = { tags: tagPick.picked, cities: cityPick.picked };

  const date = now.toISOString().slice(0, 10);
  const lines = [];
  lines.push(`# YouAndiNotAI — DateApp Daily Rotation Batch (${date})`);
  lines.push("");
  lines.push(`**Drafted:** ${now.toISOString()} · **Status:** DRAFT — approval required, never publish directly`);
  lines.push("");
  lines.push("## Rotation");
  lines.push("");
  lines.push(`- **Brand tag:** ${BRAND_TAG}`);
  lines.push(`- **Niche tags (${tagPick.picked.length}/3):** ${tagPick.picked.map((t) => t.tag).join(", ")}`);
  lines.push(`- **Cities (${cityPick.picked.length}/3):** ${cityPick.picked.map((c) => `${c.city}, ${c.state}`).join(" · ")}`);
  lines.push("");
  lines.push("## Comments");
  lines.push("");

  let commentCount = 0;
  for (const post of posts) {
    lines.push(`### Post: ${post.title} (${post.platform})`);
    if (post.url) lines.push(`Parent: ${post.url}`);
    lines.push("");
    const variants = generateComments(post, { tags: rotation.tags, cities: rotation.cities, brandTag: BRAND_TAG });
    for (const v of variants) {
      commentCount++;
      lines.push(`#### Variant ${v.variant}`);
      lines.push("");
      lines.push(v.text);
      lines.push("");
      lines.push(`Tags: ${v.tags.join(" ")}`);
      lines.push("");
    }
  }

  lines.push("## Execution notes");
  lines.push("");
  lines.push("- Drafts only. Route through the marketing-inbox approval flow before any use.");
  lines.push("- Match each comment to a relevant, already-active parent post; value and context come before tags.");
  lines.push("- Do not reuse identical text across parent posts.");
  lines.push("- Keep platform activity within the organic cap of 3 comments/day/account/platform.");
  lines.push("- X execution remains Grok-lane only and blocked until Grok cap clearance is evidenced.");

  fs.mkdirSync(inboxDir, { recursive: true });
  const outFile = path.join(inboxDir, `${date}-dateapp-daily-batch.md`);
  fs.writeFileSync(outFile, lines.join("\n"), "utf8");

  return { outputs: [outFile], rotation };
}

// CLI entry: node engine.js --daily
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const daily = args.includes("--daily");
  if (!daily) {
    console.error("usage: node engine.js --daily [--state <file>] [--inbox <dir>]");
    process.exit(2);
  }
  const stateIdx = args.indexOf("--state");
  const inboxIdx = args.indexOf("--inbox");
  const opts = {};
  if (stateIdx >= 0 && args[stateIdx + 1]) opts.stateFile = path.resolve(args[stateIdx + 1]);
  if (inboxIdx >= 0 && args[inboxIdx + 1]) opts.inboxDir = path.resolve(args[inboxIdx + 1]);
  const result = runDaily(opts);
  console.log(`DateApp daily batch written: ${result.outputs[0]}`);
}
