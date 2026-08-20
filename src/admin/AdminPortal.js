import React from 'react';
import { View, StyleSheet } from 'react-native';
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

// ─── Inner shell — consumes AdminContext ──────────────────────────────────────
function AdminShell() {
  const { adminBottomTab, setAdminBottomTab } = useAdmin();

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
    <View style={styles.shell}>
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
  shell: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});
