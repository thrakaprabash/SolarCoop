import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../theme/colors';
import { useAdmin } from '../context/AdminContext';
import { ShieldCheck, LogOut } from 'lucide-react-native';

export default function AdminHeader() {
  const { t } = useTranslation();
  const {
    adminHeaderToggle,
    setAdminHeaderToggle,
    setAdminBottomTab,
    onExit,
    alerts,
    alertsError,
    openAlertCount,
    urgentAlertCount,
  } = useAdmin();

  // The pill reflects real alert state instead of a hardcoded "System OK":
  // red for open Critical/High alerts, amber for lesser open ones, teal only
  // when nothing needs attention. If alerts couldn't load at all we say so
  // rather than claim everything is fine.
  const pill =
    alertsError && alerts.length === 0
      ? { text: t('admin.header.alertsUnavailable'), color: COLORS.amberLight, bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' }
      : urgentAlertCount > 0
        ? { text: t('admin.header.urgent', { count: urgentAlertCount }), color: COLORS.red, bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' }
        : openAlertCount > 0
          ? { text: t('admin.header.openAlerts', { count: openAlertCount }), color: COLORS.amberLight, bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' }
          : { text: t('admin.header.systemOk'), color: COLORS.tealLight, bg: 'rgba(20,184,166,0.12)', border: 'rgba(20,184,166,0.25)' };

  const handleToggle = (toggleKey) => {
    setAdminHeaderToggle(toggleKey);
    setAdminBottomTab('dashboard');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm
        ? window.confirm(t('admin.header.logoutConfirmWeb'))
        : true;
      if (confirmed) {
        onExit();
      }
      return;
    }

    Alert.alert(
      t('admin.settings.logout'),
      t('admin.header.logoutConfirmNative'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('admin.settings.logout'), style: 'destructive', onPress: onExit },
      ]
    );
  };

  return (
    <View style={styles.headerContainer}>
      {/* Top Row */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <ShieldCheck size={18} color={COLORS.amberLight} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.appName}>{t('common.appName')}</Text>
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>{t('admin.header.adminBadge')}</Text>
              </View>
            </View>
            <Text style={styles.subTitle}>{t('admin.header.subtitle')}</Text>
          </View>
        </View>

        {/* System Status Pill — links to the alerts inbox */}
        <TouchableOpacity
          style={[styles.statusPill, { backgroundColor: pill.bg, borderColor: pill.border }]}
          onPress={() => setAdminBottomTab('alerts')}
          activeOpacity={0.7}
        >
          <View style={[styles.statusDot, { backgroundColor: pill.color }]} />
          <Text style={[styles.statusText, { color: pill.color }]}>{pill.text}</Text>
        </TouchableOpacity>
      </View>

      {/* Second Row — Toggle + Logout */}
      <View style={styles.bottomRow}>
        {/* Overview / System Health Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleTab, adminHeaderToggle === 'overview' && styles.toggleTabActive]}
            onPress={() => handleToggle('overview')}
          >
            <Text style={[styles.toggleText, adminHeaderToggle === 'overview' && styles.toggleTextActive]}>
              {t('admin.header.overview')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleTab, adminHeaderToggle === 'health' && styles.toggleTabActive]}
            onPress={() => handleToggle('health')}
          >
            <Text style={[styles.toggleText, adminHeaderToggle === 'health' && styles.toggleTextActive]}>
              {t('admin.dashboard.systemHealth')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutHeaderBtn} onPress={handleLogout} activeOpacity={0.7}>
          <LogOut size={13} color={COLORS.red} />
          <Text style={styles.logoutHeaderText}>{t('admin.settings.logout')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textBright,
    letterSpacing: -0.3,
  },
  adminBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adminBadgeText: {
    color: COLORS.amberLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  subTitle: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
    borderColor: 'rgba(20, 184, 166, 0.25)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.tealLight,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.tealLight,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: 3,
  },
  toggleTab: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
  },
  toggleTabActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  toggleTextActive: {
    color: COLORS.amberLight,
    fontWeight: '700',
  },
  logoutHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.28)',
  },
  logoutHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.red,
  },
});
