import { readFileSync } from 'node:fs';
import path from 'node:path';
import { TextEncoder } from 'node:util';
import { JSDOM, VirtualConsole } from 'jsdom';
import { describe, expect, it } from 'vitest';

const file = path.resolve(__dirname, '../../public/affiliate-links.html');
const html = readFileSync(file, 'utf8');

function loadTool(search = '') {
  const dom = new JSDOM(html, {
    url: 'https://youandinotai.com/affiliate-links.html' + search,
    runScripts: 'dangerously',
    virtualConsole: new VirtualConsole(),
    beforeParse(window) {
      (window as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder =
        TextEncoder;
    },
  });
  return dom.window as unknown as Window & {
    creatorLinkTool: {
      buildCreatorLink: (raw: string) => string | null;
      makeQr: (text: string) => { size: number; modules: boolean[][] } | null;
    };
  };
}

describe('affiliate-links.html creator link tool', () => {
  it('is not empty and uses no outside script', () => {
    expect(html.length).toBeGreaterThan(1000);
    expect(html).not.toMatch(/<script[^>]+src=/i);
  });

  it('builds the right short link', () => {
    const { buildCreatorLink } = loadTool().creatorLinkTool;
    expect(buildCreatorLink('maya-rose')).toBe(
      'https://youandinotai.com/c/maya-rose'
    );
    expect(buildCreatorLink('  Maya Rose ')).toBe(
      'https://youandinotai.com/c/maya-rose'
    );
    expect(buildCreatorLink('Bot_Slayer99')).toBe(
      'https://youandinotai.com/c/bot-slayer99'
    );
    expect(buildCreatorLink('ab')).toBeNull();
    expect(buildCreatorLink('a'.repeat(31))).toBeNull();
    expect(buildCreatorLink('')).toBeNull();
  });

  it('shows the link, copy button and QR code after typing a name', () => {
    const w = loadTool('?name=maya-rose');
    const doc = w.document;
    expect(doc.getElementById('result')!.hidden).toBe(false);
    expect(doc.getElementById('link')!.textContent).toBe(
      'https://youandinotai.com/c/maya-rose'
    );
    expect(doc.getElementById('copy')!.textContent).toMatch(/copy/i);
    const qr = w.creatorLinkTool.makeQr('https://youandinotai.com/c/maya-rose');
    expect(qr!.size).toBe(29); // version 3
    const longest = w.creatorLinkTool.makeQr(
      'https://youandinotai.com/c/' + 'a'.repeat(30)
    );
    expect(longest!.size).toBe(33); // version 4
  });

  it('states no payout or percentage', () => {
    const doc = loadTool('?name=maya-rose').document;
    doc.querySelectorAll('script,style').forEach(n => n.remove());
    const words = doc.body.textContent + ' ' + doc.title;
    expect(words).not.toMatch(
      /\d+\s*%|percent|payout|commission|revenue share|\$\s*\d/i
    );
    expect(html).not.toMatch(/payout|commission|percent/i);
  });
});
