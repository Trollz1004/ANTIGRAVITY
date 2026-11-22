import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfileSetup } from './ProfileSetup';
import { api } from '../../lib/api';

vi.mock('../../lib/auth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'qa@youandinotai.com',
      display_name: 'QA Tester',
      bot_shield_verified: true,
    },
    fetchUser: vi.fn(),
  }),
}));

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('ProfileSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('fetches /profiles/me on mount and pre-populates saved fields', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      user_id: 'user-1',
      display_name: 'QA Tester',
      bio: 'Coffee enthusiast and builder.\n\nPrompt: Bookstore coffee first.\n\nDate comfort: Public coffee or daytime walk first\n\nSafety preference: Keep first meetings public',
      age: 34,
      gender: 'Male',
      looking_for: 'Relationship',
      location: 'Orlando, FL',
      photos: [],
      interests: ['Coffee', 'Hiking'],
      verified: true,
    });

    const { getByPlaceholderText, getByDisplayValue } = render(
      <MemoryRouter>
        <ProfileSetup />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/profiles/me');
      expect(
        (getByPlaceholderText('What makes you you?') as HTMLTextAreaElement)
          .value
      ).toBe('Coffee enthusiast and builder.');
    });

    expect(getByDisplayValue('Bookstore coffee first.')).toBeDefined();
    expect(getByDisplayValue('34')).toBeDefined();
    expect(getByDisplayValue('Orlando, FL')).toBeDefined();
  });

  it('persists only email and displayName in sessionStorage on /app/profile without date of birth, gender, orientation, location, or bio and clears them on submit', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('404 Not Found'));
    vi.mocked(api.put).mockResolvedValueOnce({});

    const firstRender = render(
      <MemoryRouter>
        <ProfileSetup />
      </MemoryRouter>
    );

    fireEvent.change(firstRender.getByPlaceholderText('What makes you you?'), {
      target: { value: 'Loves weekend hikes and espresso.' },
    });
    fireEvent.change(
      firstRender.getByPlaceholderText(
        'Example: My ideal first date is coffee, a bookstore, and a relaxed conversation.'
      ),
      {
        target: { value: 'Coffee and a local art walk.' },
      }
    );
    fireEvent.change(firstRender.getByPlaceholderText('MM / DD / YYYY'), {
      target: { value: '06201991' },
    });
    fireEvent.change(firstRender.getByPlaceholderText('18+'), {
      target: { value: '35' },
    });
    const selects = firstRender.container.querySelectorAll('select');
    fireEvent.change(selects[0], { target: { value: 'female' } });
    fireEvent.change(selects[1], { target: { value: 'relationship' } });
    fireEvent.change(firstRender.getByPlaceholderText('City, State'), {
      target: { value: 'Tampa, FL' },
    });
    fireEvent.click(firstRender.getByRole('button', { name: 'Coffee' }));

    const rawDraft = sessionStorage.getItem('youandinotai_profile_setup_draft');
    expect(rawDraft).not.toBeNull();
    const parsedDraft = JSON.parse(rawDraft!) as Record<string, unknown>;
    expect(Object.keys(parsedDraft).sort()).toEqual(['displayName', 'email']);
    expect(parsedDraft).toEqual({
      email: 'qa@youandinotai.com',
      displayName: 'QA Tester',
    });
    for (const key of Object.keys(parsedDraft)) {
      expect(key).not.toMatch(
        /dateOfBirth|date_of_birth|dob|birth|age|gender|lookingFor|orientation|location|photo|bio|promptAnswer|dateComfort|safetyPreference|token/i
      );
    }
    for (const value of Object.values(parsedDraft)) {
      expect(String(value)).not.toMatch(
        /06201991|06\s*\/\s*20\s*\/\s*1991|1991-06-20|female|male|nonbinary|relationship|Tampa|Loves weekend hikes|art walk/i
      );
    }

    const storedDraft = JSON.stringify(sessionStorage);
    expect(storedDraft).toContain('QA Tester');
    expect(storedDraft).toContain('qa@youandinotai.com');
    expect(storedDraft).not.toMatch(
      /dateOfBirth|date_of_birth|06201991|06\s*\/\s*20\s*\/\s*1991|1991-06-20|gender|female|lookingFor|relationship|Tampa|Loves weekend hikes|art walk/i
    );

    firstRender.unmount();

    const reloadedRender = render(
      <MemoryRouter>
        <ProfileSetup />
      </MemoryRouter>
    );

    expect(reloadedRender.getByText('QA Tester')).toBeDefined();
    expect(
      (
        reloadedRender.getByPlaceholderText(
          'What makes you you?'
        ) as HTMLTextAreaElement
      ).value
    ).toBe('');
    expect(
      (
        reloadedRender.getByPlaceholderText(
          'MM / DD / YYYY'
        ) as HTMLInputElement
      ).value
    ).toBe('');
    expect(
      (reloadedRender.getByPlaceholderText('18+') as HTMLInputElement).value
    ).toBe('');
    expect(
      (reloadedRender.getByPlaceholderText('City, State') as HTMLInputElement)
        .value
    ).toBe('');
    const reloadedSelects = reloadedRender.container.querySelectorAll('select');
    expect((reloadedSelects[0] as HTMLSelectElement).value).toBe('');
    expect((reloadedSelects[1] as HTMLSelectElement).value).toBe('');

    fireEvent.change(reloadedRender.getByPlaceholderText('18+'), {
      target: { value: '35' },
    });
    fireEvent.change(reloadedRender.getByPlaceholderText('City, State'), {
      target: { value: 'Tampa, FL' },
    });
    fireEvent.click(reloadedRender.getByRole('button', { name: 'Coffee' }));
    fireEvent.click(
      reloadedRender.getByRole('button', { name: /Save Profile/i })
    );

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/profiles/me',
        expect.objectContaining({
          display_name: 'QA Tester',
          age: 35,
          location: 'Tampa, FL',
          interests: ['Coffee'],
        })
      );
    });

    expect(sessionStorage.length).toBe(0);
    reloadedRender.unmount();
  });
});
