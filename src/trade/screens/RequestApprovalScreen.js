import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, TriangleAlert, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, radius, weight } from '../theme';
import { STATUS_STYLE, STATUS_LABEL_KEY } from '../data/requests';
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
  const { t } = useTranslation();
  const { params, navigate } = useNavigation();
  const { getIncoming, surplus, providersLoading, providersError, refreshProviders, approveIncoming, rejectIncoming } = useTrade();
  const [modal, setModal] = useState('');
  const [rejected, setRejected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const pendingAction = useRef(false);

  useEffect(() => {
    refreshProviders();
  }, [refreshProviders]);

  const request = getIncoming(params.incomingId);

  if (!request) {
    return (
      <View style={styles.missing}>
        <EmptyState title={t('trade.approval.unavailableTitle')} body={t('trade.approval.unavailableBody')} />
      </View>
    );
  }

  const pending = request.status === 'Pending';
  const canApprove = !providersLoading && !providersError && request.kwh <= surplus;
  const remaining = Math.max(0, +(surplus - request.kwh).toFixed(1));
  const tone = STATUS_STYLE[request.status] || STATUS_STYLE.Pending;

  const onApprove = async () => {
    if (pendingAction.current) return;
    pendingAction.current = true;
    setBusy(true);
    setActionError('');
    try {
      const { data, error } = await approveIncoming(request);
      if (error) throw error;
      navigate('transaction', { txnId: data.id, source: 'approval' });
    } catch (error) {
      setActionError(error?.message || t('trade.approval.approveFailed'));
    } finally {
      pendingAction.current = false;
      setBusy(false);
      setModal('');
    }
  };

  const onReject = async () => {
    if (pendingAction.current) return;
    pendingAction.current = true;
    setBusy(true);
    setActionError('');
    try {
      const { error } = await rejectIncoming(request);
      if (error) throw error;
      setRejected(true);
    } catch (error) {
      setActionError(error?.message || t('trade.approval.rejectFailed'));
    } finally {
      pendingAction.current = false;
      setBusy(false);
      setModal('');
    }
  };

  if (rejected) {
    return (
      <View style={styles.result}>
        <IconBadge size={72} background="rgba(239,68,68,0.15)" borderColor="rgba(239,68,68,0.4)">
          <X size={34} color={colors.danger} strokeWidth={2.2} />
        </IconBadge>
        <Text style={styles.resultTitle}>{t('trade.approval.rejectedTitle')}</Text>
        <Text style={styles.resultBody}>
          {t('trade.approval.rejectedBody', { name: request.name || t('trade.communityMember') })}
        </Text>
        <Pressable
          onPress={() => navigate('incoming')}
          style={({ pressed }) => [styles.doneButton, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.doneLabel}>{t('common.done')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionLabel>{t('trade.approval.requestFrom')}</SectionLabel>

      <Card style={styles.requester}>
        <IconBadge size={46}>
          <Text style={styles.initials}>{request.initials}</Text>
        </IconBadge>
        <View>
          <Text style={styles.name}>{request.name || t('trade.communityMember')}</Text>
          <Text style={styles.role}>{t('trade.communityMember')}</Text>
        </View>
      </Card>

      <Card padding={18} style={styles.amountCard}>
        <Text style={styles.amountLabel}>{t('trade.nav.energyRequest')}</Text>
        <View style={styles.amountBlock}>
          <Text style={styles.amount}>
            {kwh(request.kwh)}
            <Text style={styles.amountUnit}>{' kWh'}</Text>
          </Text>
          <Text style={styles.amountCaption}>{t('trade.approval.requestedEnergy')}</Text>
        </View>
        <Divider />
        <DetailRow label={t('trade.approval.requestedOn')} value={request.when || t('trade.dateUnavailable')} />
      </Card>

      <SectionLabel>{t('trade.approval.energyStatus')}</SectionLabel>

      <Notice tone="error" message={actionError} />

      {providersError ? (
        <View style={styles.balanceError}>
          <Notice tone="error" message={t('trade.incoming.loadSurplusFailed', { error: providersError })} />
          <Pressable onPress={refreshProviders} style={styles.retryBalance}>
            <Text style={styles.retryBalanceLabel}>{t('trade.tryAgain')}</Text>
          </Pressable>
        </View>
      ) : null}

      {providersLoading ? <ActivityIndicator color={colors.tealLight} /> : null}

      {!providersLoading && !providersError ? (
        <SurplusCard
          surplus={surplus}
          large
          afterText={pending ? (canApprove ? t('trade.approval.remainingKwh', { amount: kwh(remaining) }) : t('trade.approval.notPossible')) : null}
          afterColor={canApprove ? colors.tealLight : colors.danger}
        />
      ) : null}

      {pending && canApprove ? (
        <Notice tone="success" message={t('trade.approval.sufficientSurplus')} />
      ) : null}

      {pending && !canApprove && !providersLoading && !providersError ? (
        <View style={styles.shortfall}>
          <View style={styles.shortfallHead}>
            <TriangleAlert size={16} color={colors.danger} strokeWidth={2} />
            <Text style={styles.shortfallTitle}>{t('trade.approval.insufficientSurplus')}</Text>
          </View>
          <DetailRow label={t('trade.household.requested')} value={kwh(request.kwh) + ' kWh'} />
          <DetailRow label={t('trade.household.available')} value={kwh(surplus) + ' kWh'} />
        </View>
      ) : null}

      {request.message ? (
        <View style={styles.messageCard}>
          <Text style={styles.messageLabel}>{t('trade.approval.message')}</Text>
          <Text style={styles.messageBody}>{'“' + request.message + '”'}</Text>
        </View>
      ) : null}

      {pending ? (
        <>
          <Divider style={styles.actionDivider} />
          <View style={styles.actions}>
            <Pressable
              onPress={busy ? undefined : () => setModal('reject')}
              style={({ pressed }) => [styles.action, styles.reject, pressed && { opacity: 0.85 }]}
            >
              <X size={16} color={colors.danger} strokeWidth={2.2} />
              <Text style={[styles.actionLabel, { color: colors.danger }]}>{t('trade.approval.reject')}</Text>
            </Pressable>

            <Pressable
              onPress={canApprove && !busy ? () => setModal('approve') : undefined}
              style={({ pressed }) => [
                styles.action,
                {
                  backgroundColor: canApprove ? colors.teal : 'rgba(20,184,166,0.25)',
                  opacity: canApprove ? (pressed ? 0.85 : 1) : 0.5,
                },
              ]}
            >
              <Check size={16} color={colors.text} strokeWidth={2.4} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>{t('trade.approval.approve')}</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <View style={[styles.processed, { backgroundColor: tone.pillBg }]}>
            <View style={[styles.dot, { backgroundColor: tone.color }]} />
            <Text style={[styles.processedLabel, { color: tone.color }]}>
              {t('trade.approval.statusLine', { status: t(STATUS_LABEL_KEY[request.status] || STATUS_LABEL_KEY.Pending).toUpperCase() })}
            </Text>
          </View>
          <Text style={styles.processedNote}>{t('trade.approval.alreadyProcessed')}</Text>
        </>
      )}

      <ConfirmModal
        visible={modal === 'approve'}
        title={t('trade.approval.confirmApproveTitle')}
        body={t('trade.approval.confirmApproveBody', {
          amount: kwh(request.kwh),
          name: request.name || t('trade.communityMember'),
          remaining: kwh(remaining),
        })}
        confirmLabel={t('trade.approval.approve')}
        busy={busy}
        onConfirm={onApprove}
        onCancel={() => setModal('')}
      />

      <ConfirmModal
        visible={modal === 'reject'}
        title={t('trade.approval.confirmRejectTitle')}
        body={t('trade.approval.confirmRejectBody', {
          name: request.name || t('trade.communityMember'),
          amount: kwh(request.kwh),
        })}
        confirmLabel={t('trade.approval.reject')}
        tone="danger"
        busy={busy}
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
  balanceError: { gap: 8 },
  retryBalance: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10 },
  retryBalanceLabel: { color: colors.tealLight, fontSize: 12, fontWeight: weight.bold },

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
