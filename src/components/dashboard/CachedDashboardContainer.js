import React, { useMemo, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { HomeDashboard } from './HomeDashboard';
import { ProductionView } from './ProductionView';
import { ConsumptionView } from './ConsumptionView';
import { SurplusView } from './SurplusView';
import { DeficitView } from './DeficitView';
import { EnergyHistoryView } from './EnergyHistoryView';
import { ChartsView } from './ChartsView';
import { EnergySummaryView } from './EnergySummaryView';

// Memoized views to avoid unnecessary re-renders of background tabs
const MemoizedHomeDashboard = React.memo(HomeDashboard);
const MemoizedProductionView = React.memo(ProductionView);
const MemoizedConsumptionView = React.memo(ConsumptionView);
const MemoizedSurplusView = React.memo(SurplusView);
const MemoizedDeficitView = React.memo(DeficitView);
const MemoizedEnergyHistoryView = React.memo(EnergyHistoryView);
const MemoizedChartsView = React.memo(ChartsView);
const MemoizedEnergySummaryView = React.memo(EnergySummaryView);

const TAB_COMPONENTS = {
  dashboard: MemoizedHomeDashboard,
  production: MemoizedProductionView,
  consumption: MemoizedConsumptionView,
  surplus: MemoizedSurplusView,
  deficit: MemoizedDeficitView,
  history: MemoizedEnergyHistoryView,
  charts: MemoizedChartsView,
  summary: MemoizedEnergySummaryView,
};

/**
 * SOL-189: CachedDashboardContainer
 * Implements a high-performance Keep-Alive / Persistent Caching architecture for Dashboard tabs.
 * - Lazy initialization: Views are only mounted once they are first navigated to.
 * - State preservation: Once mounted, views remain in the hierarchy in a hidden state,
 *   preserving internal states (scroll offsets, chart filters, active animations).
 * - Instant tab transitions: Switching between tabs is 60fps instant with zero lag and zero refetching.
 */
export const CachedDashboardContainer = () => {
  const { activeTab = 'dashboard', visitedTabs = [] } = useEnergy();
  
  // Mounted tabs tracking: starts with current activeTab (or dashboard) plus any visited tabs
  const [mountedTabs, setMountedTabs] = useState(() => {
    const initial = new Set(['dashboard']);
    if (activeTab) initial.add(activeTab);
    if (Array.isArray(visitedTabs)) {
      visitedTabs.forEach(t => initial.add(t));
    }
    return Array.from(initial);
  });

  // Ensure active tab is mounted as soon as user selects it
  useEffect(() => {
    if (activeTab) {
      setMountedTabs(prev => (prev.includes(activeTab) ? prev : [...prev, activeTab]));
    }
  }, [activeTab]);

  return (
    <View style={styles.container}>
      {mountedTabs.map((tabId) => {
        const Component = TAB_COMPONENTS[tabId];
        if (!Component) return null;
        const isActive = (activeTab || 'dashboard') === tabId;

        return (
          <View
            key={tabId}
            style={[
              styles.tabPane,
              isActive ? styles.activePane : styles.hiddenPane,
            ]}
            pointerEvents={isActive ? 'auto' : 'none'}
            accessibilityElementsHidden={!isActive}
            importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
          >
            <Component />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  tabPane: {
    flex: 1,
  },
  activePane: {
    display: 'flex',
    opacity: 1,
  },
  hiddenPane: {
    display: 'none',
    opacity: 0,
  },
});
