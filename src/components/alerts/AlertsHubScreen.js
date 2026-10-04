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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, GLASS } from '../../theme/colors';
import { timeAgo } from '../../admin/data/mockAdminData';
import { FaultAlertCard } from './FaultAlertCard';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Receipt,
  PlusCircle,
  Pencil,
  Trash2,
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

const STATUS_LABEL_KEY = {
  'Open':         'common.status.open',
  'Under Review': 'common.status.underReview',
  'Resolved':     'common.status.resolved',
  'Rejected':     'common.status.rejected',
};

const TYPE_COLOR = {
  'Transaction Error': COLORS.red,
  'Billing Dispute':   COLORS.amberLight,
  'System Fault':      COLORS.teal,
  'Other':             COLORS.textSecondary,
};

const TYPE_LABEL_KEY = {
  'Transaction Error': 'admin.complaints.type.transactionError',
  'Billing Dispute':   'admin.complaints.type.billingDispute',
  'System Fault':      'admin.complaints.type.systemFault',
  'Other':             'admin.complaints.type.other',
};

// ─── 4-Step Stepper ──────────────────────────────────────────────────────────
const STEPS = ['Open', 'Under Review', 'Investigated', 'Resolved'];

const STEP_LABEL_KEY = {
  'Open':         'common.status.open',
  'Under Review': 'common.status.underReview',
  'Investigated': 'admin.complaints.investigated',
  'Resolved':     'common.status.resolved',
};

function StatusStepper({ currentStatus }) {
  const { t } = useTranslation();
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
              <Text style={[styles.stepLabel, { color }]} numberOfLines={1}>{t(STEP_LABEL_KEY[step])}</Text>
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
function MemberComplaintCard({ complaint, onEdit, onDelete }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const status = complaint.status;
  const accentColor = STATUS_COLOR[status] ?? COLORS.amberLight;
  const canEditOrDelete = complaint.canEdit || complaint.canDelete || status === 'Open';

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(e => !e);
  };

  const handleDelete = () => {
    const confirmDelete = async () => {
      try {
        setIsDeleting(true);
        await onDelete(complaint.id);
      } catch (err) {
        const msg = err?.message || t('member.alertsHub.deleteFailed');
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert(t('common.error'), msg);
        setIsDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t('member.alertsHub.deleteConfirmMessage'))) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        t('member.alertsHub.deleteConfirmTitle'),
        t('member.alertsHub.deleteConfirmMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.delete'), style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  return (
    <View style={[styles.complaintCard, { borderColor: `${accentColor}22` }]}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <TouchableOpacity style={styles.cardHeader} onPress={handleToggle} activeOpacity={0.85}>
        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: `${TYPE_COLOR[complaint.type] ?? COLORS.textMuted}15` }]}>
          <Text style={[styles.typeText, { color: TYPE_COLOR[complaint.type] ?? COLORS.textSecondary }]}>
            {t(TYPE_LABEL_KEY[complaint.type] ?? TYPE_LABEL_KEY.Other)}
          </Text>
        </View>

        <View style={styles.headerMain}>
          <View style={styles.headerTop}>
            <Text style={styles.descPreview} numberOfLines={1}>{complaint.description}</Text>
            <View style={[styles.statusPill, { backgroundColor: STATUS_BG[status], borderColor: `${accentColor}30` }]}>
              <Text style={[styles.statusPillText, { color: accentColor }]}>{t(STATUS_LABEL_KEY[status] ?? STATUS_LABEL_KEY.Open)}</Text>
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
            <Text style={styles.expandSectionTitle}>{t('member.alertsHub.yourDescription')}</Text>
            <Text style={styles.expandBody}>{complaint.description}</Text>
          </View>

          {/* Related transaction */}
          {complaint.relatedTransaction && (
            <View style={styles.expandSection}>
              <Text style={styles.expandSectionTitle}>{t('admin.complaints.section.relatedTransaction')}</Text>
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
            <Text style={styles.expandSectionTitle}>{t('admin.complaints.section.resolutionProgress')}</Text>
            <StatusStepper currentStatus={status} />
          </View>

          {/* Admin Note */}
          {complaint.resolutionNote ? (
            <View style={styles.expandSection}>
              <Text style={styles.expandSectionTitle}>{t('member.alertsHub.adminResponse')}</Text>
              <View style={styles.adminNoteBox}>
                <Text style={styles.adminNoteText}>{complaint.resolutionNote}</Text>
              </View>
            </View>
          ) : null}

          {/* Member Action Row (Edit & Delete for Open status) */}
          {canEditOrDelete && (
            <View style={styles.memberActionsRow}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => onEdit(complaint)}
                activeOpacity={0.8}
              >
                <Pencil size={13} color={COLORS.amberLight} />
                <Text style={styles.editBtnText}>{t('member.alertsHub.editComplaint')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteBtn, isDeleting && { opacity: 0.6 }]}
                onPress={handleDelete}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={COLORS.red} />
                ) : (
                  <>
                    <Trash2 size={13} color={COLORS.red} />
                    <Text style={styles.deleteBtnText}>{t('common.delete')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export const AlertsHubScreen = ({ onNavigate, complaints, faultAlerts = [], loading = false, onEdit, onDelete }) => {
  const { t } = useTranslation();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={[GLASS.card, styles.heroCard]}>
        <View style={styles.iconBadge}>
          <Bell size={28} color={COLORS.red} />
        </View>
        <Text style={styles.title}>{t('member.alertsHub.title')}</Text>
        <Text style={styles.subtitle}>{t('member.alertsHub.subtitle')}</Text>
      </View>

      {/* Maintenance status — shown only while a job is open at this household */}
      {faultAlerts.map(a => <FaultAlertCard key={a.id} alert={a} />)}

      {/* Action Button */}
      <TouchableOpacity
        style={styles.actionBtn}
        activeOpacity={0.8}
        onPress={() => onNavigate('submit')}
      >
        <PlusCircle size={18} color="#FFFFFF" />
        <Text style={styles.actionBtnText}>{t('member.alertsHub.submitButton')}</Text>
      </TouchableOpacity>

      {/* Complaints List */}
      <Text style={styles.sectionTitle}>{t('member.alertsHub.myComplaints')}</Text>

      {loading && complaints.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.amberLight} />
          <Text style={styles.loadingText}>{t('member.alertsHub.loadingText')}</Text>
        </View>
      ) : complaints.length === 0 ? (
        <View style={[GLASS.card, styles.emptyCard]}>
          <CheckCircle size={28} color={COLORS.tealLight} />
          <Text style={styles.emptyTitle}>{t('member.alertsHub.emptyTitle')}</Text>
          <Text style={styles.emptyText}>{t('member.alertsHub.emptyText')}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {complaints.map(c => (
            <MemberComplaintCard
              key={c.id}
              complaint={c}
              onEdit={onEdit}
              onDelete={onDelete}
            />
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

  loadingBox: { padding: 32, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },

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

  memberActionsRow: { flexDirection: 'row', gap: 10, marginTop: 4, justifyContent: 'flex-end' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  editBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.amberLight },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  deleteBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.red },

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
