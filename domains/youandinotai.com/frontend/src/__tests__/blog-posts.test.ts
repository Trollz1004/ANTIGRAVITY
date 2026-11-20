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
    .map(line => line.replace(/^#{1,6}\s+/, '').replace(/^\d+\.\s+/, '').trim())
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

  it('every post has title, description under 160 characters, date, keyword, canonical', () => {
    const mdFiles = readdirSync(BLOG_DIR)
      .filter(name => name.endsWith('.md'))
      .sort();

    for (const file of mdFiles) {
      const raw = readFileSync(path.join(BLOG_DIR, file), 'utf8');
      const { meta } = parseFrontMatter(raw);

      expect(meta.title, `${file} missing title`).toBeTruthy();
      expect(meta.description, `${file} missing description`).toBeTruthy();
      expect(
        meta.description.length,
        `${file} description length (${meta.description.length}) must be under 160 characters`
      ).toBeLessThan(160);
      expect(meta.date, `${file} invalid date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(meta.keyword, `${file} missing keyword`).toBeTruthy();
      expect(meta.canonical, `${file} invalid canonical`).toMatch(
        /^https:\/\/youandinotai\.com\/blog\/[a-z0-9-]+\/$/
      );
    }

    expect(mdFiles.length).toBeGreaterThanOrEqual(15);
  });

  it('includes the three new search guides with 600-900 words, strict style, and prerendered output', () => {
    const sitemap = readFileSync(SITEMAP_PATH, 'utf8');
    const bannedWords = /\b(beta|waitlist|launch|prompt)\b/i;

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
      expect(body).toContain('/app/usa');

      const htmlPath = path.join(BLOG_DIR, slug, 'index.html');
      expect(existsSync(htmlPath), `blog/${slug}/index.html must exist`).toBe(
        true
      );
      expect(sitemap).toContain(`https://youandinotai.com/blog/${slug}/`);
    }
  });
});
