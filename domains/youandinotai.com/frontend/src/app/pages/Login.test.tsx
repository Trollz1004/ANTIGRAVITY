import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Login } from './Login';
import { useAuth } from '../../lib/auth';

describe('Login Google divider visibility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuth.setState({ user: null, loading: false });
  });

  it('hides "Or continue with" when no Google button is shown', () => {
    const { container, queryByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Login googleClientId="" />
      </MemoryRouter>
    );

    expect(container.querySelector('#google-signin-button')).toBeNull();
    expect(queryByText(/Or continue with/i)).toBeNull();
  });

  it('shows "Or continue with" when the Google button is shown', () => {
    const { container, getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Login googleClientId="test-google-client-id" />
      </MemoryRouter>
    );

    expect(container.querySelector('#google-signin-button')).not.toBeNull();
    expect(getByText(/Or continue with/i)).toBeDefined();
  });
});
