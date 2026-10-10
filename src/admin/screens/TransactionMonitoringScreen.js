import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, GLASS } from '../../theme/colors';
import { useAdmin } from '../context/AdminContext';
import { timeAgo } from '../data/mockAdminData';
import {
  Receipt,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertCircle,
} from 'lucide-react-native';

const FILTERS = ['All', 'Completed', 'Reversed'];

// Canonical filter/status values stay in English — only the label shown is translated.
const STATUS_LABEL_KEY = {
  All:       'common.status.all',
  Completed: 'common.status.completed',
  Reversed:  'common.status.reversed',
};

const TX_COLORS = {
  Completed: COLORS.tealLight,
  Reversed:  COLORS.red,
};

const TX_BG = {
  Completed: 'rgba(45,212,191,0.12)',
  Reversed:  'rgba(239,68,68,0.12)',
};

const TX_ICONS = {
  Completed: CheckCircle,
  Reversed:  XCircle,
};

function TxRow({ tx, onReverse, t }) {
  const [expanded, setExpanded] = useState(false);
  const [isReversing, setIsReversing] = useState(false);
  const [reason, setReason] = useState('');
  const color  = TX_COLORS[tx.status];
  const bg     = TX_BG[tx.status];
  const StatusIcon = TX_ICONS[tx.status];

  const performReverse = async () => {
    setIsReversing(true);
    try {
      await onReverse(tx.id, reason.trim());
    } catch (err) {
      const errMsg = err?.message || t('admin.transactions.reverseFailedDefault');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(t('admin.transactions.reverseFailedInline', { message: errMsg }));
      } else {
        Alert.alert(t('admin.transactions.reverseFailedTitle'), errMsg);
      }
    } finally {
      setIsReversing(false);
    }
  };

  const handleReverse = () => {
    if (isReversing) return;
    if (reason.trim().length < 10 || reason.trim().length > 500) return;
    const confirmText = t('admin.transactions.reverseConfirm', { amount: tx.amount, sender: tx.sender, receiver: tx.receiver });

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm ? window.confirm(confirmText) : true) {
        performReverse();
      }
      return;
    }

    Alert.alert(
      t('admin.transactions.reverseDialogTitle'),
      confirmText,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('admin.transactions.reverseAction'), style: 'destructive', onPress: performReverse },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.txCard, { borderColor: `${color}20` }]}
      onPress={() => setExpanded(e => !e)}
      activeOpacity={0.8}
    >
      {/* Accent Bar */}
      <View style={[styles.txAccent, { backgroundColor: color }]} />

      <View style={styles.txMain}>
        {/* Icon */}
        <View style={[styles.txIconWrap, { backgroundColor: bg }]}>
          <ArrowUpRight size={16} color={color} />
        </View>

        {/* Info */}
        <View style={styles.txInfo}>
          <Text style={styles.txRoute}>
            {tx.sender} <Text style={{ color: COLORS.textMuted }}>→</Text> {tx.receiver}
          </Text>
          <Text style={styles.txTime}>{timeAgo(tx.timestamp)}</Text>
        </View>

        {/* Right */}
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color }]}>{tx.amount} kWh</Text>
          <View style={[styles.txStatusPill, { backgroundColor: bg }]}>
            <StatusIcon size={9} color={color} />
            <Text style={[styles.txStatusText, { color }]}>{t(STATUS_LABEL_KEY[tx.status] ?? tx.status)}</Text>
          </View>
        </View>

        {expanded ? <ChevronUp size={14} color={COLORS.textMuted} /> : <ChevronDown size={14} color={COLORS.textMuted} />}
      </View>

      {/* Expanded Details */}
      {expanded && (
        <View style={styles.txExpanded}>
          <View style={styles.expandRow}>
            <Text style={styles.expandLabel}>{t('admin.transactions.expand.reference')}</Text>
            <Text style={styles.expandValue}>{tx.referenceCode}</Text>
          </View>
          <View style={styles.expandRow}>
            <Text style={styles.expandLabel}>{t('admin.transactions.expand.dateTime')}</Text>
            <Text style={styles.expandValue}>
              {new Date(tx.timestamp).toLocaleString('en-GB', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.expandRow}>
            <Text style={styles.expandLabel}>{t('admin.transactions.expand.energyAmount')}</Text>
            <Text style={styles.expandValue}>{tx.amount} kWh</Text>
          </View>
          <View style={styles.expandRow}>
            <Text style={styles.expandLabel}>{t('admin.transactions.expand.status')}</Text>
            <Text style={[styles.expandValue, { color }]}>{t(STATUS_LABEL_KEY[tx.status] ?? tx.status)}</Text>
          </View>

          {tx.status === 'Reversed' && (
            <View>
              <Text style={styles.expandLabel}>{t('admin.transactions.reversalReason')}</Text>
              <Text style={styles.expandValue}>{tx.reversalReason || t('admin.transactions.historicalReversal')}</Text>
              {tx.reversedAt && <Text style={styles.txTime}>
                {t('admin.transactions.reversalAudit', {
                  date: new Date(tx.reversedAt).toLocaleString('en-GB', { timeZone: 'Asia/Colombo' }),
                  admin: tx.reversedByName || tx.reversedBy,
                })}
              </Text>}
            </View>
          )}

          {tx.status === 'Completed' && (
            <View>
              <Text style={styles.expandLabel}>{t('admin.transactions.reversalReasonHint')}</Text>
              <TextInput accessibilityLabel={t('admin.transactions.reversalReason')} value={reason} onChangeText={setReason}
                placeholder={t('admin.transactions.reversalReasonPlaceholder')}
                placeholderTextColor={COLORS.textMuted} multiline maxLength={500} editable={!isReversing}
                style={{ color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.textMuted,
                  borderRadius: 8, padding: 12, marginTop: 8, minHeight: 72, textAlignVertical: 'top' }} />
            </View>
          )}

          {tx.status === 'Completed' && (
            <TouchableOpacity
              style={[styles.reverseBtn, (isReversing || reason.trim().length < 10) && styles.reverseBtnDisabled]}
              onPress={handleReverse}
              disabled={isReversing || reason.trim().length < 10}
              activeOpacity={0.8}
            >
              {isReversing
                ? <ActivityIndicator size="small" color={COLORS.red} />
                : <RotateCcw size={14} color={COLORS.red} />
              }
              <Text style={styles.reverseBtnText}>
                {isReversing ? t('admin.transactions.reversing') : t('admin.transactions.reverseAction')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function TransactionMonitoringScreen() {
  const { t } = useTranslation();
  const {
    transactions,
    transactionsLoading,
    transactionsError,
    loadTransactions,
    reverseTransaction,
  } = useAdmin();
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All'
    ? transactions
    : transactions.filter(t2 => t2.status === filter);

  const completed = transactions.filter(t2 => t2.status === 'Completed');
  const reversed  = transactions.filter(t2 => t2.status === 'Reversed');
  const totalKwh  = completed.reduce((s, t2) => s + t2.amount, 0).toFixed(1);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (transactionsLoading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Receipt size={18} color={COLORS.amberLight} />
          <Text style={styles.screenTitle}>{t('admin.transactions.title')}</Text>
        </View>
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.txCard, styles.skeletonCard]}>
            <View style={[styles.skeletonBar, { width: '60%', marginBottom: 8 }]} />
            <View style={[styles.skeletonBar, { width: '40%' }]} />
          </View>
        ))}
      </ScrollView>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (transactionsError) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Receipt size={18} color={COLORS.amberLight} />
          <Text style={styles.screenTitle}>{t('admin.transactions.title')}</Text>
        </View>
        <View style={[GLASS.card, styles.errorCard]}>
          <AlertCircle size={28} color={COLORS.red} />
          <Text style={styles.errorTitle}>{t('admin.transactions.errorTitle')}</Text>
          <Text style={styles.errorMessage}>{transactionsError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadTransactions} activeOpacity={0.8}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Title */}
      <View style={styles.titleRow}>
        <Receipt size={18} color={COLORS.amberLight} />
        <Text style={styles.screenTitle}>{t('admin.transactions.title')}</Text>
      </View>

      {/* Summary Bar */}
      <View style={[GLASS.card, styles.summaryCard]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: COLORS.tealLight }]}>{completed.length}</Text>
          <Text style={styles.summaryLabel}>{t('common.status.completed')}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: COLORS.red }]}>{reversed.length}</Text>
          <Text style={styles.summaryLabel}>{t('common.status.reversed')}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: COLORS.textBright }]}>{totalKwh}</Text>
          <Text style={styles.summaryLabel}>{t('admin.transactions.kwhShared')}</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{t(STATUS_LABEL_KEY[f])}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transaction List */}
      <Text style={styles.listLabel}>
        {t('admin.transactions.listLabel', { count: filtered.length })}
        {filter !== 'All' ? ` · ${t(STATUS_LABEL_KEY[filter])}` : ''}
      </Text>

      {filtered.length === 0 ? (
        <View style={[GLASS.card, styles.emptyCard]}>
          <Text style={styles.emptyText}>{t('admin.transactions.noMatch')}</Text>
        </View>
      ) : (
        filtered.map(tx => <TxRow key={tx.id} tx={tx} onReverse={reverseTransaction} t={t} />)
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 12 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  screenTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textBright },

  summaryCard: { flexDirection: 'row', padding: 16, alignItems: 'center', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', gap: 4 },
  summaryNum: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
  summaryDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.1)' },

  filterRow: { gap: 6 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderColor: 'rgba(245,158,11,0.35)',
  },
  filterText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  filterTextActive: { color: COLORS.amberLight, fontWeight: '700' },

  listLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 2 },

  emptyCard: { padding: 24, alignItems: 'center' },
  emptyText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },

  // Transaction Card
  txCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  txAccent: { height: 3, width: '100%' },
  txMain: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  txIconWrap: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, gap: 3 },
  txRoute: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  txTime: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },
  txRight: { alignItems: 'flex-end', gap: 4, marginRight: 6 },
  txAmount: { fontSize: 16, fontWeight: '800' },
  txStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  txStatusText: { fontSize: 10, fontWeight: '700' },

  // Expanded
  txExpanded: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  expandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expandLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  expandValue: { fontSize: 12, color: COLORS.textPrimary, fontWeight: '700' },

  reverseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  reverseBtnDisabled: { opacity: 0.6 },
  reverseBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.red },

  // Skeleton / error states
  skeletonCard: { padding: 18, minHeight: 60, justifyContent: 'center' },
  skeletonBar: { height: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6 },
  errorCard: { padding: 28, alignItems: 'center', gap: 10 },
  errorTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textBright },
  errorMessage: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 18 },
  retryBtn: {
    marginTop: 6,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    borderRadius: 14,
  },
  retryText: { fontSize: 13, fontWeight: '700', color: COLORS.red },
});
