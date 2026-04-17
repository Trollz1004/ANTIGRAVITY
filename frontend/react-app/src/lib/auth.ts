/**
 * Auth state management using Zustand.
 */

import { create } from 'zustand';
import { api } from './api';

interface User {
  user_id: string;
  email: string;
  display_name: string;
  bot_shield_verified: boolean;
  subscription_tier: string | null;
  subscription_active: boolean;
  subscription_expires_at?: string | null;
  has_profile: boolean;
  adult_verified: boolean;
}

interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  dateOfBirth: string;
  acceptedTerms: boolean;
  acceptedCookiePolicy: boolean;
  confirmedOver18: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  betaAccess: (code: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuth = create<AuthState>(set => ({
  user: null,
  loading: true,

  login: async (email, password) => {
    const data = await api.post<{
      access_token: string;
      refresh_token: string;
      user_id: string;
    }>('/auth/login', { email, password });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    const user = await api.get<User>('/auth/me');
    set({ user });
  },

  googleLogin: async idToken => {
    const data = await api.post<{
      access_token: string;
      refresh_token: string;
      user_id: string;
    }>('/auth/google', { id_token: idToken });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    const user = await api.get<User>('/auth/me');
    set({ user });
  },

  betaAccess: async code => {
    const data = await api.post<{
      access_token: string;
      refresh_token: string;
      user_id: string;
    }>('/auth/beta-access', { code });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.removeItem('beta_access_code');
    const user = await api.get<User>('/auth/me');
    set({ user, loading: false });
  },

  register: async ({
    email,
    password,
    displayName,
    dateOfBirth,
    acceptedTerms,
    acceptedCookiePolicy,
    confirmedOver18,
  }) => {
    const data = await api.post<{
      access_token: string;
      refresh_token: string;
      user_id: string;
    }>('/auth/register', {
      email,
      password,
      display_name: displayName,
      date_of_birth: dateOfBirth,
      accepted_terms: acceptedTerms,
      accepted_cookie_policy: acceptedCookiePolicy,
      confirmed_over_18: confirmedOver18,
    });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    const user = await api.get<User>('/auth/me');
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('beta_access_code');
    set({ user: null });
  },

  fetchUser: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ user: null, loading: false });
      return;
    }
    try {
      const user = await api.get<User>('/auth/me');
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
}));
