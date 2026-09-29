/**
 * src/technician/TechnicianPortal.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Technician Portal shell (Epic 9 / SOL-191). Mounted by App.js's RoleRouter
 * for profiles with role = 'technician'. Mirrors src/admin/AdminPortal.js:
 * a provider for shared state, and a thin shell that swaps screens off the
 * bottom tab — react-navigation isn't installed in this project.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { TechnicianProvider, useTechnician } from './context/TechnicianContext';
import { TECH } from './theme';
import TechHeader from './components/TechHeader';
import TechBottomTabBar from './components/TechBottomTabBar';
import TechnicianDashboardScreen from './screens/TechnicianDashboardScreen';
import JobTicketDetailScreen from './screens/JobTicketDetailScreen';
import DiagnosticsScreen from './screens/DiagnosticsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

function TechnicianShell() {
  const {
    techBottomTab, setTechBottomTab, loadJobs, selectedJob, closeJob, urgentAlertCount,
  } = useTechnician();

  // Load the job board as soon as the portal mounts.
  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Switching tabs always leaves the job that was open.
  const handleTabSelect = (key) => {
    closeJob();
    setTechBottomTab(key);
  };

  // A job ticket takes over the whole screen, as in the Figma dossier frame.
  if (selectedJob) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.safeArea}>
          <JobTicketDetailScreen />
        </View>
      </View>
    );
  }

  const renderScreen = () => {
    switch (techBottomTab) {
      case 'diagnostics': return <DiagnosticsScreen />;
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
        <TechBottomTabBar
          activeKey={techBottomTab}
          onSelect={handleTabSelect}
          badges={{ diagnostics: urgentAlertCount }}
        />
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
