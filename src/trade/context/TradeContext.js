import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { HOUSEHOLDS } from '../data/households';
import { INITIAL_REQUESTS } from '../data/requests';
import { INCOMING_REQUESTS } from '../data/incoming';
import { TRANSACTIONS, TXN_SEQ_START } from '../data/transactions';
import { ENERGY, IMPACT } from '../data/energy';
import { sum, today, txnRef } from '../utils/format';

const INITIAL_SURPLUS = +(ENERGY.todayProduction - ENERGY.todayConsumption).toFixed(1);

const TradeContext = createContext(null);

export function TradeProvider({ children }) {
  const [households] = useState(HOUSEHOLDS);
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
