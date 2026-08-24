import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchMetrics,
  fetchHistory,
  fetchAppliances,
  fetchChartData,
  postShareEnergy,
  postBorrowEnergy,
  updateAppliance,
} from '../services/energyService';

const EnergyContext = createContext();

// ─── Offline / fallback mock data ────────────────────────────────────────────
// Kept as defaults so the dashboard renders even when Supabase is unreachable.

export const initialHistoryLogs = [
  { id: '1', time: '14:45 Today', type: 'surplus', title: 'Co-op Energy Shared', amount: '+4.5 kWh', cost: '+$1.35 earned', status: 'Completed', detail: 'Transferred excess solar to House #08' },
  { id: '2', time: '13:10 Today', type: 'production', title: 'Peak Solar Generation', amount: '8.4 kW', cost: 'Peak solar output', status: 'Optimal', detail: 'Roof North & South Arrays operating at 98% efficiency' },
  { id: '3', time: '11:30 Today', type: 'storage', title: 'Home Battery Fully Charged', amount: '13.5 kWh', cost: '100% SoC', status: 'Charged', detail: 'Tesla Powerwall 2 reached capacity threshold' },
  { id: '4', time: '09:15 Today', type: 'consumption', title: 'EV Fast Charging Initiated', amount: '-6.2 kW', cost: 'Solar Powered', detail: 'Vehicle charged directly using solar surplus' },
  { id: '5', time: '07:00 Today', type: 'deficit', title: 'Morning Co-op Draw', amount: '-1.8 kWh', cost: '-$0.36 borrowed', status: 'Settled', detail: 'Borrowed from Co-op Pool prior to sunrise' },
  { id: '6', time: 'Yesterday', type: 'surplus', title: 'Co-op Dividend Distributed', amount: '+18.2 kWh', cost: '+$5.46 payout', status: 'Completed', detail: 'Daily community revenue distribution' },
  { id: '7', time: 'Yesterday', type: 'production', title: 'Daily Total Solar Gen', amount: '48.2 kWh', cost: '$14.46 value', status: 'Record', detail: 'Clear sunny sky, zero cloud coverage' },
];

export const initialApplianceLoads = [
  { id: 'app1', name: 'HVAC Air Conditioner', power: '2.4 kW', active: true, icon: 'wind', category: 'Climate' },
  { id: 'app2', name: 'EV Charger (Tesla Wallbox)', power: '7.2 kW', active: true, icon: 'zap', category: 'Mobility' },
  { id: 'app3', name: 'Smart Washer / Dryer', power: '1.2 kW', active: false, icon: 'repeat', category: 'Laundry' },
  { id: 'app4', name: 'Water Heater HeatPump', power: '1.8 kW', active: true, icon: 'droplet', category: 'Water' },
  { id: 'app5', name: 'Refrigerator & Freezers', power: '0.35 kW', active: true, icon: 'box', category: 'Kitchen' },
  { id: 'app6', name: 'Home Entertainment & IT', power: '0.45 kW', active: true, icon: 'tv', category: 'Electronics' },
];

export const initialChartData = {
  hours:       ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
  production:  [0.5, 2.8, 6.4, 8.8, 8.2, 5.1, 1.2, 0.0],
  consumption: [1.8, 3.2, 3.8, 4.1, 3.5, 4.8, 6.2, 4.5],
  surplus:     [0.0, 0.0, 2.6, 4.7, 4.7, 0.3, 0.0, 0.0],
  deficit:     [1.3, 0.4, 0.0, 0.0, 0.0, 0.0, 5.0, 4.5],
};

const initialMetrics = {
  instantProduction:    8.5,
  dailyProduction:      42.6,
  instantConsumption:   3.8,
  dailyConsumption:     24.1,
  batteryLevel:         88,
  batteryCapacity:      13.5,
  batteryPowerFlow:     +2.1,
  surplusAvailable:     4.6,
  coopPoolSharedToday:  18.5,
  coopTokensEarned:     142.5,
  monetarySaved:        38.40,
  co2SavedKg:           34.2,
  gridIndependence:     94,
  coopMembersOnline:    14,
  coopTotalCapacity:    120.0,
};

// Map Supabase snake_case columns to the camelCase shape the UI expects.
const mapMetricsRow = (row) => ({
  instantProduction:    Number(row.instant_production),
  dailyProduction:      Number(row.daily_production),
  instantConsumption:   Number(row.instant_consumption),
  dailyConsumption:     Number(row.daily_consumption),
  batteryLevel:         Number(row.battery_level),
  batteryCapacity:      Number(row.battery_capacity),
  batteryPowerFlow:     Number(row.battery_power_flow),
  surplusAvailable:     Number(row.surplus_available),
  coopPoolSharedToday:  Number(row.coop_pool_shared_today),
  coopTokensEarned:     Number(row.coop_tokens_earned),
  monetarySaved:        Number(row.monetary_saved),
  co2SavedKg:           Number(row.co2_saved_kg),
  gridIndependence:     Number(row.grid_independence),
  coopMembersOnline:    Number(row.coop_members_online),
  coopTotalCapacity:    Number(row.coop_total_capacity),
});

const mapChartRow = (row) => ({
  hours:       row.hours || [],
  production:  (row.production  || []).map(Number),
  consumption: (row.consumption || []).map(Number),
  surplus:     (row.surplus     || []).map(Number),
  deficit:     (row.deficit     || []).map(Number),
});

const mapHistoryRow = (row) => ({
  id:     row.id,
  time:   new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today',
  type:   row.type,
  title:  row.title,
  amount: row.amount,
  cost:   row.cost   || '',
  status: row.status || '',
  detail: row.detail || '',
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export const EnergyProvider = ({ children }) => {
  // Auth — provides user.id for scoped queries
  const { user } = useAuth();

  // Theme
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Main bottom navigation tab
  const [mainBottomTab, setMainBottomTab] = useState('dashboard');

  // Active dashboard sub-tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Household vs Community Co-op Mode
  const [viewScope, setViewScope] = useState('household');

  // Simulation mode (kept for dev/offline use)
  const [simulationPreset, setSimulationPreset] = useState('sunny');

  // ── Core state ──
  const [metrics, setMetrics]       = useState(initialMetrics);
  const [appliances, setAppliances] = useState(initialApplianceLoads);
  const [historyLogs, setHistoryLogs] = useState(initialHistoryLogs);
  const [chartData, setChartData]   = useState(initialChartData);

  // ── Loading / error / pagination ──
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Auto-share settings
  const [autoShareEnabled, setAutoShareEnabled]     = useState(true);
  const [autoShareThreshold, setAutoShareThreshold] = useState(75);

  // Polling interval ref
  const pollRef = useRef(null);

  // ── Initial data load ──────────────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const [metricsRow, historyResult, appliancesRows, chartRow] = await Promise.all([
        fetchMetrics(user.id),
        fetchHistory(user.id, 1),
        fetchAppliances(user.id),
        fetchChartData(user.id, 'day'),
      ]);

      if (metricsRow)     setMetrics(mapMetricsRow(metricsRow));
      if (historyResult.logs.length > 0) {
        setHistoryLogs(historyResult.logs.map(mapHistoryRow));
        setHistoryHasMore(historyResult.hasMore);
        setHistoryPage(1);
      }
      if (appliancesRows.length > 0) setAppliances(appliancesRows);
      if (chartRow)       setChartData(mapChartRow(chartRow));
    } catch (err) {
      console.warn('[EnergyContext] Initial data load failed, using mock data:', err.message);
      setError(err.message);
      // Fallback: keep initial mock values — app still works offline
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ── Metrics-only refresh (for polling) ────────────────────────────────────
  const refreshMetrics = useCallback(async () => {
    if (!user?.id) return;
    try {
      const row = await fetchMetrics(user.id);
      if (row) setMetrics(mapMetricsRow(row));
    } catch (err) {
      console.warn('[EnergyContext] Metrics poll failed:', err.message);
    }
  }, [user?.id]);

  // ── Load data when user signs in ──────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      // Signed out: reset to mock defaults
      setMetrics(initialMetrics);
      setAppliances(initialApplianceLoads);
      setHistoryLogs(initialHistoryLogs);
      setChartData(initialChartData);
      setHistoryPage(1);
      setHistoryHasMore(false);
      return;
    }

    loadAllData();

    // Poll metrics every 30 seconds
    pollRef.current = setInterval(refreshMetrics, 30_000);
    return () => clearInterval(pollRef.current);
  }, [user?.id, loadAllData, refreshMetrics]);

  // ── Simulation preset (offline / dev only) ────────────────────────────────
  useEffect(() => {
    // Only apply simulation overrides when there is no real user session
    if (user?.id) return;

    if (simulationPreset === 'sunny') {
      setMetrics(prev => ({ ...prev, instantProduction: 8.4, instantConsumption: 3.8, surplusAvailable: 4.6, batteryPowerFlow: +2.1, gridIndependence: 96 }));
    } else if (simulationPreset === 'cloudy') {
      setMetrics(prev => ({ ...prev, instantProduction: 2.2, instantConsumption: 3.5, surplusAvailable: 0.0, batteryPowerFlow: -1.3, gridIndependence: 78 }));
    } else if (simulationPreset === 'evening') {
      setMetrics(prev => ({ ...prev, instantProduction: 0.2, instantConsumption: 5.8, surplusAvailable: 0.0, batteryPowerFlow: -4.2, gridIndependence: 85 }));
    } else if (simulationPreset === 'deficit') {
      setMetrics(prev => ({ ...prev, instantProduction: 0.0, instantConsumption: 6.4, surplusAvailable: 0.0, batteryPowerFlow: -5.0, gridIndependence: 42 }));
    }
  }, [simulationPreset, user?.id]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const toggleAppliance = useCallback(async (id) => {
    // Optimistic local update
    setAppliances(prev =>
      prev.map(app => (app.id === id ? { ...app, active: !app.active } : app)),
    );

    // Persist to DB (best-effort — if it fails, the optimistic update stays)
    if (user?.id) {
      const target = appliances.find(a => a.id === id);
      if (target) {
        updateAppliance(id, !target.active).catch(err =>
          console.warn('[EnergyContext] toggleAppliance DB write failed:', err.message),
        );
      }
    }
  }, [user?.id, appliances]);

  const executeShareEnergy = useCallback(async (amountKwh, recipient) => {
    if (user?.id) {
      try {
        const newLog = await postShareEnergy(user.id, amountKwh, recipient);
        setHistoryLogs(prev => [mapHistoryRow(newLog), ...prev]);
        // Refresh metrics to reflect new token / co-op totals
        await refreshMetrics();
        return;
      } catch (err) {
        console.warn('[EnergyContext] postShareEnergy failed, falling back to local update:', err.message);
      }
    }

    // Offline / fallback: local-only update
    const newLog = {
      id: Date.now().toString(),
      time: 'Just now',
      type: 'surplus',
      title: `Shared ${amountKwh} kWh with ${recipient}`,
      amount: `+${amountKwh} kWh`,
      cost: `+$${(amountKwh * 0.30).toFixed(2)} earned`,
      status: 'Completed',
      detail: 'Direct peer-to-peer energy transfer via Co-op Pool',
    };
    setHistoryLogs(prev => [newLog, ...prev]);
    setMetrics(prev => ({
      ...prev,
      coopPoolSharedToday: parseFloat((prev.coopPoolSharedToday + amountKwh).toFixed(1)),
      coopTokensEarned: prev.coopTokensEarned + amountKwh * 10,
    }));
  }, [user?.id, refreshMetrics]);

  const executeBorrowEnergy = useCallback(async (amountKwh) => {
    if (user?.id) {
      try {
        const newLog = await postBorrowEnergy(user.id, amountKwh);
        setHistoryLogs(prev => [mapHistoryRow(newLog), ...prev]);
        return;
      } catch (err) {
        console.warn('[EnergyContext] postBorrowEnergy failed, falling back to local update:', err.message);
      }
    }

    // Offline / fallback
    const newLog = {
      id: Date.now().toString(),
      time: 'Just now',
      type: 'deficit',
      title: `Borrowed ${amountKwh} kWh from Co-op`,
      amount: `-${amountKwh} kWh`,
      cost: `-$${(amountKwh * 0.20).toFixed(2)} borrowed`,
      status: 'Settled',
      detail: 'Covered household demand via community battery reserve',
    };
    setHistoryLogs(prev => [newLog, ...prev]);
  }, [user?.id]);

  // ── Pagination: load next page of history ─────────────────────────────────
  const loadMoreHistory = useCallback(async () => {
    if (!user?.id || loadingMore || !historyHasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = historyPage + 1;
      const result = await fetchHistory(user.id, nextPage);
      setHistoryLogs(prev => [...prev, ...result.logs.map(mapHistoryRow)]);
      setHistoryHasMore(result.hasMore);
      setHistoryPage(nextPage);
    } catch (err) {
      console.warn('[EnergyContext] loadMoreHistory failed:', err.message);
    } finally {
      setLoadingMore(false);
    }
  }, [user?.id, loadingMore, historyHasMore, historyPage]);

  // ── Chart range fetch ─────────────────────────────────────────────────────
  const loadChartData = useCallback(async (range) => {
    if (!user?.id) return;
    try {
      const row = await fetchChartData(user.id, range);
      if (row) setChartData(mapChartRow(row));
    } catch (err) {
      console.warn('[EnergyContext] loadChartData failed:', err.message);
    }
  }, [user?.id]);

  // ── Context value ─────────────────────────────────────────────────────────
  return (
    <EnergyContext.Provider
      value={{
        // Theme
        isDarkMode,
        setIsDarkMode,

        // Navigation state
        mainBottomTab,
        setMainBottomTab,
        activeTab,
        setActiveTab,
        viewScope,
        setViewScope,

        // Simulation (dev / offline)
        simulationPreset,
        setSimulationPreset,

        // Core data
        metrics,
        appliances,
        historyLogs,
        chartData,

        // Actions
        toggleAppliance,
        executeShareEnergy,
        executeBorrowEnergy,

        // Pagination
        loadMoreHistory,
        historyHasMore,
        loadingMore,

        // Chart range
        loadChartData,

        // Auto-share settings
        autoShareEnabled,
        setAutoShareEnabled,
        autoShareThreshold,
        setAutoShareThreshold,

        // Loading / error
        loading,
        error,
      }}
    >
      {children}
    </EnergyContext.Provider>
  );
};

export const useEnergy = () => useContext(EnergyContext);