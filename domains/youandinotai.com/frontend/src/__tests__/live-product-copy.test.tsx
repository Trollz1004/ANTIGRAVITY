import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import LandingPage from '../App';
import { Login } from '../app/pages/Login';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

// Ruling from Josh, 2026-11-07 03:43: youandinotai.com is a live product, not
// a beta. No member-facing surface says beta, early access, launch list,
// waitlist, coming soon, invite code, rollout, "when we launch" or milestones.

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const BANNED =
  /\b(beta|early access|launch list|waitlist|coming soon|invite code|rollout|when we launch|milestones)\b/i;

// Lines allowed to match BANNED in source: the backend route name (not copy)
// which is kept as is so nothing changes server-side.
const SOURCE_ALLOWLIST = ['/auth/beta-access'];

const SRC_ROOT = path.resolve(__dirname, '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      return name === '__tests__' ? [] : sourceFiles(full);
    }
    return /\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name)
      ? [full]
      : [];
  });
}

function visibleText(root: HTMLElement): string {
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

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <LandingPage />
    </MemoryRouter>
  );
}

describe('live product copy (Josh ruling 2026-11-07 03:43)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
    useAuth.setState({ user: null, loading: false });
  });

  it('no source file under src carries a banned word in copy', () => {
    const hits: string[] = [];
    for (const file of sourceFiles(SRC_ROOT)) {
      readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (!BANNED.test(line)) return;
          if (SOURCE_ALLOWLIST.some(allowed => line.includes(allowed))) return;
          hits.push(`${path.relative(SRC_ROOT, file)}:${i + 1}: ${line.trim()}`);
        });
    }
    expect(hits).toEqual([]);
  });

  it('PRIVACY_POLICY.md carries no banned word', () => {
    const policy = readFileSync(
      path.resolve(SRC_ROOT, '../PRIVACY_POLICY.md'),
      'utf8'
    );
    expect(policy.split(/\r?\n/).filter(line => BANNED.test(line))).toEqual(
      []
    );
  });

  it('landing page shows no banned word anywhere a visitor reads', () => {
    const { container } = renderLanding();
    const hits = visibleText(container)
      .split('\n')
      .map(line => line.trim())
      .filter(line => BANNED.test(line));
    expect(hits).toEqual([]);
  });

  it('stop 07 is "Start tonight" with three actions in order and no email capture', () => {
    const { container } = renderLanding();
    const stop = container.querySelector('#join') as HTMLElement;
    expect(stop).not.toBeNull();
    expect(stop.textContent).toContain('07 / START TONIGHT');
    expect(
      within(stop).getByRole('heading', { level: 2 }).textContent?.trim()
    ).toBe('Verified people are already here.');

    const actions = within(
      within(stop).getByRole('navigation', { name: 'Start tonight' })
    ).getAllByRole('link');
    expect(
      actions.map(a => [a.textContent?.trim(), a.getAttribute('href')])
    ).toEqual([
      ['Create Free Account', '/register'],
      ['Get Verified, $1 Bot-Shield', '/app/verify'],
      ['Member Sign In', '/login'],
    ]);

    expect(stop.querySelector('form')).toBeNull();
    expect(stop.querySelector('input')).toBeNull();
  });

  it('the one email box lives in the footer as a single line, same endpoint', () => {
    const { container, getByLabelText } = renderLanding();
    const forms = container.querySelectorAll(
      'form[action="https://formsubmit.co/contact@youandinotai.com"]'
    );
    expect(forms.length).toBe(1);
    const form = forms[0] as HTMLFormElement;
    expect(form.closest('footer')).not.toBeNull();
    expect(form.getAttribute('method')?.toUpperCase()).toBe('POST');

    const email = getByLabelText(
      'Get invited to verified member events'
    ) as HTMLInputElement;
    expect(email.type).toBe('email');
    expect(email.name).toBe('email');
    expect(form.contains(email)).toBe(true);

    // No other visible field anywhere on the landing page.
    const visibleInputs = container.querySelectorAll(
      'input:not([type="hidden"])'
    );
    expect(visibleInputs.length).toBe(1);
    // The founder code field moved to Sign In.
    expect(container.textContent).not.toMatch(/founder code/i);
  });

  it('header "Join" opens the register flow; brand marks and API Live stay', () => {
    const { container, getAllByText } = renderLanding();
    const nav = container.querySelector(
      'nav[aria-label="Primary section navigation"]'
    ) as HTMLElement;
    const join = within(nav).getByRole('link', { name: 'Join' });
    expect(join.getAttribute('href')).toBe('/register');
    expect(nav.textContent).not.toMatch(/early access/i);

    expect(getAllByText(/CLAUDE's N Joshua's/i).length).toBeGreaterThan(0);
    expect(getAllByText(/#TeamClaudeForLife/i).length).toBeGreaterThan(0);
    expect(getAllByText(/API Live/).length).toBeGreaterThan(0);
  });

  it('progress map keeps eight stops and labels stop 07 as "07 START"', () => {
    const { container, getByLabelText } = renderLanding();
    const map = container.querySelector('#youandinotai-progress-map');
    expect(map?.getAttribute('data-total-stops')).toBe('8');
    const segment = getByLabelText('07 Start Tonight');
    expect(segment.textContent?.replace(/\s+/g, ' ').trim()).toMatch(
      /^07\s?START$/
    );
  });

  it('Sign In has one optional "Founder code (optional)" field wired to /auth/beta-access', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      access_token: 'tok-founder',
      refresh_token: 'ref-founder',
      user_id: 'u-founder',
    });
    vi.mocked(api.get).mockResolvedValueOnce({
      user_id: 'u-founder',
      email: 'founder@youandinotai.com',
      display_name: 'Founder',
      bot_shield_verified: true,
      subscription_tier: null,
      subscription_active: false,
      has_profile: true,
      adult_verified: true,
    });

    const { container, getByLabelText, getByRole, findByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<p>member home</p>} />
          <Route path="/app/profile" element={<p>profile setup</p>} />
        </Routes>
      </MemoryRouter>
    );

    const hits = visibleText(container)
      .split('\n')
      .filter(line => BANNED.test(line));
    expect(hits).toEqual([]);

    const field = getByLabelText('Founder code (optional)') as HTMLInputElement;
    expect(field.required).toBe(false);

    // Empty submit stays on the page with a plain message.
    fireEvent.click(getByRole('button', { name: 'Use Code' }));
    expect(await findByText('Enter your founder code first.')).toBeTruthy();
    expect(api.post).not.toHaveBeenCalled();

    fireEvent.change(field, { target: { value: '  FOUNDER-7  ' } });
    fireEvent.click(getByRole('button', { name: 'Use Code' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/beta-access', {
        code: 'FOUNDER-7',
      });
    });
    expect(await findByText('member home')).toBeTruthy();
  });

  it('Sign In with a founder code sends a member without a profile to profile setup', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      access_token: 'tok-new',
      refresh_token: 'ref-new',
      user_id: 'u-new',
    });
    vi.mocked(api.get).mockResolvedValueOnce({
      user_id: 'u-new',
      email: 'new@youandinotai.com',
      display_name: 'New',
      bot_shield_verified: false,
      subscription_tier: null,
      subscription_active: false,
      has_profile: false,
      adult_verified: true,
    });

    const { getByLabelText, getByRole, findByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<p>member home</p>} />
          <Route path="/app/profile" element={<p>profile setup</p>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByLabelText('Founder code (optional)'), {
      target: { value: 'FOUNDER-8' },
    });
    fireEvent.click(getByRole('button', { name: 'Use Code' }));
    expect(await findByText('profile setup')).toBeTruthy();
  });
});
