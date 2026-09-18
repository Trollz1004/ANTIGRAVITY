/**
 * Paperclip growth engine — the "5 ways to improve Paperclip in
 * marketing / SEO / YouTube" deliverable. Executable contract (node test
 * runner).
 *
 * Run: node --test ops/paperclip-growth-engine/engine.test.js
 *
 * Pins the behavior Joshua's directive requires:
 *   1. Five concrete ways, each a daily routine: marketing, SEO, faceless
 *      YouTube, animated/avatar short-form, community engagement.
 *   2. Each way picks at most 3 topics/angles per day, rotating with no
 *      repeats within a window, state persisted across runs.
 *   3. Each way produces 3 variants with different 3-tag sets.
 *   4. Daily output is one dated DRAFT markdown in ops/marketing-inbox/ —
 *      never direct publishing.
 */
import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { WAYS, BRAND_TAG } from "./data.js";
import { runWay } from "./engine.js";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "paperclip-growth-"));

test("data: exactly 5 ways, each with a real pool of 6+ items", () => {
  assert.equal(WAYS.length, 5, "five ways, no more no less");
  const ids = new Set(WAYS.map((w) => w.id));
  assert.equal(ids.size, 5, "way ids are unique");
  for (const w of WAYS) {
    assert.ok(w.id && w.name, `${w.id} has id+name`);
    assert.ok(w.description, `${w.id} has a description`);
    assert.ok(w.platform, `${w.id} names its platform`);
    assert.ok(Array.isArray(w.pool) && w.pool.length >= 6, `${w.id} pool has >=6 items (got ${w.pool.length})`);
    for (const item of w.pool) {
      assert.ok(item.id && item.title, `${w.id} pool items have id+title`);
      assert.ok(Array.isArray(item.tags) && item.tags.length >= 3, `${w.id} item ${item.id} has >=3 tags`);
      assert.ok(item.tags.every((t) => t.startsWith("#")), `${w.id} item ${item.id} tags start with #`);
    }
  }
});

test("data: brand tag present", () => {
  assert.equal(BRAND_TAG, "#YouAndiNotAI");
});

test("engine: every way produces 3 variants, each a different 3-tag set", () => {
  const inbox = path.join(tmp, "inbox");
  for (const way of WAYS) {
    const stateFile = path.join(tmp, `state-${way.id}.json`);
    const result = runWay(way.id, { inboxDir: inbox, stateFile, now: new Date("2026-08-27T09:00:00Z") });
    assert.equal(result.variants.length, 3, `${way.id}: 3 variants`);
    for (const v of result.variants) {
      assert.equal(v.tags.length, 3, `${way.id}: each variant carries exactly 3 tags`);
      assert.ok(v.tags.includes(BRAND_TAG), `${way.id}: brand tag always present`);
      assert.ok(v.text.length > 20, `${way.id}: variant text is substantive`);
    }
    const sets = result.variants.map((v) => [...v.tags].sort().join(" "));
    assert.equal(new Set(sets).size, 3, `${way.id}: 3 variants have 3 different tag sets`);
  }
});

test("engine: picks at most 3 topics per way", () => {
  for (const way of WAYS) {
    const stateFile = path.join(tmp, `pick-${way.id}.json`);
    const result = runWay(way.id, { inboxDir: path.join(tmp, "i2"), stateFile });
    assert.ok(result.picked.length <= 3, `${way.id}: picked <= 3 (got ${result.picked.length})`);
    assert.ok(result.picked.length >= 1, `${way.id}: picked at least 1`);
  }
});

test("engine: rotation persists across runs (no repeat within window)", () => {
  const way = WAYS[0];
  const stateFile = path.join(tmp, "persist.json");
  const r1 = runWay(way.id, { inboxDir: path.join(tmp, "i3"), stateFile, now: new Date("2026-08-27T09:00:00Z") });
  const r2 = runWay(way.id, { inboxDir: path.join(tmp, "i3"), stateFile, now: new Date("2026-08-28T09:00:00Z") });
  const ids1 = r1.picked.map((p) => p.id);
  const ids2 = r2.picked.map((p) => p.id);
  const overlap = ids1.filter((id) => ids2.includes(id));
  assert.equal(overlap.length, 0, `no topic repeats across consecutive runs (window ${way.pool.length >= 6 ? 6 : way.pool.length})`);
  assert.notDeepEqual(ids1, ids2, "second run rotates to different topics");
});

test("engine: writes one dated DRAFT to inbox only, never publishes", () => {
  const inbox = path.join(tmp, "inbox4");
  const result = runWay("seo", { inboxDir: inbox, stateFile: path.join(tmp, "s1.json"), now: new Date("2026-08-27T09:00:00Z") });
  assert.equal(result.outputs.length, 1, "one output file");
  const out = result.outputs[0];
  assert.ok(out.startsWith(inbox), `output inside inbox (${out})`);
  assert.match(path.basename(out), /^2026-08-27-paperclip-seo-batch\.md$/, "dated filename per way");
  const content = fs.readFileSync(out, "utf8");
  assert.match(content, /DRAFT/, "output marked draft");
  assert.match(content, /#YouAndiNotAI/, "brand tag in output");
  assert.ok((content.match(/^### Variant /gm) || []).length >= 3, "3 variants in output");
  const stray = fs.readdirSync(tmp).filter((f) => !f.startsWith("inbox") && !f.includes("state-") && !f.includes("pick-") && !f.includes("persist") && !f.includes("s1") && f.endsWith(".md"));
  assert.deepEqual(stray, [], "no output outside the inbox");
});

test("engine: all five ways write their own dated file", () => {
  const inbox = path.join(tmp, "inbox5");
  for (const way of WAYS) {
    const result = runWay(way.id, { inboxDir: inbox, stateFile: path.join(tmp, `all-${way.id}.json`), now: new Date("2026-08-27T09:00:00Z") });
    assert.match(path.basename(result.outputs[0]), new RegExp(`^2026-08-27-paperclip-${way.id}-batch\\.md$`), `${way.id} file`);
    assert.ok(fs.existsSync(result.outputs[0]), `${way.id} file exists`);
  }
});

after(() => fs.rmSync(tmp, { recursive: true, force: true }));
