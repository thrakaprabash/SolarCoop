import React, { useEffect } from 'react';
import {
  ImageBackground,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { AdminProvider, useAdmin } from './context/AdminContext';
import AdminHeader from './components/AdminHeader';
import AdminMetricChips from './components/AdminMetricChips';
import AdminBottomTabBar from './components/AdminBottomTabBar';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import MemberMonitoringScreen from './screens/MemberMonitoringScreen';
import MemberDetailScreen from './screens/MemberDetailScreen';
import TransactionMonitoringScreen from './screens/TransactionMonitoringScreen';
import AlertsScreen from './screens/AlertsScreen';
import ComplaintsScreen from './screens/ComplaintsScreen';
import AdminSettingsScreen from './screens/AdminSettingsScreen';
import { useTheme } from '../theme/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemedStyles } from '../theme/useLegacyTheme';

// ─── Background image — same dark-glass theme used by Member & Technician shells
const BG = require('../../assets/bg.jpg');

// ─── Inner shell — consumes AdminContext ──────────────────────────────────────
function AdminShell() {
  const theme = useTheme();
  const styles = useThemedStyles(baseStyles);

  const { adminBottomTab, setAdminBottomTab, loadMembers, loadComplaints, loadTransactions, loadAlerts, scanAlerts } = useAdmin();

  // Kick off member, complaint, transaction & alert data fetch as soon as the admin portal mounts.
  // Alerts are loaded first so existing ones paint immediately; the scan then looks for new
  // conditions and reloads alerts itself if it raised anything.
  useEffect(() => {
    loadMembers();
    loadComplaints();
    loadTransactions();
    loadAlerts();
    scanAlerts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const renderScreen = () => {
    switch (adminBottomTab) {
      case 'dashboard':    return <AdminDashboardScreen />;
      case 'members':      return <MemberMonitoringScreen />;
      case 'memberDetail': return <MemberDetailScreen />;
      case 'ledger':       return <TransactionMonitoringScreen />;
      case 'alerts':       return <AlertsScreen />;
      case 'reports':      return <ComplaintsScreen />;
      case 'profile':      return <AdminSettingsScreen />;
      default:             return <AdminDashboardScreen />;
    }
  };

  // Tabs that should highlight the bottom bar (memberDetail maps to members visually)
  const activeTabKey =
    adminBottomTab === 'memberDetail' ? 'members' : adminBottomTab;

  // Only show metric chips on dashboard screen
  const showChips = adminBottomTab === 'dashboard';

  return (
    <ImageBackground source={theme.isDark ? BG : undefined} style={styles.bgImage} resizeMode="cover">
      <View style={styles.overlay}>
        {!theme.isDark && <LinearGradient pointerEvents="none" colors={['#D9F3FF', '#F5FBFF', '#E4F4DF', '#FFF7D4']} style={StyleSheet.absoluteFillObject} />}
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
        <View style={styles.safeArea}>
          <AdminHeader />
          {showChips && <AdminMetricChips />}
          <View style={styles.screenContainer}>
            {renderScreen()}
          </View>
          <AdminBottomTabBar
            activeKey={activeTabKey}
            onSelect={setAdminBottomTab}
          />
        </View>
      </View>
    </ImageBackground>
  );
}

// ─── Public Export — wraps provider around shell ──────────────────────────────
export default function AdminPortal({ onExit }) {
  return (
    <AdminProvider onExit={onExit}>
      <AdminShell />
    </AdminProvider>
  );
}

const baseStyles = StyleSheet.create({
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
  screenContainer: {
    flex: 1,
  },
});
