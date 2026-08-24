import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowDown, ArrowUp, Check } from 'lucide-react-native';

import { colors, weight } from '../theme';
import { SELF_LABEL } from '../data/transactions';
import { useTrade } from '../context/TradeContext';
import { useNavigation } from '../context/NavigationContext';
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
  const { getTransaction, showToast } = useTrade();

  const txn = getTransaction(params.txnId);

  if (!txn) {
    return (
      <View style={styles.missing}>
        <EmptyState title="Transaction unavailable" body="This record is no longer in your ledger." />
      </View>
    );
  }

  const sent = txn.dir === 'sent';
  const showSummary = sent && txn.before != null;
  const fromHistory = params.source === 'history';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <IconBadge size={66} borderColor={colors.tealBorder} style={styles.heroIcon}>
          <Check size={32} color={colors.tealLight} strokeWidth={2.4} />
        </IconBadge>
        <Text style={styles.heroTitle}>Transaction Complete</Text>
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
            <Text style={styles.partyName}>{sent ? SELF_LABEL : txn.party}</Text>
          </View>
        </View>

        <View style={styles.partyRow}>
          <IconBadge size={38} background={colors.amberTint}>
            <ArrowDown size={17} color={colors.amberLight} strokeWidth={2} />
          </IconBadge>
          <View style={styles.partyBody}>
            <Text style={styles.partyLabel}>To</Text>
            <Text style={styles.partyName}>{sent ? txn.party : SELF_LABEL}</Text>
          </View>
        </View>

        <Divider />

        <DetailRow label="Date & time" value={stamp(new Date(txn.ts))} />

        <DetailRow label="Status">
          <Pill
            label="COMPLETED"
            color={colors.tealLight}
            background={colors.tealTintSoft}
            dotColor={colors.teal}
            style={styles.statusPill}
          />
        </DetailRow>

        <DetailRow label="Transaction ID" value={txn.ref} />
      </Card>

      {showSummary ? (
        <>
          <SectionLabel style={styles.summaryLabel}>Energy summary</SectionLabel>
          <Card padding={18} style={styles.summaryCard}>
            <DetailRow label="Available before" value={kwh(txn.before) + ' kWh'} valueSize={14} />
            <DetailRow
              label="Energy shared"
              value={'−' + kwh(txn.kwh) + ' kWh'}
              valueColor={colors.amberLight}
              valueSize={14}
            />
            <Divider />
            <DetailRow
              label="Remaining surplus"
              value={kwh(txn.after) + ' kWh'}
              valueColor={colors.tealLight}
              valueSize={18}
            />
          </Card>
        </>
      ) : null}

      <PrimaryButton
        label={fromHistory ? 'Back to History' : 'Done'}
        onPress={() => navigate('history')}
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
  statusPill: { paddingVertical: 4, borderColor: 'rgba(20,184,166,0.35)' },

  summaryLabel: { marginTop: 2 },
  summaryCard: { gap: 12 },
  done: { marginTop: 2 },
  report: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 10 },
  reportLabel: { fontSize: 12, fontWeight: weight.medium, color: colors.textFaint },
});
