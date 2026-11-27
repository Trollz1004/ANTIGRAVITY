import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../App';

const renderMock = vi.fn();

vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: renderMock }),
}));

describe('/creators is reachable', () => {
  beforeEach(() => {
    localStorage.clear();
    renderMock.mockClear();
    vi.resetModules();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('the home page footer has one link labelled "Creators: earn 50%" that goes to /creators', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );
    const links = Array.from(container.querySelectorAll('footer a')).filter(
      a => (a.textContent || '').trim() === 'Creators: earn 50%'
    );
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('/creators');
  });

  it('main.tsx registers a public /creators route that shows the page', async () => {
    window.history.replaceState({}, '', '/creators');
    await import('../main');
    expect(renderMock).toHaveBeenCalled();
    render(renderMock.mock.calls[0][0]);
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: /creators: earn 50%/i })
      ).toBeTruthy()
    );
  });
});
