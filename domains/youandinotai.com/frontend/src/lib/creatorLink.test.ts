import { readFileSync } from 'node:fs';
import path from 'node:path';
import { TextEncoder } from 'node:util';
import { JSDOM, VirtualConsole } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { buildCreatorLink, makeQr, toShortName } from './creatorLink';

// The /creators page reuses the generator that public/affiliate-links.html
// already ships and tests. This file proves the copy in src/lib is the same
// generator: same names in, same links and same QR modules out.

const html = readFileSync(
  path.resolve(__dirname, '../../public/affiliate-links.html'),
  'utf8'
);

type Tool = {
  toShortName: (raw: string) => string | null;
  buildCreatorLink: (raw: string) => string | null;
  makeQr: (text: string) => { size: number; modules: boolean[][] } | null;
};

function loadHtmlTool(): Tool {
  const dom = new JSDOM(html, {
    url: 'https://youandinotai.com/affiliate-links.html',
    runScripts: 'dangerously',
    virtualConsole: new VirtualConsole(),
    beforeParse(window) {
      (window as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder =
        TextEncoder;
    },
  });
  return (dom.window as unknown as { creatorLinkTool: Tool }).creatorLinkTool;
}

const SAMPLES = [
  'maya-rose',
  '  Maya Rose ',
  'Bot_Slayer99',
  'abc',
  'a'.repeat(30),
  'ab',
  'a'.repeat(31),
  '',
  '!!!',
  '---x---',
];

describe('creatorLink (shared with public/affiliate-links.html)', () => {
  const tool = loadHtmlTool();

  it('builds the https://youandinotai.com/c/<name> short link', () => {
    expect(buildCreatorLink('maya-rose')).toBe(
      'https://youandinotai.com/c/maya-rose'
    );
    expect(buildCreatorLink('  Maya Rose ')).toBe(
      'https://youandinotai.com/c/maya-rose'
    );
    expect(buildCreatorLink('ab')).toBeNull();
    expect(buildCreatorLink('a'.repeat(31))).toBeNull();
    expect(buildCreatorLink('')).toBeNull();
  });

  it.each(SAMPLES)('gives the same name and link as the HTML tool for %j', raw => {
    expect(toShortName(raw)).toBe(tool.toShortName(raw));
    expect(buildCreatorLink(raw)).toBe(tool.buildCreatorLink(raw));
  });

  it.each([
    'https://youandinotai.com/c/maya-rose',
    'https://youandinotai.com/c/' + 'a'.repeat(30),
    'https://youandinotai.com/c/abc',
  ])('draws the exact same QR modules as the HTML tool for %s', text => {
    const mine = makeQr(text);
    const theirs = tool.makeQr(text);
    expect(mine).not.toBeNull();
    expect(mine!.size).toBe(theirs!.size);
    expect(mine!.modules).toEqual(theirs!.modules);
  });

  it('uses the sizes the existing tool tests promise (version 3 and 4)', () => {
    expect(makeQr('https://youandinotai.com/c/maya-rose')!.size).toBe(29);
    expect(makeQr('https://youandinotai.com/c/' + 'a'.repeat(30))!.size).toBe(
      33
    );
  });

  it('returns null for text too long for the small QR versions', () => {
    expect(makeQr('x'.repeat(200))).toBeNull();
  });
});
