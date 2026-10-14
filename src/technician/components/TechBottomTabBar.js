import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Activity, Stethoscope, User, Wrench } from 'lucide-react-native';
import { useTechnicianTheme, useTechStyles } from '../TechnicianTheme';

const TABS = [
  { key: 'dashboard',   labelKey: 'technician.nav.dashboard',   icon: Wrench },
  { key: 'diagnostics', labelKey: 'technician.nav.diagnostics', icon: Stethoscope },
  { key: 'health',      labelKey: 'technician.nav.health',      icon: Activity },
  { key: 'profile',     labelKey: 'technician.nav.profile',     icon: User },
];

export default function TechBottomTabBar({ activeKey, onSelect, badges = {} }) {
  const { TECH } = useTechnicianTheme();
  const styles = useTechStyles(createStyles);
  const { t } = useTranslation();

  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const active = tab.key === activeKey;
        const color = active ? TECH.orange : TECH.textMuted;
        const Icon = tab.icon;
        const badge = badges[tab.key];
        return (
          <Pressable key={tab.key} style={({pressed})=>[styles.tab,pressed&&styles.pressed]} onPress={() => onSelect(tab.key)} accessibilityRole="tab" accessibilityState={{selected:active}}>
            {active ? <View style={styles.activeIndicator} pointerEvents="none"/> : null}
            <View style={styles.icon}>
              <Icon size={20} color={color} strokeWidth={active ? 2.3 : 1.8} />
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

const createStyles = TECH => StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 4,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: TECH.border,
    backgroundColor: TECH.card,
  },
  tab: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 4 },
  icon: { width: 28, height: 24, alignItems: 'center', justifyContent: 'center' },
  activeIndicator: { position: 'absolute', top: 0, width: 18, height: 2, borderRadius: 1, backgroundColor: TECH.orange },
  pressed: { opacity: 0.65 },
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
  label: { fontSize: 11 },
});
