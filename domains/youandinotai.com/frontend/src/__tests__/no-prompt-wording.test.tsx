import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import LandingPage from '../App';
import { Discover } from '../app/pages/Discover';
import { Inbox } from '../app/pages/Inbox';
import { Matches } from '../app/pages/Matches';
import { LoveBotPage } from '../app/pages/LoveBotPage';
import { OnboardingFunnel } from '../app/pages/OnboardingFunnel';
import { ProfileSetup } from '../app/pages/ProfileSetup';
import { Verify } from '../app/pages/Verify';
import { SwipeCard } from '../app/components/SwipeCard';
import LoveBot from '../components/LoveBot';
import DataPrivacyDashboard from '../components/DataPrivacyDashboard';
import SolarFlareSOS from '../components/SolarFlareSOS';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import {
  DISPLAY_PROFILE_ANSWER_LABEL,
  STORED_PROFILE_ANSWER_KEY,
  formatBioForDisplay,
} from '../lib/profileBio';

// Ruling from Josh, 2026-11-07: the word "prompt" never appears on anything a
// member or visitor reads on youandinotai.com. These tests render the
// member-facing surfaces and read their visible text plus the attributes a
// screen reader or browser shows (placeholder, aria-label, title, alt).

vi.mock('../lib/api', async () => {
  const actual =
    await vi.importActual<typeof import('../lib/api')>('../lib/api');
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
});

vi.mock('../lib/safety', () => ({
  isSafetyToolsAvailable: () => Promise.resolve(true),
}));

const BANNED = /prompt/i;

// A stored bio as ProfileSetup writes it today. The stored key stays as is so
// existing profiles keep parsing; only what is shown changes.
const STORED_BIO =
  'Coffee enthusiast and builder.\n\nPrompt: Bookstore coffee first.\n\nDate comfort: Public coffee or daytime walk first';

function memberFacingText(root: HTMLElement): string {
  const parts = [root.textContent || ''];
  root
    .querySelectorAll('[placeholder],[aria-label],[title],[alt]')
    .forEach(el => {
      for (const attr of ['placeholder', 'aria-label', 'title', 'alt']) {
        const value = el.getAttribute(attr);
        if (value) parts.push(value);
      }
    });
  return parts.join('\n');
}

function expectNoBannedWord(root: HTMLElement) {
  const text = memberFacingText(root);
  const hits = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => BANNED.test(line));
  expect(hits).toEqual([]);
}

describe('no "prompt" on member-facing copy (Josh ruling 2026-11-07)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
    useAuth.setState({
      user: {
        user_id: 'user-wording-1',
        email: 'member@youandinotai.com',
        display_name: 'Verified Member',
        bot_shield_verified: true,
        subscription_tier: 'founding_member',
        subscription_active: true,
        has_profile: true,
        adult_verified: true,
      },
      loading: false,
    });
  });

  it('PRIVACY_POLICY.md never uses the word', () => {
    const policyPath = path.resolve(__dirname, '../../PRIVACY_POLICY.md');
    const lines = readFileSync(policyPath, 'utf8')
      .split(/\r?\n/)
      .filter(line => BANNED.test(line));
    expect(lines).toEqual([]);
  });

  it('landing page and every legal modal tab are free of the word', () => {
    const { container, getAllByText, getByRole } = render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );
    expectNoBannedWord(container);
    expect(container.textContent).toMatch(
      /relationship goals, openers, and\s+meetup preferences/
    );

    fireEvent.click(getAllByText('Terms of Service')[0]);
    const dialog = getByRole('dialog');
    for (const label of [
      'Terms of Service',
      'Privacy Policy',
      'Age Policy',
      'Refund Policy',
    ]) {
      fireEvent.click(within(dialog).getByRole('button', { name: label }));
      expectNoBannedWord(dialog);
    }

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Privacy Policy' })
    );
    expect(dialog.textContent).toContain('profile answers');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Refund Policy' })
    );
    expect(dialog.textContent).toContain('for a quick resolution');
  });

  it('Discover with loaded profiles shows "Profile Answer" and opener-specific likes', async () => {
    vi.mocked(api.get).mockResolvedValue([
      {
        user_id: 'member-1',
        display_name: 'Maya',
        bio: 'Coffee, bookstores, and honest conversation beat endless scrolling.',
        age: 31,
        photos: [],
        interests: ['Coffee', 'Bookstores'],
        location: 'Orlando, FL',
        verified: true,
        subscription_active: true,
        gender: 'female',
        prompt:
          'My ideal first date is coffee, a bookstore, and no pressure to perform.',
        intent: 'Relationship ready',
        availability: 'Free this weekend',
        compatibility: 'Shared pace and safety-first dating',
      },
    ]);
    const { container, findAllByText } = render(
      <MemoryRouter initialEntries={['/app']}>
        <Discover />
      </MemoryRouter>
    );
    expect((await findAllByText('Profile Answer')).length).toBeGreaterThan(0);
    expect(container.textContent).toContain('opener-specific likes');
    expectNoBannedWord(container);
  });

  it('SwipeCard shows a stored profile answer without the stored key', () => {
    const { container, getByText } = render(
      <SwipeCard
        isTop
        onSwipe={vi.fn()}
        profile={{
          user_id: 'member-2',
          display_name: 'Maya',
          bio: STORED_BIO,
          age: 31,
          photos: [],
          interests: ['Coffee'],
          location: 'Tampa, FL',
          prompt: 'Bookstore coffee first.',
        }}
      />
    );
    expect(getByText('Profile Answer')).toBeTruthy();
    expect(container.textContent).toContain(
      'Profile answer: Bookstore coffee first.'
    );
    expectNoBannedWord(container);
  });

  it('Inbox empty state talks about openers', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const { container, findByText } = render(
      <MemoryRouter>
        <Inbox />
      </MemoryRouter>
    );
    await findByText(
      'Comment on an opener instead of sending a blank greeting.'
    );
    expect(container.textContent).toMatch(
      /start from the opener or shared interest/
    );
    expectNoBannedWord(container);
  });

  it('Matches empty state talks about openers', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const { container, findByText } = render(
      <MemoryRouter>
        <Matches />
      </MemoryRouter>
    );
    await findByText(/Like or comment on an opener in Discover\./);
    expectNoBannedWord(container);
  });

  it('Onboarding profile step asks for a profile answer', () => {
    const { container, getByText } = render(
      <MemoryRouter>
        <OnboardingFunnel />
      </MemoryRouter>
    );
    expect(
      getByText(
        'Add a bio, interests, and a profile answer so people can find you.'
      )
    ).toBeTruthy();
    expectNoBannedWord(container);
  });

  it('ProfileSetup labels the field "Profile Answer" and still parses the stored key', async () => {
    vi.mocked(api.get).mockResolvedValue({
      user_id: 'user-wording-1',
      display_name: 'Verified Member',
      bio: STORED_BIO,
      age: 31,
      gender: null,
      looking_for: null,
      location: null,
      photos: [],
      interests: [],
      verified: true,
    });
    const { container, getByText, findByDisplayValue } = render(
      <MemoryRouter>
        <ProfileSetup />
      </MemoryRouter>
    );
    expect(await findByDisplayValue('Bookstore coffee first.')).toBeTruthy();
    expect(getByText('Profile Answer')).toBeTruthy();
    expectNoBannedWord(container);
  });

  it('Verify flow steps are free of the word', async () => {
    vi.mocked(api.get).mockResolvedValue({
      verified: false,
      trust_score: 0,
      tier: 'unverified',
      bot_shield_paid: false,
      subscription_active: false,
      checks_completed: 0,
    });
    const { container, findByText } = render(
      <MemoryRouter>
        <Verify />
      </MemoryRouter>
    );
    await findByText('Answer a short human check challenge.');
    expectNoBannedWord(container);
  });

  it('premium Concierge page and its locked and quotes views are free of the word', () => {
    const page = render(
      <MemoryRouter>
        <LoveBotPage />
      </MemoryRouter>
    );
    expect(page.container.textContent).toContain(
      'compatibility tools, conversation starters, gift ideas'
    );
    fireEvent.click(page.getByLabelText('Quotes'));
    expect(page.container.textContent).toContain(
      'Randomized conversation starters, love quotes, and sweet openers.'
    );
    expectNoBannedWord(page.container);
    page.unmount();

    const locked = render(
      <LoveBot user={{ display_name: 'Visitor', subscription_active: false }} />
    );
    expect(locked.container.textContent).toContain(
      'Compatibility tools, conversation starters, dating tips'
    );
    expectNoBannedWord(locked.container);
  });

  it('Privacy Center shows the stored bio without the stored key', async () => {
    vi.mocked(api.get).mockResolvedValue({
      user_id: 'user-wording-1',
      email: 'member@youandinotai.com',
      display_name: 'Verified Member',
      created_at: null,
      profile: {
        bio: STORED_BIO,
        age: 31,
        gender: null,
        looking_for: null,
        location: null,
        interests: [],
        verified: true,
        location_enabled: true,
      },
      message_count: 0,
      match_count: 0,
      photos_count: 0,
      pending_requests: [],
    });
    const { container, findByText } = render(
      <MemoryRouter>
        <DataPrivacyDashboard />
      </MemoryRouter>
    );
    await findByText(/Profile answer: Bookstore coffee first\./);
    expectNoBannedWord(container);
  });

  it('Solar Flare SOS feature form label is free of the word', () => {
    const { container, getByText } = render(
      <SolarFlareSOS onClose={vi.fn()} />
    );
    fireEvent.click(getByText('Generate SOS Beacon'));
    expect(getByText('Distress Message')).toBeTruthy();
    expectNoBannedWord(container);
  });
});

describe('formatBioForDisplay', () => {
  it('keeps the stored key unchanged for parsing', () => {
    expect(STORED_PROFILE_ANSWER_KEY).toBe('Prompt: ');
    expect(DISPLAY_PROFILE_ANSWER_LABEL).toBe('Profile answer: ');
  });

  it('relabels the stored profile answer line and leaves everything else alone', () => {
    expect(formatBioForDisplay(STORED_BIO)).toBe(
      'Coffee enthusiast and builder.\n\nProfile answer: Bookstore coffee first.\n\nDate comfort: Public coffee or daytime walk first'
    );
  });

  it('handles indentation, missing key and empty input', () => {
    expect(formatBioForDisplay('  Prompt: Tea')).toBe('  Profile answer: Tea');
    expect(formatBioForDisplay('Just a bio.')).toBe('Just a bio.');
    expect(formatBioForDisplay('')).toBe('');
  });
});
