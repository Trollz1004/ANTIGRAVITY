import { describe, expect, it, beforeEach } from 'vitest';

import {
  capturePartnerId,
  clearPartnerId,
  getStoredPartnerId,
  normalizeRef,
} from './partnerAttribution';

describe('normalizeRef', () => {
  it('accepts a plain slug', () => {
    expect(normalizeRef('bot-slayer')).toBe('bot-slayer');
  });

  it('lowercases and trims', () => {
    expect(normalizeRef('  Bot-Slayer  ')).toBe('bot-slayer');
  });

  it('accepts underscores and digits', () => {
    expect(normalizeRef('portal_2')).toBe('portal_2');
  });

  it('rejects empty, null, and whitespace', () => {
    expect(normalizeRef('')).toBeNull();
    expect(normalizeRef(null)).toBeNull();
    expect(normalizeRef(undefined)).toBeNull();
    expect(normalizeRef('   ')).toBeNull();
  });

  it('rejects values with unsafe characters', () => {
    expect(normalizeRef('bot slayer')).toBeNull();
    expect(normalizeRef('<script>')).toBeNull();
    expect(normalizeRef('a/b')).toBeNull();
    expect(normalizeRef('a?b=c')).toBeNull();
  });

  it('rejects values longer than 64 characters', () => {
    expect(normalizeRef('x'.repeat(65))).toBeNull();
    expect(normalizeRef('x'.repeat(64))).toBe('x'.repeat(64));
  });
});

describe('capturePartnerId', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('captures ref from the query string and stores it', () => {
    expect(capturePartnerId('?ref=bot-slayer')).toBe('bot-slayer');
    expect(getStoredPartnerId()).toBe('bot-slayer');
  });

  it('falls back to the stored value when the query has no ref', () => {
    capturePartnerId('?ref=skeptic-squad');
    expect(capturePartnerId('?next=/app/profile')).toBe('skeptic-squad');
  });

  it('returns null when neither query nor storage has a ref', () => {
    expect(capturePartnerId('?next=/app/profile')).toBeNull();
  });

  it('ignores and does not overwrite storage with an invalid ref', () => {
    capturePartnerId('?ref=bot-slayer');
    expect(capturePartnerId('?ref=not a valid ref')).toBe('bot-slayer');
    expect(getStoredPartnerId()).toBe('bot-slayer');
  });

  it('handles an empty search string', () => {
    expect(capturePartnerId('')).toBeNull();
  });

  it('overwrites a previous ref with a newer one', () => {
    capturePartnerId('?ref=first-portal');
    expect(capturePartnerId('?ref=second-portal')).toBe('second-portal');
    expect(getStoredPartnerId()).toBe('second-portal');
  });
});

describe('clearPartnerId', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes the stored partner id', () => {
    capturePartnerId('?ref=bot-slayer');
    clearPartnerId();
    expect(getStoredPartnerId()).toBeNull();
  });

  it('is safe to call when nothing is stored', () => {
    expect(() => clearPartnerId()).not.toThrow();
  });
});
