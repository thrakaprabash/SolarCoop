import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, weight } from '../theme';
import { Card, IconBadge, ProgressBar } from './ui';

export default function ImpactStatCard({
  icon: Icon,
  iconColor = colors.tealLight,
  tint = colors.tealTint,
  value,
  unit,
  label,
  progress,
}) {
  return (
    <Card padding={18} style={progress != null ? styles.stacked : styles.row}>
      <View style={styles.row}>
        <IconBadge size={50} background={tint}>
          <Icon size={24} color={iconColor} strokeWidth={2} />
        </IconBadge>
        <View>
          <Text style={[styles.value, { color: iconColor }]}>
            {value}
            {unit ? <Text style={styles.unit}> {unit}</Text> : null}
          </Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>
      {progress != null ? <ProgressBar value={progress} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stacked: { gap: 14 },
  value: { fontSize: 32, fontWeight: weight.heavy, lineHeight: 36 },
  unit: { fontSize: 18, fontWeight: weight.medium },
  label: {
    fontSize: 12,
    fontWeight: weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: colors.textMuted,
    marginTop: 2,
  },
});
