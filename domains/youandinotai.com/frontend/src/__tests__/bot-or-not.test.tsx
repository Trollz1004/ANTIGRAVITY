import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import LandingPage from '../App';
import { BOT_OR_NOT_CARDS, BotOrNotGame } from '../components/BotOrNotGame';
import { useAuth } from '../lib/auth';

describe('Bot or Not landing page game (trolling the founder)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
    useAuth.setState({ user: null, loading: false });
  });

  it('defines 10 cards where humans are only Josh portraits in /bot-or-not/ and bots are inline SVG illustrations', () => {
    expect(BOT_OR_NOT_CARDS.length).toBe(10);

    const humans = BOT_OR_NOT_CARDS.filter(c => c.kind === 'human');
    const bots = BOT_OR_NOT_CARDS.filter(c => c.kind === 'bot');
    expect(humans.length).toBe(5);
    expect(bots.length).toBe(5);

    for (const h of humans) {
      expect(h.imageSrc).toMatch(
        /^\/bot-or-not\/(josh-portrait-[a-z-]+\.jpg|josh-sticker\.jpg)$/
      );
    }

    for (const b of bots) {
      expect(b.imageSrc).toBeUndefined();
      expect(b.botVariant).toBeTruthy();
    }

    const jokes = BOT_OR_NOT_CARDS.map(c => c.joke);
    expect(jokes).toContain('Human. Verified. Still debugging at 3 AM.');
    expect(jokes).toContain("Bot? No. Just hasn't slept since the last deploy.");
    expect(jokes).toContain(
      'Real human. The beard is not AI-generated, we checked.'
    );
  });

  it('shows one card at a time on the landing page and flips on Bot or Not tap to reveal the answer and joke', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    const section = container.querySelector('#bot-or-not') as HTMLElement;
    expect(section).not.toBeNull();

    // Only one card stage rendered at a time
    const cards = section.querySelectorAll('[data-testid="bot-or-not-card"]');
    expect(cards.length).toBe(1);
    const card = cards[0] as HTMLElement;
    expect(card.getAttribute('data-flipped')).toBe('false');
    expect(card.getAttribute('data-card-kind')).toBe('human');

    // First card is Human (Josh) — renders img from /bot-or-not/
    const img = card.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('/bot-or-not/josh-portrait-blazer.jpg');

    // Tap "Not" to flip the human card
    const notBtn = within(section).getByRole('button', { name: /^Not$/i });
    fireEvent.click(notBtn);

    expect(card.getAttribute('data-flipped')).toBe('true');
    expect(section.textContent).toContain(
      'Human. Verified. Still debugging at 3 AM.'
    );
    expect(section.textContent).toMatch(/NOT A BOT/i);

    // Advance to card 2 (a Bot card)
    const nextBtn = within(section).getByRole('button', {
      name: /Next Card/i,
    });
    fireEvent.click(nextBtn);

    expect(card.getAttribute('data-flipped')).toBe('false');
    expect(card.getAttribute('data-card-kind')).toBe('bot');
    // Bot card never uses a member/human photo img; uses illustrated SVG robot
    expect(card.querySelector('img')).toBeNull();
    expect(
      card.querySelector('svg[data-testid="bot-or-not-robot-svg"]')
    ).not.toBeNull();

    // Tap "Bot" to flip the bot card
    const botBtn = within(section).getByRole('button', { name: /^Bot$/i });
    fireEvent.click(botBtn);

    expect(card.getAttribute('data-flipped')).toBe('true');
    expect(section.textContent).toContain(
      'Bot. Still gets more sleep than Josh on deploy night.'
    );
    expect(section.textContent).toMatch(/100% BOT/i);
  });

  it('ends on one verification CTA button wired to /app/verify and enforces 44px minimum hit targets', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        < BotOrNotGame />
      </MemoryRouter>
    );

    const section = container.querySelector('#bot-or-not') as HTMLElement;
    expect(section).not.toBeNull();

    const verifyLink = within(section).getByRole('link', {
      name: "Prove you're not a bot: Get Verified for $1",
    });
    expect(verifyLink.getAttribute('href')).toBe('/app/verify');
    expect(verifyLink.className).toContain('min-h-[44px]');
    expect(verifyLink.className).toContain('min-w-[44px]');

    const buttons = section.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    buttons.forEach(btn => {
      expect(btn.className).toContain('min-h-[44px]');
      expect(btn.className).toContain('min-w-[44px]');
    });
  });

  it('respects prefers-reduced-motion by disabling flip motion transitions', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    try {
      const { container } = render(
        <MemoryRouter initialEntries={['/']}>
          <BotOrNotGame />
        </MemoryRouter>
      );
      const card = container.querySelector(
        '[data-testid="bot-or-not-card"]'
      ) as HTMLElement;
      expect(card.getAttribute('data-reduced-motion')).toBe('true');
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
