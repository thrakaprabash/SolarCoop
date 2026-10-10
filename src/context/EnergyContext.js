import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { fetchMyFaultAlerts, subscribeToMyFaultAlerts } from '../services/faultAlertService';
import { readingStatus } from '../utils/energyTelemetry';
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
  { id: 'telemetry', labelKey: 'member.dashboard.widget.telemetry', visible: true, locked: false },
  { id: 'powerGrid', labelKey: 'member.dashboard.widget.powerGrid', visible: true, locked: true },
  { id: 'environmental', labelKey: 'member.dashboard.environmental.title', visible: true, locked: false },
  { id: 'sitePower', labelKey: 'member.dashboard.widget.sitePower', visible: true, locked: false },
  { id: 'coopActivity', labelKey: 'member.dashboard.widget.coopActivity', visible: true, locked: false },
  { id: 'quickActions', labelKey: 'member.dashboard.widget.quickActions', visible: true, locked: false },
];
export const WIDGET_STORAGE_KEY = '@solarcoop_widget_layout_v1';
export const ACTIVE_SUBTAB_STORAGE_KEY = '@solarcoop_active_subtab_v1';

// Empty placeholders are hidden until an authoritative reading arrives.
export const initialHistoryLogs = [];
export const initialApplianceLoads = [];
export const initialChartData = { hours: [], production: [], consumption: [], surplus: [], deficit: [] };
const initialMetrics = {
  isSimulated: false, instantProduction: 0, dailyProduction: 0,
  instantConsumption: 0, dailyConsumption: 0, batteryLevel: 0,
  batteryCapacity: 0, batteryPowerFlow: 0, surplusAvailable: 0,
  coopPoolSharedToday: 0, coopTokensEarned: 0, monetarySaved: 0,
  co2SavedKg: 0, gridIndependence: 0, coopMembersOnline: 0, coopTotalCapacity: 0,
};

// Map Supabase snake_case columns to the camelCase shape the UI expects.
const mapMetricsRow = (row) => ({
  isSimulated:          Boolean(row.is_simulated),
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
  const identity = useRef(user?.id);
  identity.current = user?.id;
  const metricsRequest = useRef(0);
  const chartRequest = useRef(0);
  const dataRequest = useRef(0);
  const [dataUserId, setDataUserId] = useState(null);
  const [metricsAvailable, setMetricsAvailable] = useState(false);
  const [faultAlerts, setFaultAlerts] = useState([]);
  const [faultError, setFaultError] = useState(null);

  // Theme
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Main bottom navigation tab
  const [mainBottomTab, setMainBottomTab] = useState('dashboard');

  // Active dashboard sub-tab (SOL-189: Cached & persisted)
  const [activeTab, setActiveTabState] = useState('dashboard');
  const [visitedTabs, setVisitedTabs] = useState(['dashboard']);
  const tabStateCache = useRef({});

  // Household vs Community Co-op Mode
  const [viewScope, setViewScope] = useState('household');


  // ── Core state ──
  const [metrics, setMetrics]       = useState(initialMetrics);
  const [appliances, setAppliances] = useState(initialApplianceLoads);
  const [historyLogs, setHistoryLogs] = useState(initialHistoryLogs);
  const [chartData, setChartData]   = useState(initialChartData);

  // ── SOL-187: Live Telemetry State ──
  const [telemetryStatus, setTelemetryStatus] = useState('offline'); // 'live' | 'stale' | 'offline'
  const [lastFetchedAt, setLastFetchedAt]     = useState(null);
  const [telemetryHealth, setTelemetryHealth] = useState({
    inverterStatus: null, gridFrequency: null, pingMs: null, efficiency: null,
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

  // ── SOL-189: Load saved sub-tab on mount ──
  useEffect(() => {
    const loadSavedSubTab = async () => {
      try {
        const savedTab = await AsyncStorage.getItem(ACTIVE_SUBTAB_STORAGE_KEY);
        if (savedTab && ['dashboard', 'production', 'consumption', 'surplus', 'deficit', 'history', 'charts', 'summary'].includes(savedTab)) {
          setActiveTabState(savedTab);
          setVisitedTabs(prev => prev.includes(savedTab) ? prev : [...prev, savedTab]);
        }
      } catch (e) {
        console.warn('[EnergyContext] Failed to load saved active tab:', e);
      }
    };
    loadSavedSubTab();
  }, []);

  const setActiveTab = useCallback((tabId) => {
    setActiveTabState(tabId);
    setVisitedTabs(prev => (prev.includes(tabId) ? prev : [...prev, tabId]));
    AsyncStorage.setItem(ACTIVE_SUBTAB_STORAGE_KEY, tabId).catch(() => {});
  }, []);

  const updateTabStateCache = useCallback((tabId, state) => {
    tabStateCache.current[tabId] = {
      ...(tabStateCache.current[tabId] || {}),
      ...state,
      cachedAt: Date.now(),
    };
  }, []);

  const getTabStateCache = useCallback((tabId) => {
    return tabStateCache.current[tabId] || null;
  }, []);

  const clearTabStateCache = useCallback((tabId) => {
    if (tabId) {
      delete tabStateCache.current[tabId];
    } else {
      tabStateCache.current = {};
    }
  }, []);

  // All reads are identity- and request-scoped so late responses cannot cross accounts.
  const refreshMetrics = useCallback(async () => {
    const id = user?.id;
    if (!id) return false;
    const ticket = ++metricsRequest.current;
    const started = Date.now();
    const current = () => identity.current === id && ticket === metricsRequest.current;
    try {
      const row = await fetchMetrics(id);
      if (!current()) return false;
      setDataUserId(id);
      setMetrics(row ? mapMetricsRow(row) : initialMetrics);
      setMetricsAvailable(Boolean(row));
      setLastFetchedAt(row?.updated_at || null);
      setTelemetryStatus(readingStatus(row?.updated_at));
      setTelemetryHealth(previous => ({ ...previous, pingMs: Date.now() - started }));
      setError(null);
      return Boolean(row);
    } catch (err) {
      if (current()) { setError(err.message); setTelemetryStatus('offline'); }
      return false;
    }
  }, [user?.id]);

  const loadAllData = useCallback(async () => {
    const id = user?.id;
    if (!id) return;
    const ticket = ++dataRequest.current;
    setLoading(true);
    const results = await Promise.allSettled([
      refreshMetrics(), fetchHistory(id, 1), fetchAppliances(id),
    ]);
    if (identity.current !== id || ticket !== dataRequest.current) return;
    setDataUserId(id);
    if (results[1].status === 'fulfilled') {
      setHistoryLogs(results[1].value.logs.map(mapHistoryRow));
      setHistoryHasMore(results[1].value.hasMore); setHistoryPage(1);
    }
    if (results[2].status === 'fulfilled') setAppliances(results[2].value);
    setLoading(false);
  }, [user?.id, refreshMetrics]);

  const refreshMetricsNow = useCallback(() => refreshMetrics(), [refreshMetrics]);

  useEffect(() => {
    metricsRequest.current++; dataRequest.current++; chartRequest.current++;
    setDataUserId(user?.id || null);
    setMetrics(initialMetrics); setMetricsAvailable(false);
    setAppliances([]); setHistoryLogs([]); setChartData(initialChartData);
    setLastFetchedAt(null); setTelemetryStatus('offline'); setError(null);
    setHistoryPage(1); setHistoryHasMore(false);
    setLoadingMore(false);
    setTelemetryHealth({ inverterStatus: null, gridFrequency: null, pingMs: null, efficiency: null });
    if (!user?.id) { setLoading(false); return; }
    loadAllData();
    pollRef.current = setInterval(refreshMetrics, 30_000);
    return () => clearInterval(pollRef.current);
  }, [user?.id, loadAllData, refreshMetrics]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!error) setTelemetryStatus(readingStatus(lastFetchedAt));
    }, 5000);
    return () => clearInterval(timer);
  }, [lastFetchedAt, error]);

  useEffect(() => {
    if (!user?.id) return;
    const id = user.id;
    let active = true;
    const channel = supabase.channel('energy-metrics:' + id)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'energy_metrics', filter: 'user_id=eq.' + id,
      }, ({ new: row }) => {
        if (!active || identity.current !== id) return;
        metricsRequest.current++;
        if (row?.user_id === id) {
          setDataUserId(id); setMetrics(mapMetricsRow(row)); setMetricsAvailable(true);
          setLastFetchedAt(row.updated_at || null);
          setTelemetryStatus(readingStatus(row.updated_at)); setError(null);
        } else { refreshMetrics(); }
      }).subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [user?.id, refreshMetrics]);

  useEffect(() => {
    const id = user?.id;
    let active = true, request = 0;
    setFaultAlerts([]); setFaultError(null);
    if (!id) return;
    const reload = async () => {
      const ticket = ++request;
      try {
        const alerts = await fetchMyFaultAlerts(id);
        if (active && identity.current === id && ticket === request) {
          setFaultAlerts(alerts); setFaultError(null);
        }
      } catch (err) {
        if (active && identity.current === id && ticket === request) setFaultError(err.message);
      }
    };
    reload();
    const unsubscribe = subscribeToMyFaultAlerts(id, reload);
    const timer = setInterval(reload, 10_000);
    const foreground = AppState.addEventListener('change', state => { if (state === 'active') reload(); });
    return () => { active = false; clearInterval(timer); foreground.remove(); unsubscribe(); };
  }, [user?.id]);

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
    const id = user?.id;
    if (!id) return false;
    try {
      const log = await postShareEnergy(id, amountKwh, recipient);
      if (identity.current !== id) return false;
      setHistoryLogs(previous => [mapHistoryRow(log), ...previous]);
      await refreshMetrics();
      return true;
    } catch (err) { if (identity.current === id) setError(err.message); return false; }
  }, [user?.id, refreshMetrics]);

  const executeBorrowEnergy = useCallback(async amountKwh => {
    const id = user?.id;
    if (!id) return false;
    try {
      const log = await postBorrowEnergy(id, amountKwh);
      if (identity.current !== id) return false;
      setHistoryLogs(previous => [mapHistoryRow(log), ...previous]);
      return true;
    } catch (err) { if (identity.current === id) setError(err.message); return false; }
  }, [user?.id]);

  // ── Pagination: load next page of history ─────────────────────────────────
  const loadMoreHistory = useCallback(async () => {
    if (!user?.id || loadingMore || !historyHasMore) return;
    const id = user.id;
    setLoadingMore(true);
    try {
      const nextPage = historyPage + 1;
      const result = await fetchHistory(id, nextPage);
      if (identity.current !== id) return;
      setHistoryLogs(prev => [...prev, ...result.logs.map(mapHistoryRow)]);
      setHistoryHasMore(result.hasMore);
      setHistoryPage(nextPage);
    } catch (err) {
      console.warn('[EnergyContext] loadMoreHistory failed:', err.message);
    } finally {
      if (identity.current === id) setLoadingMore(false);
    }
  }, [user?.id, loadingMore, historyHasMore, historyPage]);

  // Map UI ranges onto the simulator's existing day/week/month chart rows.
  const loadChartData = useCallback(async (range = 'today') => {
    const id = user?.id, ticket = ++chartRequest.current;
    setChartData(initialChartData);
    if (!id) return;
    const dbRange = { today: 'day', '7d': 'week', '30d': 'month' }[range] || range;
    try {
      const row = await fetchChartData(id, dbRange);
      if (identity.current === id && ticket === chartRequest.current) {
        setChartData(row ? mapChartRow(row) : initialChartData);
      }
    } catch (err) {
      if (identity.current === id && ticket === chartRequest.current) setError(err.message);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    loadChartData(dateRange);
    const timer = setInterval(() => loadChartData(dateRange), 30_000);
    return () => clearInterval(timer);
  }, [user?.id, dateRange, loadChartData]);

  // ── Context value ─────────────────────────────────────────────────────────
  return (
    <EnergyContext.Provider
      value={{
        // Theme
        isDarkMode,
        setIsDarkMode,

        // Navigation state & SOL-189 Tab Caching
        mainBottomTab,
        setMainBottomTab,
        activeTab,
        setActiveTab,
        visitedTabs,
        updateTabStateCache,
        getTabStateCache,
        clearTabStateCache,
        viewScope,
        setViewScope,

        // Core data
        metrics: dataUserId === user?.id ? metrics : initialMetrics,
        hasMetrics: dataUserId === user?.id && metricsAvailable,
        faultAlerts: dataUserId === user?.id ? faultAlerts : [],
        faultError,
        appliances: dataUserId === user?.id ? appliances : [],
        historyLogs: dataUserId === user?.id ? historyLogs : [],
        chartData: dataUserId === user?.id ? chartData : initialChartData,

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
        telemetryStatus: dataUserId === user?.id ? telemetryStatus : 'offline',
        setTelemetryStatus,
        lastFetchedAt: dataUserId === user?.id ? lastFetchedAt : null,
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
