import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CirclePlus } from 'lucide-react-native';

import { REQUEST_FILTERS } from '../data/requests';
import { useEnergy } from '../context/EnergyContext';
import { useNavigation } from '../context/NavigationContext';
import { RequestRow } from '../components';
import { Card, Chip, EmptyState, PrimaryButton, ScreenTitle } from '../components/ui';

export default function MyRequestsScreen() {
  const { requests } = useEnergy();
  const { navigate } = useNavigation();
  const [filter, setFilter] = useState('All');

  const visible = useMemo(
    () => requests.filter((r) => filter === 'All' || r.status === filter),
    [requests, filter]
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenTitle title="My Requests" />

      <View style={styles.filters}>
        {REQUEST_FILTERS.map((f) => (
          <Chip key={f} label={f} active={f === filter} onPress={() => setFilter(f)} />
        ))}
      </View>

      <Card style={styles.list}>
        {visible.map((request, i) => (
          <RequestRow key={request.id} request={request} last={i === visible.length - 1} />
        ))}
        {visible.length === 0 ? (
          <EmptyState title="Nothing here yet" body="No requests with this status." />
        ) : null}
      </Card>

      <PrimaryButton
        label="Browse Available Energy"
        icon={CirclePlus}
        variant="ghost"
        onPress={() => navigate('list')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20, gap: 16 },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  list: { gap: 14 },
});
