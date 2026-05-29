import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { fetchProfile, createProfile } from '../lib/api';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: { id: string; username: string; avatar_url: string } | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  initialize: () => Promise<void>;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  loading: false,
  error: null,
  initialized: false,

  initialize: async () => {
    set({ loading: true });

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        set({
          user: session.user,
          session,
          profile,
          initialized: true,
          loading: false,
        });
      } else {
        set({ initialized: true, loading: false });
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          let profile = await fetchProfile(session.user.id);
          if (!profile && (event as string) === 'SIGNED_UP') {
            profile = await createProfile(session.user.id);
          }
          set({ user: session.user, session, profile });
        } else {
          set({ user: null, session: null, profile: null });
        }
      });
    } catch (e) {
      console.warn('Supabase initialization failed, running in local/fallback mode:', e);
      set({ initialized: true, loading: false });
    }
  },

  signUp: async (email, password, username) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }

    if (data.user) {
      const profile = await createProfile(data.user.id, username);
      set({ user: data.user, session: data.session, profile, loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }

    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      set({ user: data.user, session: data.session, profile, loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, loading: false });
  },

  clearError: () => set({ error: null }),
}));
