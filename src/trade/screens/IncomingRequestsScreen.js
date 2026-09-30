import React, { useEffect } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { colors } from '../theme';
import { useTrade } from '../context/TradeContext';
import { useNavigation } from '../context/NavigationContext';
import { IncomingRequestRow, SurplusCard } from '../components';
import { Card, EmptyState, Notice, PrimaryButton, ScreenTitle } from '../components/ui';

export default function IncomingRequestsScreen() {
  const {
    incoming,
    incomingPendingCount,
    incomingLoading,
    incomingRefreshing,
    incomingError,
    refreshIncoming,
    surplus,
    providersLoading,
    providersError,
    refreshProviders,
  } = useTrade();
  const { navigate } = useNavigation();

  useEffect(() => {
    refreshIncoming({ refresh: true });
    refreshProviders();
  }, [refreshIncoming, refreshProviders]);

  const refresh = () => {
    refreshIncoming({ refresh: true });
    refreshProviders();
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={incomingRefreshing} onRefresh={refresh} tintColor={colors.tealLight} />
      }
    >
      <ScreenTitle title="Incoming Requests" />

      {providersLoading ? (
        <Card style={styles.loading}><ActivityIndicator color={colors.tealLight} /></Card>
      ) : providersError ? (
        <View style={styles.error}>
          <Notice tone="error" message={'Could not load available surplus: ' + providersError} />
          <PrimaryButton label="Try Again" variant="ghost" onPress={refreshProviders} />
        </View>
      ) : (
        <SurplusCard surplus={surplus} pending={incomingPendingCount} />
      )}

      {incomingError ? (
        <View style={styles.error}>
          <Notice tone="error" message={incomingError} />
          <PrimaryButton label="Try Again" variant="ghost" onPress={refresh} />
        </View>
      ) : null}

      {incomingLoading && incoming.length === 0 ? (
        <Card style={styles.loading}>
          <ActivityIndicator color={colors.tealLight} />
        </Card>
      ) : !incomingError || incoming.length > 0 ? (
        <Card style={styles.list}>
          {incoming.map((request, i) => (
            <IncomingRequestRow
              key={request.id}
              request={request}
              last={i === incoming.length - 1}
              onPress={() => request.status === 'Completed'
                ? navigate('transaction', { requestId: request.id, source: 'incoming' })
                : navigate('approval', { incomingId: request.id })}
            />
          ))}
          {incoming.length === 0 ? (
            <EmptyState title="No incoming requests" body="Requests from neighbouring households appear here." />
          ) : null}
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20, gap: 16 },
  list: { gap: 14 },
  loading: { alignItems: 'center', justifyContent: 'center', minHeight: 100 },
  error: { gap: 8 },
});
