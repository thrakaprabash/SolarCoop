import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchLatestEnergyReading, fetchSharedEnergy, reportingPeriod } from '../services/energyAnalyticsService';

const initial = (userId, period) => ({ userId, period, reading: null, shared: null,
  energyLoading: true, ledgerLoading: true, energyError: null, ledgerError: null });

/** Screen-local reads: entering/re-entering the screen reloads authoritative data. */
export function useEnergyAnalytics({ includeLedger = false } = {}) {
  const { user, profile } = useAuth();
  const userId = user?.id ?? null;
  const identity = useRef(userId);
  identity.current = userId;
  const generation = useRef(0);
  const [state, setState] = useState(() => initial(null, reportingPeriod()));
  const refresh = useCallback(async () => {
    const token = ++generation.current;
    const period = reportingPeriod();
    setState({ ...initial(userId, period), energyLoading: !!userId, ledgerLoading: !!userId && includeLedger });
    if (!userId) return;
    const update = (patch) => {
      if (identity.current === userId && generation.current === token) {
        setState((previous) => ({ ...previous, ...patch }));
      }
    };
    await Promise.all([
      fetchLatestEnergyReading(userId).then(
        (reading) => update({ reading, energyLoading: false }),
        () => update({ energyError: 'Energy readings could not be loaded.', energyLoading: false })),
      includeLedger ? fetchSharedEnergy(userId, period).then(
        (shared) => update({ shared, ledgerLoading: false }),
        () => update({ ledgerError: 'Shared energy could not be loaded.', ledgerLoading: false })) : Promise.resolve(),
    ]);
  }, [userId, includeLedger]);
  useEffect(() => {
    refresh();
    return () => { generation.current += 1; };
  }, [refresh]);
  const visible = state.userId === userId ? state : initial(userId, reportingPeriod());
  return { ...visible, refresh, name: profile?.id === userId ? profile.name : null,
    signedIn: !!userId, loading: visible.energyLoading || (includeLedger && visible.ledgerLoading) };
}
