import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRightLeft, LayoutDashboard, User, Zap } from 'lucide-react-native';

import { colors, radius, weight } from '../theme';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, screen: null },
  { key: 'trade', label: 'P2P Trade', icon: ArrowRightLeft, screen: 'trade' },
  { key: 'energy', label: 'Energy', icon: Zap, screen: 'insights' },
  { key: 'profile', label: 'Profile', icon: User, screen: null },
];

export default function BottomTabBar({ activeKey, onSelect, bottomInset = 20 }) {
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(bottomInset, 12) }]}>
      {TABS.map((tab) => {
        const active = tab.key === activeKey;
        const color = active ? colors.amberLight : colors.textFaint;
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => (tab.screen ? onSelect(tab.screen) : null)}
          >
            <View
              style={[
                styles.iconWrap,
                active && { backgroundColor: colors.amberTint, borderColor: 'rgba(245,158,11,0.3)' },
              ]}
            >
              <Icon size={18} color={color} strokeWidth={2} />
            </View>
            <Text style={[styles.label, { color, fontWeight: active ? weight.heavy : weight.medium }]}>
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
    backgroundColor: colors.navBar,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  iconWrap: {
    width: 44,
    height: 30,
    borderRadius: radius.pill - 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  label: { fontSize: 10 },
});
