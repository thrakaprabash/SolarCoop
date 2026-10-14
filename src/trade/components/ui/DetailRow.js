import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, weight } from '../../theme';
import { useThemedStyles, useLegacyTheme } from '../../../theme/useLegacyTheme';

/** Label on the left, value (or any node) on the right. */
export default function DetailRow({ label, value, valueColor, valueSize = 12, children }) {
  const styles = useThemedStyles(baseStyles);
  const { colors } = useLegacyTheme();

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

const baseStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  label: { fontSize: 11, fontWeight: weight.medium, color: colors.textMuted },
  value: { fontWeight: weight.heavy },
});
