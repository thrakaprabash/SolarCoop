import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BatteryCharging } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, weight } from '../theme';
import { Card, Divider, IconBadge, Metric } from './ui';
import { tradeKwh as kwh, rate as fmtRate } from '../utils/format';

export default function PoolSummaryCard({ pool }) {
  const { t } = useTranslation();
  return (
    <Card padding={18}>
      <View style={styles.headRow}>
        <IconBadge size={50}>
          <BatteryCharging size={26} color={colors.tealLight} strokeWidth={2} />
        </IconBadge>
        <Metric label={t('trade.pool.totalAvailable')} value={kwh(pool.total)} unit="kWh" />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('trade.pool.householdsOnline')}</Text>
          <Text style={styles.statValue}>{t('trade.pool.onlineOfTotal', { online: pool.onlineCount, total: pool.totalCount })}</Text>
        </View>
        <Divider vertical />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('trade.pool.avgRate')}</Text>
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
