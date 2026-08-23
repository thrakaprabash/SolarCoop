import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, GLASS } from '../../theme/colors';
import { MOCK_TRANSACTIONS, timeAgo } from '../data/mockAdminData';
import {
  Receipt,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';

const FILTERS = ['All', 'Completed', 'Pending', 'Failed'];

const TX_COLORS = {
  Completed: COLORS.tealLight,
  Pending:   COLORS.amberLight,
  Failed:    COLORS.red,
};

const TX_BG = {
  Completed: 'rgba(45,212,191,0.12)',
  Pending:   'rgba(251,191,36,0.12)',
  Failed:    'rgba(239,68,68,0.12)',
};

const TX_ICONS = {
  Completed: CheckCircle,
  Pending:   Clock,
  Failed:    XCircle,
};

function TxRow({ tx }) {
  const [expanded, setExpanded] = useState(false);
  const color  = TX_COLORS[tx.status];
  const bg     = TX_BG[tx.status];
  const StatusIcon = TX_ICONS[tx.status];

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
            <Text style={[styles.txStatusText, { color }]}>{tx.status}</Text>
          </View>
        </View>

        {expanded ? <ChevronUp size={14} color={COLORS.textMuted} /> : <ChevronDown size={14} color={COLORS.textMuted} />}
      </View>

      {/* Expanded Details */}
      {expanded && (
        <View style={styles.txExpanded}>
          <View style={styles.expandRow}>
            <Text style={styles.expandLabel}>Transaction ID</Text>
            <Text style={styles.expandValue}>{tx.id.toUpperCase()}</Text>
          </View>
          <View style={styles.expandRow}>
            <Text style={styles.expandLabel}>Date & Time</Text>
            <Text style={styles.expandValue}>
              {new Date(tx.timestamp).toLocaleString('en-GB', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.expandRow}>
            <Text style={styles.expandLabel}>Energy Amount</Text>
            <Text style={styles.expandValue}>{tx.amount} kWh</Text>
          </View>
          <View style={styles.expandRow}>
            <Text style={styles.expandLabel}>Status</Text>
            <Text style={[styles.expandValue, { color }]}>{tx.status}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function TransactionMonitoringScreen() {
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All'
    ? MOCK_TRANSACTIONS
    : MOCK_TRANSACTIONS.filter(t => t.status === filter);

  const completed = MOCK_TRANSACTIONS.filter(t => t.status === 'Completed');
  const pending   = MOCK_TRANSACTIONS.filter(t => t.status === 'Pending');
  const failed    = MOCK_TRANSACTIONS.filter(t => t.status === 'Failed');
  const totalKwh  = completed.reduce((s, t) => s + t.amount, 0).toFixed(1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Title */}
      <View style={styles.titleRow}>
        <Receipt size={18} color={COLORS.amberLight} />
        <Text style={styles.screenTitle}>Transaction Ledger</Text>
      </View>

      {/* Summary Bar */}
      <View style={[GLASS.card, styles.summaryCard]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: COLORS.tealLight }]}>{completed.length}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: COLORS.amberLight }]}>{pending.length}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: COLORS.red }]}>{failed.length}</Text>
          <Text style={styles.summaryLabel}>Failed</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: COLORS.textBright }]}>{totalKwh}</Text>
          <Text style={styles.summaryLabel}>kWh Shared</Text>
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
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transaction List */}
      <Text style={styles.listLabel}>
        {filtered.length} Transaction{filtered.length !== 1 ? 's' : ''}{filter !== 'All' ? ` · ${filter}` : ''}
      </Text>

      {filtered.map(tx => <TxRow key={tx.id} tx={tx} />)}

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
});
