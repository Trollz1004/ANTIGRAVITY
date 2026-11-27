import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';

import MeetupsDiscovery from './MeetupsDiscovery';
import { api } from '../lib/api';
import * as geolocation from '../lib/geolocation';

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('MeetupsDiscovery honest GPS controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(geolocation, 'isGeolocationSupported').mockReturnValue(true);
    vi.spyOn(geolocation, 'requestLocation').mockResolvedValue({
      lat: 28.5383,
      lng: -81.3792,
    });
    vi.mocked(api.get).mockResolvedValue([
      {
        id: 'evt-1',
        organizer_id: 'u-1',
        organizer_name: 'Maya',
        title: 'Coffee & Conversation',
        description: 'Saturday morning coffee meetup.',
        location: 'Orlando, FL',
        event_date: '2026-12-01T15:00:00Z',
        max_attendees: 12,
        attendee_count: 4,
        category: 'social',
        created_at: '2026-11-20T12:00:00Z',
      },
    ]);
  });

  it('does not render no-op 5/10/25-mile GPS radius buttons before or after enabling location', async () => {
    const { container, getByRole, getByText, queryByRole, queryByText } =
      render(<MeetupsDiscovery />);

    await waitFor(() => {
      expect(getByText('Coffee & Conversation')).toBeTruthy();
    });

    expect(queryByText(/Radius:/i)).toBeNull();
    expect(queryByRole('button', { name: /^5\s*mi$/i })).toBeNull();
    expect(queryByRole('button', { name: /^10\s*mi$/i })).toBeNull();
    expect(queryByRole('button', { name: /^25\s*mi$/i })).toBeNull();

    fireEvent.click(getByRole('button', { name: /Enable Location/i }));

    await waitFor(() => {
      expect(getByText(/Location active/i)).toBeTruthy();
    });

    expect(container.querySelector('#meetups-radius-5')).toBeNull();
    expect(container.querySelector('#meetups-radius-10')).toBeNull();
    expect(container.querySelector('#meetups-radius-25')).toBeNull();
    expect(queryByText(/Radius:/i)).toBeNull();
    expect(queryByRole('button', { name: /^5\s*mi$/i })).toBeNull();
    expect(queryByRole('button', { name: /^10\s*mi$/i })).toBeNull();
    expect(queryByRole('button', { name: /^25\s*mi$/i })).toBeNull();
  });
});
