/**
 * src/context/AuthContext.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Global authentication state for the SolarCoop member application.
 *
 * Exposes:
 *   • `session`  — the active Supabase session (`null` when signed out). The
 *                  app gate routes on the SESSION, not just `user`, so an
 *                  unconfirmed sign-up (email verification enabled) stays on
 *                  the auth stack until a real session exists.
 *   • `user`     — the active Supabase auth user (`null` when signed out).
 *   • `profile`  — the matching `public.profiles` row (fetched from the
 *                  database, not from metadata, so admin role/status changes
 *                  always show up in the UI).
 *   • `loading`  — true while restoring the session or during an auth action.
 *
 *   • `signUp({ email, password, name, role, mobileNumber, solarCapacity })`
 *       Registration status mapping (SOL-90 / SOL-95):
 *         consumer    → status 'active'  (immediate full access)
 *         technician  → status 'active'  (immediate full access)
 *         owner       → status 'pending_approval' (unlocks after Admin OK)
 *       The mapped status is written into the raw user metadata (so the
 *       `auth.users → public.profiles` database trigger persists it, even
 *       when email confirmation prevents an immediate session) and then
 *       re-applied directly to the `profiles` row as a belt-and-suspenders
 *       when a session is available.
 *   • `signIn(email, password)`
 *   • `resetPasswordForEmail(email)` — Supabase password recovery workflow.
 *   • `signOut()` — clears the Supabase session AND the AsyncStorage token.
 *   • `refreshProfile()`
 *   • `adminUpdateProfileStatus(userId, status)` — used by the Admin member
 *     management dashboard to approve / block members.
 *   • `fetchAllProfiles()` — member directory for the Admin dashboard.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

/**
 * Registration → profile status mapping (SOL-90 / SOL-95).
 * Consumers & technicians are trusted immediately; solar owners must be
 * validated by an admin before sharing/trading features unlock.
 */
export const STATUS_BY_ROLE = {
  consumer: 'active',
  technician: 'active',
  owner: 'pending_approval',
  admin: 'active',
};

/** Resolve the initial profile status for a given role. */
export const resolveRegistrationStatus = (role) =>
  STATUS_BY_ROLE[role] || 'pending_approval';

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load the `public.profiles` row for the given user id.
   * Returns the row, or `null` when there is no user / no row.
   */
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      // A missing/misconfigured profiles table should not crash the auth
      // flow, but we surface the failure so callers can handle it.
      console.error('[AuthContext] Failed to load profile:', error.message);
      throw error;
    }

    setProfile(data);
    return data;
  }, []);

  /**
   * Best-effort direct write of the registration status onto the
   * `public.profiles` row. The metadata path (database trigger) is the
   * primary sync; this covers setups where the trigger does not copy
   * `status`. RLS may block the write — that is fine and non-fatal.
   */
  const enforceProfileStatus = useCallback(async (userId, role) => {
    const status = resolveRegistrationStatus(role);
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId);

    if (error) {
      console.warn(
        '[AuthContext] Could not enforce registration status directly ' +
          `(falling back to metadata/trigger): ${error.message}`,
      );
    }
  }, []);

  /**
   * Register a new member.
   *
   * `options.data` becomes `raw_user_meta_data` on `auth.users`, which the
   * `public.profiles` trigger reads: name, role, mobile_number,
   * solar_capacity_kw and the role-mapped status. Solar capacity is only
   * meaningful for solar owners, so it is stored as a number for owners and
   * `null` otherwise.
   */
  const signUp = useCallback(
    async ({ email, password, name, role, mobileNumber, solarCapacity }) => {
      setLoading(true);
      try {
        const status = resolveRegistrationStatus(role);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role,
              mobile_number: mobileNumber || null,
              solar_capacity_kw:
                role === 'owner' && solarCapacity != null
                  ? Number(solarCapacity)
                  : null,
              status,
            },
          },
        });

        if (error) throw error;

        // Supabase may return a user without a session when email
        // confirmation is enabled — that is still a successful sign-up.
        if (data?.user) {
          // Enforce the role-mapped status on the profiles row when possible.
          await enforceProfileStatus(data.user.id, role).catch(() => {});
        }

        if (data?.session) {
          setSession(data.session);
          setUser(data.user);
          await fetchProfile(data.user.id).catch(() => {});
        } else if (data?.user) {
          setUser(data.user);
        }

        return data;
      } finally {
        setLoading(false);
      }
    },
    [enforceProfileStatus, fetchProfile],
  );

  /**
   * Authenticate an existing member with email + password.
   */
  const signIn = useCallback(
    async (email, password) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setSession(data.session);
        setUser(data.user);
        await fetchProfile(data.user.id).catch(() => {});

        return data;
      } finally {
        setLoading(false);
      }
    },
    [fetchProfile],
  );

  /**
   * Trigger Supabase's password recovery workflow for `email`.
   * The user receives a reset link; the app UI shows a success state.
   */
  const resetPasswordForEmail = useCallback(async (email) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * End the active session and reset local auth state.
   * `supabase.auth.signOut()` also removes the persisted token from
   * AsyncStorage via the client's storage adapter.
   */
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  }, []);

  /**
   * Admin: update a member's profile status (e.g. approve a pending solar
   * owner → 'active', or block a member → 'blocked').
   * Requires an RLS policy that allows admins to update profiles.
   */
  const adminUpdateProfileStatus = useCallback(async (userId, status) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, []);

  /**
   * Admin: fetch the full member directory for the management dashboard.
   * Requires an RLS policy that allows admins to select profiles.
   */
  const fetchAllProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }, []);

  /**
   * Restore the persisted session and subscribe to auth changes.
   */
  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!active) return;

      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        fetchProfile(initialSession.user.id).catch(() => {
          // A missing/misconfigured profiles table should not hard-crash the
          // provider; the UI can handle a null profile.
        });
      }
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, changedSession) => {
        if (!active) return;

        setSession(changedSession);
        setUser(changedSession?.user ?? null);

        if (event === 'SIGNED_IN' && changedSession?.user) {
          fetchProfile(changedSession.user.id).catch(() => {});
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      },
    );

    return () => {
      active = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      resetPasswordForEmail,
      refreshProfile: () =>
        user ? fetchProfile(user.id) : Promise.resolve(null),
      adminUpdateProfileStatus,
      fetchAllProfiles,
    }),
    [
      session,
      user,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      resetPasswordForEmail,
      fetchProfile,
      adminUpdateProfileStatus,
      fetchAllProfiles,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
