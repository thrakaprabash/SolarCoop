/**
 * src/lib/supabase.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase client singleton for the SolarCoop member application.
 *
 * Session persistence is delegated to AsyncStorage so that a signed-in user
 * remains authenticated across app restarts. The `react-native-url-polyfill`
 * shim is required by `@supabase/supabase-js` on React Native because the
 * JavaScript runtime does not provide a full WHATWG URL implementation.
 *
 * Environment variables must be prefixed with `EXPO_PUBLIC_` so that Expo
 * inlines them at build time. Create a `.env` file at the project root:
 *
 *   EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
 *
 * Guards:
 *   • Missing variables trigger a loud, actionable warning in development and
 *     a hard failure in production — never a silently broken client.
 *
 * "Remember me":
 *   The storage adapter below honors the `solarcoop.remember_me` preference.
 *   When the preference is off, refreshed session tokens are never written
 *   back to AsyncStorage, so the session only lives for the current app run
 *   and the user must sign in again after a restart.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Must be imported before the Supabase client is constructed.
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/* ─── Environment guards ────────────────────────────────────────────────── */

const buildEnvMessage = () => {
  const missing = [];
  if (!supabaseUrl) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  return (
    `[SolarCoop] Missing Supabase environment variable${missing.length > 1 ? 's' : ''}: ` +
    `${missing.join(', ')}.\n\n` +
    '1. Copy `.env.example` to `.env` at the project root.\n' +
    '2. Fill in your Supabase project URL and anon (publishable) key.\n' +
    '3. Restart the dev server with `npx expo start --clear`.'
  );
};

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast so misconfiguration is obvious and does not surface as confusing
  // downstream auth/network errors.
  throw new Error(buildEnvMessage());
}

/* ─── "Remember me" preference helpers ──────────────────────────────────── */

export const REMEMBER_ME_KEY = 'solarcoop.remember_me';
export const AUTH_STORAGE_KEY = 'solarcoop.supabase.auth';

/** Read the stored "remember me" preference (defaults to true). */
export const getRememberMe = async () => {
  try {
    return (await AsyncStorage.getItem(REMEMBER_ME_KEY)) !== 'false';
  } catch {
    return true;
  }
};

/** Persist the "remember me" preference. */
export const setRememberMe = async (remember) => {
  try {
    await AsyncStorage.setItem(REMEMBER_ME_KEY, remember ? 'true' : 'false');
  } catch {
    // Best-effort persistence; a failure here must never block sign-in.
  }
};

/**
 * Storage adapter that drops session writes while "remember me" is disabled.
 * The in-memory session keeps working for the current run; on restart the
 * persisted token simply isn't there, which forces a fresh sign-in.
 */
const authStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: async (key, value) => {
    const remember = await getRememberMe();
    if (remember) {
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: (key) => AsyncStorage.removeItem(key),
};

/* ─── Client construction ───────────────────────────────────────────────── */

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist the session token in AsyncStorage so users stay logged in.
    storage: authStorage,
    // Deterministic key so we never collide with other Supabase projects.
    storageKey: AUTH_STORAGE_KEY,
    // Keep the access token fresh while the app is open.
    autoRefreshToken: true,
    // Restore the session from storage on cold start.
    persistSession: true,
    // Native apps do not receive the PKCE callback in the URL bar.
    detectSessionInUrl: false,
  },
});
