import React from 'react';
import { StyleSheet, View, ImageBackground, StatusBar, Platform } from 'react-native';
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
  const { mainBottomTab, activeTab } = useEnergy();

  const renderDashboardView = () => {
    switch (activeTab) {
      case 'dashboard': return <HomeDashboard />;
      case 'production': return <ProductionView />;
      case 'consumption': return <ConsumptionView />;
      case 'surplus': return <SurplusView />;
      case 'deficit': return <DeficitView />;
      case 'history': return <EnergyHistoryView />;
      case 'charts': return <ChartsView />;
      case 'summary': return <EnergySummaryView />;
      default: return <HomeDashboard />;
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
      case 'trade': return <TradeRequestsPlaceholder />;
      case 'alerts': return <AlertsSupportPlaceholder />;
      case 'profile': return <ProfileAuthPlaceholder />;
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
    <ImageBackground
      source={require('./assets/bg.jpg')}
      style={styles.bgImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.safeArea}>
          <Header />
          <View style={styles.mainContentContainer}>
            {renderMainContent()}
          </View>
          <BottomTaskBar />
        </View>
      </View>
    </ImageBackground>
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
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 22, 0.55)',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 50,
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
