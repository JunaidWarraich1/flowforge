import { create } from 'zustand';
import { User, LoginPayload, RegisterPayload } from '../types';
import { authApi } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const formatError = (err: any, fallback: string): string => {
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
  }
  return err.message || fallback;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('flowforge_token'),
  isAuthenticated: !!localStorage.getItem('flowforge_token'),
  isLoading: false,
  error: null,

  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      const tokenRes = await authApi.login(payload);
      localStorage.setItem('flowforge_token', tokenRes.access_token);
      if (tokenRes.refresh_token) {
        localStorage.setItem('flowforge_refresh_token', tokenRes.refresh_token);
      }
      const user = await authApi.getMe();
      set({
        token: tokenRes.access_token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      const msg = formatError(err, 'Authentication failed. Please check your credentials.');
      set({ error: msg, isLoading: false, isAuthenticated: false });
      throw err;
    }
  },

  register: async (payload: RegisterPayload) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.register(payload);
      // Automatically log in after registration
      const tokenRes = await authApi.login({
        email: payload.email,
        password: payload.password,
      });
      localStorage.setItem('flowforge_token', tokenRes.access_token);
      if (tokenRes.refresh_token) {
        localStorage.setItem('flowforge_refresh_token', tokenRes.refresh_token);
      }
      const user = await authApi.getMe();
      set({
        token: tokenRes.access_token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      const msg = formatError(err, 'Registration failed. Please check your information.');
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('flowforge_token');
    localStorage.removeItem('flowforge_refresh_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('flowforge_token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    set({ isLoading: true });
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      localStorage.removeItem('flowforge_token');
      localStorage.removeItem('flowforge_refresh_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
