import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../theme/colors';
import { useAdmin } from '../context/AdminContext';
import { ShieldCheck, ArrowLeft } from 'lucide-react-native';

export default function AdminHeader() {
  const { adminHeaderToggle, setAdminHeaderToggle, onExit } = useAdmin();

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
              <Text style={styles.appName}>SolarCoop</Text>
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            </View>
            <Text style={styles.subTitle}>Community Management Portal</Text>
          </View>
        </View>

        {/* System Status Pill */}
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>System OK</Text>
        </View>
      </View>

      {/* Second Row — Toggle + Exit */}
      <View style={styles.bottomRow}>
        {/* Overview / System Health Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleTab, adminHeaderToggle === 'overview' && styles.toggleTabActive]}
            onPress={() => setAdminHeaderToggle('overview')}
          >
            <Text style={[styles.toggleText, adminHeaderToggle === 'overview' && styles.toggleTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleTab, adminHeaderToggle === 'health' && styles.toggleTabActive]}
            onPress={() => setAdminHeaderToggle('health')}
          >
            <Text style={[styles.toggleText, adminHeaderToggle === 'health' && styles.toggleTextActive]}>
              System Health
            </Text>
          </TouchableOpacity>
        </View>

        {/* Exit Button */}
        <TouchableOpacity style={styles.exitBtn} onPress={onExit} activeOpacity={0.7}>
          <ArrowLeft size={13} color={COLORS.textSecondary} />
          <Text style={styles.exitText}>Exit Admin</Text>
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
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  exitText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
