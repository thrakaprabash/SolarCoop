import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { HOUSEHOLDS } from '../data/households';
import { INITIAL_REQUESTS } from '../data/requests';
import { ENERGY, IMPACT } from '../data/energy';
import { sum, today } from '../utils/format';

const EnergyContext = createContext(null);

export function EnergyProvider({ children }) {
  const [households] = useState(HOUSEHOLDS);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [requestedIds, setRequestedIds] = useState({});
  const [toast, setToast] = useState('');

  const showToast = useCallback((message, ms = 2400) => {
    setToast(message);
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(''), ms);
  }, []);

  const submitRequest = useCallback(
    (provider, amount) => {
      const entry = {
        id: 'r' + Date.now(),
        name: provider.name,
        kwh: amount,
        rate: provider.rate,
        date: today(),
        status: 'Pending',
      };
      setRequests((prev) => [entry, ...prev]);
      setRequestedIds((prev) => ({ ...prev, [provider.id]: true }));
      return entry;
    },
    []
  );

  const getHousehold = useCallback(
    (id) => households.find((h) => h.id === id) || null,
    [households]
  );

  const pool = useMemo(() => {
    const online = households.filter((h) => h.online);
    return {
      online,
      total: sum(online.map((h) => h.kwh)),
      onlineCount: online.length,
      totalCount: households.length,
      avgRate: online.length ? sum(online.map((h) => h.rate)) / online.length : 0,
    };
  }, [households]);

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === 'Pending').length,
    [requests]
  );

  const value = useMemo(
    () => ({
      households,
      requests,
      requestedIds,
      pendingCount,
      pool,
      energy: ENERGY,
      impact: IMPACT,
      toast,
      showToast,
      submitRequest,
      getHousehold,
    }),
    [households, requests, requestedIds, pendingCount, pool, toast, showToast, submitRequest, getHousehold]
  );

  return <EnergyContext.Provider value={value}>{children}</EnergyContext.Provider>;
}

export function useEnergy() {
  const ctx = useContext(EnergyContext);
  if (!ctx) throw new Error('useEnergy must be used inside <EnergyProvider>');
  return ctx;
}

export default EnergyContext;
