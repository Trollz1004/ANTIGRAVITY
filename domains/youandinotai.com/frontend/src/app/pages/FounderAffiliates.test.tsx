import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { FounderAffiliates } from './FounderAffiliates';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('FounderAffiliates tagged link builder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({
      generated_at: '2026-11-20T12:00:00Z',
      items: [],
      totals: {
        codes_count: 0,
        signups_count: 0,
        verified_count: 0,
        payments_count: 0,
        gross_cents: 0,
        owed_cents: 0,
      },
    });
  });

  it('builds a tagged link from the source, medium, and campaign boxes with lowercase letters, digits, and dashes only', async () => {
    const { getByLabelText, getByTestId } = render(<FounderAffiliates />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    const sourceInput = getByLabelText(/^Source$/i) as HTMLInputElement;
    const mediumInput = getByLabelText(/^Medium$/i) as HTMLInputElement;
    const campaignInput = getByLabelText(/^Campaign$/i) as HTMLInputElement;

    fireEvent.change(sourceInput, {
      target: { value: 'YouTube_Shorts! 01' },
    });
    fireEvent.change(mediumInput, {
      target: { value: 'Social_Video@2' },
    });
    fireEvent.change(campaignInput, {
      target: { value: 'Winter-Date_Night#2026' },
    });

    expect(sourceInput.value).toBe('youtubeshorts01');
    expect(mediumInput.value).toBe('socialvideo2');
    expect(campaignInput.value).toBe('winter-datenight2026');

    expect(getByTestId('built-tagged-link').textContent).toBe(
      'https://youandinotai.com/?utm_source=youtubeshorts01&utm_medium=socialvideo2&utm_campaign=winter-datenight2026'
    );
  });

  it('copies the built tagged link when the copy button is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    const { getByLabelText, getByRole, findByText } = render(
      <FounderAffiliates />
    );

    fireEvent.change(getByLabelText(/^Source$/i), {
      target: { value: 'Reddit-1' },
    });
    fireEvent.change(getByLabelText(/^Medium$/i), {
      target: { value: 'Organic' },
    });
    fireEvent.change(getByLabelText(/^Campaign$/i), {
      target: { value: 'Friday-Mixer' },
    });

    fireEvent.click(getByRole('button', { name: /Copy Link/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        'https://youandinotai.com/?utm_source=reddit-1&utm_medium=organic&utm_campaign=friday-mixer'
      );
    });

    expect(await findByText('Copied')).toBeDefined();
  });

  it('shows "e.g. facebook" for Source and "e.g. post" for Medium example text', async () => {
    const { getByLabelText } = render(<FounderAffiliates />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    const sourceInput = getByLabelText(/^Source$/i) as HTMLInputElement;
    const mediumInput = getByLabelText(/^Medium$/i) as HTMLInputElement;

    expect(sourceInput.placeholder).toBe('e.g. facebook');
    expect(mediumInput.placeholder).toBe('e.g. post');
  });
});
