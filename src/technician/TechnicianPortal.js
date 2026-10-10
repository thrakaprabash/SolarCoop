/**
 * src/technician/TechnicianPortal.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Technician Portal shell (Epic 9 / SOL-191). Mounted by App.js's RoleRouter
 * for profiles with role = 'technician'. Mirrors src/admin/AdminPortal.js:
 * a provider for shared state, and a thin shell that swaps screens off the
 * bottom tab — react-navigation isn't installed in this project.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { TechnicianProvider, useTechnician } from './context/TechnicianContext';
import { TechnicianThemeProvider, useTechnicianTheme } from './TechnicianTheme';
import TechHeader from './components/TechHeader';
import TechnicianAlertCenter from './components/TechnicianAlertCenter';
import TechBottomTabBar from './components/TechBottomTabBar';
import TechnicianDashboardScreen from './screens/TechnicianDashboardScreen';
import JobTicketDetailScreen from './screens/JobTicketDetailScreen';
import DiagnosticsScreen from './screens/DiagnosticsScreen';
import SystemHealthScreen from './screens/SystemHealthScreen';
import JobClosureScreen from './screens/JobClosureScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

function TechnicianShell() {
  const { TECH, mode } = useTechnicianTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    techBottomTab, setTechBottomTab, loadJobs, selectedJob, closeJob, closureOpen, urgentAlertCount,
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

  const renderScreen = () => {
    switch (techBottomTab) {
      case 'diagnostics': return <DiagnosticsScreen />;
      case 'health': return <SystemHealthScreen />;
      case 'profile':   return <ProfileScreen />;
      case 'dashboard':
      default:          return <TechnicianDashboardScreen />;
    }
  };

  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={[styles.root, { backgroundColor: TECH.bg }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.workspace}>
        <TechHeader onSettings={() => setSettingsOpen(true)} />
        <TechnicianAlertCenter settingsOpen={settingsOpen} onCloseSettings={() => setSettingsOpen(false)} />
        <View style={styles.screen}>{selectedJob
          ? closureOpen && selectedJob.status === 'active' ? <JobClosureScreen /> : <JobTicketDetailScreen />
          : renderScreen()}</View>
        {!selectedJob && <TechBottomTabBar
          activeKey={techBottomTab}
          onSelect={handleTabSelect}
          badges={{ diagnostics: urgentAlertCount }}
        />}
      </View>
    </SafeAreaView>
  );
}

export default function TechnicianPortal({ onExit }) {
  return (
    <TechnicianProvider onExit={onExit}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <TechnicianThemeProvider><TechnicianShell /></TechnicianThemeProvider>
      </SafeAreaProvider>
    </TechnicianProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  workspace: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  screen: { flex: 1 },
});
