import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  LayoutDashboard,
  Users,
  Receipt,
  MessageSquare,
  UserCog,
} from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { colors } from '../../trade/theme';
import { useAdmin } from '../context/AdminContext';
import { MOCK_COMPLAINTS, MOCK_TRANSACTIONS } from '../data/mockAdminData';

const TAB_KEYS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'members',   label: 'Members',   icon: Users },
  { key: 'ledger',    label: 'Ledger',    icon: Receipt },
  { key: 'reports',   label: 'Reports',   icon: MessageSquare },
  { key: 'profile',   label: 'Profile',   icon: UserCog },
];

export default function AdminBottomTabBar({ activeKey, onSelect, bottomInset = 20 }) {
  const { communityStats } = useAdmin();

  // Live badges: members count from Supabase; others from mock until wired
  const TABS = TAB_KEYS.map(t => ({
    ...t,
    badge:
      t.key === 'members' ? (communityStats?.totalMembers ?? null) :
      t.key === 'ledger'  ? MOCK_TRANSACTIONS.filter(tx => tx.status === 'Pending').length :
      t.key === 'reports' ? MOCK_COMPLAINTS.filter(c => c.status === 'Open').length :
      null,
  }));

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(bottomInset, 12) }]}>
      {TABS.map((tab) => {
        const active = tab.key === activeKey;
        const color = active ? COLORS.amberLight : colors.textFaint;
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onSelect(tab.key)}
          >
            <View style={styles.iconWrapper}>
              <View
                style={[
                  styles.iconWrap,
                  active && { backgroundColor: 'rgba(245,158,11,0.2)', borderColor: 'rgba(245,158,11,0.3)' },
                ]}
              >
                <Icon size={18} color={color} strokeWidth={2} />
              </View>
              {/* Badge */}
              {tab.badge != null && tab.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, { color, fontWeight: active ? '700' : '500' }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: 'rgba(8, 10, 28, 0.85)',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  iconWrapper: { position: 'relative' },
  iconWrap: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.red,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  label: { fontSize: 10 },
});
