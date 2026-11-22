import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PayMethods } from './PayMethods';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('PayMethods (/app/pay)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a top $1 Bot-Shield Human Check card linking to /app/verify before checkout rails', () => {
    const { container, getAllByText } = render(
      <MemoryRouter initialEntries={['/app/pay']}>
        <PayMethods />
      </MemoryRouter>
    );

    expect(getAllByText(/\$1 Bot-Shield Human Check/i).length).toBeGreaterThan(
      0
    );

    const verifyLinks = Array.from(
      container.querySelectorAll('a[href="/app/verify"]')
    );
    expect(verifyLinks.length).toBeGreaterThan(0);
  });

  it('renders live Founder Plans copy, https://youandinotai.com/?ref= links, zero github.io links, and zero Plaid stub text', () => {
    const { container, getAllByText } = render(
      <MemoryRouter initialEntries={['/app/pay']}>
        <PayMethods />
      </MemoryRouter>
    );

    expect(getAllByText(/Founder Plans/i).length).toBeGreaterThan(0);

    const links = Array.from(container.querySelectorAll('a')).map(
      a => a.getAttribute('href') || ''
    );
    expect(
      links.some(href => href.startsWith('https://youandinotai.com/?ref='))
    ).toBe(true);
    expect(links.some(href => /github\.io/i.test(href))).toBe(false);

    const text = container.textContent || '';
    expect(text).not.toMatch(/github\.io/i);
    expect(text).not.toMatch(/pre-order/i);
    expect(text).not.toMatch(/Plaid/i);
    expect(text).not.toMatch(/Wire Plaid Link JS/i);
  });
});
