import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const goDir = path.resolve(__dirname, '../../public/go');
const pages = ['index.html', 'josh/index.html', 'launch/index.html', 'partner/index.html'];

function runForward(file: string, pathname: string): string {
  const html = readFileSync(path.join(goDir, file), 'utf8');
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)![1];
  let target = '';
  const fakeLocation = { pathname, replace: (url: string) => (target = url) };
  new Function('location', script)(fakeLocation);
  return target;
}

describe('public/go pages', () => {
  it.each(pages)('%s contains no checkout link', (file) => {
    const html = readFileSync(path.join(goDir, file), 'utf8');
    expect(html).not.toMatch(/square\.link|squareup|checkout|founding\.html|paypal|cash\.app/i);
  });

  it('forwards to the home page keeping the code', () => {
    expect(runForward('josh/index.html', '/go/josh/')).toBe('/?ref=josh');
    expect(runForward('launch/index.html', '/go/launch')).toBe('/?ref=launch');
    expect(runForward('partner/index.html', '/go/partner/')).toBe('/?ref=partner');
    expect(runForward('index.html', '/go/maya-23')).toBe('/?ref=maya-23');
  });

  it('a bad or missing name lands on the home page with no code', () => {
    expect(runForward('index.html', '/go/')).toBe('/');
    expect(runForward('index.html', '/go/<x>')).toBe('/');
    expect(runForward('index.html', '/go/ab')).toBe('/');
  });
});
