import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const FRONTEND_ROOT = path.resolve(__dirname, '../..');
const BLOG_DIR = path.join(FRONTEND_ROOT, 'public', 'blog');
const SITEMAP_PATH = path.join(FRONTEND_ROOT, 'public', 'sitemap.xml');

const NEW_POSTS = [
  {
    slug: 'romance-scam-warning-signs',
    keyword: 'romance scam warning signs',
  },
  {
    slug: 'how-to-tell-if-a-dating-profile-is-real',
    keyword: 'how to tell if a dating profile is real',
  },
  {
    slug: 'first-message-examples-that-get-a-reply',
    keyword: 'first message examples that get a reply',
  },
] as const;

const ORIGINAL_TWELVE_POSTS = [
  'best-dating-app-for-serious-relationships-2026',
  'dating-after-divorce-over-40',
  'dating-app-catfishing',
  'dating-app-identity-verification',
  'dating-app-profile-tips',
  'dating-app-scams',
  'dating-app-without-bots',
  'fake-profiles-on-dating-apps',
  'how-to-spot-a-bot-on-a-dating-app',
  'online-dating-conversation-tips',
  'safe-online-dating',
  'verified-dating-profiles',
] as const;

function parseFrontMatter(raw: string): {
  meta: Record<string, string>;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    return { meta: {}, body: raw };
  }
  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (key) {
      meta[key] = val;
    }
  }
  return { meta, body: raw.slice(match[0].length) };
}

function countWords(body: string): number {
  const cleaned = body
    .split(/\r?\n/)
    .map(line =>
      line
        .replace(/^#{1,6}\s+/, '')
        .replace(/^\d+\.\s+/, '')
        .trim()
    )
    .filter(Boolean)
    .join(' ');
  return cleaned.split(/\s+/).filter(Boolean).length;
}

describe('blog posts front matter and three new guides', () => {
  beforeAll(() => {
    execFileSync('python', [path.join(FRONTEND_ROOT, 'build_blog_static.py')], {
      stdio: 'pipe',
    });
  });

  it('every post has title, description under 160 characters with no raw URL, date, keyword, canonical', () => {
    const mdFiles = readdirSync(BLOG_DIR)
      .filter(name => name.endsWith('.md'))
      .sort();

    const seenDescriptions = new Map<string, string>();

    for (const file of mdFiles) {
      const raw = readFileSync(path.join(BLOG_DIR, file), 'utf8');
      const { meta } = parseFrontMatter(raw);

      expect(meta.title, `${file} missing title`).toBeTruthy();
      expect(meta.description, `${file} missing description`).toBeTruthy();
      expect(
        meta.description.length,
        `${file} description length (${meta.description.length}) must be under 160 characters`
      ).toBeLessThan(160);
      expect(
        meta.description,
        `${file} description must not contain raw URLs`
      ).not.toMatch(/https?:\/\/|www\.|youandinotai\.com/i);
      const normDesc = meta.description.trim().toLowerCase();
      expect(
        seenDescriptions.has(normDesc),
        `${file} shares duplicate description with ${seenDescriptions.get(normDesc)}`
      ).toBe(false);
      seenDescriptions.set(normDesc, file);

      expect(meta.date, `${file} invalid date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(meta.keyword, `${file} missing keyword`).toBeTruthy();
      expect(meta.canonical, `${file} invalid canonical`).toMatch(
        /^https:\/\/youandinotai\.com\/blog\/[a-z0-9-]+\/$/
      );
    }

    expect(mdFiles.length).toBeGreaterThanOrEqual(15);
  });

  it('no two posts share identical body paragraphs and markdown links use descriptive [label](url) anchor text instead of raw URLs', () => {
    const mdFiles = readdirSync(BLOG_DIR)
      .filter(name => name.endsWith('.md'))
      .sort();

    const seenParagraphs = new Map<string, string>();
    const mdLinkRe = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g;

    for (const file of mdFiles) {
      const raw = readFileSync(path.join(BLOG_DIR, file), 'utf8');
      const { meta, body } = parseFrontMatter(raw);

      const blocks = body
        .split(/\r?\n\r?\n+/)
        .flatMap(chunk => {
          const lines = chunk
            .split(/\r?\n/)
            .map(l => l.trim())
            .filter(Boolean);
          if (lines.length === 0) return [];
          if (lines.every(l => /^\d+\.\s+/.test(l))) {
            return lines.map(l => l.replace(/^\d+\.\s+/, '').trim());
          }
          return [
            lines
              .filter(l => !/^#{1,6}\s+/.test(l))
              .join(' ')
              .trim(),
          ];
        })
        .filter(Boolean);

      expect(
        blocks.length,
        `${file} must contain multiple body paragraphs`
      ).toBeGreaterThanOrEqual(4);

      for (const block of blocks) {
        const normalized = block.replace(/\s+/g, ' ').trim().toLowerCase();
        expect(
          seenParagraphs.has(normalized),
          `${file} shares identical body paragraph with ${seenParagraphs.get(normalized)}: "${block.slice(0, 80)}"`
        ).toBe(false);
        seenParagraphs.set(normalized, file);
      }

      const links = [...body.matchAll(mdLinkRe)];
      expect(
        links.length,
        `${file} must include at least two descriptive [label](url) links`
      ).toBeGreaterThanOrEqual(2);

      for (const match of links) {
        const label = match[1].trim();
        expect(
          label,
          `${file} link label "${label}" must not be a raw URL or bare route`
        ).not.toMatch(/https?:\/\/|www\.|youandinotai\.com|^\/[a-z0-9/_-]*$/i);
        expect(
          label.split(/\s+/).length,
          `${file} link label "${label}" must be descriptive anchor text`
        ).toBeGreaterThanOrEqual(2);
      }

      const bodyWithoutMdLinks = body.replace(mdLinkRe, '$1');
      expect(
        bodyWithoutMdLinks,
        `${file} body must not contain raw URLs outside [label](url) links`
      ).not.toMatch(/https?:\/\/|(?<![a-z0-9-])youandinotai\.com/i);

      const slug = file.replace(/\.md$/, '');
      const htmlPath = path.join(BLOG_DIR, slug, 'index.html');
      expect(existsSync(htmlPath), `blog/${slug}/index.html must exist`).toBe(
        true
      );
      const renderedHtml = readFileSync(htmlPath, 'utf8');
      const articleMatch = renderedHtml.match(
        /<article>([\s\S]*?)<\/article>/i
      );
      expect(articleMatch, `${slug} HTML must contain <article>`).toBeTruthy();
      const articleAnchors = [
        ...(articleMatch?.[1].matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi) ?? []),
      ];
      expect(
        articleAnchors.length,
        `${slug} rendered article must contain descriptive anchor tags`
      ).toBeGreaterThanOrEqual(2);
      for (const anchor of articleAnchors) {
        const anchorText = anchor[1].trim();
        expect(
          anchorText,
          `${slug} rendered anchor text "${anchorText}" must not be a raw URL`
        ).not.toMatch(/https?:\/\/|www\.|youandinotai\.com|^\/[a-z0-9/_-]*$/i);
      }

      if ((ORIGINAL_TWELVE_POSTS as readonly string[]).includes(slug)) {
        expect(
          countWords(body),
          `${file} must be a substantive topic-specific guide`
        ).toBeGreaterThanOrEqual(260);
        expect(
          body.toLowerCase(),
          `${file} must cover its target keyword "${meta.keyword}"`
        ).toContain(meta.keyword.toLowerCase());
      }
    }
  });

  it('includes the three new search guides with 600-900 words, strict style, and prerendered output', () => {
    const sitemap = readFileSync(SITEMAP_PATH, 'utf8');
    const bannedWords = /\b(beta|waitlist|launch|prompt)\b/i;
    const bannedAdverbs =
      /\b(?!(?:reply|rely|apply|family)\b)(?:[a-z]{3,}ly|very|quite|too|almost|always|never|often|soon|already|still|just|even|perhaps|maybe|rather|instead|ever|seldom|sometimes|also)\b/i;
    const notXButY = /\bnot\b[^.!?\n]*\bbut\b/i;

    for (const { slug, keyword } of NEW_POSTS) {
      const mdPath = path.join(BLOG_DIR, `${slug}.md`);
      expect(existsSync(mdPath), `${slug}.md must exist`).toBe(true);

      const raw = readFileSync(mdPath, 'utf8');
      const { meta, body } = parseFrontMatter(raw);

      expect(meta.keyword).toBe(keyword);
      expect(meta.canonical).toBe(`https://youandinotai.com/blog/${slug}/`);

      const words = countWords(body);
      expect(
        words,
        `${slug}.md word count (${words}) must be between 600 and 900`
      ).toBeGreaterThanOrEqual(600);
      expect(
        words,
        `${slug}.md word count (${words}) must be between 600 and 900`
      ).toBeLessThanOrEqual(900);

      expect(raw).not.toContain('\u2014');
      expect(raw).not.toMatch(bannedWords);
      expect(body).not.toMatch(bannedAdverbs);
      expect(body).not.toMatch(notXButY);
      expect(body).toContain(
        'one timed question plus a one dollar payment, once, before a member can message, swipe or post'
      );
      expect(body).toContain('/app/usa');

      const htmlPath = path.join(BLOG_DIR, slug, 'index.html');
      expect(existsSync(htmlPath), `blog/${slug}/index.html must exist`).toBe(
        true
      );
      expect(sitemap).toContain(`https://youandinotai.com/blog/${slug}/`);
    }
  });
});
