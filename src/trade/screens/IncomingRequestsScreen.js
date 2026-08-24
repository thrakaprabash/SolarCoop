import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { useTrade } from '../context/TradeContext';
import { useNavigation } from '../context/NavigationContext';
import { IncomingRequestRow, SurplusCard } from '../components';
import { Card, EmptyState, ScreenTitle } from '../components/ui';

export default function IncomingRequestsScreen() {
  const { incoming, incomingPendingCount, surplus } = useTrade();
  const { navigate } = useNavigation();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenTitle title="Incoming Requests" />

      <SurplusCard surplus={surplus} pending={incomingPendingCount} />

      <Card style={styles.list}>
        {incoming.map((request, i) => (
          <IncomingRequestRow
            key={request.id}
            request={request}
            last={i === incoming.length - 1}
            onPress={() => navigate('approval', { incomingId: request.id })}
          />
        ))}
        {incoming.length === 0 ? (
          <EmptyState title="No incoming requests" body="Requests from neighbouring households appear here." />
        ) : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20, gap: 16 },
  list: { gap: 14 },
});
