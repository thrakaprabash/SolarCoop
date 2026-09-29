/**
 * src/technician/TechnicianPortal.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Technician Portal shell (Epic 9 / SOL-191). Mounted by App.js's RoleRouter
 * for profiles with role = 'technician'. Mirrors src/admin/AdminPortal.js:
 * a provider for shared state, and a thin shell that swaps screens off the
 * bottom tab — react-navigation isn't installed in this project.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { TechnicianProvider, useTechnician } from './context/TechnicianContext';
import { TECH } from './theme';
import TechHeader from './components/TechHeader';
import TechBottomTabBar from './components/TechBottomTabBar';
import TechnicianDashboardScreen from './screens/TechnicianDashboardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

function TechnicianShell() {
  const { techBottomTab, setTechBottomTab } = useTechnician();

  const renderScreen = () => {
    switch (techBottomTab) {
      case 'profile':   return <ProfileScreen />;
      case 'dashboard':
      default:          return <TechnicianDashboardScreen />;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.safeArea}>
        {techBottomTab !== 'profile' && <TechHeader />}
        <View style={styles.screen}>{renderScreen()}</View>
        <TechBottomTabBar activeKey={techBottomTab} onSelect={setTechBottomTab} />
      </View>
    </View>
  );
}

export default function TechnicianPortal({ onExit }) {
  return (
    <TechnicianProvider onExit={onExit}>
      <TechnicianShell />
    </TechnicianProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: TECH.bg },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 50,
  },
  screen: { flex: 1 },
});
