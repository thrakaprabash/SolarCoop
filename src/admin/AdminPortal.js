import React, { useEffect } from 'react';
import {
  ImageBackground,
  Platform,
  StatusBar,
  StyleSheet,
  View,
  AppState,
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
import { supabase } from '../lib/supabase';

// ─── Background image — same dark-glass theme used by Member & Technician shells
const BG = require('../../assets/bg.jpg');

// ─── Inner shell — consumes AdminContext ──────────────────────────────────────
function AdminShell() {
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

  useEffect(() => {
    let timer;
    const refresh = () => {
      if (AppState.currentState && AppState.currentState !== 'active') return;
      loadTransactions({ silent: true });
      loadAlerts({ silent: true });
    };
    const changed = () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 300);
    };
    const channel = supabase.channel('admin-live-ledger-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, changed)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, changed)
      .subscribe();
    const poll = setInterval(refresh, 10_000);
    const scan = setInterval(() => {
      if (!AppState.currentState || AppState.currentState === 'active') scanAlerts();
    }, 60_000);
    const foreground = AppState.addEventListener('change', state => {
      if (state === 'active') { refresh(); scanAlerts(); }
    });
    return () => {
      clearTimeout(timer); clearInterval(poll); clearInterval(scan);
      foreground.remove(); supabase.removeChannel(channel);
    };
  }, [loadTransactions, loadAlerts, scanAlerts]);

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
    <ImageBackground source={BG} style={styles.bgImage} resizeMode="cover">
      <View style={styles.overlay}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
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
  screenContainer: {
    flex: 1,
  },
});
