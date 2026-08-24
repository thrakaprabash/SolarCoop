import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Lightweight screen router for the module. Screens:
 * trade | list | request | requests | incoming | approval | transaction | history | insights
 */
const PARENT = {
  request: 'list',
  requests: 'list',
  incoming: 'list',
  history: 'list',
  approval: 'incoming',
};

export const BACK_LABELS = {
  request: 'Request Energy',
  requests: 'My Requests',
  incoming: 'Incoming Requests',
  approval: 'Energy Request',
  transaction: 'Transaction Details',
  history: 'Transaction History',
  insights: 'Smart Energy Insights',
  impact: 'Sustainability Impact',
  list: 'Energy Sharing',
  trade: 'P2P Trade',
};

/** Transaction Details is reachable from two places, so its parent is contextual. */
function parentOf(screen, params) {
  if (screen === 'transaction') return params.source === 'history' ? 'history' : 'incoming';
  return PARENT[screen] || null;
}

const NavigationContext = createContext(null);

export function NavigationProvider({ children, initialScreen = 'list' }) {
  const [screen, setScreen] = useState(initialScreen);
  const [params, setParams] = useState({});

  const navigate = useCallback((next, nextParams = {}) => {
    setScreen(next);
    setParams(nextParams);
  }, []);

  const goBack = useCallback(() => {
    const to = parentOf(screen, params);
    if (!to) return;
    setScreen(to);
    setParams({});
  }, [screen, params]);

  const value = useMemo(
    () => ({
      screen,
      params,
      navigate,
      goBack,
      canGoBack: !!parentOf(screen, params),
      backLabel: BACK_LABELS[screen] || BACK_LABELS.list,
    }),
    [screen, params, navigate, goBack]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used inside <NavigationProvider>');
  return ctx;
}

export default NavigationContext;
