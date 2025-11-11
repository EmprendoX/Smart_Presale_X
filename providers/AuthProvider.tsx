"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Provider as OAuthProvider, Session } from '@supabase/supabase-js';
import {
  AppUser,
  getSupabaseBrowserClient,
  mapSupabaseUser,
  signInWithOAuth as supabaseSignInWithOAuth,
  signInWithOtp as supabaseSignInWithOtp,
  signOut as supabaseSignOut
} from '@/lib/auth/supabase';

type AuthContextValue = {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  signInWithOtp: (email: string, options?: { redirectTo?: string; shouldCreateUser?: boolean }) => Promise<void>;
  signInWithOAuth: (
    provider: OAuthProvider,
    options?: {
      redirectTo?: string;
      scopes?: string;
    }
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const client = getSupabaseBrowserClient();

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const [{ data, error }, userResult] = await Promise.all([
          client.auth.getSession(),
          client.auth.getUser()
        ]);

        if (!isMounted) return;

        if (error) {
          console.error('[AuthProvider] Error fetching session:', error.message);
          setSession(null);
          setUser(null);
        } else {
          setSession(data.session ?? null);
          if (userResult.error) {
            console.error('[AuthProvider] Error fetching user:', userResult.error.message);
            setUser(mapSupabaseUser(data.session?.user ?? null));
          } else {
            setUser(mapSupabaseUser(userResult.data.user ?? null));
          }
        }
      } catch (error) {
        console.error('[AuthProvider] Unexpected session error:', error);
        if (!isMounted) return;
        setSession(null);
        setUser(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSession();

    const {
      data: { subscription }
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession ?? null);
      setUser(mapSupabaseUser(nextSession?.user ?? null));
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      signInWithOtp: async (email, options) => {
        await supabaseSignInWithOtp(email, options);
      },
      signInWithOAuth: async (provider, options) => {
        await supabaseSignInWithOAuth(provider, options);
      },
      signOut: async () => {
        await supabaseSignOut();
        setUser(null);
        setSession(null);
      },
      refreshSession: async () => {
        const [{ data, error }, userResult] = await Promise.all([
          client.auth.getSession(),
          client.auth.getUser()
        ]);

        if (error) {
          console.error('[AuthProvider] Error refreshing session:', error.message);
          return;
        }

        setSession(data.session ?? null);
        if (userResult.error) {
          console.error('[AuthProvider] Error refreshing user:', userResult.error.message);
          setUser(mapSupabaseUser(data.session?.user ?? null));
        } else {
          setUser(mapSupabaseUser(userResult.data.user ?? null));
        }
      }
    }),
    [client, loading, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
