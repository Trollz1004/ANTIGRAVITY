/**
 * Date App marketing engine — executable contract (node test runner).
 *
 * Run: node --test ops/dateapp-marketing-engine/engine.test.js
 *
 * Pins the behavior Joshua's directive requires:
 *   1. Rotation engine — picks at most 3 tags AND at most 3 cities/states per
 *      post, cycles without repeating within a window, persists state.
 *   2. Comment generator — 3 variants per target post, each with a different
 *      3-tag set (brand + niche tag + city tag), extending reach of existing
 *      posts.
 *   3. Research data — real US metros by singles population and dating-app
 *      content niches, selectable by rotation.
 *   4. Daily routine — output lands in ops/marketing-inbox/ (draft), never
 *      direct publishing.
 */
import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { pick } from "./rotation.js";
import { generateComments } from "./comments.js";
import { runDaily } from "./engine.js";
import { CITIES, NICHES, BRAND_TAG, TARGET_POSTS } from "./data.js";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dateapp-engine-"));

test("data: cities are real US metros with tags, ranked", () => {
  assert.ok(CITIES.length >= 20, `expected >=20 metros, got ${CITIES.length}`);
  for (const c of CITIES.slice(0, 5)) {
    assert.ok(c.city && c.state, `${c.city} has city+state`);
    assert.ok(/^#/.test(c.tag), `${c.city} tag ${c.tag} starts with #`);
    assert.ok(c.rank >= 1, `${c.city} has rank`);
  }
  // no duplicate city names or tags
  assert.equal(new Set(CITIES.map((c) => c.city)).size, CITIES.length, "city names unique");
  assert.equal(new Set(CITIES.map((c) => c.tag)).size, CITIES.length, "city tags unique");
});

test("data: niches are dating-app content niches with tag pools", () => {
  assert.ok(NICHES.length >= 3, `expected >=3 niches, got ${NICHES.length}`);
  for (const n of NICHES) {
    assert.ok(n.id && n.name, `${n.id} has id+name`);
    assert.ok(Array.isArray(n.tags) && n.tags.length >= 3, `${n.id} has >=3 tags`);
    assert.ok(n.angle, `${n.id} has an angle`);
  }
});

test("data: brand tag present and target posts seeded", () => {
  assert.equal(BRAND_TAG, "#YouAndiNotAI");
  assert.ok(TARGET_POSTS.length >= 2, "seeded target posts exist");
});

test("rotation: picks at most max items per pool", () => {
  const r1 = pick(CITIES, 3, 6);
  assert.ok(r1.picked.length <= 3, `tags <= 3 (got ${r1.picked.length})`);
  const r2 = pick(CITIES.map((c) => ({ id: c.city })), 3, 6);
  assert.ok(r2.picked.length <= 3, `cities <= 3 (got ${r2.picked.length})`);
});

test("rotation: cycles without repeating within a window", () => {
  const pool = CITIES.map((c) => ({ id: c.city }));
  let state = { cursor: 0, recent: [] };
  const seen = [];
  for (let i = 0; i < 12; i++) {
    const { picked, state: next } = pick(pool, 3, 6, state);
    seen.push(picked.map((p) => p.id));
    state = next;
  }
  // Within any sliding window of 2 consecutive picks (6 items), no city
  // repeats — the window of 6 blocks re-use.
  for (let i = 1; i < seen.length; i++) {
    const union = new Set([...seen[i - 1], ...seen[i]]);
    assert.equal(union.size, seen[i - 1].length + seen[i].length, `no repeat between picks ${i - 1} and ${i}`);
  }
});

test("rotation: window larger than pool still fills (no deadlock)", () => {
  const pool = [{ id: "a" }, { id: "b" }];
  const r = pick(pool, 3, 5);
  assert.equal(r.picked.length, 2, "returns both items when pool smaller than max");
});

test("rotation: empty pool and zero max are safe", () => {
  assert.deepEqual(pick([], 3, 6).picked, []);
  assert.deepEqual(pick(CITIES, 0, 6).picked, []);
});

test("rotation: round-robin advances across calls", () => {
  const pool = [{ id: "a" }, { id: "b" }, { id: "c" }];
  // pick is pure: state in, state out. Thread the returned state through.
  let st = { cursor: 0, recent: [] };
  const first = pick(pool, 1, 6, st);
  st = first.state;
  const second = pick(pool, 1, 6, st);
  assert.notEqual(first.picked[0].id, second.picked[0].id, "cursor advances");
});

test("rotation: state persists across runs (file)", () => {
  const file = path.join(tmp, "rotation-state.json");
  const pool = CITIES.map((c) => ({ id: c.city }));
  const save = (st) => fs.writeFileSync(file, JSON.stringify(st), "utf8");
  const load = () => JSON.parse(fs.readFileSync(file, "utf8"));

  const { picked, state: s1 } = pick(pool, 3, 6, { cursor: 0, recent: [] });
  save(s1);
  // A fresh process state, loaded from the file, must not repeat the first pick.
  const { picked: second } = pick(pool, 3, 6, load());
  const overlap = picked.filter((p) => second.some((q) => q.id === p.id));
  assert.equal(overlap.length, 0, "no repeat across persisted runs (window 6)");
});

test("comments: exactly 3 variants, each with a different 3-tag set", () => {
  const tags = NICHES.flatMap((n) => n.tags.slice(0, 1)).map((t, i) => ({ id: `tag${i}`, tag: t }));
  const cities = CITIES.slice(0, 3).map((c) => ({ id: c.city, city: c.city, state: c.state, tag: c.tag }));
  const post = TARGET_POSTS[0];
  const variants = generateComments(post, { tags, cities, brandTag: BRAND_TAG });
  assert.equal(variants.length, 3, "3 variants per target post");
  for (const v of variants) {
    assert.equal(v.tags.length, 3, "each variant carries exactly 3 tags");
    assert.ok(v.tags.includes(BRAND_TAG), "brand tag always present");
  }
  const sets = variants.map((v) => [...v.tags].sort().join(" "));
  assert.equal(new Set(sets).size, 3, "3 variants have 3 different tag sets");
  assert.ok(variants[0].text.includes(cities[0].city), "variant text mentions the city");
});

test("comments: variants differ even when tags coincide (openings vary)", () => {
  const tags = [{ id: "t", tag: NICHES[0].tags[0] }];
  const cities = [CITIES[0]].map((c) => ({ id: c.city, city: c.city, state: c.state, tag: c.tag }));
  const post = TARGET_POSTS[1];
  const variants = generateComments(post, { tags, cities, brandTag: BRAND_TAG });
  assert.equal(variants.length, 3, "still 3 variants with a 1-tag/1-city pool");
  const texts = new Set(variants.map((v) => v.text));
  assert.equal(texts.size, 3, "texts differ (openings vary per variant)");
});

test("daily: writes one dated draft to inbox, never publishes", () => {
  const inbox = path.join(tmp, "inbox");
  const stateFile = path.join(tmp, "daily-state.json");
  const result = runDaily({ inboxDir: inbox, stateFile, posts: TARGET_POSTS.slice(0, 2), now: new Date("2026-08-27T09:00:00Z") });
  assert.equal(result.outputs.length, 1, "one output file");
  const out = result.outputs[0];
  assert.ok(out.startsWith(inbox), `output inside inbox (${out})`);
  assert.match(path.basename(out), /^2026-08-27-dateapp-daily-batch\.md$/, "dated filename");
  const content = fs.readFileSync(out, "utf8");
  assert.match(content, /DRAFT/, "output marked draft");
  assert.match(content, /#YouAndiNotAI/, "brand tag in output");
  assert.ok((content.match(/^#### Variant /gm) || []).length >= 6, "3 variants x 2 posts in output");
  // nothing written anywhere else
  const stray = fs.readdirSync(tmp).filter((f) => !f.startsWith("inbox") && !f.includes("daily-state") && f.endsWith(".md"));
  assert.deepEqual(stray, [], "no output outside the inbox");
});

test("daily: second run advances rotation (no immediate repeat)", () => {
  const inbox = path.join(tmp, "inbox2");
  const stateFile = path.join(tmp, "daily-state2.json");
  const r1 = runDaily({ inboxDir: inbox, stateFile, posts: TARGET_POSTS.slice(0, 1), now: new Date("2026-08-27T09:00:00Z") });
  const r2 = runDaily({ inboxDir: inbox, stateFile, posts: TARGET_POSTS.slice(0, 1), now: new Date("2026-08-28T09:00:00Z") });
  const cities1 = (r1.rotation.cities || []).map((c) => c.id);
  const cities2 = (r2.rotation.cities || []).map((c) => c.id);
  assert.notDeepEqual(cities1, cities2, "second daily run rotates to different cities");
});

after(() => fs.rmSync(tmp, { recursive: true, force: true }));
