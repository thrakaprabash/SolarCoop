import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { COLORS, GLASS } from '../../theme/colors';
import { MOCK_COMPLAINTS, timeAgo } from '../data/mockAdminData';
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Receipt,
} from 'lucide-react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FILTERS = ['All', 'Open', 'Under Review', 'Resolved', 'Rejected'];

const STATUS_COLOR = {
  'Open':         COLORS.red,
  'Under Review': COLORS.amberLight,
  'Resolved':     COLORS.tealLight,
  'Rejected':     COLORS.textMuted,
};

const STATUS_BG = {
  'Open':         'rgba(239,68,68,0.12)',
  'Under Review': 'rgba(251,191,36,0.12)',
  'Resolved':     'rgba(45,212,191,0.12)',
  'Rejected':     'rgba(255,255,255,0.05)',
};

const TYPE_COLOR = {
  'Transaction Error': COLORS.red,
  'Billing Dispute':   COLORS.amberLight,
  'System Fault':      COLORS.teal,
  'Other':             COLORS.textSecondary,
};

// ─── 4-Step Stepper ──────────────────────────────────────────────────────────
const STEPS = ['Open', 'Under Review', 'Investigated', 'Resolved'];

function StatusStepper({ currentStatus }) {
  const stepMap = {
    'Open': 0, 'Under Review': 1, 'Investigated': 2, 'Resolved': 3, 'Rejected': -1,
  };
  const currentStep = stepMap[currentStatus] ?? 0;

  return (
    <View style={styles.stepperRow}>
      {STEPS.map((step, i) => {
        const done    = currentStep > i;
        const active  = currentStep === i;
        const color   = done || active ? COLORS.amberLight : COLORS.textMuted;
        const bgColor = active ? 'rgba(245,158,11,0.25)' : done ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)';

        return (
          <React.Fragment key={step}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, { backgroundColor: bgColor, borderColor: active ? 'rgba(245,158,11,0.5)' : 'transparent' }]}>
                {done ? (
                  <CheckCircle size={12} color={COLORS.amberLight} />
                ) : (
                  <Text style={[styles.stepNum, { color }]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, { color }]} numberOfLines={1}>{step}</Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, { backgroundColor: done ? COLORS.amberLight : 'rgba(255,255,255,0.1)' }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ─── Complaint Card ───────────────────────────────────────────────────────────
function ComplaintCard({ complaint, onUpdateStatus }) {
  const [expanded, setExpanded]     = useState(false);
  const [note, setNote]             = useState(complaint.resolutionNote);
  const [status, setStatus]         = useState(complaint.status);
  const accentColor = STATUS_COLOR[status];
  const canAct = status === 'Open' || status === 'Under Review';

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(e => !e);
  };

  const changeStatus = (newStatus) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStatus(newStatus);
    onUpdateStatus && onUpdateStatus(complaint.id, newStatus);
  };

  return (
    <View style={[styles.complaintCard, { borderColor: `${accentColor}22` }]}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <TouchableOpacity style={styles.cardHeader} onPress={handleToggle} activeOpacity={0.85}>
        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: `${TYPE_COLOR[complaint.type] ?? COLORS.textMuted}15` }]}>
          <Text style={[styles.typeText, { color: TYPE_COLOR[complaint.type] ?? COLORS.textSecondary }]}>
            {complaint.type}
          </Text>
        </View>

        <View style={styles.headerMain}>
          {/* Complainant + household */}
          <View style={styles.headerTop}>
            <Text style={styles.complainantName}>{complaint.complainant}</Text>
            <View style={[styles.statusPill, { backgroundColor: STATUS_BG[status], borderColor: `${accentColor}30` }]}>
              <Text style={[styles.statusPillText, { color: accentColor }]}>{status}</Text>
            </View>
          </View>
          <Text style={styles.householdText}>{complaint.household}</Text>
          <Text style={styles.descPreview} numberOfLines={2}>{complaint.description}</Text>
          <Text style={styles.cardTime}>{timeAgo(complaint.submittedAt)}</Text>
        </View>

        {expanded ? <ChevronUp size={16} color={COLORS.textMuted} /> : <ChevronDown size={16} color={COLORS.textMuted} />}
      </TouchableOpacity>

      {/* Expanded Panel */}
      {expanded && (
        <View style={styles.expandedPanel}>
          {/* Full description */}
          <View style={styles.expandSection}>
            <Text style={styles.expandSectionTitle}>Full Description</Text>
            <Text style={styles.expandBody}>{complaint.description}</Text>
          </View>

          {/* Related transaction */}
          {complaint.relatedTransaction && (
            <View style={styles.expandSection}>
              <Text style={styles.expandSectionTitle}>Related Transaction</Text>
              <View style={styles.txRefRow}>
                <Receipt size={13} color={COLORS.amberLight} />
                <Text style={styles.txRefText}>
                  {complaint.relatedTransaction.toUpperCase()} · {complaint.relatedAmount} kWh
                </Text>
              </View>
            </View>
          )}

          {/* Status Stepper */}
          <View style={styles.expandSection}>
            <Text style={styles.expandSectionTitle}>Resolution Progress</Text>
            <StatusStepper currentStatus={status} />
          </View>

          {/* Resolution Note */}
          <View style={styles.expandSection}>
            <Text style={styles.expandSectionTitle}>Resolution Note</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Add resolution note…"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Action Buttons */}
          {canAct && (
            <View style={styles.actionBtnsRow}>
              {status === 'Open' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.3)' }]}
                  onPress={() => changeStatus('Under Review')}
                  activeOpacity={0.8}
                >
                  <Eye size={14} color={COLORS.amberLight} />
                  <Text style={[styles.actionBtnText, { color: COLORS.amberLight }]}>Review</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: 'rgba(45,212,191,0.12)', borderColor: 'rgba(45,212,191,0.3)' }]}
                onPress={() => changeStatus('Resolved')}
                activeOpacity={0.8}
              >
                <CheckCircle size={14} color={COLORS.tealLight} />
                <Text style={[styles.actionBtnText, { color: COLORS.tealLight }]}>Resolve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)' }]}
                onPress={() => changeStatus('Rejected')}
                activeOpacity={0.8}
              >
                <XCircle size={14} color={COLORS.red} />
                <Text style={[styles.actionBtnText, { color: COLORS.red }]}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Already resolved/rejected note */}
          {!canAct && complaint.resolutionNote ? (
            <View style={styles.expandSection}>
              <Text style={styles.expandSectionTitle}>Admin Note</Text>
              <Text style={styles.expandBody}>{complaint.resolutionNote}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ComplaintsScreen() {
  const [filter, setFilter] = useState('All');
  const [complaints, setComplaints] = useState(MOCK_COMPLAINTS);

  const filtered = filter === 'All'
    ? complaints
    : complaints.filter(c => c.status === filter);

  const openCnt       = complaints.filter(c => c.status === 'Open').length;
  const reviewCnt     = complaints.filter(c => c.status === 'Under Review').length;
  const resolvedCnt   = complaints.filter(c => c.status === 'Resolved').length;

  const handleUpdate = (id, newStatus) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Title */}
      <View style={styles.titleRow}>
        <MessageSquare size={18} color={COLORS.amberLight} />
        <Text style={styles.screenTitle}>Complaints</Text>
      </View>

      {/* Stats Strip */}
      <View style={styles.statsStrip}>
        <View style={[styles.statPill, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
          <Text style={[styles.statNum, { color: COLORS.red }]}>{openCnt}</Text>
          <Text style={[styles.statLabel, { color: COLORS.red }]}>Open</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: 'rgba(251,191,36,0.12)' }]}>
          <Text style={[styles.statNum, { color: COLORS.amberLight }]}>{reviewCnt}</Text>
          <Text style={[styles.statLabel, { color: COLORS.amberLight }]}>In Review</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: 'rgba(45,212,191,0.12)' }]}>
          <Text style={[styles.statNum, { color: COLORS.tealLight }]}>{resolvedCnt}</Text>
          <Text style={[styles.statLabel, { color: COLORS.tealLight }]}>Resolved</Text>
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

      {/* Complaint Cards */}
      {filtered.length === 0 ? (
        <View style={[GLASS.card, styles.emptyCard]}>
          <CheckCircle size={28} color={COLORS.tealLight} />
          <Text style={styles.emptyTitle}>No Complaints Here</Text>
          <Text style={styles.emptyText}>Nothing to show for "{filter}".</Text>
        </View>
      ) : (
        filtered.map(c => (
          <ComplaintCard key={c.id} complaint={c} onUpdateStatus={handleUpdate} />
        ))
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

  statsStrip: { flexDirection: 'row', gap: 10 },
  statPill: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, gap: 3 },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600' },

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

  // Complaint Card
  complaintCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    paddingLeft: 18,
  },
  typeBadge: { marginTop: 2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  typeText: { fontSize: 10, fontWeight: '700' },
  headerMain: { flex: 1, gap: 5 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  complainantName: { fontSize: 14, fontWeight: '800', color: COLORS.textBright, flex: 1, marginRight: 8 },
  statusPill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  householdText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  descPreview: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17, fontWeight: '500' },
  cardTime: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },

  // Expanded Panel
  expandedPanel: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    padding: 14,
    paddingLeft: 18,
    gap: 16,
  },
  expandSection: { gap: 8 },
  expandSectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  expandBody: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, fontWeight: '500' },

  txRefRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txRefText: { fontSize: 13, fontWeight: '700', color: COLORS.amberLight },

  // Stepper
  stepperRow: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { alignItems: 'center', gap: 5, flex: 1 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepNum: { fontSize: 12, fontWeight: '700' },
  stepLabel: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  stepLine: { height: 2, flex: 0.8, marginBottom: 18, borderRadius: 1 },

  // Note Input
  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
    minHeight: 70,
    textAlignVertical: 'top',
  },

  // Action Buttons
  actionBtnsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  emptyCard: { padding: 32, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textBright },
  emptyText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
});
