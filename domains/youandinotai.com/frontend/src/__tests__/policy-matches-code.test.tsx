import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import LandingPage from '../App';
import { useAuth } from '../lib/auth';

const FRONTEND_ROOT = path.resolve(__dirname, '../..');

function readFrontendDoc(filename: string): string {
  return readFileSync(path.join(FRONTEND_ROOT, filename), 'utf8');
}

describe('Date app refund policy, terms, and privacy match the code', () => {
  beforeEach(() => {
    localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
    useAuth.setState({ user: null, loading: false });
  });

  it('REFUND_POLICY.md states the conditional 3-day $1 Bot-Shield rule and keeps effective date + November 21, 2026 last updated', () => {
    const refundDoc = readFrontendDoc('REFUND_POLICY.md');

    expect(refundDoc).toContain('**Effective Date:** March 30, 2026');
    expect(refundDoc).toContain('**Last Updated:** November 21, 2026');
    expect(refundDoc.toLowerCase()).toContain(
      'where the app offers it, you can ask for the dollar back within three days; the badge turns off'
    );

    expect(refundDoc).not.toContain(
      '### 2.1 Bot-Shield Verification — $1\n\n**Non-refundable.**'
    );
    expect(refundDoc).not.toContain(
      'Once you start the Bot-Shield challenge and payment checkpoint, the service has been rendered regardless of the outcome.'
    );
    expect(refundDoc).not.toContain(
      '- Bot-Shield and Royalty Card purchases are non-refundable'
    );
    expect(refundDoc).not.toMatch(
      /\|\s*Bot-Shield\s*\|\s*\$1\s*\|\s*No\s*\|\s*Service rendered at submission\s*\|/
    );
  });

  it('TERMS_OF_SERVICE.md removes statements contradicted by the code and keeps effective date + November 21, 2026 last updated', () => {
    const termsDoc = readFrontendDoc('TERMS_OF_SERVICE.md');

    expect(termsDoc).toContain(
      '**Effective Date:** March 30, 2026 (previously updated November 13, 2026)'
    );
    expect(termsDoc).toContain('**Last Updated:** November 21, 2026');

    expect(termsDoc).not.toContain(
      'verified badges are only assigned after the Bot-Shield flow is completed'
    );
    expect(termsDoc).not.toContain(
      "Google Gemini's matchmaking suggestions are just that — suggestions."
    );
    expect(termsDoc).toContain('founder code');
    expect(termsDoc).toContain('badge turns off');
  });

  it('PRIVACY_POLICY.md removes unbacked data collection, hosting, and Gemini matchmaking claims and keeps effective date + November 21, 2026 last updated', () => {
    const privacyDoc = readFrontendDoc('PRIVACY_POLICY.md');

    expect(privacyDoc).toContain(
      '**Effective Date:** March 30, 2026 (previously updated November 13, 2026)'
    );
    expect(privacyDoc).toContain('**Last Updated:** November 21, 2026');

    expect(privacyDoc).not.toMatch(/sexual orientation/i);
    expect(privacyDoc).not.toMatch(/GitHub Pages\s*\/\s*GCP Cloud Run/i);
    expect(privacyDoc).not.toMatch(
      /Anonymized (profile preferences|preference data)/i
    );
    expect(privacyDoc).not.toContain(
      'Using Google Gemini AI to suggest compatible matches and generate conversation starters'
    );
    expect(privacyDoc).not.toContain(
      'We use **Google Gemini** to power matchmaking suggestions and generate conversation icebreakers.'
    );
    expect(privacyDoc).not.toContain(
      'Suggests potential matches based on compatibility and generates conversation starters.'
    );
    expect(privacyDoc).not.toContain(
      'A member must pass the timed human check and the $1 payment before they can browse, match, message, or start video.'
    );
  });

  it('LandingPage legal modal renders the updated effective date, November 21, 2026 last updated, and conditional $1 refund wording', () => {
    const { getByRole, getByText } = render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    fireEvent.click(getByRole('button', { name: 'Refund Policy' }));

    const dialog = getByRole('dialog');
    expect(dialog.textContent).toContain(
      'Effective: April 2026 · Last Updated: November 21, 2026'
    );
    expect(dialog.textContent?.toLowerCase()).toContain(
      'where the app offers it, you can ask for the dollar back within three days; the badge turns off'
    );
    expect(dialog.textContent).not.toContain('or account settings');

    fireEvent.click(
      getByText('Terms of Service', { selector: 'div[role="dialog"] button' })
    );
    expect(dialog.textContent).toContain(
      'Effective: April 2026 · Last Updated: November 21, 2026'
    );
  });
});
