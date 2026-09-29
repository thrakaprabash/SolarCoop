import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { CirclePlus } from 'lucide-react-native';

import { colors } from '../theme';
import { REQUEST_FILTERS } from '../data/requests';
import { useTrade } from '../context/TradeContext';
import { useNavigation } from '../context/NavigationContext';
import { RequestRow } from '../components';
import { Card, Chip, EmptyState, Notice, PrimaryButton, ScreenTitle } from '../components/ui';

export default function MyRequestsScreen() {
  const {
    requests,
    requestsLoading,
    requestsRefreshing,
    requestsError,
    refreshRequests,
  } = useTrade();
  const { navigate } = useNavigation();
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    refreshRequests({ refresh: true });
  }, [refreshRequests]);

  const visible = useMemo(
    () => requests.filter((r) => filter === 'All' || r.status === filter),
    [requests, filter]
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={requestsRefreshing}
          onRefresh={() => refreshRequests({ refresh: true })}
          tintColor={colors.tealLight}
        />
      }
    >
      <ScreenTitle title="My Requests" />

      <View style={styles.filters}>
        {REQUEST_FILTERS.map((f) => (
          <Chip key={f} label={f} active={f === filter} onPress={() => setFilter(f)} />
        ))}
      </View>

      {requestsError ? (
        <View style={styles.error}>
          <Notice tone="error" message={requestsError} />
          <PrimaryButton
            label="Try Again"
            variant="ghost"
            onPress={() => refreshRequests({ refresh: true })}
          />
        </View>
      ) : null}

      {requestsLoading && requests.length === 0 ? (
        <Card style={styles.loading}>
          <ActivityIndicator color={colors.tealLight} />
        </Card>
      ) : !requestsError || requests.length > 0 ? (
        <Card style={styles.list}>
          {visible.map((request, i) => (
            <RequestRow key={request.id} request={request} last={i === visible.length - 1} />
          ))}
          {visible.length === 0 ? (
            <EmptyState
              title={requests.length === 0 ? 'No requests yet' : 'Nothing here yet'}
              body={requests.length === 0 ? 'Your energy requests will appear here.' : 'No requests with this status.'}
            />
          ) : null}
        </Card>
      ) : null}

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
  loading: { alignItems: 'center', justifyContent: 'center', minHeight: 100 },
  error: { gap: 8 },
});
