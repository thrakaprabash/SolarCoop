import React from 'react';
import { StyleSheet, View, ImageBackground, StatusBar, Platform } from 'react-native';
import { EnergyProvider, useEnergy } from './src/context/EnergyContext';
import { EnergyProvider as TradeEnergyProvider } from './src/trade/context/EnergyContext';
import { Header } from './src/components/common/Header';
import { SegmentedTabs } from './src/components/common/SegmentedTabs';
import BottomTabBar from './src/components/common/BottomTabBar';
import { HomeDashboard } from './src/components/dashboard/HomeDashboard';
import { ProductionView } from './src/components/dashboard/ProductionView';
import { ConsumptionView } from './src/components/dashboard/ConsumptionView';
import { SurplusView } from './src/components/dashboard/SurplusView';
import { DeficitView } from './src/components/dashboard/DeficitView';
import { EnergyHistoryView } from './src/components/dashboard/EnergyHistoryView';
import { ChartsView } from './src/components/dashboard/ChartsView';
import { EnergySummaryView } from './src/components/dashboard/EnergySummaryView';
import { TradeSection } from './src/components/trade/TradeSection';
import { AlertsSupportPlaceholder } from './src/components/placeholders/AlertsSupportPlaceholder';
import { ProfileAuthPlaceholder } from './src/components/placeholders/ProfileAuthPlaceholder';
import AdminPortal from './src/admin/AdminPortal';

// ─── Member App Shell ─────────────────────────────────────────────────────────
function MainAppWithAdminButton({ onOpenAdmin }) {
  const { mainBottomTab, setMainBottomTab, activeTab } = useEnergy();

  const renderDashboardView = () => {
    switch (activeTab) {
      case 'dashboard':   return <HomeDashboard onOpenAdmin={onOpenAdmin} />;
      case 'production':  return <ProductionView />;
      case 'consumption': return <ConsumptionView />;
      case 'surplus':     return <SurplusView />;
      case 'deficit':     return <DeficitView />;
      case 'history':     return <EnergyHistoryView />;
      case 'charts':      return <ChartsView />;
      case 'summary':     return <EnergySummaryView />;
      default:            return <HomeDashboard onOpenAdmin={onOpenAdmin} />;
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
      case 'trade':   return <TradeSection initialScreen="trade" />;
      case 'energy':  return <TradeSection initialScreen="insights" />;
      case 'alerts':  return <AlertsSupportPlaceholder />;
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
    <View style={styles.mainApp}>
      <Header />
      <View style={styles.mainContentContainer}>
        {renderMainContent()}
      </View>
      <BottomTabBar activeKey={mainBottomTab} onSelect={setMainBottomTab} />
    </View>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [isAdminMode, setIsAdminMode] = React.useState(false);

  return (
    <ImageBackground
      source={require('./assets/bg.jpg')}
      style={styles.bgImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.safeArea}>
          {isAdminMode ? (
            <AdminPortal onExit={() => setIsAdminMode(false)} />
          ) : (
            <EnergyProvider>
              <TradeEnergyProvider>
                <MainAppWithAdminButton onOpenAdmin={() => setIsAdminMode(true)} />
              </TradeEnergyProvider>
            </EnergyProvider>
          )}
        </View>
      </View>
    </ImageBackground>
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
  mainApp: {
    flex: 1,
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
