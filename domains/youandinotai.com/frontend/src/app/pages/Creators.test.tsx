import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Creators } from './Creators';

function visibleText(root: HTMLElement): string {
  const parts = [root.textContent || ''];
  root.querySelectorAll('[placeholder],[aria-label],[title],[alt]').forEach(el => {
    for (const attr of ['placeholder', 'aria-label', 'title', 'alt']) {
      const value = el.getAttribute(attr);
      if (value) parts.push(value);
    }
  });
  return parts.join('\n');
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/creators']}>
      <Creators />
    </MemoryRouter>
  );
}

describe('Creators page (/creators)', () => {
  const fillRect = vi.fn();
  let anchorClicks: HTMLAnchorElement[] = [];

  beforeEach(() => {
    fillRect.mockClear();
    anchorClicks = [];
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      (() => ({ fillRect, fillStyle: '' })) as never
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,QVNL'
    );
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      anchorClicks.push(this);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('says plainly what a creator earns and who pays', () => {
    const { container } = renderPage();
    const text = visibleText(container);
    expect(text).toMatch(/earn half of what the members you bring pay/i);
    expect(text).toMatch(/for as long as they pay/i);
    expect(text).toMatch(/50%/);
    expect(text).toMatch(/payouts are sent by the founder/i);
    expect(text).toMatch(/earn from sign-ups/i);
  });

  it('never uses the words prompt, beta or launch', () => {
    const { container } = renderPage();
    const text = visibleText(container);
    expect(text).not.toMatch(/prompt/i);
    expect(text).not.toMatch(/\bbeta\b/i);
    expect(text).not.toMatch(/launch/i);
  });

  it('shows no link or QR until a usable name is typed', () => {
    renderPage();
    expect(screen.queryByRole('button', { name: /copy link/i })).toBeNull();
    expect(screen.queryByLabelText(/QR code/i)).toBeNull();
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: 'ab' },
    });
    expect(screen.getByRole('alert').textContent).toMatch(
      /3 to 30 letters, numbers or dashes/i
    );
    expect(screen.queryByRole('button', { name: /copy link/i })).toBeNull();
  });

  it('turns a typed name into the short link and draws the QR', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: 'Maya Rose' },
    });
    const link = screen.getByRole('link', {
      name: 'https://youandinotai.com/c/maya-rose',
    });
    expect(link.getAttribute('href')).toBe(
      'https://youandinotai.com/c/maya-rose'
    );
    expect(screen.getByLabelText(/QR code for your link/i)).toBeTruthy();
    expect(fillRect).toHaveBeenCalled();
  });

  it('copies the link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    renderPage();
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: 'maya-rose' },
    });
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }));
    expect(writeText).toHaveBeenCalledWith(
      'https://youandinotai.com/c/maya-rose'
    );
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/copied/i));
  });

  it('downloads the QR as a PNG named after the creator', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: 'maya-rose' },
    });
    fireEvent.click(screen.getByRole('button', { name: /download qr as png/i }));
    expect(anchorClicks).toHaveLength(1);
    expect(anchorClicks[0].download).toBe('youandinotai-maya-rose-qr.png');
    expect(anchorClicks[0].getAttribute('href')).toBe(
      'data:image/png;base64,QVNL'
    );
  });

  it('gives creators a plain line to say they earn from sign-ups', () => {
    renderPage();
    expect(
      screen.getByText(/I earn money when you sign up through this link/i)
    ).toBeTruthy();
  });
});
