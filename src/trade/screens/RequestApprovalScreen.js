import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, TriangleAlert, X } from 'lucide-react-native';

import { colors, radius, weight } from '../theme';
import { STATUS_STYLE } from '../data/requests';
import { useTrade } from '../context/TradeContext';
import { useNavigation } from '../context/NavigationContext';
import { kwh } from '../utils/format';
import { SurplusCard } from '../components';
import {
  Card,
  ConfirmModal,
  DetailRow,
  Divider,
  EmptyState,
  IconBadge,
  Notice,
  SectionLabel,
} from '../components/ui';

export default function RequestApprovalScreen() {
  const { params, navigate } = useNavigation();
  const { getIncoming, surplus, approveIncoming, rejectIncoming } = useTrade();
  const [modal, setModal] = useState('');
  const [rejected, setRejected] = useState(false);

  const request = getIncoming(params.incomingId);

  if (!request) {
    return (
      <View style={styles.missing}>
        <EmptyState title="Request unavailable" body="This request is no longer in your queue." />
      </View>
    );
  }

  const pending = request.status === 'Pending';
  const canApprove = request.kwh <= surplus;
  const remaining = Math.max(0, +(surplus - request.kwh).toFixed(1));
  const tone = STATUS_STYLE[request.status] || STATUS_STYLE.Pending;

  const onApprove = () => {
    const txn = approveIncoming(request);
    setModal('');
    if (txn) navigate('transaction', { txnId: txn.id, source: 'approval' });
  };

  const onReject = () => {
    rejectIncoming(request);
    setModal('');
    setRejected(true);
  };

  if (rejected) {
    return (
      <View style={styles.result}>
        <IconBadge size={72} background="rgba(239,68,68,0.15)" borderColor="rgba(239,68,68,0.4)">
          <X size={34} color={colors.danger} strokeWidth={2.2} />
        </IconBadge>
        <Text style={styles.resultTitle}>Request Rejected</Text>
        <Text style={styles.resultBody}>
          {'The request from ' + request.name + ' has been rejected. Your surplus is unchanged.'}
        </Text>
        <Pressable
          onPress={() => navigate('incoming')}
          style={({ pressed }) => [styles.doneButton, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.doneLabel}>Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionLabel>Request from</SectionLabel>

      <Card style={styles.requester}>
        <IconBadge size={46}>
          <Text style={styles.initials}>{request.initials}</Text>
        </IconBadge>
        <View>
          <Text style={styles.name}>{request.name}</Text>
          <Text style={styles.role}>Community Member</Text>
        </View>
      </Card>

      <Card padding={18} style={styles.amountCard}>
        <Text style={styles.amountLabel}>Energy Request</Text>
        <View style={styles.amountBlock}>
          <Text style={styles.amount}>
            {kwh(request.kwh)}
            <Text style={styles.amountUnit}>{' kWh'}</Text>
          </Text>
          <Text style={styles.amountCaption}>Requested Energy</Text>
        </View>
        <Divider />
        <DetailRow label="Requested on" value={request.when} />
      </Card>

      <SectionLabel>Your energy status</SectionLabel>

      <SurplusCard
        surplus={surplus}
        large
        afterText={pending ? (canApprove ? kwh(remaining) + ' kWh remaining' : 'Not possible') : null}
        afterColor={canApprove ? colors.tealLight : colors.danger}
      />

      {pending && canApprove ? (
        <Notice tone="success" message="You have enough surplus to complete this request." />
      ) : null}

      {pending && !canApprove ? (
        <View style={styles.shortfall}>
          <View style={styles.shortfallHead}>
            <TriangleAlert size={16} color={colors.danger} strokeWidth={2} />
            <Text style={styles.shortfallTitle}>Insufficient surplus</Text>
          </View>
          <DetailRow label="Requested" value={kwh(request.kwh) + ' kWh'} />
          <DetailRow label="Available" value={kwh(surplus) + ' kWh'} />
        </View>
      ) : null}

      {request.message ? (
        <View style={styles.messageCard}>
          <Text style={styles.messageLabel}>Message</Text>
          <Text style={styles.messageBody}>{'“' + request.message + '”'}</Text>
        </View>
      ) : null}

      {pending ? (
        <>
          <Divider style={styles.actionDivider} />
          <View style={styles.actions}>
            <Pressable
              onPress={() => setModal('reject')}
              style={({ pressed }) => [styles.action, styles.reject, pressed && { opacity: 0.85 }]}
            >
              <X size={16} color={colors.danger} strokeWidth={2.2} />
              <Text style={[styles.actionLabel, { color: colors.danger }]}>Reject</Text>
            </Pressable>

            <Pressable
              onPress={canApprove ? () => setModal('approve') : undefined}
              style={({ pressed }) => [
                styles.action,
                {
                  backgroundColor: canApprove ? colors.teal : 'rgba(20,184,166,0.25)',
                  opacity: canApprove ? (pressed ? 0.85 : 1) : 0.5,
                },
              ]}
            >
              <Check size={16} color={colors.text} strokeWidth={2.4} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>Approve</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <View style={[styles.processed, { backgroundColor: tone.pillBg }]}>
            <View style={[styles.dot, { backgroundColor: tone.color }]} />
            <Text style={[styles.processedLabel, { color: tone.color }]}>
              {'Status: ' + request.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.processedNote}>This request has already been processed.</Text>
        </>
      )}

      <ConfirmModal
        visible={modal === 'approve'}
        title="Approve energy request?"
        body={
          'You are about to share ' +
          kwh(request.kwh) +
          ' kWh with ' +
          request.name +
          '. Your remaining surplus will be ' +
          kwh(remaining) +
          ' kWh.'
        }
        confirmLabel="Approve"
        onConfirm={onApprove}
        onCancel={() => setModal('')}
      />

      <ConfirmModal
        visible={modal === 'reject'}
        title="Reject this request?"
        body={request.name + ' will be notified that their request for ' + kwh(request.kwh) + ' kWh was declined.'}
        confirmLabel="Reject"
        tone="danger"
        onConfirm={onReject}
        onCancel={() => setModal('')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20, gap: 14 },
  missing: { flex: 1, justifyContent: 'center', paddingHorizontal: 16 },

  requester: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  initials: { fontSize: 15, fontWeight: weight.heavy, color: colors.tealLight },
  name: { fontSize: 16, fontWeight: weight.heavy, color: colors.text },
  role: { fontSize: 11, fontWeight: weight.medium, color: colors.textFaint },

  amountCard: { gap: 14 },
  amountLabel: {
    fontSize: 11,
    fontWeight: weight.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textFaint,
    textAlign: 'center',
  },
  amountBlock: { alignItems: 'center', gap: 2 },
  amount: { fontSize: 46, fontWeight: weight.heavy, color: colors.tealLight, letterSpacing: -1, lineHeight: 50 },
  amountUnit: { fontSize: 22, fontWeight: weight.medium },
  amountCaption: {
    fontSize: 12,
    fontWeight: weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.textMuted,
  },

  shortfall: {
    backgroundColor: colors.dangerTint,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
  },
  shortfallHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shortfallTitle: { color: colors.danger, fontSize: 12, fontWeight: weight.heavy },

  messageCard: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    padding: 14,
    gap: 6,
  },
  messageLabel: {
    fontSize: 10,
    fontWeight: weight.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textFaint,
  },
  messageBody: { fontSize: 13, lineHeight: 20, color: colors.textStrong, fontStyle: 'italic' },

  actionDivider: { marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: radius.xl,
  },
  reject: { backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)' },
  actionLabel: { fontSize: 14, fontWeight: weight.bold },

  processed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: 14,
    marginTop: 2,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  processedLabel: { fontSize: 12, fontWeight: weight.heavy, letterSpacing: 0.4 },
  processedNote: { fontSize: 11, fontWeight: weight.medium, color: colors.textFaint, textAlign: 'center' },

  result: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 24 },
  resultTitle: { fontSize: 22, fontWeight: weight.heavy, color: colors.text, letterSpacing: -0.5 },
  resultBody: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: weight.medium,
    color: colors.textMuted,
    textAlign: 'center',
  },
  doneButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: 14,
    marginTop: 8,
  },
  doneLabel: { color: colors.textStrong, fontSize: 14, fontWeight: weight.bold },
});
