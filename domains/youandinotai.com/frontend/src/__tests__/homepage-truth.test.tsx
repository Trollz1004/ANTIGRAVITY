import { readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import LandingPage from '../App';
import { useAuth } from '../lib/auth';

const FRONTEND_ROOT = path.resolve(__dirname, '../..');
const APP_TSX_PATH = path.join(FRONTEND_ROOT, 'src', 'App.tsx');
const INDEX_HTML_PATH = path.join(FRONTEND_ROOT, 'index.html');

function collectVisibleAndAccessibleText(root: HTMLElement): string {
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

function collectFullHomePageText(): string {
  const { container, getAllByText, getByRole, unmount } = render(
    <MemoryRouter initialEntries={['/']}>
      <LandingPage />
    </MemoryRouter>
  );

  const chunks: string[] = [collectVisibleAndAccessibleText(container)];

  fireEvent.click(getAllByText('Terms of Service')[0]);
  const dialog = getByRole('dialog');
  for (const label of [
    'Terms of Service',
    'Privacy Policy',
    'Age Policy',
    'Refund Policy',
  ]) {
    fireEvent.click(within(dialog).getByRole('button', { name: label }));
    chunks.push(collectVisibleAndAccessibleText(dialog));
  }

  unmount();
  return chunks.join('\n');
}

describe('Date app home page says only what works today (b17 audit)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
    useAuth.setState({ user: null, loading: false });
  });

  it('home page text holds none of: video date(s) as a live feature, Local Meetups or nearby meetup discovery, or romance concierge', () => {
    const fullText = collectFullHomePageText();
    const indexHtml = readFileSync(INDEX_HTML_PATH, 'utf8');
    const combined = `${fullText}\n${indexHtml}`;

    expect(combined).not.toMatch(
      /\bvideo\s*(dates?|calls?|rooms?|chat)\b|starting\s+video|start\s+video|messaging\s+and\s+video|matched\s+video/i
    );
    expect(combined).not.toMatch(
      /\blocal\s+meetups?\b|\bnearby\s+meetups?\b|\bmeetup\s+discovery\b|\blocal\s+venue\s+planning\b|\bboards\s*&\s*local\s+meetups\b|\bfor\s+dating,\s*meetups\b/i
    );
    expect(combined).not.toMatch(/\bromance\s+concierge\b/i);
  });

  it('keeps and leads with what works today: timed question and $1 check before messaging, topic boards, USA group chat, and Square checkout', () => {
    const fullText = collectFullHomePageText();

    expect(fullText).toMatch(/timed question/i);
    expect(fullText).toMatch(/\$1\s+Bot-Shield|\$1\s+check/i);
    expect(fullText).toMatch(
      /before\s+messaging|before\s+anyone\s+can\s+message/i
    );
    expect(fullText).toMatch(/topic\s+boards/i);
    expect(fullText).toMatch(/USA\s+group\s+chat/i);
    expect(fullText).toMatch(/Square\s+checkout/i);
  });

  it('Founding Member card lists only what a member gets today and keeps every price unchanged', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    const pricingSection = container.querySelector('#pricing') as HTMLElement;
    expect(pricingSection).not.toBeNull();
    const articles = Array.from(pricingSection.querySelectorAll('article'));
    expect(articles.length).toBe(5);

    const tierPrices = articles.map(article => ({
      name: article.querySelector('h3')?.textContent?.trim(),
      price: article.querySelector('span.font-display')?.textContent?.trim(),
    }));
    expect(tierPrices).toEqual([
      { name: 'Bot-Shield Verification', price: '$1' },
      { name: 'Founding Member', price: '$14.99' },
      { name: '3-Month Founder', price: '$39.99' },
      { name: '12-Month Founder', price: '$99.99' },
      { name: 'Royalty Card', price: '$2,500' },
    ]);

    const foundingCardText = articles[1].textContent || '';
    expect(foundingCardText).toContain('$14.99');
    expect(foundingCardText).toContain('/month');
    expect(foundingCardText).toMatch(/Founding Member|Platinum/i);
    expect(foundingCardText).not.toMatch(
      /video\s*dates?|romance\s*concierge|priority\s*discovery/i
    );
  });

  it('contains no coming soon promises and never uses beta, waitlist, launch, or prompt on the home page', () => {
    const fullText = collectFullHomePageText();
    const indexHtml = readFileSync(INDEX_HTML_PATH, 'utf8');
    const appTsx = readFileSync(APP_TSX_PATH, 'utf8');

    expect(fullText).not.toMatch(/coming\s+soon/i);
    expect(fullText).not.toMatch(/\b(beta|waitlist|launch|prompt)\b/i);
    expect(indexHtml).not.toMatch(/coming\s+soon/i);
    expect(indexHtml).not.toMatch(/\b(beta|waitlist|launch|prompt)\b/i);
    expect(appTsx).not.toMatch(/\b(beta|waitlist|launch|prompt)\b/i);
  });
});
