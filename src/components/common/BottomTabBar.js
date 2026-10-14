import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRightLeft, Bell, LayoutDashboard, User, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, radius, weight } from '../../trade/theme';
import { useThemedStyles, useLegacyTheme } from '../../theme/useLegacyTheme';

const TABS = [
  { key: 'dashboard', labelKey: 'member.nav.dashboard', icon: LayoutDashboard },
  { key: 'trade', labelKey: 'member.nav.trade', icon: ArrowRightLeft },
  { key: 'energy', labelKey: 'member.nav.energy', icon: Zap },
  { key: 'alerts', labelKey: 'member.nav.alerts', icon: Bell },
  { key: 'profile', labelKey: 'member.nav.profile', icon: User },
];

export default function BottomTabBar({ activeKey, onSelect, bottomInset = 20 }) {
  const styles = useThemedStyles(baseStyles);
  const { colors, themeColor } = useLegacyTheme();

  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
  const usesCompactLabels = language === 'si' || language === 'ta';
  // Sinhala and Tamil labels are much wider than English ones. On web each tab is
  // never narrower than its longest word (min-content) and the rest share the spare
  // room, so a word never breaks mid-word; native shrinks the label font instead.
  return (
    <View style={[styles.bar, usesCompactLabels && styles.barCompact, { paddingBottom: Math.max(bottomInset, 12) }]}>
      {TABS.map((tab) => {
        const active = tab.key === activeKey;
        const color = active ? colors.amberLight : colors.textFaint;
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onSelect(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={t(tab.labelKey)}
            accessibilityState={{ selected: active }}
          >
            <View
              style={[
                styles.iconWrap,
                active && { backgroundColor: colors.amberTint, borderColor: themeColor("rgba(245,158,11,0.3)", "borderColor") },
              ]}
            >
              <Icon size={18} color={color} strokeWidth={2} />
            </View>
            <Text
              style={[
                styles.label,
                usesCompactLabels && styles.labelLocalized,
                { color, fontWeight: active ? weight.heavy : weight.medium },
              ]}
              numberOfLines={usesCompactLabels ? 2 : 1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
            >
              {t(tab.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const baseStyles = StyleSheet.create({
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
  barCompact: { alignItems: 'flex-start', paddingHorizontal: 4 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 3, ...Platform.select({ web: { minWidth: 'min-content' }, default: {} }) },
  iconWrap: {
    width: 44,
    height: 30,
    borderRadius: radius.pill - 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  label: { width: '100%', fontSize: 10, lineHeight: 13, textAlign: 'center' },
  labelLocalized: { fontSize: 10, lineHeight: 13 },
});
