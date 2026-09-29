import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import { useAdmin } from '../context/AdminContext';
import { timeAgo } from '../data/mockAdminData';
import { fetchTransactionsForMember } from '../services/adminTransactionService';
import {
  ArrowLeft,
  Sun,
  Zap,
  BatteryCharging,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Mail,
  Home,
  Cpu,
  UserCheck,
  UserX,
  ShieldOff,
} from 'lucide-react-native';

const STATUS_COLORS = {
  Active:    COLORS.tealLight,
  Pending:   COLORS.blueLight,
  Inactive:  COLORS.amberLight,
  Suspended: COLORS.red,
};

// Canonical status values stay in English — only the label shown is translated.
const STATUS_LABEL_KEY = {
  Active:    'common.status.active',
  Pending:   'common.status.pending',
  Inactive:  'common.status.inactive',
  Suspended: 'common.status.suspended',
};

export default function MemberDetailScreen() {
  const { t } = useTranslation();
  const { selectedMember, setSelectedMember, setAdminBottomTab, updateMemberStatus } = useAdmin();
  const [updating, setUpdating] = useState(false);
  const [relatedTx, setRelatedTx] = useState([]);
  const [relatedTxLoading, setRelatedTxLoading] = useState(true);
  const [relatedTxError, setRelatedTxError] = useState(null);

  const memberId = selectedMember?.id;

  // Fetched independently of TransactionMonitoringScreen's list, so this
  // section works correctly even if the admin opens a member's detail page
  // without having visited the Ledger tab first.
  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;

    setRelatedTxLoading(true);
    setRelatedTxError(null);
    fetchTransactionsForMember(memberId, 5)
      .then(data => { if (!cancelled) setRelatedTx(data); })
      .catch(err => { if (!cancelled) setRelatedTxError(err.message || t('admin.memberDetail.loadTxError')); })
      .finally(() => { if (!cancelled) setRelatedTxLoading(false); });

    return () => { cancelled = true; };
  }, [memberId]);

  if (!selectedMember) return null;

  // Status comes from selectedMember — kept in sync by AdminContext's optimistic update
  const memberStatus = selectedMember.status ?? 'Active';
  const member       = selectedMember;
  const accentColor  = STATUS_COLORS[memberStatus];
  const hasSurplus   = member.todaySurplus > 0;

  const handleBack = () => {
    setSelectedMember(null);
    setAdminBottomTab('members');
  };

  const performStatusChange = async (newStatus) => {
    setUpdating(true);
    const statusLabel = t(STATUS_LABEL_KEY[newStatus] ?? newStatus);
    try {
      await updateMemberStatus(member.id, newStatus);
      const msg = t('admin.memberDetail.statusUpdatedMessage', { name: member.name, status: statusLabel });
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert(t('admin.memberDetail.statusUpdatedTitle'), msg);
      }
    } catch (err) {
      const errMsg = err?.message || t('admin.memberDetail.updateFailedDefault');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(t('admin.memberDetail.updateFailedInline', { message: errMsg }));
      } else {
        Alert.alert(t('admin.memberDetail.updateFailedTitle'), errMsg);
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    if (updating) return;
    const statusLabel = t(STATUS_LABEL_KEY[newStatus] ?? newStatus);
    const confirmTitle = t('admin.memberDetail.confirmStatusTitle', { status: statusLabel });
    const confirmText = t('admin.memberDetail.confirmStatusMessage', { name: member.name, status: statusLabel });

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm ? window.confirm(confirmText) : true) {
        performStatusChange(newStatus);
      }
      return;
    }

    Alert.alert(
      confirmTitle,
      confirmText,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.memberDetail.confirm'),
          onPress: () => performStatusChange(newStatus),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
        <ArrowLeft size={16} color={COLORS.textSecondary} />
        <Text style={styles.backText}>{t('admin.memberDetail.backToMembers')}</Text>
      </TouchableOpacity>

      {/* Profile Header Card */}
      <View style={[GLASS.card, styles.profileCard]}>
        {/* Accent Banner */}
        <View style={[styles.profileBanner, { backgroundColor: `${accentColor}18` }]} />

        <View style={[styles.profileAvatar, { backgroundColor: 'rgba(245,158,11,0.2)', borderColor: 'rgba(245,158,11,0.4)' }]}>
          <Text style={styles.profileAvatarText}>
            {member.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </Text>
        </View>

        <Text style={styles.profileName}>{member.name}</Text>
        <View style={[styles.statusBadgeLarge, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}40` }]}>
          <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
          <Text style={[styles.statusBadgeText, { color: accentColor }]}>{t(STATUS_LABEL_KEY[memberStatus] ?? memberStatus)}</Text>
        </View>

        <View style={styles.profileInfoGrid}>
          <View style={styles.infoItem}>
            <Mail size={13} color={COLORS.textMuted} />
            <Text style={styles.infoText}>{member.email}</Text>
          </View>
          <View style={styles.infoItem}>
            <Home size={13} color={COLORS.textMuted} />
            <Text style={styles.infoText}>{member.household}</Text>
          </View>
          <View style={styles.infoItem}>
            <Cpu size={13} color={COLORS.textMuted} />
            <Text style={styles.infoText}>{t('admin.memberDetail.capacityLabel', { capacity: member.solarCapacity })}</Text>
          </View>
          <View style={styles.infoItem}>
            <Calendar size={13} color={COLORS.textMuted} />
            <Text style={styles.infoText}>
              {t('admin.memberDetail.joined', {
                date: new Date(member.joinDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
              })}
            </Text>
          </View>
        </View>
      </View>

      {/* Energy Overview */}
      <View style={[GLASS.card, styles.sectionCard]}>
        <Text style={styles.sectionTitle}>{t('admin.memberDetail.energyOverviewToday')}</Text>
        <View style={styles.energyGrid}>
          <View style={styles.energyCell}>
            <View style={[styles.energyIcon, { backgroundColor: 'rgba(251,191,36,0.12)' }]}>
              <Sun size={16} color={COLORS.amberLight} />
            </View>
            <Text style={styles.energyValue}>{member.todayProduction}</Text>
            <Text style={styles.energyUnit}>kWh</Text>
            <Text style={styles.energyLabel}>{t('admin.memberDetail.produced')}</Text>
          </View>
          <View style={styles.energyCell}>
            <View style={[styles.energyIcon, { backgroundColor: 'rgba(20,184,166,0.12)' }]}>
              <Zap size={16} color={COLORS.teal} />
            </View>
            <Text style={styles.energyValue}>{member.todayConsumption}</Text>
            <Text style={styles.energyUnit}>kWh</Text>
            <Text style={styles.energyLabel}>{t('admin.memberDetail.consumed')}</Text>
          </View>
          <View style={styles.energyCell}>
            <View style={[styles.energyIcon, { backgroundColor: hasSurplus ? 'rgba(45,212,191,0.12)' : 'rgba(239,68,68,0.1)' }]}>
              {hasSurplus ? <TrendingUp size={16} color={COLORS.tealLight} /> : <TrendingDown size={16} color={COLORS.red} />}
            </View>
            <Text style={[styles.energyValue, { color: hasSurplus ? COLORS.tealLight : COLORS.red }]}>
              {hasSurplus ? '+' : ''}{member.todaySurplus.toFixed(1)}
            </Text>
            <Text style={styles.energyUnit}>kWh</Text>
            <Text style={styles.energyLabel}>{hasSurplus ? t('admin.memberDetail.surplus') : t('admin.memberDetail.deficit')}</Text>
          </View>
        </View>

        {/* Weekly stats */}
        <View style={styles.weeklyRow}>
          <View style={styles.weeklyItem}>
            <Text style={styles.weeklyLabel}>{t('admin.memberDetail.weeklyProduction')}</Text>
            <Text style={styles.weeklyValue}>{member.weeklyProduction} kWh</Text>
          </View>
          <View style={styles.weeklyItem}>
            <Text style={styles.weeklyLabel}>{t('admin.memberDetail.weeklyConsumption')}</Text>
            <Text style={styles.weeklyValue}>{member.weeklyConsumption} kWh</Text>
          </View>
        </View>
      </View>

      {/* Account Actions */}
      <View style={[GLASS.card, styles.sectionCard]}>
        <Text style={styles.sectionTitle}>{t('admin.memberDetail.accountManagement')}</Text>
        <Text style={styles.sectionSubtext}>{t('admin.memberDetail.accountManagementSubtitle')}</Text>
        <View style={styles.actionBtnsCol}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: 'rgba(45,212,191,0.15)', borderColor: 'rgba(45,212,191,0.3)' }, (memberStatus === 'Active' || updating) && styles.actionBtnDisabled]}
            onPress={() => handleStatusChange('Active')}
            disabled={memberStatus === 'Active' || updating}
            activeOpacity={0.8}
          >
            {updating && memberStatus !== 'Active'
              ? <ActivityIndicator size="small" color={COLORS.tealLight} />
              : <UserCheck size={16} color={COLORS.tealLight} />
            }
            <Text style={[styles.actionBtnText, { color: COLORS.tealLight }]}>{t('admin.memberDetail.activateAccount')}</Text>
            {memberStatus === 'Active' && <View style={styles.currentBadge}><Text style={styles.currentText}>{t('admin.memberDetail.current')}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.3)' }, (memberStatus === 'Inactive' || updating) && styles.actionBtnDisabled]}
            onPress={() => handleStatusChange('Inactive')}
            disabled={memberStatus === 'Inactive' || updating}
            activeOpacity={0.8}
          >
            {updating && memberStatus !== 'Inactive'
              ? <ActivityIndicator size="small" color={COLORS.amberLight} />
              : <UserX size={16} color={COLORS.amberLight} />
            }
            <Text style={[styles.actionBtnText, { color: COLORS.amberLight }]}>{t('admin.memberDetail.deactivateAccount')}</Text>
            {memberStatus === 'Inactive' && <View style={styles.currentBadge}><Text style={styles.currentText}>{t('admin.memberDetail.current')}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' }, (memberStatus === 'Suspended' || updating) && styles.actionBtnDisabled]}
            onPress={() => handleStatusChange('Suspended')}
            disabled={memberStatus === 'Suspended' || updating}
            activeOpacity={0.8}
          >
            {updating && memberStatus !== 'Suspended'
              ? <ActivityIndicator size="small" color={COLORS.red} />
              : <ShieldOff size={16} color={COLORS.red} />
            }
            <Text style={[styles.actionBtnText, { color: COLORS.red }]}>{t('admin.memberDetail.suspendAccount')}</Text>
            {memberStatus === 'Suspended' && <View style={styles.currentBadge}><Text style={styles.currentText}>{t('admin.memberDetail.current')}</Text></View>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={[GLASS.card, styles.sectionCard]}>
        <Text style={styles.sectionTitle}>{t('admin.memberDetail.recentTransactions')}</Text>
        {relatedTxLoading ? (
          <ActivityIndicator size="small" color={COLORS.amberLight} />
        ) : relatedTxError ? (
          <Text style={styles.emptyText}>{relatedTxError}</Text>
        ) : relatedTx.length === 0 ? (
          <Text style={styles.emptyText}>{t('admin.memberDetail.noTransactions')}</Text>
        ) : (
          relatedTx.map(tx => {
            const isSender   = tx.senderId === member.id;
            const txColor    = tx.status === 'Completed' ? COLORS.tealLight : COLORS.red;
            return (
              <View key={tx.id} style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: `${txColor}18` }]}>
                  {isSender ? <ArrowUpRight size={14} color={txColor} /> : <ArrowDownLeft size={14} color={txColor} />}
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDesc}>
                    {isSender ? t('admin.memberDetail.toMember', { name: tx.receiver }) : t('admin.memberDetail.fromMember', { name: tx.sender })}
                  </Text>
                  <Text style={styles.txTime}>{timeAgo(tx.timestamp)}</Text>
                </View>
                <View>
                  <Text style={[styles.txAmount, { color: isSender ? COLORS.red : COLORS.tealLight }]}>
                    {isSender ? '-' : '+'}{tx.amount} kWh
                  </Text>
                  <View style={[styles.txStatus, { backgroundColor: `${txColor}18` }]}>
                    <Text style={[styles.txStatusText, { color: txColor }]}>{t(tx.status === 'Completed' ? 'common.status.completed' : 'common.status.reversed')}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 14 },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  backText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },

  // Profile Card
  profileCard: { padding: 20, alignItems: 'center', gap: 10, overflow: 'hidden' },
  profileBanner: { position: 'absolute', top: 0, left: 0, right: 0, height: 50 },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginTop: 10,
  },
  profileAvatarText: { fontSize: 24, fontWeight: '800', color: COLORS.amberLight },
  profileName: { fontSize: 20, fontWeight: '800', color: COLORS.textBright, textAlign: 'center' },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  profileInfoGrid: { width: '100%', gap: 8, marginTop: 6 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },

  // Energy Overview
  sectionCard: { padding: 16, gap: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textBright },
  sectionSubtext: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500', marginTop: -8 },
  energyGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  energyCell: { alignItems: 'center', gap: 4 },
  energyIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  energyValue: { fontSize: 22, fontWeight: '800', color: COLORS.textBright },
  energyUnit: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', marginTop: -4 },
  energyLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  weeklyRow: { flexDirection: 'row', gap: 10 },
  weeklyItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  weeklyLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  weeklyValue: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },

  // Action Buttons
  actionBtnsCol: { gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionBtnText: { flex: 1, fontSize: 13, fontWeight: '700' },
  actionBtnDisabled: { opacity: 0.5 },
  currentBadge: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  currentText: { fontSize: 9, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.5 },

  // Transactions
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  txIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, gap: 2 },
  txDesc: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  txTime: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },
  txAmount: { fontSize: 14, fontWeight: '800', textAlign: 'right' },
  txStatus: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-end', marginTop: 2 },
  txStatusText: { fontSize: 9, fontWeight: '700' },
  emptyText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
});
