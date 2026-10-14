import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Sun, Moon, Smartphone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/useTheme';

export function ThemeSwitcher({ compact = false }) {
  const { t } = useTranslation();
  const { colors, preference, setPreference, isDark } = useTheme();
  const options = compact
    ? [[isDark ? 'light' : 'dark', isDark ? Sun : Moon]]
    : [['light', Sun], ['dark', Moon], ['system', Smartphone]];
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, compact && styles.compact]}>
      {!compact && <Text style={[styles.title, { color: colors.text }]}>{t('appearance.title')}</Text>}
      <View style={styles.row} accessibilityRole={compact ? undefined : 'radiogroup'} accessibilityLabel={t('appearance.title')}>
        {options.map(([mode, Icon]) => {
          const selected = preference === mode;
          return (
            <TouchableOpacity key={mode} onPress={() => setPreference(mode)} accessibilityRole={compact ? 'button' : 'radio'}
              accessibilityLabel={t(`appearance.${mode}`)} accessibilityState={compact ? undefined : { checked: selected }}
              style={[styles.option, { backgroundColor: selected ? colors.primarySoft : colors.cardAlt, borderColor: selected ? colors.primary : colors.border }]}>
              <Icon size={16} color={selected ? colors.primary : colors.textSecondary} />
              {!compact && <Text style={{ color: selected ? colors.primary : colors.textSecondary, fontWeight: '700', fontSize: 12 }}>{t(`appearance.${mode}`)}</Text>}
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
  title: { fontSize: 15, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 6 },
  option: { flex: 1, minHeight: 44, minWidth: 44, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 8 },
});
