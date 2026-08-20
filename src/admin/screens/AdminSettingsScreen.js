import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS, GLASS } from '../../theme/colors';
import { useAdmin } from '../context/AdminContext';
import {
  UserCog,
  ShieldCheck,
  Info,
  LogOut,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react-native';

export default function AdminSettingsScreen() {
  const { onExit } = useAdmin();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Login has not been implemented yet. Exiting the Admin Panel instead.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit Admin', onPress: onExit },
      ]
    );
  };

  const menuItems = [
    { icon: Info,       label: 'About SolarCoop',  sub: 'Community Energy Sharing App v1.0.0' },
    { icon: ShieldCheck, label: 'Admin Privileges', sub: 'Full system access · EPIC-04 scope' },
    { icon: UserCog,    label: 'System Info',       sub: 'Expo SDK 57 · React Native 0.86' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Title */}
      <View style={styles.titleRow}>
        <UserCog size={18} color={COLORS.amberLight} />
        <Text style={styles.screenTitle}>Admin Profile</Text>
      </View>

      {/* Admin Profile Card */}
      <View style={[GLASS.card, styles.profileCard]}>
        <View style={styles.profileBanner} />
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>AD</Text>
        </View>
        <Text style={styles.adminName}>Administrator</Text>
        <Text style={styles.adminEmail}>admin@solarcoop.app</Text>
        <View style={styles.roleBadge}>
          <ShieldCheck size={12} color={COLORS.amberLight} />
          <Text style={styles.roleBadgeText}>SUPER ADMIN</Text>
        </View>
        <View style={styles.adminInfoRow}>
          <View style={styles.adminInfoItem}>
            <Text style={styles.adminInfoNum}>12</Text>
            <Text style={styles.adminInfoLabel}>Members</Text>
          </View>
          <View style={styles.adminInfoDivider} />
          <View style={styles.adminInfoItem}>
            <Text style={styles.adminInfoNum}>4</Text>
            <Text style={styles.adminInfoLabel}>Open Issues</Text>
          </View>
          <View style={styles.adminInfoDivider} />
          <View style={styles.adminInfoItem}>
            <Text style={styles.adminInfoNum}>∞</Text>
            <Text style={styles.adminInfoLabel}>Access Level</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={[GLASS.card, styles.menuCard]}>
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <View key={i}>
              <View style={styles.menuRow}>
                <View style={styles.menuIconWrap}>
                  <Icon size={16} color={COLORS.amberLight} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <ChevronRight size={16} color={COLORS.textMuted} />
              </View>
              {i < menuItems.length - 1 && <View style={styles.menuDivider} />}
            </View>
          );
        })}
      </View>

      {/* Exit Admin Panel */}
      <TouchableOpacity style={styles.exitBtn} onPress={onExit} activeOpacity={0.8}>
        <ArrowLeft size={18} color={COLORS.tealLight} />
        <Text style={styles.exitBtnText}>Exit Admin Panel</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <LogOut size={18} color={COLORS.red} />
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.footerNote}>
        Login & role-based routing will be implemented in Sprint 2 (CES-40).
      </Text>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 14 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  screenTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textBright },

  profileCard: { padding: 20, alignItems: 'center', gap: 10, overflow: 'hidden' },
  profileBanner: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 50,
    backgroundColor: 'rgba(245,158,11,0.1)',
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(245,158,11,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: COLORS.amberLight },
  adminName: { fontSize: 22, fontWeight: '800', color: COLORS.textBright },
  adminEmail: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleBadgeText: { color: COLORS.amberLight, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  adminInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', marginTop: 6 },
  adminInfoItem: { alignItems: 'center', gap: 3 },
  adminInfoNum: { fontSize: 20, fontWeight: '800', color: COLORS.textBright },
  adminInfoLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  adminInfoDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' },

  menuCard: { padding: 4, gap: 0 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1, gap: 2 },
  menuLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  menuSub: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  menuDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 14 },

  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(20,184,166,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.3)',
  },
  exitBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.tealLight },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  logoutBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.red },

  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    lineHeight: 16,
  },
});
