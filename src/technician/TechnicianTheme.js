import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme } from '../theme/colors';
import { ThemeOverrideContext } from '../theme/ThemeOverrideContext';
import { useTechnician } from './context/TechnicianContext';
import { TECH_LIGHT, TECH_DARK, resolveTechMode, getUrgencyColor } from './theme';

const ThemeContext = createContext(null);
export function TechnicianThemeProvider({ children }) {
  const { technicianId } = useTechnician();
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState('system');
  const [ready, setReady] = useState(false);
  const writeQueue = useRef(Promise.resolve());
  const storageKey = `technician-appearance:${technicianId}`;
  useEffect(() => {
    let active = true;
    setPreference('system'); setReady(false);
    AsyncStorage.getItem(storageKey).then(value => {
      if (active && ['light', 'dark', 'system'].includes(value)) setPreference(value);
    }).catch(() => {}).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [storageKey]);
  const mode = resolveTechMode(preference, systemScheme);
  const TECH = mode === 'dark' ? TECH_DARK : TECH_LIGHT;
  const setMode = value => {
    if (!ready || !['light', 'dark', 'system'].includes(value)) return;
    setPreference(value);
    // Rapid choices are saved in order, so the last choice survives a reload.
    writeQueue.current = writeQueue.current.catch(() => {}).then(() => AsyncStorage.setItem(storageKey, value));
    writeQueue.current.catch(() => {});
  };
  const value = { TECH, mode, preference, setMode, ready, urgencyColor: urgency => getUrgencyColor(TECH, urgency) };
  const sharedTheme = useMemo(() => {
    const base = getTheme(mode);
    return { ...base, colors: { ...base.colors, background: TECH.bg, card: TECH.card, cardAlt: TECH.cardRaised,
      text: TECH.text, textSecondary: TECH.textSecondary, textMuted: TECH.textMuted, border: TECH.border,
      inputBg: TECH.card, inputBorder: TECH.borderStrong, inputBorderFocus: TECH.orange,
      track: TECH.cardRaised, primary: TECH.action, primarySoft: TECH.orangeSoft, danger: '#C13232' } };
  }, [mode, TECH]);
  return <ThemeContext.Provider value={value}><ThemeOverrideContext.Provider value={sharedTheme}>{children}</ThemeOverrideContext.Provider></ThemeContext.Provider>;
}
export const useTechnicianTheme = () => useContext(ThemeContext);
export function useTechStyles(factory) {
  const { TECH } = useTechnicianTheme();
  return useMemo(() => factory(TECH), [factory, TECH]);
}
