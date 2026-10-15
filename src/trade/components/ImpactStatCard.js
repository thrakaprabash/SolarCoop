import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, weight } from '../theme';
import { Card, IconBadge, ProgressBar } from './ui';
import { useThemedStyles, useLegacyTheme } from '../../theme/useLegacyTheme';

export default function ImpactStatCard({
  icon: Icon,
  iconColor,
  tint,
  value,
  unit,
  label,
  progress,
}) {
  const styles = useThemedStyles(baseStyles);
  const { colors, themeColor } = useLegacyTheme();

  // Defaults and passed-in colours are mapped for the active theme: the dark
  // theme's bright teal is only 1.9:1 on a white light-mode card.
  const accent = themeColor(iconColor, 'color') || colors.tealLight;
  const fill = themeColor(tint, 'backgroundColor') || colors.tealTint;

  return (
    <Card padding={18} style={progress != null ? styles.stacked : styles.row}>
      <View style={[styles.row, styles.fullWidth]}>
        <IconBadge size={50} background={fill}>
          <Icon size={24} color={accent} strokeWidth={2} />
        </IconBadge>
        <View style={styles.details}>
          <Text style={[styles.value, { color: accent }]}>
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

const baseStyles = StyleSheet.create({
  fullWidth: { width: '100%' },
  details: { flex: 1 },
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
