/**
 * src/components/common/LanguageSwitcher.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Epic 6 item 20 — lets a signed-in user switch the app's language and
 * remembers the choice (via setAppLanguage, src/i18n/index.js) for next
 * launch. Shared across every role: dropped into the member/technician
 * ProfileScreen and the admin AdminSettingsScreen.
 *
 * Language names are shown in their own script (English / සිංහල / தமிழ்),
 * never translated — a reader picks their language by recognizing its own
 * name, not by reading it in whatever language happens to be active.
 *
 * `colors` is optional: screens with their own light/dark-aware theme (e.g.
 * ProfileScreen via useTheme()) pass their token object through; screens on
 * the static dark "glass" palette (e.g. AdminSettingsScreen) can omit it and
 * get a matching dark-glass default.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Languages } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { useThemedStyles, useLegacyTheme } from '../../theme/useLegacyTheme';

const LANGUAGES = [
  { code: 'en', nativeLabel: 'English' },
  { code: 'si', nativeLabel: 'සිංහල' },
  { code: 'ta', nativeLabel: 'தமிழ்' },
];

const DEFAULT_COLORS = {
  card: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.1)',
  text: '#F8FAFC',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  primary: '#F59E0B',
};

export const LanguageSwitcher = ({ colors }) => {
  const styles = useThemedStyles(baseStyles);
  const { action } = useLegacyTheme();

  const { t, i18n } = useTranslation();
  const appTheme = useTheme();
  const theme = colors || appTheme.colors;
  // Light mode: the chosen language uses the shared "selected" look (sun tint).
  const activeColor = action.selected.icon ?? (theme.primaryDark || theme.primary);
  const activeCode = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <Languages size={15} color={theme.primary} strokeWidth={2.2} />
        <Text style={[styles.title, { color: theme.text }]}>{t('common.language')}</Text>
      </View>

      <View style={styles.pillRow}>
        {LANGUAGES.map((lang) => {
          const active = activeCode === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              onPress={() => setAppLanguage(lang.code)}
              activeOpacity={0.8}
              style={[
                styles.pill,
                {
                  backgroundColor: active ? `${theme.primary}26` : 'transparent',
                  borderColor: active ? theme.primary : theme.border,
                },
                active && action.selected.box,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: active ? activeColor : theme.textSecondary },
                ]}
              >
                {lang.nativeLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const baseStyles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 13, fontWeight: '700' },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontSize: 13, fontWeight: '700' },
});
