import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from './api';
import { useAuth } from './auth';
import {
  captureSignupSource,
  clearSignupSource,
  getStoredSignupSource,
  normalizeSignupSource,
} from './signupSource';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('captureSignupSource', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('captures ref:<slug> when ?ref= or /c/<name> is present', () => {
    expect(
      captureSignupSource({
        search: '?ref=Bot-Slayer',
        pathname: '/',
        referrer: 'https://www.reddit.com/r/dating/comments/123?q=secret',
      })
    ).toBe('ref:bot-slayer');
    expect(getStoredSignupSource()).toBe('ref:bot-slayer');

    clearSignupSource();
    expect(
      captureSignupSource({
        search: '',
        pathname: '/c/maya-23',
        referrer: '',
      })
    ).toBe('ref:maya-23');
    expect(getStoredSignupSource()).toBe('ref:maya-23');
  });

  it('captures utm:<source> with optional /<medium> and /<campaign>', () => {
    expect(
      captureSignupSource({
        search: '?utm_source=NewsLetter',
        pathname: '/',
        referrer: '',
      })
    ).toBe('utm:newsletter');

    clearSignupSource();
    expect(
      captureSignupSource({
        search: '?utm_source= TikTok &utm_medium=Social&utm_campaign=Spring_2026',
        pathname: '/',
        referrer: 'https://www.tiktok.com/@creator',
      })
    ).toBe('utm:tiktok/social/spring_2026');
  });

  it('captures site:<host> from external document.referrer and drops leading www.', () => {
    expect(
      captureSignupSource({
        search: '',
        pathname: '/register',
        referrer: 'https://www.Reddit.com/r/florida/comments/abc?search=private#top',
      })
    ).toBe('site:reddit.com');
    expect(getStoredSignupSource()).toBe('site:reddit.com');
  });

  it('captures direct when no partner code, utm_source, or external referrer is present', () => {
    expect(
      captureSignupSource({
        search: '',
        pathname: '/',
        referrer: '',
      })
    ).toBe('direct');
    expect(getStoredSignupSource()).toBe('direct');
  });

  it('keeps first touch once a signup_source is stored', () => {
    expect(
      captureSignupSource({
        search: '?utm_source=youtube&utm_medium=shorts',
        pathname: '/',
        referrer: '',
      })
    ).toBe('utm:youtube/shorts');

    expect(
      captureSignupSource({
        search: '',
        pathname: '/register',
        referrer: 'https://news.ycombinator.com/item?id=1',
      })
    ).toBe('utm:youtube/shorts');

    expect(
      captureSignupSource({
        search: '?utm_source=other',
        pathname: '/register',
        referrer: '',
      })
    ).toBe('utm:youtube/shorts');
  });

  it('allows a partner code to replace a stored value that does not start with ref:', () => {
    captureSignupSource({
      search: '',
      pathname: '/',
      referrer: 'https://www.google.com/search?q=dating',
    });
    expect(getStoredSignupSource()).toBe('site:google.com');

    expect(
      captureSignupSource({
        search: '?ref=bot-slayer',
        pathname: '/register',
        referrer: '',
      })
    ).toBe('ref:bot-slayer');
    expect(getStoredSignupSource()).toBe('ref:bot-slayer');

    // Once a ref: value is stored, first touch wins over later non-ref visits
    expect(
      captureSignupSource({
        search: '?utm_source=newsletter',
        pathname: '/register',
        referrer: '',
      })
    ).toBe('ref:bot-slayer');
  });

  it('counts a referrer on youandinotai.com or its subdomains as direct', () => {
    expect(
      captureSignupSource({
        search: '',
        pathname: '/register',
        referrer: 'https://youandinotai.com/support?q=1',
      })
    ).toBe('direct');

    clearSignupSource();
    expect(
      captureSignupSource({
        search: '',
        pathname: '/register',
        referrer: 'https://www.youandinotai.com/',
      })
    ).toBe('direct');

    clearSignupSource();
    expect(
      captureSignupSource({
        search: '',
        pathname: '/register',
        referrer: 'https://api.youandinotai.com/health',
      })
    ).toBe('direct');
  });

  it('cleans or drops odd characters and never stores an IP address, full path, or query string', () => {
    expect(
      captureSignupSource({
        search: '?utm_source=bad<>!source&utm_medium=paid%20ads&utm_campaign=c$1',
        pathname: '/',
        referrer: '',
      })
    ).toBe('utm:badsource/paidads/c1');

    clearSignupSource();
    expect(
      captureSignupSource({
        search: '',
        pathname: '/',
        referrer: 'http://192.168.1.50:8080/secret?token=abc',
      })
    ).toBe('direct');

    expect(normalizeSignupSource('  UTM:Google/CPC  ')).toBe('utm:google/cpc');
    expect(normalizeSignupSource('bad value with spaces')).toBeNull();
    expect(normalizeSignupSource('x'.repeat(129))).toBeNull();
  });

  it('sends signup_source with email sign-up and clears it after success', async () => {
    vi.resetAllMocks();
    captureSignupSource({
      search: '?utm_source=reddit&utm_medium=organic',
      pathname: '/',
      referrer: '',
    });
    vi.mocked(api.post).mockResolvedValueOnce({
      access_token: 'tok-1',
      refresh_token: 'ref-1',
      user_id: 'u-1',
    });
    vi.mocked(api.get).mockResolvedValueOnce({
      user_id: 'u-1',
      email: 'member@youandinotai.com',
      display_name: 'Member',
      bot_shield_verified: false,
      subscription_tier: null,
      subscription_active: false,
      has_profile: false,
      adult_verified: true,
    });

    await useAuth.getState().register({
      email: 'member@youandinotai.com',
      password: 'password123',
      displayName: 'Member',
      dateOfBirth: '1990-01-01',
      acceptedTerms: true,
      acceptedCookiePolicy: true,
      confirmedOver18: true,
    });

    expect(api.post).toHaveBeenCalledWith(
      '/auth/register',
      expect.objectContaining({
        email: 'member@youandinotai.com',
        signup_source: 'utm:reddit/organic',
      })
    );
    expect(getStoredSignupSource()).toBeNull();
  });

  it('sends signup_source with Google sign-up and clears it after success', async () => {
    vi.resetAllMocks();
    captureSignupSource({
      search: '',
      pathname: '/',
      referrer: 'https://www.youtube.com/watch?v=123',
    });
    vi.mocked(api.post).mockResolvedValueOnce({
      access_token: 'tok-g',
      refresh_token: 'ref-g',
      user_id: 'u-g',
    });
    vi.mocked(api.get).mockResolvedValueOnce({
      user_id: 'u-g',
      email: 'g@youandinotai.com',
      display_name: 'G Member',
      bot_shield_verified: false,
      subscription_tier: null,
      subscription_active: false,
      has_profile: false,
      adult_verified: true,
    });

    await useAuth.getState().googleLogin('google-id-token', '1992-05-14');

    expect(api.post).toHaveBeenCalledWith(
      '/auth/google',
      expect.objectContaining({
        id_token: 'google-id-token',
        date_of_birth: '1992-05-14',
        signup_source: 'site:youtube.com',
      })
    );
    expect(getStoredSignupSource()).toBeNull();
  });
});


import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('privacy policy disclosure for signup_source', () => {
  const expectedSentence =
    'When you create an account we record how you reached us: a partner link, a campaign tag in the link, or the name of the site that sent you. We do not keep the full address of the page you came from.';

  it('includes the signup_source disclosure sentence in member-facing privacy policy text', () => {
    const appSource = readFileSync(
      path.resolve(__dirname, '../App.tsx'),
      'utf8'
    );
    const privacyDoc = readFileSync(
      path.resolve(__dirname, '../../PRIVACY_POLICY.md'),
      'utf8'
    );

    expect(appSource).toContain(expectedSentence);
    expect(privacyDoc).toContain(expectedSentence);
  });
});
