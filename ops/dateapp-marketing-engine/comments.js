/**
 * Comment generator — 3 variants per target post, each with a different
 * 3-tag set (brand + niche tag + city tag), per the playbook's 1+1+1 rule.
 * The opening line varies per variant so no two comments read identically
 * even when a small pool forces shared tags.
 */

const OPENINGS = [
  "Honest question for the room —",
  "Something worth saying —",
  "Genuinely curious —",
];

const CLOSERS = [
  "would a human-first profile change how you swipe?",
  "does the algorithm even matter when the profile is real?",
  "are we overthinking this, or is this the actual fix?",
];

/**
 * @param {{title: string, platform: string}} post  target post
 * @param {{tags: Array<{id: string, tag: string}>, cities: Array<{city: string, tag: string}>, brandTag: string}} rotation
 * @returns {Array<{variant: number, tags: string[], text: string}>} 3 variants
 */
export function generateComments(post, { tags, cities, brandTag }) {
  const count = 3;
  const variants = [];
  for (let i = 0; i < count; i++) {
    const tag = tags[i % tags.length];
    const city = cities[i % cities.length];
    // Different tag set per variant when pools allow: variant i pairs
    // tag[i] with city[i]. When a pool is smaller than 3 the sets cycle
    // (test: openings still differ), and the engine's rotation guarantees
    // 3 distinct tags + 3 distinct cities in the normal case.
    const tagSet = [brandTag, tag.tag, city.tag];
    const text = `${OPENINGS[i]} ${post.title} on ${post.platform}? ${city.city}: ${CLOSERS[i]} ${tagSet.join(" ")}`;
    variants.push({ variant: i + 1, tags: tagSet, text });
  }
  return variants;
}
