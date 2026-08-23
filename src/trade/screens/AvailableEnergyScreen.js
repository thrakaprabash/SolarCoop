import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowDownToLine, ArrowDownWideNarrow, ChevronRight, Clock, History } from 'lucide-react-native';

import { colors, radius, weight } from '../theme';
import { SORTS } from '../data/households';
import { useTrade } from '../context/TradeContext';
import { useNavigation } from '../context/NavigationContext';
import { distanceInMeters } from '../utils/format';
import { HouseholdCard, PoolSummaryCard } from '../components';
import { Card, EmptyState, IconBadge, PrimaryButton, ScreenTitle, SearchInput } from '../components/ui';

export default function AvailableEnergyScreen({ showPoolSummary = true }) {
  const { households, requestedIds, pool, pendingCount, incomingPendingCount } = useTrade();
  const { navigate } = useNavigation();
  const [query, setQuery] = useState('');
  const [sortIndex, setSortIndex] = useState(0);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const key = SORTS[sortIndex].key;
    return households
      .filter((h) => !q || h.name.toLowerCase().includes(q) || h.house.toLowerCase().includes(q))
      .sort((a, b) =>
        key === 'kwh'
          ? b.kwh - a.kwh
          : key === 'rate'
          ? a.rate - b.rate
          : distanceInMeters(a.dist) - distanceInMeters(b.dist)
      );
  }, [households, query, sortIndex]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenTitle title="Available Community Energy" />

      {showPoolSummary ? <PoolSummaryCard pool={pool} /> : null}

      <View style={styles.controls}>
        <SearchInput value={query} onChangeText={setQuery} placeholder="Search households" />
        <Pressable
          onPress={() => setSortIndex((i) => (i + 1) % SORTS.length)}
          style={({ pressed }) => [styles.sort, pressed && { opacity: 0.8 }]}
        >
          <ArrowDownWideNarrow size={14} color={colors.amberLight} strokeWidth={2} />
          <Text style={styles.sortLabel}>{SORTS[sortIndex].label}</Text>
        </Pressable>
      </View>

      {list.map((household) => (
        <HouseholdCard
          key={household.id}
          household={household}
          requested={!!requestedIds[household.id]}
          onRequest={() => navigate('request', { providerId: household.id })}
        />
      ))}

      {list.length === 0 ? (
        <EmptyState
          title="No households match"
          body="Try a different search term."
          style={styles.empty}
        />
      ) : null}

      <PrimaryButton label="My Requests" icon={Clock} variant="ghost" onPress={() => navigate('requests')}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingCount}</Text>
        </View>
      </PrimaryButton>

      <PrimaryButton
        label="Incoming Requests"
        icon={ArrowDownToLine}
        background={colors.surfaceAlt}
        style={styles.neutralButton}
        onPress={() => navigate('incoming')}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{incomingPendingCount}</Text>
        </View>
      </PrimaryButton>

      <Pressable onPress={() => navigate('history')} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
        <Card style={styles.historyRow}>
          <IconBadge size={38} background={colors.amberTint}>
            <History size={18} color={colors.amberLight} strokeWidth={2} />
          </IconBadge>
          <View style={styles.historyBody}>
            <Text style={styles.historyTitle}>Transaction History</Text>
            <Text style={styles.historyDesc}>View your completed P2P trades</Text>
          </View>
          <ChevronRight size={16} color={colors.textFaint} strokeWidth={2.4} />
        </Card>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20, gap: 16 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sort: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.amberTint,
    borderWidth: 1,
    borderColor: colors.amberBorder,
  },
  sortLabel: { fontSize: 11, fontWeight: weight.heavy, color: colors.amberLight },
  empty: {
    paddingVertical: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
  },
  badge: {
    backgroundColor: colors.amberTintStrong,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.5)',
    borderRadius: radius.sm,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  badgeText: { color: colors.amberLight, fontSize: 11, fontWeight: weight.heavy },
  neutralButton: { borderWidth: 1, borderColor: colors.border },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyBody: { flex: 1, minWidth: 0 },
  historyTitle: { fontSize: 14, fontWeight: weight.heavy, color: colors.text },
  historyDesc: { fontSize: 11, fontWeight: weight.medium, color: colors.textMuted, marginTop: 2 },
});
