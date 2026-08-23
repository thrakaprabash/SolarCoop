import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BatteryCharging } from 'lucide-react-native';

import { colors, weight } from '../theme';
import { Card, Divider, IconBadge, Metric } from './ui';
import { kwh, rate as fmtRate } from '../utils/format';

export default function PoolSummaryCard({ pool }) {
  return (
    <Card padding={18}>
      <View style={styles.headRow}>
        <IconBadge size={50}>
          <BatteryCharging size={26} color={colors.tealLight} strokeWidth={2} />
        </IconBadge>
        <Metric label="Total Pool Available" value={kwh(pool.total)} unit="kWh" />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Households Online</Text>
          <Text style={styles.statValue}>{pool.onlineCount + ' of ' + pool.totalCount}</Text>
        </View>
        <Divider vertical />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Avg Co-op Rate</Text>
          <Text style={[styles.statValue, { color: colors.amber }]}>
            {'$' + fmtRate(pool.avgRate) + ' / kWh'}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: weight.medium, color: colors.textFaint },
  statValue: { fontSize: 14, fontWeight: weight.heavy, color: colors.textStrong, marginTop: 2 },
});
