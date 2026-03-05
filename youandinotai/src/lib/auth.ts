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
  has_profile: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
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

  register: async (email, password, displayName) => {
    const data = await api.post<{
      access_token: string;
      refresh_token: string;
      user_id: string;
    }>('/auth/register', { email, password, display_name: displayName });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    const user = await api.get<User>('/auth/me');
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
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
