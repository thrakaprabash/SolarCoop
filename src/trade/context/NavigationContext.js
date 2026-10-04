import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

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

export const BACK_LABEL_KEYS = {
  request: 'trade.nav.requestEnergy',
  requests: 'trade.nav.myRequests',
  incoming: 'trade.nav.incomingRequests',
  approval: 'trade.nav.energyRequest',
  transaction: 'trade.nav.transactionDetails',
  history: 'trade.nav.transactionHistory',
  insights: 'trade.nav.smartEnergyInsights',
  impact: 'trade.nav.sustainabilityImpact',
  list: 'trade.nav.energySharing',
  trade: 'trade.nav.p2pTrade',
};

/** Transaction Details is reachable from two places, so its parent is contextual. */
function parentOf(screen, params) {
  if (screen === 'transaction') {
    if (params.source === 'history') return 'history';
    if (params.source === 'requests') return 'requests';
    return 'incoming';
  }
  return PARENT[screen] || null;
}

const NavigationContext = createContext(null);

export function NavigationProvider({ children, initialScreen = 'list' }) {
  const { t } = useTranslation();
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
      backLabel: t(BACK_LABEL_KEYS[screen] || BACK_LABEL_KEYS.list),
    }),
    [screen, params, navigate, goBack, t]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used inside <NavigationProvider>');
  return ctx;
}

export default NavigationContext;
