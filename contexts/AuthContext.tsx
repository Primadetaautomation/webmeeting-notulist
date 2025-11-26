/**
 * Authentication Context for Vergader Notulist AI
 *
 * Provides centralized authentication state management using Supabase.
 * Handles user sessions, OAuth flows, and email/password authentication.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, signInWithGoogle, signOut, loading } = useAuth();
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (!user) return <LoginButton onClick={signInWithGoogle} />;
 *   return <div>Welcome {user.email}</div>;
 * }
 * ```
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode
} from 'react';
import type {
  User as SupabaseUser,
  Session,
  AuthError as SupabaseAuthError
} from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { AuthError, type User } from '../types/database';

// ============================================================================
// Types
// ============================================================================

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// ============================================================================
// Context Creation
// ============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  /**
   * Handles Supabase auth errors and converts them to user-friendly messages
   */
  const handleAuthError = useCallback((error: SupabaseAuthError | Error): never => {
    console.error('[AuthContext] Authentication error:', error);

    // Map Supabase error codes to user-friendly messages
    const errorMessage =
      'message' in error
        ? error.message
        : 'Er is een onbekende fout opgetreden bij authenticatie';

    const errorCode = 'code' in error ? (error as SupabaseAuthError).code : undefined;

    throw new AuthError(errorMessage, errorCode, error);
  }, []);

  /**
   * Initialize auth state from stored session
   */
  const initializeAuth = useCallback(async () => {
    if (!supabase) {
      console.warn('[AuthContext] Supabase niet geconfigureerd. Auth uitgeschakeld.');
      setInitialized(true);
      return;
    }

    try {
      // Get current session from Supabase
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[AuthContext] Failed to get session:', error);
        return;
      }

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user as User);
      }
    } catch (error) {
      console.error('[AuthContext] Initialize error:', error);
    } finally {
      setInitialized(true);
    }
  }, []);

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      throw new AuthError('Supabase niet geconfigureerd');
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        handleAuthError(error);
      }

      // Note: The actual sign-in happens via redirect, so we don't update state here
      // The onAuthStateChange listener will handle the state update
    } catch (error) {
      throw error instanceof AuthError
        ? error
        : new AuthError('Google inloggen mislukt', undefined, error);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  /**
   * Sign in with email and password
   */
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        throw new AuthError('Supabase niet geconfigureerd');
      }

      // Input validation (E-5: Fail fast)
      if (!email || !password) {
        throw new AuthError('Email en wachtwoord zijn verplicht');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AuthError('Ongeldig email adres');
      }

      setLoading(true);

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          handleAuthError(error);
        }

        if (data.user) {
          setUser(data.user as User);
          setSession(data.session);
        }
      } catch (error) {
        throw error instanceof AuthError
          ? error
          : new AuthError('Inloggen mislukt', undefined, error);
      } finally {
        setLoading(false);
      }
    },
    [handleAuthError]
  );

  /**
   * Sign up with email and password
   */
  const signUpWithEmail = useCallback(
    async (email: string, password: string, fullName?: string) => {
      if (!supabase) {
        throw new AuthError('Supabase niet geconfigureerd');
      }

      // Input validation (E-5: Fail fast)
      if (!email || !password) {
        throw new AuthError('Email en wachtwoord zijn verplicht');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AuthError('Ongeldig email adres');
      }

      if (password.length < 8) {
        throw new AuthError('Wachtwoord moet minimaal 8 tekens bevatten');
      }

      setLoading(true);

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || null
            }
          }
        });

        if (error) {
          handleAuthError(error);
        }

        if (data.user) {
          // Check if email confirmation is required
          if (data.user.confirmed_at) {
            setUser(data.user as User);
            setSession(data.session);
          } else {
            // User needs to confirm email
            console.log('[AuthContext] Email confirmation required');
          }
        }
      } catch (error) {
        throw error instanceof AuthError
          ? error
          : new AuthError('Registratie mislukt', undefined, error);
      } finally {
        setLoading(false);
      }
    },
    [handleAuthError]
  );

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async () => {
    if (!supabase) {
      throw new AuthError('Supabase niet geconfigureerd');
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        handleAuthError(error);
      }

      // Clear state
      setUser(null);
      setSession(null);
    } catch (error) {
      throw error instanceof AuthError
        ? error
        : new AuthError('Uitloggen mislukt', undefined, error);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  /**
   * Manually refresh the session
   */
  const refreshSession = useCallback(async () => {
    if (!supabase) {
      return;
    }

    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('[AuthContext] Failed to refresh session:', error);
        return;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user as User);
      }
    } catch (error) {
      console.error('[AuthContext] Refresh session error:', error);
    }
  }, []);

  /**
   * Set up auth state change listener
   */
  useEffect(() => {
    if (!supabase) {
      return;
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('[AuthContext] Auth state changed:', event);

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user as User);
        } else {
          setSession(null);
          setUser(null);
        }

        // Handle specific events
        switch (event) {
          case 'SIGNED_IN':
            console.log('[AuthContext] User signed in');
            break;
          case 'SIGNED_OUT':
            console.log('[AuthContext] User signed out');
            break;
          case 'TOKEN_REFRESHED':
            console.log('[AuthContext] Token refreshed');
            break;
          case 'USER_UPDATED':
            console.log('[AuthContext] User updated');
            break;
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Initialize auth on mount
   */
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /**
   * Memoized context value to prevent unnecessary re-renders
   */
  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      initialized,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      refreshSession
    }),
    [
      user,
      session,
      loading,
      initialized,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      refreshSession
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook to access auth context
 *
 * @throws {Error} If used outside of AuthProvider
 *
 * @example
 * ```tsx
 * function ProfilePage() {
 *   const { user, signOut } = useAuth();
 *
 *   return (
 *     <div>
 *       <p>Logged in as: {user?.email}</p>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
