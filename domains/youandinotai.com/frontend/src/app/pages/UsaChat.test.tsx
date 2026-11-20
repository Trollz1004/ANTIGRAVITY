import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UsaChat } from './UsaChat';
import { Discover } from './Discover';
import { AppShell } from '../AppShell';
import { api, ApiError } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  ApiError: class extends Error {
    constructor(
      public status: number,
      message: string
    ) {
      super(message);
    }
  },
}));

vi.mock('../../lib/safety', () => ({
  isSafetyToolsAvailable: vi.fn().mockResolvedValue(true),
}));

describe('UsaChat (/app/usa)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows lines oldest to newest with name and time and polls every 10 seconds only while visible', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(api.get).mockResolvedValue([
      {
        id: 'post-newer',
        board_slug: 'usa',
        author_id: 'u-2',
        author_name: 'Casey',
        title: 'Second message from Austin',
        body: 'Second message from Austin',
        like_count: 0,
        created_at: '2026-11-20T14:05:00Z',
      },
      {
        id: 'post-older',
        board_slug: 'usa',
        author_id: 'u-1',
        author_name: 'Morgan',
        title: 'First message from Seattle',
        body: 'First message from Seattle',
        like_count: 0,
        created_at: '2026-11-20T14:00:00Z',
      },
    ]);

    const { container } = render(
      <MemoryRouter initialEntries={['/app/usa']}>
        <UsaChat />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/boards/usa/posts?order=asc&limit=100'
      );
      expect(screen.getByText('First message from Seattle')).toBeTruthy();
      expect(screen.getByText('Second message from Austin')).toBeTruthy();
    });

    expect(screen.getByText('Morgan')).toBeTruthy();
    expect(screen.getByText('Casey')).toBeTruthy();

    const times = container.querySelectorAll('time');
    expect(times.length).toBe(2);
    expect(times[0].textContent?.trim().length).toBeGreaterThan(0);
    expect(times[1].textContent?.trim().length).toBeGreaterThan(0);

    const fullText = container.textContent || '';
    expect(fullText.indexOf('First message from Seattle')).toBeLessThan(
      fullText.indexOf('Second message from Austin')
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(api.get).toHaveBeenCalledTimes(2);

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('sending calls POST /boards/usa/posts with body = the text and title = its first 60 characters', async () => {
    const longMessage =
      'Good morning from Orlando! Looking forward to meeting verified members across the country today.';
    expect(longMessage.length).toBeGreaterThan(60);

    vi.mocked(api.get).mockResolvedValue([]);
    vi.mocked(api.post).mockResolvedValueOnce({
      id: 'post-new',
      board_slug: 'usa',
      author_id: 'u-1',
      author_name: 'Morgan',
      title: longMessage.slice(0, 60),
      body: longMessage,
      like_count: 0,
      created_at: '2026-11-20T15:00:00Z',
    });

    render(
      <MemoryRouter initialEntries={['/app/usa']}>
        <UsaChat />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('No one has written yet. Say hello.')
      ).toBeTruthy();
    });

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: longMessage } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/boards/usa/posts', {
        title: longMessage.slice(0, 60),
        body: longMessage,
      });
    });
  });

  it("shows 'No one has written yet. Say hello.' when the room is empty", async () => {
    vi.mocked(api.get).mockResolvedValueOnce([]);

    render(
      <MemoryRouter initialEntries={['/app/usa']}>
        <UsaChat />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('No one has written yet. Say hello.')
      ).toBeTruthy();
    });
  });

  it('shows one plain line and a link to /app/verify on 403', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(
      new ApiError(403, 'Verification required')
    );

    const { container } = render(
      <MemoryRouter initialEntries={['/app/usa']}>
        <UsaChat />
      </MemoryRouter>
    );

    await waitFor(() => {
      const verifyLink = screen.getByRole('link');
      expect(verifyLink.getAttribute('href')).toBe('/app/verify');
    });

    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs.length).toBe(1);
  });

  it('keeps the Report control on each post and posts to /boards/posts/:id/report', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([
      {
        id: 'post-42',
        board_slug: 'usa',
        author_id: 'u-9',
        author_name: 'Taylor',
        title: 'Hello everyone',
        body: 'Hello everyone',
        like_count: 0,
        created_at: '2026-11-20T14:10:00Z',
      },
    ]);
    vi.mocked(api.post).mockResolvedValueOnce({ status: 'queued' });

    render(
      <MemoryRouter initialEntries={['/app/usa']}>
        <UsaChat />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hello everyone')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /report/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/boards/posts/post-42/report',
        expect.objectContaining({
          reason: expect.any(String),
        })
      );
    });
  });

  it("offers 'Join the USA group chat' linking to /app/usa on the empty Discover screen and 'USA chat' in AppShell", async () => {
    vi.mocked(api.get).mockResolvedValueOnce([]);

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Discover />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('no one new is nearby yet.')).toBeTruthy();
    });

    const joinLink = screen.getByRole('link', {
      name: 'Join the USA group chat',
    });
    expect(joinLink.getAttribute('href')).toBe('/app/usa');

    render(
      <MemoryRouter initialEntries={['/app']}>
        <AppShell />
      </MemoryRouter>
    );

    const navLink = screen.getByRole('link', { name: 'USA chat' });
    expect(navLink.getAttribute('href')).toBe('/app/usa');
  });
});
