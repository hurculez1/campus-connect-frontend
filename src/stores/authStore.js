import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';
import { DEMO_USER } from '../utils/demoData';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      mode: 'dating', // 'dating' or 'study'

      toggleMode: () => {
        const newMode = get().mode === 'dating' ? 'study' : 'dating';
        set({ mode: newMode });
        return newMode;
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, user } = response.data;

          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return true;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false
          });
          return false;
        }
      },

      setAdminSession: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true, isLoading: false });
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', userData);
          const { token, user } = response.data;

          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return true;
        } catch (error) {
          const errData = error.response?.data;
          const errorMsg = errData?.errors
            ? errData.errors.map(e => e.msg).join(', ')
            : errData?.message || 'Registration failed';

          set({
            error: errorMsg,
            isLoading: false
          });
          return false;
        }
      },

      googleLogin: async (googleToken, additionalData = {}) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/google', { googleToken, ...additionalData });
          
          if (response.data.requireMoreData) {
            set({ isLoading: false });
            return { success: true, requireMoreData: true, pendingData: response.data.pendingData };
          }
          
          const { token, user } = response.data;
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return { success: true, isNewUser: response.data.isNewUser };
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Google login failed',
            isLoading: false
          });
          return { success: false };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      updateUser: (updates) => {
        set((state) => ({
          user: { ...state.user, ...updates }
        }));
      },

      clearError: () => set({ error: null }),

      demoLogin: () => {
        const mockToken = 'demo-token-campus-connect-2026';
        localStorage.setItem('token', mockToken);
        set({ user: DEMO_USER, token: mockToken, isAuthenticated: true, error: null, isLoading: false });
      },

      // Called once on app load — refreshes admin flags from DB in case they changed
      refreshUser: async () => {
        try {
          const token = get().token;
          if (!token || token === 'demo-token-campus-connect-2026') return;
          const response = await api.get('/auth/me');
          const freshUser = response.data.user;
          // Normalize profile_photo_url
          if (freshUser.profilePhotoUrl && !freshUser.profile_photo_url) {
            freshUser.profile_photo_url = freshUser.profilePhotoUrl;
            delete freshUser.profilePhotoUrl;
          }
          set((state) => ({
            user: { ...state.user, ...freshUser }
          }));
        } catch {
          // silently fail — user stays logged in with cached data
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);