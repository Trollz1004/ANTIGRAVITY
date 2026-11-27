import { beforeEach, describe, expect, it } from 'vitest';
import {
  captureShortLink,
  capturePartnerId,
  getStoredPartnerId,
} from './partnerAttribution';

describe('short creator link /c/<name>', () => {
  beforeEach(() => localStorage.clear());

  it('saves the code the same way ?ref= does', () => {
    expect(captureShortLink('/c/maya-23')).toEqual({
      isShortLink: true,
      code: 'maya-23',
    });
    expect(getStoredPartnerId()).toBe('maya-23');
    localStorage.clear();
    capturePartnerId('?ref=maya-23');
    expect(getStoredPartnerId()).toBe('maya-23');
  });

  it('accepts a trailing slash', () => {
    expect(captureShortLink('/c/abc/').code).toBe('abc');
  });

  it.each([
    '/c/ab',
    '/c/' + 'a'.repeat(31),
    '/c/Maya',
    '/c/maya_23',
    '/c/ma%20ya',
    '/c/',
    '/c',
    '/c/%E0%A4%A',
  ])('bad name %s saves nothing', path => {
    expect(captureShortLink(path)).toEqual({ isShortLink: true, code: null });
    expect(getStoredPartnerId()).toBeNull();
  });

  it('a bad name leaves an earlier code alone', () => {
    captureShortLink('/c/first-one');
    captureShortLink('/c/NO');
    expect(getStoredPartnerId()).toBe('first-one');
  });

  it("keeps today's rule: the latest link before sign-up wins", () => {
    captureShortLink('/c/first-one');
    captureShortLink('/c/second-one');
    expect(getStoredPartnerId()).toBe('second-one');
  });

  it('ignores paths that are not short links', () => {
    expect(captureShortLink('/')).toEqual({ isShortLink: false, code: null });
    expect(captureShortLink('/creator/abc')).toEqual({
      isShortLink: false,
      code: null,
    });
    expect(captureShortLink('/c/abc/extra')).toEqual({
      isShortLink: false,
      code: null,
    });
    expect(getStoredPartnerId()).toBeNull();
  });
});
