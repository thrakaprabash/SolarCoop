import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
import { EnergyProvider, useEnergy } from './src/context/EnergyContext';
import { Header } from './src/components/common/Header';
import { SegmentedTabs } from './src/components/common/SegmentedTabs';
import { BottomTaskBar } from './src/components/common/BottomTaskBar';
import { HomeDashboard } from './src/components/dashboard/HomeDashboard';
import { ProductionView } from './src/components/dashboard/ProductionView';
import { ConsumptionView } from './src/components/dashboard/ConsumptionView';
import { SurplusView } from './src/components/dashboard/SurplusView';
import { DeficitView } from './src/components/dashboard/DeficitView';
import { EnergyHistoryView } from './src/components/dashboard/EnergyHistoryView';
import { ChartsView } from './src/components/dashboard/ChartsView';
import { EnergySummaryView } from './src/components/dashboard/EnergySummaryView';
import { TradeRequestsPlaceholder } from './src/components/placeholders/TradeRequestsPlaceholder';
import { AlertsSupportPlaceholder } from './src/components/placeholders/AlertsSupportPlaceholder';
import { ProfileAuthPlaceholder } from './src/components/placeholders/ProfileAuthPlaceholder';

function MainApp() {
  const { mainBottomTab, activeTab, isDarkMode } = useEnergy();

  const renderDashboardView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <HomeDashboard />;
      case 'production':
        return <ProductionView />;
      case 'consumption':
        return <ConsumptionView />;
      case 'surplus':
        return <SurplusView />;
      case 'deficit':
        return <DeficitView />;
      case 'history':
        return <EnergyHistoryView />;
      case 'charts':
        return <ChartsView />;
      case 'summary':
        return <EnergySummaryView />;
      default:
        return <HomeDashboard />;
    }
  };

  const renderMainContent = () => {
    switch (mainBottomTab) {
      case 'dashboard':
        return (
          <View style={styles.dashboardContainer}>
            <SegmentedTabs />
            <View style={styles.viewContainer}>{renderDashboardView()}</View>
          </View>
        );
      case 'trade':
        return <TradeRequestsPlaceholder />;
      case 'alerts':
        return <AlertsSupportPlaceholder />;
      case 'profile':
        return <ProfileAuthPlaceholder />;
      default:
        return (
          <View style={styles.dashboardContainer}>
            <SegmentedTabs />
            <View style={styles.viewContainer}>{renderDashboardView()}</View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Header />
      <View style={styles.mainContentContainer}>
        {renderMainContent()}
      </View>
      <BottomTaskBar />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <EnergyProvider>
      <MainApp />
    </EnergyProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
  },
  mainContentContainer: {
    flex: 1,
  },
  dashboardContainer: {
    flex: 1,
  },
  viewContainer: {
    flex: 1,
  },
});
