import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Lightweight screen router for the module. Screens:
 * trade | list | request | requests | insights
 */
const PARENT = { request: 'list', requests: 'list', list: 'trade' };

export const BACK_LABELS = {
  request: 'Request Energy',
  requests: 'My Requests',
  insights: 'Smart Energy Insights',
  list: 'Energy Sharing',
  trade: 'P2P Trade',
};

const NavigationContext = createContext(null);

export function NavigationProvider({ children, initialScreen = 'list' }) {
  const [screen, setScreen] = useState(initialScreen);
  const [params, setParams] = useState({});

  const navigate = useCallback((next, nextParams = {}) => {
    setScreen(next);
    setParams(nextParams);
  }, []);

  const goBack = useCallback(() => {
    setScreen((cur) => PARENT[cur] || cur);
    setParams({});
  }, []);

  const value = useMemo(
    () => ({
      screen,
      params,
      navigate,
      goBack,
      canGoBack: !!PARENT[screen],
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
