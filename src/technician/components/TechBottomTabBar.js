import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Stethoscope, User, Wrench } from 'lucide-react-native';
import { TECH } from '../theme';

const TABS = [
  { key: 'dashboard',   labelKey: 'technician.nav.dashboard',   icon: Wrench },
  { key: 'diagnostics', labelKey: 'technician.nav.diagnostics', icon: Stethoscope },
  { key: 'profile',     labelKey: 'technician.nav.profile',     icon: User },
];

export default function TechBottomTabBar({ activeKey, onSelect, badges = {} }) {
  const { t } = useTranslation();

  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const active = tab.key === activeKey;
        const color = active ? TECH.orange : TECH.textMuted;
        const Icon = tab.icon;
        const badge = badges[tab.key];
        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => onSelect(tab.key)}>
            <View>
              <Icon size={20} color={color} strokeWidth={2} />
              {badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, { color, fontWeight: active ? '700' : '500' }]}>
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
    paddingTop: 10,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: TECH.border,
    backgroundColor: '#1A1511',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  badge: {
    position: 'absolute',
    top: -5,
    right: -9,
    backgroundColor: TECH.red,
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
