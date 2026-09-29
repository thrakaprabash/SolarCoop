import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// ─── SOL-185: Default Dashboard Widget Layout ────────────────────────────────
export const DEFAULT_WIDGET_LAYOUT = [
  { id: 'telemetry', label: 'Live Real-Time Telemetry', visible: true, locked: false },
  { id: 'powerGrid', label: 'Current Power Grid (2×2)', visible: true, locked: true },
  { id: 'environmental', label: 'Environmental Benefits', visible: true, locked: false },
  { id: 'sitePower', label: 'Site Power & Flow Diagram', visible: true, locked: false },
  { id: 'coopActivity', label: 'Co-op Community Activity', visible: true, locked: false },
  { id: 'quickActions', label: 'Quick Actions (Share & Borrow)', visible: true, locked: false },
];
export const WIDGET_STORAGE_KEY = '@solarcoop_widget_layout_v1';

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

export const mockChartDataByRange = {
  day: {
    hours:       ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
    production:  [0.5, 2.8, 6.4, 8.8, 8.2, 5.1, 1.2, 0.0],
    consumption: [1.8, 3.2, 3.8, 4.1, 3.5, 4.8, 6.2, 4.5],
    surplus:     [0.0, 0.0, 2.6, 4.7, 4.7, 0.3, 0.0, 0.0],
    deficit:     [1.3, 0.4, 0.0, 0.0, 0.0, 0.0, 5.0, 4.5],
  },
  today: {
    '1h': {
      hours:       ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
      production:  [0.5, 2.8, 6.4, 8.8, 8.2, 5.1, 1.2, 0.0],
      consumption: [1.8, 3.2, 3.8, 4.1, 3.5, 4.8, 6.2, 4.5],
      surplus:     [0.0, 0.0, 2.6, 4.7, 4.7, 0.3, 0.0, 0.0],
      deficit:     [1.3, 0.4, 0.0, 0.0, 0.0, 0.0, 5.0, 4.5],
    },
    '30m': {
      hours:       ['06:00', '07:30', '09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30'],
      production:  [0.4, 1.6, 4.8, 7.5, 8.8, 8.5, 6.8, 4.2, 1.1, 0.1],
      consumption: [1.6, 2.4, 3.5, 3.7, 4.1, 3.8, 3.6, 5.0, 6.0, 4.8],
      surplus:     [0.0, 0.0, 1.3, 3.8, 4.7, 4.7, 3.2, 0.0, 0.0, 0.0],
      deficit:     [1.2, 0.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.8, 4.9, 4.7],
    },
  },
  yesterday: {
    '1h': {
      hours:       ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
      production:  [0.3, 2.4, 5.8, 8.1, 7.6, 4.8, 0.9, 0.0],
      consumption: [2.1, 3.4, 3.6, 4.0, 3.7, 4.6, 5.8, 4.2],
      surplus:     [0.0, 0.0, 2.2, 4.1, 3.9, 0.2, 0.0, 0.0],
      deficit:     [1.8, 1.0, 0.0, 0.0, 0.0, 0.0, 4.9, 4.2],
    },
    '30m': {
      hours:       ['06:00', '07:30', '09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30'],
      production:  [0.2, 1.4, 4.2, 6.9, 8.1, 7.9, 6.1, 3.9, 0.8, 0.0],
      consumption: [1.9, 2.8, 3.4, 3.8, 4.0, 3.9, 3.8, 4.8, 5.6, 4.4],
      surplus:     [0.0, 0.0, 0.8, 3.1, 4.1, 4.0, 2.3, 0.0, 0.0, 0.0],
      deficit:     [1.7, 1.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.9, 4.8, 4.4],
    },
  },
  week: {
    hours:       ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    production:  [38.2, 41.5, 44.1, 48.6, 42.3, 36.8, 39.4],
    consumption: [22.1, 24.8, 23.5, 25.2, 26.1, 20.3, 21.7],
    surplus:     [16.1, 16.7, 20.6, 23.4, 16.2, 16.5, 17.7],
    deficit:     [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  },
  '7d': {
    '1d': {
      hours:       ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      production:  [38.2, 41.5, 44.1, 48.6, 42.3, 36.8, 39.4],
      consumption: [22.1, 24.8, 23.5, 25.2, 26.1, 20.3, 21.7],
      surplus:     [16.1, 16.7, 20.6, 23.4, 16.2, 16.5, 17.7],
      deficit:     [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    },
    '6h': {
      hours:       ['Mon AM', 'Mon PM', 'Wed AM', 'Wed PM', 'Fri AM', 'Fri PM', 'Sun AM', 'Sun PM'],
      production:  [18.5, 19.7, 21.2, 22.9, 20.5, 21.8, 19.1, 20.3],
      consumption: [10.4, 11.7, 11.2, 12.3, 12.8, 13.3, 10.2, 11.5],
      surplus:     [8.1, 8.0, 10.0, 10.6, 7.7, 8.5, 8.9, 8.8],
      deficit:     [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    },
  },
  month: {
    hours:       ['W1', 'W2', 'W3', 'W4'],
    production:  [280.5, 302.1, 315.8, 290.3],
    consumption: [168.2, 175.6, 182.1, 170.4],
    surplus:     [112.3, 126.5, 133.7, 119.9],
    deficit:     [0.0, 0.0, 0.0, 0.0],
  },
  '30d': {
    '1w': {
      hours:       ['W1', 'W2', 'W3', 'W4'],
      production:  [280.5, 302.1, 315.8, 290.3],
      consumption: [168.2, 175.6, 182.1, 170.4],
      surplus:     [112.3, 126.5, 133.7, 119.9],
      deficit:     [0.0, 0.0, 0.0, 0.0],
    },
    '1d': {
      hours:       ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'],
      production:  [40.2, 42.1, 45.3, 44.8, 39.5, 41.2, 43.6],
      consumption: [24.1, 25.0, 23.8, 26.2, 25.4, 23.9, 24.5],
      surplus:     [16.1, 17.1, 21.5, 18.6, 14.1, 17.3, 19.1],
      deficit:     [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    },
  },
  custom: {
    '1d': {
      hours:       ['09/01', '09/05', '09/10', '09/15', '09/20', '09/25', '09/29'],
      production:  [39.5, 41.2, 43.8, 46.1, 42.0, 40.5, 44.2],
      consumption: [23.5, 24.2, 23.9, 25.1, 25.8, 22.6, 23.4],
      surplus:     [16.0, 17.0, 19.9, 21.0, 16.2, 17.9, 20.8],
      deficit:     [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    },
    '1w': {
      hours:       ['Sep W1', 'Sep W2', 'Sep W3', 'Sep W4'],
      production:  [275.4, 298.2, 310.5, 288.6],
      consumption: [165.0, 172.4, 180.2, 168.9],
      surplus:     [110.4, 125.8, 130.3, 119.7],
      deficit:     [0.0, 0.0, 0.0, 0.0],
    },
  },
};

export const initialChartData = mockChartDataByRange.day;

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

  // ── SOL-187: Live Telemetry State ──
  const [telemetryStatus, setTelemetryStatus] = useState('live'); // 'live' | 'polling' | 'offline'
  const [lastFetchedAt, setLastFetchedAt]     = useState(new Date().toISOString());
  const [telemetryHealth, setTelemetryHealth] = useState({
    inverterStatus: 'Optimal',
    gridFrequency: '50.0 Hz',
    pingMs: 38,
    efficiency: 99.2,
  });

  // ── SOL-185: Widget Customization Layout State ──
  const [widgetLayout, setWidgetLayout] = useState(DEFAULT_WIDGET_LAYOUT);

  // ── SOL-186: Date-Range & Granularity State ──
  const [dateRange, setDateRange]               = useState('today');
  const [customDateRange, setCustomDateRange]   = useState({ startDate: '2026-09-01', endDate: '2026-09-29' });
  const [granularity, setGranularity]           = useState('1h');

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

  // ── SOL-185: Load saved widget layout from AsyncStorage on mount ──
  useEffect(() => {
    const loadSavedLayout = async () => {
      try {
        const saved = await AsyncStorage.getItem(WIDGET_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Merge with default to guarantee new widgets are present
            const merged = parsed.map(item => {
              const def = DEFAULT_WIDGET_LAYOUT.find(d => d.id === item.id);
              return def ? { ...def, ...item } : item;
            });
            DEFAULT_WIDGET_LAYOUT.forEach(def => {
              if (!merged.some(m => m.id === def.id)) {
                merged.push(def);
              }
            });
            setWidgetLayout(merged);
          }
        }
      } catch (e) {
        console.warn('[EnergyContext] Failed to load widget layout:', e);
      }
    };
    loadSavedLayout();
  }, []);

  const updateWidgetLayout = useCallback(async (newLayout) => {
    setWidgetLayout(newLayout);
    try {
      await AsyncStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(newLayout));
    } catch (e) {
      console.warn('[EnergyContext] Failed to save widget layout:', e);
    }
  }, []);

  const resetWidgetLayout = useCallback(async () => {
    setWidgetLayout(DEFAULT_WIDGET_LAYOUT);
    try {
      await AsyncStorage.removeItem(WIDGET_STORAGE_KEY);
    } catch (e) {
      console.warn('[EnergyContext] Failed to reset widget layout:', e);
    }
  }, []);

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
    if (!user?.id) {
      setLastFetchedAt(new Date().toISOString());
      return;
    }
    try {
      const row = await fetchMetrics(user.id);
      if (row) {
        setMetrics(mapMetricsRow(row));
        setLastFetchedAt(new Date().toISOString());
        setTelemetryStatus('live');
      }
    } catch (err) {
      console.warn('[EnergyContext] Metrics poll failed:', err.message);
      setTelemetryStatus('offline');
    }
  }, [user?.id]);

  // ── SOL-187: Manual Telemetry Refresh Trigger ─────────────────────────────
  const refreshMetricsNow = useCallback(async () => {
    setLastFetchedAt(new Date().toISOString());
    // Simulate slight natural ping/latency variance
    const simulatedPing = Math.floor(32 + Math.random() * 12);
    setTelemetryHealth(prev => ({
      ...prev,
      pingMs: simulatedPing,
      efficiency: Number((99.1 + Math.random() * 0.5).toFixed(1)),
    }));

    if (user?.id) {
      try {
        await refreshMetrics();
        setTelemetryStatus('live');
        return true;
      } catch (err) {
        setTelemetryStatus('offline');
        return false;
      }
    } else {
      // Offline / dev mode simulation
      setTelemetryStatus('live');
      return true;
    }
  }, [user?.id, refreshMetrics]);

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
      setLastFetchedAt(new Date().toISOString());
      return;
    }

    loadAllData();
    setLastFetchedAt(new Date().toISOString());

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

  // ── SOL-186: Chart range & granularity fetch ──────────────────────────────
  const loadChartData = useCallback(async (range = 'today', gran = '1h') => {
    // Map legacy keys
    const normalizedRange = range === 'day' ? 'today' : range === 'week' ? '7d' : range === 'month' ? '30d' : range;

    if (user?.id) {
      try {
        const row = await fetchChartData(user.id, normalizedRange);
        if (row && row.hours && row.hours.length > 0) {
          setChartData(mapChartRow(row));
          return;
        }
      } catch (err) {
        console.warn('[EnergyContext] loadChartData failed, using fallback:', err.message);
      }
    }

    // Fallback if offline or table not populated: check granular structure
    const rangeObj = mockChartDataByRange[normalizedRange] || mockChartDataByRange[range];
    if (rangeObj) {
      if (rangeObj[gran]) {
        setChartData(rangeObj[gran]);
      } else if (rangeObj.hours) {
        setChartData(rangeObj);
      } else {
        const firstKey = Object.keys(rangeObj)[0];
        setChartData(rangeObj[firstKey] || initialChartData);
      }
    } else {
      setChartData(initialChartData);
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

        // Chart range & granularity (SOL-186)
        loadChartData,
        dateRange,
        setDateRange,
        customDateRange,
        setCustomDateRange,
        granularity,
        setGranularity,

        // Live Telemetry (SOL-187)
        telemetryStatus,
        setTelemetryStatus,
        lastFetchedAt,
        telemetryHealth,
        refreshMetricsNow,

        // Widget Customization (SOL-185)
        widgetLayout,
        updateWidgetLayout,
        resetWidgetLayout,

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