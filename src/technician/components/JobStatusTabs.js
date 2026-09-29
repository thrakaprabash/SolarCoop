import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TECH } from '../theme';

const TABS = ['pending', 'active', 'completed'];

/**
 * Pending / Active / Completed segmented control. Counts are shown for the
 * two queues a technician works from; "Completed" stays a plain label so the
 * number of finished jobs doesn't compete for attention.
 */
export default function JobStatusTabs({ value, onChange, counts }) {
  const { t } = useTranslation();

  return (
    <View style={styles.track}>
      {TABS.map((key) => {
        const active = key === value;
        const count = key === 'completed' ? null : counts?.[key] ?? 0;
        return (
          <Pressable
            key={key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {count == null
                ? t(`technician.tabs.${key}`)
                : t('technician.tabs.withCount', { label: t(`technician.tabs.${key}`), count })}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: TECH.card,
    borderWidth: 1,
    borderColor: TECH.border,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: TECH.orangeSoft,
    borderWidth: 1,
    borderColor: TECH.orangeBorder,
  },
  label: { fontSize: 12, fontWeight: '600', color: TECH.textSecondary },
  labelActive: { color: TECH.text, fontWeight: '800' },
});
