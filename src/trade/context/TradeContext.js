import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { INITIAL_REQUESTS } from '../data/requests';
import { INCOMING_REQUESTS } from '../data/incoming';
import { TRANSACTIONS, TXN_SEQ_START } from '../data/transactions';
import { ENERGY, IMPACT } from '../data/energy';
import { sum, today, txnRef } from '../utils/format';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const INITIAL_SURPLUS = +(ENERGY.todayProduction - ENERGY.todayConsumption).toFixed(1);

const TradeContext = createContext(null);

export function TradeProvider({ children }) {
  const { user } = useAuth();

  const [households, setHouseholds] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState(null);

  /**
   * Loads today's available-energy providers: active solar owners with a
   * positive surplus today. Two queries (profiles, then their energy_records)
   * because Postgres RLS + PostgREST embeds get fragile with computed
   * columns across two tables — a plain JS join keeps this easy to reason
   * about, matching the "no overengineering" prototype boundary (SOL-104).
   */
  const refreshProviders = useCallback(async () => {
    setProvidersLoading(true);
    setProvidersError(null);
    try {
      const { data: owners, error: ownersError } = await supabase
        .from('profiles')
        .select('id, name, household_id, rate_per_kwh, battery_soc, distance_label')
        .eq('role', 'owner')
        .eq('status', 'active');

      if (ownersError) throw ownersError;
      if (!owners?.length) {
        setHouseholds([]);
        return;
      }

      const todayDate = new Date().toISOString().slice(0, 10);
      const ownerIds = owners.map((o) => o.id);

      const { data: records, error: recordsError } = await supabase
        .from('energy_records')
        .select('user_id, production, consumption')
        .eq('record_date', todayDate)
        .in('user_id', ownerIds);

      if (recordsError) throw recordsError;

      const recordByUser = new Map((records || []).map((r) => [r.user_id, r]));

      const providers = owners
        .map((owner) => {
          const record = recordByUser.get(owner.id);
          if (!record) return null;
          const surplus = Math.max(record.production - record.consumption, 0);
          if (surplus <= 0) return null;
          return {
            id: owner.id,
            name: owner.name,
            house: owner.household_id || 'House',
            dist: owner.distance_label || '—',
            kwh: +surplus.toFixed(1),
            rate: owner.rate_per_kwh ?? 0.22,
            soc: owner.battery_soc ?? 0,
            online: true,
          };
        })
        .filter(Boolean);

      setHouseholds(providers);
    } catch (error) {
      console.error('[TradeContext] refreshProviders failed:', error?.message || error);
      setProvidersError(error?.message || 'Failed to load available energy.');
    } finally {
      setProvidersLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProviders();
  }, [refreshProviders]);

  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [requestedIds, setRequestedIds] = useState({});
  const [incoming, setIncoming] = useState(INCOMING_REQUESTS);
  const [transactions, setTransactions] = useState(TRANSACTIONS);
  const [surplus, setSurplus] = useState(INITIAL_SURPLUS);
  const [txnSeq, setTxnSeq] = useState(TXN_SEQ_START);
  const [toast, setToast] = useState('');

  const showToast = useCallback((message, ms = 2400) => {
    setToast(message);
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(''), ms);
  }, []);

  const submitRequest = useCallback((provider, amount) => {
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
  }, []);

  /**
   * Approves an incoming request: writes a ledger entry, debits the surplus and
   * marks the request Completed. Surplus is re-checked here, not only on render,
   * so a stale screen cannot overdraw. Returns the transaction, or null.
   */
  const approveIncoming = useCallback(
    (request) => {
      if (!request || request.status !== 'Pending') return null;
      if (request.kwh > surplus) {
        showToast('Surplus changed — request can no longer be approved');
        return null;
      }

      const now = new Date();
      const after = +(surplus - request.kwh).toFixed(1);
      const entry = {
        id: 'x' + Date.now(),
        ref: txnRef(now, txnSeq),
        dir: 'sent',
        party: request.name,
        kwh: request.kwh,
        ts: now.toISOString(),
        before: surplus,
        after,
      };

      setTransactions((prev) => [entry, ...prev]);
      setSurplus(after);
      setTxnSeq((n) => n + 1);
      setIncoming((prev) => prev.map((i) => (i.id === request.id ? { ...i, status: 'Completed' } : i)));
      return entry;
    },
    [surplus, txnSeq, showToast]
  );

  const rejectIncoming = useCallback((request) => {
    if (!request || request.status !== 'Pending') return false;
    setIncoming((prev) => prev.map((i) => (i.id === request.id ? { ...i, status: 'Rejected' } : i)));
    return true;
  }, []);

  const getHousehold = useCallback((id) => households.find((h) => h.id === id) || null, [households]);

  const getIncoming = useCallback((id) => incoming.find((i) => i.id === id) || null, [incoming]);

  const getTransaction = useCallback((id) => transactions.find((t) => t.id === id) || null, [transactions]);

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

  const pendingCount = useMemo(() => requests.filter((r) => r.status === 'Pending').length, [requests]);

  const incomingPendingCount = useMemo(
    () => incoming.filter((i) => i.status === 'Pending').length,
    [incoming]
  );

  const value = useMemo(
    () => ({
      households,
      providersLoading,
      providersError,
      refreshProviders,
      requests,
      requestedIds,
      pendingCount,
      pool,
      incoming,
      incomingPendingCount,
      transactions,
      surplus,
      energy: ENERGY,
      impact: IMPACT,
      toast,
      showToast,
      submitRequest,
      approveIncoming,
      rejectIncoming,
      getHousehold,
      getIncoming,
      getTransaction,
    }),
    [
      households,
      providersLoading,
      providersError,
      refreshProviders,
      requests,
      requestedIds,
      pendingCount,
      pool,
      incoming,
      incomingPendingCount,
      transactions,
      surplus,
      toast,
      showToast,
      submitRequest,
      approveIncoming,
      rejectIncoming,
      getHousehold,
      getIncoming,
      getTransaction,
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
