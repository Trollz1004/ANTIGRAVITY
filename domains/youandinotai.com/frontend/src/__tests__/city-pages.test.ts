import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const FRONTEND_ROOT = path.resolve(__dirname, '../..');
const CITIES_DIR = path.join(FRONTEND_ROOT, 'public', 'cities');
const SITEMAP_PATH = path.join(FRONTEND_ROOT, 'public', 'sitemap.xml');

const TOP_TEN_CITIES = [
  { slug: 'new-york', name: 'New York' },
  { slug: 'los-angeles', name: 'Los Angeles' },
  { slug: 'chicago', name: 'Chicago' },
  { slug: 'houston', name: 'Houston' },
  { slug: 'phoenix', name: 'Phoenix' },
  { slug: 'philadelphia', name: 'Philadelphia' },
  { slug: 'san-antonio', name: 'San Antonio' },
  { slug: 'san-diego', name: 'San Diego' },
  { slug: 'dallas', name: 'Dallas' },
  { slug: 'jacksonville', name: 'Jacksonville' },
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
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim()
    )
    .filter(Boolean)
    .join(' ');
  return cleaned.split(/\s+/).filter(Boolean).length;
}

describe('ten city pages by population (/cities/<slug>/)', () => {
  beforeAll(() => {
    execFileSync('python', [path.join(FRONTEND_ROOT, 'build_blog_static.py')], {
      stdio: 'pipe',
    });
  });

  it('builds all ten city pages with title, description under 160 chars, canonical, one h1, 250-350 words, sign-up UTM button, and sitemap entry', () => {
    expect(existsSync(SITEMAP_PATH), 'sitemap.xml must exist').toBe(true);
    const sitemap = readFileSync(SITEMAP_PATH, 'utf8');
    const bannedWords =
      /\b(beta|waitlist|launch|prompt|liveness|selfie|gesture|biometric)\b/i;
    const memberCountClaims =
      /\b(\d+\s+(?:members|singles|users|people|verified\s+members)|thousands\s+of\s+(?:members|singles)|hundreds\s+of\s+(?:members|singles))\b/i;

    const normalizedBodies: string[] = [];

    for (const { slug, name } of TOP_TEN_CITIES) {
      const mdPath = path.join(CITIES_DIR, `${slug}.md`);
      expect(existsSync(mdPath), `cities/${slug}.md must exist`).toBe(true);

      const raw = readFileSync(mdPath, 'utf8');
      const { meta, body } = parseFrontMatter(raw);

      expect(meta.title, `${slug} missing front matter title`).toBe(
        `Dating in ${name} without bots`
      );
      expect(
        meta.description,
        `${slug} missing front matter description`
      ).toBeTruthy();
      expect(
        meta.description.length,
        `${slug} description length (${meta.description.length}) must be under 160 characters`
      ).toBeLessThan(160);
      expect(meta.canonical, `${slug} canonical mismatch`).toBe(
        `https://youandinotai.com/cities/${slug}/`
      );

      const words = countWords(body);
      expect(
        words,
        `${slug} word count (${words}) must be at least 250`
      ).toBeGreaterThanOrEqual(250);
      expect(
        words,
        `${slug} word count (${words}) must be at most 350`
      ).toBeLessThanOrEqual(350);

      expect(raw).not.toMatch(bannedWords);
      expect(raw).not.toMatch(memberCountClaims);
      expect(body.toLowerCase()).toContain('timed question');
      expect(body.toLowerCase()).toMatch(/one dollar|\$1/);
      expect(body.toLowerCase()).toContain('usa group chat');

      const htmlPath = path.join(CITIES_DIR, slug, 'index.html');
      expect(existsSync(htmlPath), `cities/${slug}/index.html must exist`).toBe(
        true
      );
      const html = readFileSync(htmlPath, 'utf8');

      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      expect(titleMatch?.[1]).toContain(`Dating in ${name} without bots`);

      const descMatch = html.match(
        /<meta\s+name="description"\s+content="([^"]+)"/i
      );
      expect(
        descMatch?.[1],
        `${slug} HTML missing meta description`
      ).toBeTruthy();
      expect(
        (descMatch?.[1] ?? '').length,
        `${slug} HTML meta description must be under 160 characters`
      ).toBeLessThan(160);

      expect(html).toContain(
        `<link rel="canonical" href="https://youandinotai.com/cities/${slug}/" />`
      );

      const h1Matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
      expect(h1Matches.length, `${slug} must have exactly one h1`).toBe(1);
      expect(h1Matches[0][1].trim()).toBe(`Dating in ${name} without bots`);

      const expectedSignupHref = `/register?utm_source=city&amp;utm_medium=page&amp;utm_campaign=${slug}`;
      const expectedSignupHrefRaw = `/register?utm_source=city&utm_medium=page&utm_campaign=${slug}`;
      expect(
        html.includes(`href="${expectedSignupHref}"`) ||
          html.includes(`href="${expectedSignupHrefRaw}"`),
        `${slug} must have a sign-up button to ${expectedSignupHrefRaw}`
      ).toBe(true);

      const signupLinks = [
        ...html.matchAll(
          /<a\b[^>]*href="\/register\?utm_source=city&(amp;)?utm_medium=page&(amp;)?utm_campaign=[^"]+"[^>]*>/gi
        ),
      ];
      expect(
        signupLinks.length,
        `${slug} must have exactly one button to the sign-up page`
      ).toBe(1);

      expect(sitemap).toContain(
        `<loc>https://youandinotai.com/cities/${slug}/</loc>`
      );

      const maskCity = body
        .replace(new RegExp(name, 'gi'), '<CITY>')
        .replace(new RegExp(slug, 'gi'), '<SLUG>')
        .replace(/\s+/g, ' ')
        .trim();
      normalizedBodies.push(maskCity);
    }

    const uniqueBodies = new Set(normalizedBodies);
    expect(uniqueBodies.size).toBe(TOP_TEN_CITIES.length);
  });
});
