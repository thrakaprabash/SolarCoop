import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Sun, Moon, Smartphone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/useTheme';
import { LIGHT_ACTION } from '../../theme/lightTones';

export function ThemeSwitcher({ compact = false }) {
  const { t } = useTranslation();
  const { colors, preference, setPreference, isDark } = useTheme();
  // Light mode: the chosen appearance uses the shared "selected" look (sun tint),
  // the same as the language pills and the header tabs.
  const selectedLook = isDark ? null : LIGHT_ACTION.selected;
  const selectedColor = selectedLook ? selectedLook.icon : colors.primaryDark || colors.primary;
  const options = compact
    ? [[isDark ? 'light' : 'dark', isDark ? Sun : Moon]]
    : [['light', Sun], ['dark', Moon], ['system', Smartphone]];
  // The one-tap toggle in the header reads as a single round button in light
  // mode: no outer ring and no tinted inner tile, just a white circle.
  const quiet = compact && !isDark;
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, compact && styles.compact, quiet && styles.compactQuiet]}>
      {!compact && <Text style={[styles.title, { color: colors.text }]}>{t('appearance.title')}</Text>}
      <View style={styles.row} accessibilityRole={compact ? undefined : 'radiogroup'} accessibilityLabel={t('appearance.title')}>
        {options.map(([mode, Icon]) => {
          const selected = preference === mode;
          return (
            <TouchableOpacity key={mode} onPress={() => setPreference(mode)} accessibilityRole={compact ? 'button' : 'radio'}
              accessibilityLabel={t(`appearance.${mode}`)} accessibilityState={compact ? undefined : { checked: selected }}
              style={[
                styles.option,
                { backgroundColor: selected ? colors.primarySoft : colors.cardAlt, borderColor: selected ? colors.primary : colors.border },
                selected && selectedLook && selectedLook.box,
                // Light mode: unselected options are plain white outlines, not mint tiles.
                !selected && !isDark && { backgroundColor: colors.card },
                quiet && { backgroundColor: colors.card, borderRadius: 22 },
              ]}>
              <Icon size={quiet ? 18 : 16} color={selected ? selectedColor : quiet ? colors.text : colors.textSecondary} />
              {!compact && <Text style={{ color: selected ? selectedColor : colors.textSecondary, fontWeight: '700', fontSize: 12 }}>{t(`appearance.${mode}`)}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { padding: 16, borderWidth: 1, borderRadius: 20, gap: 12 },
  compact: { padding: 4, borderRadius: 24 },
  compactQuiet: { backgroundColor: 'transparent', borderColor: 'transparent' },
  title: { fontSize: 15, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 6 },
  option: { flex: 1, minHeight: 44, minWidth: 44, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 8 },
});
