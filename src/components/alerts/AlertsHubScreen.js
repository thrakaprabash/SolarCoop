import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { COLORS, GLASS } from '../../theme/colors';
import { timeAgo } from '../../admin/data/mockAdminData';
import {
  Bell,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  Receipt,
  PlusCircle
} from 'lucide-react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

// ─── Complaint Card (Member View) ─────────────────────────────────────────────
function MemberComplaintCard({ complaint }) {
  const [expanded, setExpanded] = useState(false);
  const status = complaint.status;
  const accentColor = STATUS_COLOR[status];

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(e => !e);
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
          <View style={styles.headerTop}>
            <Text style={styles.descPreview} numberOfLines={1}>{complaint.description}</Text>
            <View style={[styles.statusPill, { backgroundColor: STATUS_BG[status], borderColor: `${accentColor}30` }]}>
              <Text style={[styles.statusPillText, { color: accentColor }]}>{status}</Text>
            </View>
          </View>
          <Text style={styles.cardTime}>{timeAgo(complaint.submittedAt)}</Text>
        </View>

        {expanded ? <ChevronUp size={16} color={COLORS.textMuted} /> : <ChevronDown size={16} color={COLORS.textMuted} />}
      </TouchableOpacity>

      {/* Expanded Panel */}
      {expanded && (
        <View style={styles.expandedPanel}>
          {/* Full description */}
          <View style={styles.expandSection}>
            <Text style={styles.expandSectionTitle}>Your Description</Text>
            <Text style={styles.expandBody}>{complaint.description}</Text>
          </View>

          {/* Related transaction */}
          {complaint.relatedTransaction && (
            <View style={styles.expandSection}>
              <Text style={styles.expandSectionTitle}>Related Transaction</Text>
              <View style={styles.txRefRow}>
                <Receipt size={13} color={COLORS.amberLight} />
                <Text style={styles.txRefText}>
                  {complaint.relatedTransaction.toUpperCase()} {complaint.relatedAmount ? `· ${complaint.relatedAmount} kWh` : ''}
                </Text>
              </View>
            </View>
          )}

          {/* Status Stepper */}
          <View style={styles.expandSection}>
            <Text style={styles.expandSectionTitle}>Resolution Progress</Text>
            <StatusStepper currentStatus={status} />
          </View>

          {/* Admin Note */}
          {complaint.resolutionNote ? (
            <View style={styles.expandSection}>
              <Text style={styles.expandSectionTitle}>Admin Response</Text>
              <View style={styles.adminNoteBox}>
                <Text style={styles.adminNoteText}>{complaint.resolutionNote}</Text>
              </View>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export const AlertsHubScreen = ({ onNavigate, complaints }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* Header */}
      <View style={[GLASS.card, styles.heroCard]}>
        <View style={styles.iconBadge}>
          <Bell size={28} color={COLORS.red} />
        </View>
        <Text style={styles.title}>Alerts & Support</Text>
        <Text style={styles.subtitle}>System Incidents, Complaints & Ticket Resolution</Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity 
        style={styles.actionBtn} 
        activeOpacity={0.8}
        onPress={() => onNavigate('submit')}
      >
        <PlusCircle size={18} color="#FFFFFF" />
        <Text style={styles.actionBtnText}>Submit a Complaint</Text>
      </TouchableOpacity>

      {/* Complaints List */}
      <Text style={styles.sectionTitle}>My Complaints</Text>

      {complaints.length === 0 ? (
        <View style={[GLASS.card, styles.emptyCard]}>
          <CheckCircle size={28} color={COLORS.tealLight} />
          <Text style={styles.emptyTitle}>No Complaints</Text>
          <Text style={styles.emptyText}>You haven't submitted any complaints yet.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {complaints.map(c => (
            <MemberComplaintCard key={c.id} complaint={c} />
          ))}
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 16 },
  
  heroCard: { padding: 20, alignItems: 'center', gap: 8 },
  iconBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.redGlow, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textBright },
  subtitle: { fontSize: 12, textAlign: 'center', color: COLORS.textSecondary },

  actionBtn: { 
    backgroundColor: COLORS.redGlow, 
    borderWidth: 1, 
    borderColor: 'rgba(239, 68, 68, 0.35)', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    paddingVertical: 14, 
    borderRadius: 18 
  },
  actionBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textBright, marginTop: 8 },
  list: { gap: 12 },

  emptyCard: { padding: 32, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textBright },
  emptyText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },

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
    alignItems: 'center',
    gap: 10,
    padding: 14,
    paddingLeft: 18,
  },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, width: 90, alignItems: 'center' },
  typeText: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  headerMain: { flex: 1, gap: 4 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  descPreview: { fontSize: 13, color: COLORS.textBright, fontWeight: '600', flex: 1, marginRight: 8 },
  statusPill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  statusPillText: { fontSize: 9, fontWeight: '700' },
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
  expandSectionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  expandBody: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, fontWeight: '500' },

  txRefRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txRefText: { fontSize: 13, fontWeight: '700', color: COLORS.amberLight },

  adminNoteBox: {
    backgroundColor: 'rgba(45,212,191,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.2)',
    borderRadius: 12,
    padding: 12,
  },
  adminNoteText: { fontSize: 13, color: COLORS.tealLight, lineHeight: 19, fontWeight: '500' },

  // Stepper
  stepperRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  stepItem: { alignItems: 'center', gap: 5, flex: 1 },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepNum: { fontSize: 10, fontWeight: '700' },
  stepLabel: { fontSize: 8, fontWeight: '600', textAlign: 'center' },
  stepLine: { height: 2, flex: 0.8, marginBottom: 14, borderRadius: 1 },
});
