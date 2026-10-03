import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRightLeft, Bell, LayoutDashboard, User, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, radius, weight } from '../../trade/theme';

const TABS = [
  { key: 'dashboard', labelKey: 'member.nav.dashboard', icon: LayoutDashboard },
  { key: 'trade', labelKey: 'member.nav.trade', icon: ArrowRightLeft },
  { key: 'energy', labelKey: 'member.nav.energy', icon: Zap },
  { key: 'alerts', labelKey: 'member.nav.alerts', icon: Bell },
  { key: 'profile', labelKey: 'member.nav.profile', icon: User },
];

export default function BottomTabBar({ activeKey, onSelect, bottomInset = 20 }) {
  const { t } = useTranslation();
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
            onPress={() => onSelect(tab.key)}
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
              {t(tab.labelKey)}
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
