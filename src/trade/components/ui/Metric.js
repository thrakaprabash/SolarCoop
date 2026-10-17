import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { type } from '../../theme';
import { useThemedStyles, useLegacyTheme } from '../../../theme/useLegacyTheme';

/** Big number + unit + caption, e.g. "4.2 kWh / Available". */
export default function Metric({
  value,
  unit,
  label,
  color,
  align = 'left',
  size = 'lg',
  labelColor,
}) {
  const styles = useThemedStyles(baseStyles);
  const { colors } = useLegacyTheme();

  // Defaults come from the active theme: a static dark-theme colour here would be
  // pale teal on white (1.9:1) and an invisible white caption in light mode.
  const numberStyle = size === 'lg' ? type.metric : type.metricSm;
  return (
    <View style={{ alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      {label ? <Text style={[styles.label, { color: labelColor || colors.textMuted }]}>{label}</Text> : null}
      <Text style={[numberStyle, { color: color || colors.tealLight }]}>
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
