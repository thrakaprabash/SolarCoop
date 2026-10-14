import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, type } from '../../theme';
import { useThemedStyles, useLegacyTheme } from '../../../theme/useLegacyTheme';

/** Big number + unit + caption, e.g. "4.2 kWh / Available". */
export default function Metric({
  value,
  unit,
  label,
  color = colors.tealLight,
  align = 'left',
  size = 'lg',
  labelColor = colors.textMuted,
}) {
  const styles = useThemedStyles(baseStyles);
  const { colors } = useLegacyTheme();

  const numberStyle = size === 'lg' ? type.metric : type.metricSm;
  return (
    <View style={{ alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      {label ? <Text style={[styles.label, { color: labelColor }]}>{label}</Text> : null}
      <Text style={[numberStyle, { color }]}>
        {value}
        {unit ? <Text style={styles.unit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

const baseStyles = StyleSheet.create({
  label: { ...type.labelCaps, fontSize: 10 },
  unit: { fontSize: 18, fontWeight: '600' },
});
