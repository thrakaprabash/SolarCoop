import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowDownWideNarrow, Clock } from 'lucide-react-native';

import { colors, radius, weight } from '../theme';
import { SORTS } from '../data/households';
import { useEnergy } from '../context/EnergyContext';
import { useNavigation } from '../context/NavigationContext';
import { distanceInMeters } from '../utils/format';
import { HouseholdCard, PoolSummaryCard } from '../components';
import { EmptyState, PrimaryButton, ScreenTitle, SearchInput } from '../components/ui';

export default function AvailableEnergyScreen({ showPoolSummary = true }) {
  const { households, requestedIds, pool, pendingCount } = useEnergy();
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
});
