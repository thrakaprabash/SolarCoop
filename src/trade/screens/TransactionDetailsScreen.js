import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowDown, ArrowUp, Check, X } from 'lucide-react-native';

import { colors, weight } from '../theme';
import { useTrade } from '../context/TradeContext';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { fetchTransactionById, fetchTransactionByRequestId } from '../services/transactionService';
import { kwh, stamp } from '../utils/format';
import {
  Card,
  DetailRow,
  Divider,
  EmptyState,
  IconBadge,
  Pill,
  PrimaryButton,
  SectionLabel,
} from '../components/ui';

export default function TransactionDetailsScreen() {
  const { params, navigate } = useNavigation();
  const { showToast } = useTrade();
  const { user } = useAuth();
  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const detailKey = JSON.stringify([user?.id, params.txnId, params.requestId, params.source]);
  const [loadedKey, setLoadedKey] = useState(null);

  useEffect(() => {
    let active = true;
    setTxn(null);
    setError('');
    setLoading(true);
    const load = params.requestId
      ? fetchTransactionByRequestId(params.requestId, user?.id)
      : fetchTransactionById(params.txnId, user?.id);
    load
      .then((data) => { if (active) setTxn(data); })
      .catch((reason) => { if (active) setError(reason?.message || 'Could not load transaction details.'); })
      .finally(() => {
        if (active) {
          setLoading(false);
          setLoadedKey(detailKey);
        }
      });
    return () => { active = false; };
  }, [params.txnId, params.requestId, params.source, user?.id, reload, detailKey]);

  if (loading || loadedKey !== detailKey) {
    return <View style={styles.missing}><ActivityIndicator color={colors.tealLight} /></View>;
  }

  if (error) {
    return (
      <View style={styles.missing}>
        <EmptyState title="Could not load transaction" body={error} />
        <PrimaryButton label="Try Again" variant="ghost" onPress={() => setReload((value) => value + 1)} />
      </View>
    );
  }

  if (!txn) {
    return (
      <View style={styles.missing}>
        <EmptyState title="Transaction unavailable" body="This transaction is unavailable or you do not have access to it." />
      </View>
    );
  }

  const sent = txn.dir === 'sent';
  const reversed = txn.status === 'REVERSED';
  const fromHistory = params.source === 'history';
  const fromRequests = params.source === 'requests';
  const returnScreen = fromHistory ? 'history' : fromRequests ? 'requests' : 'incoming';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <IconBadge size={66} borderColor={colors.tealBorder} style={styles.heroIcon}>
          {reversed
            ? <X size={32} color={colors.danger} strokeWidth={2.4} />
            : <Check size={32} color={colors.tealLight} strokeWidth={2.4} />}
        </IconBadge>
        <Text style={styles.heroTitle}>{reversed ? 'Transaction Reversed' : 'Transaction Complete'}</Text>
        <Text style={styles.heroAmount}>
          {kwh(txn.kwh)}
          <Text style={styles.heroUnit}>{' kWh'}</Text>
        </Text>
        <Text style={styles.heroCaption}>{sent ? 'Energy Shared' : 'Energy Received'}</Text>
      </View>

      <SectionLabel>Transaction details</SectionLabel>

      <Card padding={18} style={styles.card}>
        <View style={styles.partyRow}>
          <IconBadge size={38}>
            <ArrowUp size={17} color={colors.tealLight} strokeWidth={2} />
          </IconBadge>
          <View style={styles.partyBody}>
            <Text style={styles.partyLabel}>From</Text>
            <Text style={styles.partyName}>{sent ? 'You' : txn.sender}</Text>
          </View>
        </View>

        <View style={styles.partyRow}>
          <IconBadge size={38} background={colors.amberTint}>
            <ArrowDown size={17} color={colors.amberLight} strokeWidth={2} />
          </IconBadge>
          <View style={styles.partyBody}>
            <Text style={styles.partyLabel}>To</Text>
            <Text style={styles.partyName}>{sent ? txn.receiver : 'You'}</Text>
          </View>
        </View>

        <Divider />

        <DetailRow label="Date & time" value={stamp(new Date(txn.ts))} />

        <DetailRow label="Status">
          <Pill
            label={reversed ? 'REVERSED' : 'COMPLETED'}
            color={reversed ? colors.danger : colors.tealLight}
            background={reversed ? colors.dangerTint : colors.tealTintSoft}
            dotColor={reversed ? colors.danger : colors.teal}
            style={[styles.statusPill, { borderColor: reversed ? 'rgba(239,68,68,0.35)' : 'rgba(20,184,166,0.35)' }]}
          />
        </DetailRow>

        <DetailRow label="Transaction ID" value={txn.ref} />
      </Card>

      <PrimaryButton
        label={fromHistory ? 'Back to History' : fromRequests ? 'Back to My Requests' : 'Done'}
        onPress={() => navigate(returnScreen)}
        style={styles.done}
      />

      <Pressable
        onPress={() => showToast('Complaint form opens in the complaints module')}
        style={({ pressed }) => [styles.report, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.reportLabel}>Report an issue with this transaction</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20, gap: 16 },
  missing: { flex: 1, justifyContent: 'center', paddingHorizontal: 16 },

  hero: { alignItems: 'center', gap: 6, paddingTop: 8, paddingBottom: 2 },
  heroIcon: { marginBottom: 6 },
  heroTitle: { fontSize: 16, fontWeight: weight.heavy, color: colors.textStrong, letterSpacing: -0.2 },
  heroAmount: { fontSize: 46, fontWeight: weight.heavy, color: colors.tealLight, letterSpacing: -1, lineHeight: 50 },
  heroUnit: { fontSize: 22, fontWeight: weight.medium },
  heroCaption: {
    fontSize: 12,
    fontWeight: weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.textMuted,
  },

  card: { gap: 14 },
  partyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  partyBody: { flex: 1, minWidth: 0 },
  partyLabel: {
    fontSize: 10,
    fontWeight: weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: colors.textFaint,
  },
  partyName: { fontSize: 15, fontWeight: weight.heavy, color: colors.text },
  statusPill: { paddingVertical: 4 },
  done: { marginTop: 2 },
  report: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 10 },
  reportLabel: { fontSize: 12, fontWeight: weight.medium, color: colors.textFaint },
});
