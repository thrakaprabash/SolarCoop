import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Zap } from 'lucide-react-native';

import { colors, weight } from '../theme';
import { kwh } from '../utils/format';
import { Card, Divider, IconBadge, Pill } from './ui';

/**
 * Available surplus block. Compact by default (Incoming Requests header),
 * large with an icon on the approval screen, plus an optional
 * "after approval" projection row.
 */
export default function SurplusCard({ surplus, pending, large = false, afterText, afterColor }) {
  return (
    <Card padding={large ? 18 : 16} style={large ? styles.largeCard : styles.row}>
      <View style={large ? styles.largeHead : null}>
        {large ? (
          <IconBadge size={50}>
            <Zap size={24} color={colors.tealLight} strokeWidth={2} />
          </IconBadge>
        ) : null}
        <View>
          <Text style={styles.label}>Available Surplus</Text>
          <Text style={[styles.value, large && styles.valueLarge]}>
            {kwh(surplus)}
            <Text style={[styles.unit, large && styles.unitLarge]}>{' kWh'}</Text>
          </Text>
        </View>
      </View>

      {pending != null && !large ? (
        <Pill
          label={pending + ' pending'}
          color={colors.amberLight}
          background={colors.amberTint}
          style={styles.pendingPill}
        />
      ) : null}

      {afterText ? (
        <>
          <Divider />
          <View style={styles.afterRow}>
            <Text style={styles.afterLabel}>After approval</Text>
            <Text style={[styles.afterValue, { color: afterColor || colors.tealLight }]}>{afterText}</Text>
          </View>
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  largeCard: { gap: 14 },
  largeHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  label: {
    fontSize: 10,
    fontWeight: weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: colors.textMuted,
  },
  value: { fontSize: 28, fontWeight: weight.heavy, color: colors.tealLight, lineHeight: 32 },
  valueLarge: { fontSize: 32, lineHeight: 36 },
  unit: { fontSize: 15, fontWeight: weight.medium },
  unitLarge: { fontSize: 18 },
  pendingPill: { borderColor: colors.amberBorder },
  afterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  afterLabel: { fontSize: 11, fontWeight: weight.medium, color: colors.textMuted },
  afterValue: { fontSize: 14, fontWeight: weight.heavy },
});
