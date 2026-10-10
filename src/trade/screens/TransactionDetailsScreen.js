import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowDown, ArrowUp, Check, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, weight } from '../theme';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { fetchTransactionById, fetchTransactionByRequestId } from '../services/transactionService';
import { tradeKwh as kwh, stamp } from '../utils/format';
import { reportingHelp } from '../utils/reportingHelp';
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
  const { t, i18n } = useTranslation();
  const { params, navigate } = useNavigation();
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
      .catch((reason) => { if (active) setError(reason?.message || t('trade.details.loadFailed')); })
      .finally(() => {
        if (active) {
          setLoading(false);
          setLoadedKey(detailKey);
        }
      });
    return () => { active = false; };
  }, [params.txnId, params.requestId, params.source, user?.id, reload, detailKey, t]);

  if (loading || loadedKey !== detailKey) {
    return <View style={styles.missing}><ActivityIndicator color={colors.tealLight} /></View>;
  }

  if (error) {
    return (
      <View style={styles.missing}>
        <EmptyState title={t('trade.details.loadErrorTitle')} body={error} />
        <PrimaryButton label={t('trade.tryAgain')} variant="ghost" onPress={() => setReload((value) => value + 1)} />
      </View>
    );
  }

  if (!txn) {
    return (
      <View style={styles.missing}>
        <EmptyState title={t('trade.details.unavailableTitle')} body={t('trade.details.unavailableBody')} />
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
        <Text style={styles.heroTitle}>{reversed ? t('trade.details.reversedTitle') : t('trade.details.completeTitle')}</Text>
        <Text style={styles.heroAmount}>
          {kwh(txn.kwh)}
          <Text style={styles.heroUnit}>{' kWh'}</Text>
        </Text>
        <Text style={styles.heroCaption}>{sent ? t('trade.details.energyShared') : t('trade.details.energyReceived')}</Text>
      </View>

      <SectionLabel>{t('trade.details.sectionLabel')}</SectionLabel>

      <Card padding={18} style={styles.card}>
        <View style={styles.partyRow}>
          <IconBadge size={38}>
            <ArrowUp size={17} color={colors.tealLight} strokeWidth={2} />
          </IconBadge>
          <View style={styles.partyBody}>
            <Text style={styles.partyLabel}>{t('trade.details.from')}</Text>
            <Text style={styles.partyName}>{sent ? t('trade.details.you') : (txn.sender || t('trade.household.fallback'))}</Text>
          </View>
        </View>

        <View style={styles.partyRow}>
          <IconBadge size={38} background={colors.amberTint}>
            <ArrowDown size={17} color={colors.amberLight} strokeWidth={2} />
          </IconBadge>
          <View style={styles.partyBody}>
            <Text style={styles.partyLabel}>{t('trade.details.to')}</Text>
            <Text style={styles.partyName}>{sent ? (txn.receiver || t('trade.household.fallback')) : t('trade.details.you')}</Text>
          </View>
        </View>

        <Divider />

        <DetailRow label={t('trade.details.dateTime')} value={stamp(new Date(txn.ts), i18n.resolvedLanguage || i18n.language)} />

        <DetailRow label={t('trade.details.status')}>
          <Pill
            label={reversed ? t('trade.transaction.reversed') : t('trade.transaction.completed')}
            color={reversed ? colors.danger : colors.tealLight}
            background={reversed ? colors.dangerTint : colors.tealTintSoft}
            dotColor={reversed ? colors.danger : colors.teal}
            style={[styles.statusPill, { borderColor: reversed ? 'rgba(239,68,68,0.35)' : 'rgba(20,184,166,0.35)' }]}
          />
        </DetailRow>

        <DetailRow label={t('trade.details.transactionId')} value={txn.ref} />
      </Card>

      <PrimaryButton
        label={fromHistory ? t('trade.details.backToHistory') : fromRequests ? t('trade.details.backToMyRequests') : t('common.done')}
        onPress={() => navigate(returnScreen)}
        style={styles.done}
      />

      <View style={styles.report}>
        <Text style={styles.reportLabel}>{reportingHelp(i18n.resolvedLanguage || i18n.language)}</Text>
      </View>
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
