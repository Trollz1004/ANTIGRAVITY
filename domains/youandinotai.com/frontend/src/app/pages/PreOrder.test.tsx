import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PreOrder } from './PreOrder';

describe('PreOrder (/app/preorder)', () => {
  it('renders live Founder Plans copy without the past August 2026 pre-order countdown', () => {
    const { container, getAllByText } = render(
      <MemoryRouter initialEntries={['/app/preorder']}>
        <PreOrder />
      </MemoryRouter>
    );

    expect(getAllByText(/Founder Plans/i).length).toBeGreaterThan(0);

    const text = container.textContent || '';
    expect(text).not.toMatch(/Aug 14,\s*2026/i);
    expect(text).not.toMatch(/Aug 18/i);
    expect(text).not.toMatch(/before launch day/i);
    expect(text).not.toMatch(/Pre-order/i);
    expect(text).not.toMatch(/Countdown/i);
  });

  it('uses first-party https://youandinotai.com/?ref= referral URLs with zero github.io links or Plaid stub text', () => {
    const { container, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/app/preorder']}>
        <PreOrder />
      </MemoryRouter>
    );

    const links = Array.from(container.querySelectorAll('a')).map(
      a => a.getAttribute('href') || ''
    );

    expect(
      links.some(href => href.startsWith('https://youandinotai.com/?ref='))
    ).toBe(true);
    expect(links.some(href => /github\.io/i.test(href))).toBe(false);

    const text = container.textContent || '';
    expect(text).toContain('https://youandinotai.com/?ref=elite');
    expect(text).not.toMatch(/github\.io/i);
    expect(text).not.toMatch(/Plaid/i);

    const refInput = getByPlaceholderText('clean-repo');
    fireEvent.change(refInput, { target: { value: 'creator1' } });
    expect(container.textContent || '').toContain(
      'https://youandinotai.com/?ref=creator1'
    );
  });
});
