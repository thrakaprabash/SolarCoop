import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowDown, ArrowUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, weight } from '../theme';
import { HISTORY_FILTERS, HISTORY_FILTER_LABEL_KEY } from '../data/transactions';
import { useAuth } from '../../context/AuthContext';
import { fetchMyTransactions } from '../services/transactionService';
import { useNavigation } from '../context/NavigationContext';
import { kwh } from '../utils/format';
import { analyticsText } from '../utils/analyticsText';
import { byNewest, emptyCopy, groupByMonth, matchesFilter, monthTotals } from '../utils/transactions';
import { TransactionCard } from '../components';
import { Card, Chip, Divider, IconBadge, Notice, PrimaryButton, ScreenTitle, SectionLabel } from '../components/ui';

export default function TransactionHistoryScreen() {
  const { t, i18n } = useTranslation();
  const copy = (key) => analyticsText(i18n.language, key);
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const [filter, setFilter] = useState('All');
  const activeUser = useRef(user?.id);
  activeUser.current = user?.id;
  const fetchId = useRef(0);
  const [state, setState] = useState({ userId: null, rows: [], loaded: false, loading: true, refreshing: false, error: '' });
  const belongsToUser = state.userId === (user?.id ?? null);
  const transactions = belongsToUser ? state.rows : [];
  const loading = !belongsToUser || state.loading;
  const error = belongsToUser ? state.error : '';
  const refreshing = belongsToUser && state.refreshing;
  const hasSavedHistory = belongsToUser && state.loaded;

  const refresh = useCallback(async (isRefresh = false) => {
    const userId = user?.id ?? null;
    const id = ++fetchId.current;
    setState((previous) => ({
      userId,
      rows: previous.userId === userId ? previous.rows : [],
      loaded: previous.userId === userId && previous.loaded,
      loading: !isRefresh,
      refreshing: isRefresh,
      error: '',
    }));
    try {
      const rows = await fetchMyTransactions(userId);
      if ((activeUser.current ?? null) === userId && fetchId.current === id) {
        setState({ userId, rows, loaded: true, loading: false, refreshing: false, error: '' });
      }
    } catch {
      if ((activeUser.current ?? null) === userId && fetchId.current === id) {
        setState((previous) => ({ ...previous, loading: false, refreshing: false,
          error: 'load-failed' }));
      }
    }
  }, [user?.id, t]);

  useEffect(() => {
    refresh();
    return () => { fetchId.current += 1; };
  }, [refresh]);

  const visible = useMemo(
    () => transactions.filter((t) => matchesFilter(t, filter)).sort(byNewest),
    [transactions, filter]
  );
  const groups = useMemo(() => groupByMonth(visible), [visible]);
  const totals = useMemo(() => monthTotals(transactions), [transactions]);
  const empty = emptyCopy(filter);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => refresh(true)} tintColor={colors.tealLight} />}>
      <ScreenTitle title={t('trade.nav.transactionHistory')} />

      {error ? <View style={{ gap: 8 }}>
        <Notice tone="error" message={copy('historyError')} />
        {hasSavedHistory ? <Text style={styles.emptyBody}>{copy('historyStale')}</Text> : null}
        <PrimaryButton label={t('trade.tryAgain')} variant="ghost" disabled={loading || refreshing} onPress={() => refresh(true)} />
      </View> : null}
      {loading && transactions.length === 0 ? <Card style={{ alignItems: 'center', padding: 24 }}>
        <ActivityIndicator color={colors.tealLight} />
      </Card> : null}
      {(!loading && !error) || hasSavedHistory ? <>

      <Card padding={18} style={styles.summary}>
        <Text style={styles.summaryLabel}>{t('trade.history.thisMonth')}</Text>
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
              <Text style={styles.totalCaption}>{t('trade.history.shared')}</Text>
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
              <Text style={styles.totalCaption}>{t('trade.history.received')}</Text>
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.filters}>
        {HISTORY_FILTERS.map((f) => (
          <Chip key={f} label={t(HISTORY_FILTER_LABEL_KEY[f])} active={f === filter} onPress={() => setFilter(f)} />
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
          <Text style={styles.emptyTitle}>{t(empty.titleKey)}</Text>
          <Text style={styles.emptyBody}>{t(empty.bodyKey)}</Text>
          {filter === 'All' ? (
            <PrimaryButton
              label={t('trade.history.findAvailableEnergy')}
              variant="ghost"
              onPress={() => navigate('list')}
              style={styles.emptyCta}
            />
          ) : null}
        </Card>
      ) : null}
      </> : null}
      <PrimaryButton label={t(refreshing ? 'member.telemetry.syncing' : 'member.telemetry.sync')} variant="ghost"
        disabled={loading || refreshing} onPress={() => refresh(true)} />
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
