import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowDown, ArrowUp } from 'lucide-react-native';

import { colors, weight } from '../theme';
import { HISTORY_FILTERS } from '../data/transactions';
import { useTrade } from '../context/TradeContext';
import { useNavigation } from '../context/NavigationContext';
import { kwh } from '../utils/format';
import { byNewest, emptyCopy, groupByMonth, matchesFilter, monthTotals } from '../utils/transactions';
import { TransactionCard } from '../components';
import { Card, Chip, Divider, IconBadge, PrimaryButton, ScreenTitle, SectionLabel } from '../components/ui';

export default function TransactionHistoryScreen() {
  const { transactions } = useTrade();
  const { navigate } = useNavigation();
  const [filter, setFilter] = useState('All');

  const visible = useMemo(
    () => transactions.filter((t) => matchesFilter(t, filter)).sort(byNewest),
    [transactions, filter]
  );
  const groups = useMemo(() => groupByMonth(visible), [visible]);
  const totals = useMemo(() => monthTotals(transactions), [transactions]);
  const empty = emptyCopy(filter);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenTitle title="Transaction History" subtitle="Your completed P2P energy trades" />

      <Card padding={18} style={styles.summary}>
        <Text style={styles.summaryLabel}>This month</Text>
        <View style={styles.totals}>
          <View style={styles.total}>
            <IconBadge size={34}>
              <ArrowUp size={16} color={colors.tealLight} strokeWidth={2.2} />
            </IconBadge>
            <View>
              <Text style={[styles.totalValue, { color: colors.tealLight }]}>
                {kwh(totals.sent)}
                <Text style={styles.totalUnit}>{' kWh'}</Text>
              </Text>
              <Text style={styles.totalCaption}>Shared</Text>
            </View>
          </View>

          <Divider vertical style={styles.totalDivider} />

          <View style={[styles.total, styles.totalRight]}>
            <IconBadge size={34} background={colors.amberTint}>
              <ArrowDown size={16} color={colors.amberLight} strokeWidth={2.2} />
            </IconBadge>
            <View>
              <Text style={[styles.totalValue, { color: colors.amberLight }]}>
                {kwh(totals.received)}
                <Text style={styles.totalUnit}>{' kWh'}</Text>
              </Text>
              <Text style={styles.totalCaption}>Received</Text>
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.filters}>
        {HISTORY_FILTERS.map((f) => (
          <Chip key={f} label={f} active={f === filter} onPress={() => setFilter(f)} />
        ))}
      </View>

      {groups.map((group) => (
        <View key={group.label} style={styles.group}>
          <SectionLabel>{group.label}</SectionLabel>
          {group.items.map((txn) => (
            <TransactionCard
              key={txn.id}
              transaction={txn}
              onPress={() => navigate('transaction', { txnId: txn.id, source: 'history' })}
            />
          ))}
        </View>
      ))}

      {visible.length === 0 ? (
        <Card padding={24} style={styles.empty}>
          <Text style={styles.emptyTitle}>{empty.title}</Text>
          <Text style={styles.emptyBody}>{empty.body}</Text>
          {filter === 'All' ? (
            <PrimaryButton
              label="Find Available Energy"
              variant="ghost"
              onPress={() => navigate('list')}
              style={styles.emptyCta}
            />
          ) : null}
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20, gap: 16 },

  summary: { gap: 14 },
  summaryLabel: {
    fontSize: 10,
    fontWeight: weight.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textFaint,
  },
  totals: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  total: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  totalRight: { paddingLeft: 14 },
  totalDivider: { height: 34 },
  totalValue: { fontSize: 20, fontWeight: weight.heavy, lineHeight: 23 },
  totalUnit: { fontSize: 12, fontWeight: weight.medium },
  totalCaption: {
    fontSize: 10,
    fontWeight: weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: colors.textMuted,
  },

  filters: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  group: { gap: 12 },

  empty: { alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: weight.heavy, color: colors.textStrong },
  emptyBody: { fontSize: 12, lineHeight: 18, fontWeight: weight.medium, color: colors.textMuted, textAlign: 'center' },
  emptyCta: { marginTop: 6, paddingVertical: 11, paddingHorizontal: 16 },
});
