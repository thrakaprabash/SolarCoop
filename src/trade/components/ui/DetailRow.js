import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { colors, weight } from '../../theme';

/** Label on the left, value (or any node) on the right. */
export default function DetailRow({ label, value, valueColor, valueSize = 12, children }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {children || (
        <Text style={[styles.value, { color: valueColor || colors.textStrong, fontSize: valueSize }]}>
          {value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  label: { flex: 1, minWidth: 0, fontSize: 11, fontWeight: weight.medium, color: colors.textMuted },
  value: { flex: 2, minWidth: 0, flexShrink: 1, fontWeight: weight.heavy, textAlign: 'right',
    ...(Platform.OS === 'web' ? { overflowWrap: 'anywhere' } : {}) },
});
