import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { sum } from '../utils/format';
import { approveRequest, fetchIncomingRequests, fetchMyRequests, rejectRequest } from '../services/requestService';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const TradeContext = createContext(null);
const EMPTY_REQUESTS = [];

export function TradeProvider({ children }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const activeUserId = useRef(user?.id ?? null);
  const providersFetchId = useRef(0);
  const requestsFetchId = useRef(0);
  const incomingFetchId = useRef(0);
  activeUserId.current = user?.id ?? null;

  const [providerState, setProviderState] = useState({ userId: null, items: [], surplus: 0 });
  const providersBelongToUser = providerState.userId === (user?.id ?? null);
  const households = providersBelongToUser ? providerState.items : [];
  const surplus = providersBelongToUser ? providerState.surplus : 0;
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState(null);
  const visibleProvidersLoading = providersBelongToUser ? providersLoading : true;
  const visibleProvidersError = providersBelongToUser ? providersError : null;

  /** Read the same tradeable balance that the approval operation validates. */
  const refreshProviders = useCallback(async () => {
    const userId = user?.id;
    const fetchId = ++providersFetchId.current;
    if (!userId) {
      setProviderState({ userId: null, items: [], surplus: 0 });
      setProvidersLoading(false);
      setProvidersError(null);
      return;
    }

    setProviderState((previous) => previous.userId === userId
      ? previous
      : { userId, items: [], surplus: 0 });
    setProvidersLoading(true);
    setProvidersError(null);
    try {
      const { data, error } = await supabase.rpc('trade_available_providers');
      if (error) throw error;

      const providers = (data || []).map((provider) => {
        const available = Number(provider.available_kwh || 0);
        return {
          id: provider.id,
          name: provider.name,
          house: provider.household_id || 'House',
          dist: provider.distance_label || '—',
          kwh: Math.max(0, available),
          rate: Number(provider.rate_per_kwh ?? 0.22),
          soc: provider.battery_soc ?? 0,
          online: available > 0,
        };
      });

      if (activeUserId.current === userId && providersFetchId.current === fetchId) {
        setProviderState({
          userId,
          surplus: providers.find((provider) => provider.id === userId)?.kwh ?? 0,
          // Keep zero-surplus owners visible so the total represents all other
          // approved solar households, not just those currently able to share.
          items: providers.filter((provider) => provider.id !== userId),
        });
      }
    } catch (error) {
      console.error('[TradeContext] refreshProviders failed:', error?.message || error);
      if (activeUserId.current === userId && providersFetchId.current === fetchId) {
        setProvidersError(error?.message || t('trade.errors.loadAvailableEnergyFailed'));
      }
    } finally {
      if (activeUserId.current === userId && providersFetchId.current === fetchId) {
        setProvidersLoading(false);
      }
    }
  }, [user?.id, t]);

  useEffect(() => {
    refreshProviders();
  }, [refreshProviders]);

  const [requestState, setRequestState] = useState({ userId: null, items: EMPTY_REQUESTS });
  const requestsBelongToUser = requestState.userId === (user?.id ?? null);
  const requests = requestsBelongToUser ? requestState.items : EMPTY_REQUESTS;
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsRefreshing, setRequestsRefreshing] = useState(false);
  const [requestsError, setRequestsError] = useState(null);
  const visibleRequestsLoading = requestsBelongToUser ? requestsLoading : true;
  const visibleRequestsRefreshing = requestsBelongToUser ? requestsRefreshing : false;
  const visibleRequestsError = requestsBelongToUser ? requestsError : null;
  const [incomingState, setIncomingState] = useState({ userId: null, items: [] });
  const incomingBelongsToUser = incomingState.userId === (user?.id ?? null);
  const incoming = incomingBelongsToUser ? incomingState.items : [];
  const [incomingLoading, setIncomingLoading] = useState(true);
  const [incomingRefreshing, setIncomingRefreshing] = useState(false);
  const [incomingError, setIncomingError] = useState(null);
  const visibleIncomingLoading = incomingBelongsToUser ? incomingLoading : true;
  const visibleIncomingRefreshing = incomingBelongsToUser ? incomingRefreshing : false;
  const visibleIncomingError = incomingBelongsToUser ? incomingError : null;
  const [toast, setToast] = useState('');

  const showToast = useCallback((message, ms = 2400) => {
    setToast(message);
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(''), ms);
  }, []);

  const refreshRequests = useCallback(async ({ refresh = false } = {}) => {
    const userId = user?.id;
    const fetchId = ++requestsFetchId.current;
    if (!userId) {
      setRequestState({ userId: null, items: EMPTY_REQUESTS });
      setRequestsError(null);
      setRequestsLoading(false);
      setRequestsRefreshing(false);
      return { data: [], error: null };
    }

    setRequestState((previous) => previous.userId === userId
      ? previous
      : { userId, items: EMPTY_REQUESTS });
    if (refresh) setRequestsRefreshing(true);
    else setRequestsLoading(true);
    setRequestsError(null);

    try {
      const data = await fetchMyRequests(userId);
      if (activeUserId.current === userId && requestsFetchId.current === fetchId) {
        setRequestState({ userId, items: data });
      }
      return { data, error: null };
    } catch (error) {
      if (activeUserId.current === userId && requestsFetchId.current === fetchId) {
        setRequestsError(error?.message || t('trade.errors.loadMyRequestsFailed'));
      }
      return { data: null, error };
    } finally {
      if (activeUserId.current === userId && requestsFetchId.current === fetchId) {
        setRequestsLoading(false);
        setRequestsRefreshing(false);
      }
    }
  }, [user?.id, t]);

  useEffect(() => {
    setRequestState({ userId: user?.id ?? null, items: EMPTY_REQUESTS });
    setRequestsError(null);
    refreshRequests();
  }, [refreshRequests]);

  const refreshIncoming = useCallback(async ({ refresh = false } = {}) => {
    const userId = user?.id;
    const fetchId = ++incomingFetchId.current;
    if (!userId) {
      setIncomingState({ userId: null, items: [] });
      setIncomingError(null);
      setIncomingLoading(false);
      setIncomingRefreshing(false);
      return { data: [], error: null };
    }

    setIncomingState((previous) => previous.userId === userId
      ? previous
      : { userId, items: [] });
    if (refresh) setIncomingRefreshing(true);
    else setIncomingLoading(true);
    setIncomingError(null);

    try {
      const data = await fetchIncomingRequests(userId);
      if (activeUserId.current === userId && incomingFetchId.current === fetchId) {
        setIncomingState({ userId, items: data });
      }
      return { data, error: null };
    } catch (error) {
      if (activeUserId.current === userId && incomingFetchId.current === fetchId) {
        setIncomingError(error?.message || t('trade.errors.loadIncomingFailed'));
      }
      return { data: null, error };
    } finally {
      if (activeUserId.current === userId && incomingFetchId.current === fetchId) {
        setIncomingLoading(false);
        setIncomingRefreshing(false);
      }
    }
  }, [user?.id, t]);

  useEffect(() => {
    setIncomingState({ userId: user?.id ?? null, items: [] });
    setIncomingError(null);
    refreshIncoming();
  }, [refreshIncoming]);

  /**
   * Persists a new energy request to Supabase (SOL-105), then reloads the
   * requester's list so My Requests shows its authoritative status.
   */
  const submitRequest = useCallback(
    async (providerId, amountKwh) => {
      if (!user?.id) {
        return { data: null, error: new Error(t('trade.errors.signInRequired')) };
      }
      if (!Number.isFinite(amountKwh) || !(amountKwh > 0)) {
        return { data: null, error: new Error(t('trade.errors.invalidAmount')) };
      }

      const { data, error } = await supabase
        .from('energy_requests')
        .insert({
          requester_id: user.id,
          provider_id: providerId,
          amount_requested_kwh: amountKwh,
          status: 'PENDING',
        })
        .select()
        .single();

      if (error) return { data: null, error };

      await refreshRequests({ refresh: true });

      return { data, error: null };
    },
    [user?.id, refreshRequests, t],
  );

  const approveIncoming = useCallback(async (request) => {
    if (!request || request.status !== 'Pending') {
      return { data: null, error: new Error(t('trade.errors.requestNoLongerPending')) };
    }

    try {
      const transactionId = await approveRequest(request.id);
      await Promise.all([
        refreshIncoming({ refresh: true }),
        refreshRequests({ refresh: true }),
        refreshProviders(),
      ]);
      return { data: { id: transactionId }, error: null };
    } catch (error) {
      await Promise.all([refreshIncoming({ refresh: true }), refreshProviders()]);
      return { data: null, error };
    }
  }, [refreshIncoming, refreshRequests, refreshProviders, t]);

  const rejectIncoming = useCallback(async (request) => {
    if (!request || request.status !== 'Pending') {
      return { data: null, error: new Error(t('trade.errors.requestNoLongerPending')) };
    }

    try {
      await rejectRequest(request.id);
      await refreshIncoming({ refresh: true });
      return { data: true, error: null };
    } catch (error) {
      await refreshIncoming({ refresh: true });
      return { data: null, error };
    }
  }, [refreshIncoming, t]);

  const getHousehold = useCallback((id) => households.find((h) => h.id === id) || null, [households]);

  const getIncoming = useCallback((id) => incoming.find((i) => i.id === id) || null, [incoming]);


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

  const requestedIds = useMemo(
    () => Object.fromEntries(
      requests
        .filter((request) => request.status === 'Pending' || request.status === 'Approved')
        .map((request) => [request.providerId, true])
    ),
    [requests]
  );

  const pendingCount = useMemo(() => requests.filter((r) => r.status === 'Pending').length, [requests]);

  const incomingPendingCount = useMemo(
    () => incoming.filter((i) => i.status === 'Pending').length,
    [incoming]
  );

  const value = useMemo(
    () => ({
      households,
      providersLoading: visibleProvidersLoading,
      providersError: visibleProvidersError,
      refreshProviders,
      requests,
      requestsLoading: visibleRequestsLoading,
      requestsRefreshing: visibleRequestsRefreshing,
      requestsError: visibleRequestsError,
      refreshRequests,
      requestedIds,
      pendingCount,
      pool,
      incoming,
      incomingLoading: visibleIncomingLoading,
      incomingRefreshing: visibleIncomingRefreshing,
      incomingError: visibleIncomingError,
      refreshIncoming,
      incomingPendingCount,
      surplus,
      toast,
      showToast,
      submitRequest,
      approveIncoming,
      rejectIncoming,
      getHousehold,
      getIncoming,
    }),
    [
      households,
      visibleProvidersLoading,
      visibleProvidersError,
      refreshProviders,
      requests,
      visibleRequestsLoading,
      visibleRequestsRefreshing,
      visibleRequestsError,
      refreshRequests,
      requestedIds,
      pendingCount,
      pool,
      incoming,
      visibleIncomingLoading,
      visibleIncomingRefreshing,
      visibleIncomingError,
      refreshIncoming,
      incomingPendingCount,
      surplus,
      toast,
      showToast,
      submitRequest,
      approveIncoming,
      rejectIncoming,
      getHousehold,
      getIncoming,
    ]
  );

  return <TradeContext.Provider value={value}>{children}</TradeContext.Provider>;
}

export function useTrade() {
  const ctx = useContext(TradeContext);
  if (!ctx) throw new Error('useTrade must be used inside <TradeProvider>');
  return ctx;
}

export default TradeContext;
