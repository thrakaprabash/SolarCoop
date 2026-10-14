import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme } from './colors';

export const THEME_STORAGE_KEY = 'solarcoop_theme';
export const THEME_MODES = ['light', 'dark', 'system'];
export const ThemeContext = createContext({ ...getTheme('dark'), preference: 'dark', setPreference: () => {} });

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [preference, setMode] = useState('dark');
  const [ready, setReady] = useState(false);
  const changed = useRef(false);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then(saved => {
        if (mounted && !changed.current && THEME_MODES.includes(saved)) setMode(saved);
      })
      .catch(() => {})
      .finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);
  const setPreference = useCallback(mode => {
    if (!THEME_MODES.includes(mode)) return;
    changed.current = true;
    setMode(mode);
    // Serialize writes so rapid taps cannot persist an older choice last.
    writes.current = writes.current.then(() => AsyncStorage.setItem(THEME_STORAGE_KEY, mode)).catch(() => {});
  }, []);
  const mode = preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;
  const value = useMemo(() => ({ ...getTheme(mode), preference, setPreference, ready }), [mode, preference, setPreference, ready]);
  return <ThemeContext.Provider value={value}>{ready ? children : null}</ThemeContext.Provider>;
}
