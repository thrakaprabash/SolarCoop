import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, GLASS } from '../../theme/colors';
import { useAdmin } from '../context/AdminContext';
import {
  Search,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Zap,
  Sun,
  AlertCircle,
  Users,
  UserPlus,
  X,
  CheckCircle2,
} from 'lucide-react-native';

const STATUS_COLORS = {
  Active:    COLORS.tealLight,
  Pending:   COLORS.blueLight,
  Inactive:  COLORS.amberLight,
  Suspended: COLORS.red,
};

const STATUS_BG = {
  Active:    'rgba(45,212,191,0.12)',
  Pending:   'rgba(59,130,246,0.12)',
  Inactive:  'rgba(251,191,36,0.12)',
  Suspended: 'rgba(239,68,68,0.12)',
};

// Canonical filter/status values stay in English — only the label shown for
// each is translated, so filtering and status comparisons are untouched.
const STATUS_LABEL_KEY = {
  All:       'common.status.all',
  Active:    'common.status.active',
  Pending:   'common.status.pending',
  Inactive:  'common.status.inactive',
  Suspended: 'common.status.suspended',
};

const FILTER_OPTS = ['All', 'Active', 'Pending', 'Inactive', 'Suspended'];

function MemberCard({ member, onPress, t }) {
  const accentColor = STATUS_COLORS[member.status];
  const hasSurplus = member.todaySurplus > 0;

  return (
    <TouchableOpacity
      style={styles.memberCard}
      onPress={() => onPress(member)}
      activeOpacity={0.75}
    >
      {/* Left Status Accent Bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: 'rgba(245,158,11,0.2)', borderColor: 'rgba(245,158,11,0.35)' }]}>
        <Text style={styles.avatarText}>
          {member.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
        </Text>
      </View>

      {/* Main Info */}
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[member.status], borderColor: `${accentColor}40` }]}>
            <Text style={[styles.statusText, { color: accentColor }]}>{t(STATUS_LABEL_KEY[member.status] ?? member.status)}</Text>
          </View>
        </View>
        <Text style={styles.householdText}>{member.household} · {member.solarCapacity} kW</Text>

        {/* Mini Stats */}
        <View style={styles.miniStatsRow}>
          <View style={styles.miniStat}>
            <Sun size={11} color={COLORS.amberLight} />
            <Text style={styles.miniStatText}>{member.todayProduction} kWh</Text>
          </View>
          <View style={styles.miniStat}>
            <Zap size={11} color={COLORS.teal} />
            <Text style={styles.miniStatText}>{member.todayConsumption} kWh</Text>
          </View>
          <View style={styles.miniStat}>
            {hasSurplus ? (
              <TrendingUp size={11} color={COLORS.tealLight} />
            ) : (
              <TrendingDown size={11} color={COLORS.red} />
            )}
            <Text style={[styles.miniStatText, { color: hasSurplus ? COLORS.tealLight : COLORS.red }]}>
              {hasSurplus ? '+' : ''}{member.todaySurplus.toFixed(1)} kWh
            </Text>
          </View>
        </View>

        {/* Mini Sparkline */}
        <View style={styles.sparklineRow}>
          {member.trend.map((val, i) => {
            const maxVal = Math.max(...member.trend, 1);
            const barH = Math.max((val / maxVal) * 20, 2);
            return (
              <View
                key={i}
                style={[
                  styles.sparkBar,
                  {
                    height: barH,
                    backgroundColor: i === member.trend.length - 1
                      ? COLORS.amberLight
                      : 'rgba(245,158,11,0.35)',
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      <ChevronRight size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const EMPTY_FORM = { email: '', name: '', mobile: '', household: '', capacity: '' };

function AddMemberModal({ visible, onClose, onCreate }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);

  const setField = (key) => (value) => setForm(f => ({ ...f, [key]: value }));

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setCreatedResult(null);
    onClose();
  };

  const handleSubmit = async () => {
    const email = form.email.trim();
    const name = form.name.trim();
    const household = form.household.trim();

    if (!name || !email || !household) {
      setFormError(t('admin.members.addModal.errorRequired'));
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setFormError(t('admin.members.addModal.errorInvalidEmail'));
      return;
    }

    setFormError(null);
    setIsCreating(true);
    try {
      const result = await onCreate({
        email,
        name,
        mobileNumber: form.mobile.trim() || null,
        householdId: household,
        solarCapacityKw: form.capacity.trim() ? Number(form.capacity.trim()) : null,
      });
      setCreatedResult(result);
    } catch (err) {
      setFormError(err?.message || t('admin.members.addModal.errorGeneric'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          {createdResult ? (
            <>
              {/* ── Success state ─────────────────────────────────────────── */}
              <View style={styles.successIconWrap}>
                <CheckCircle2 size={28} color={COLORS.tealLight} />
              </View>
              <Text style={styles.modalTitle}>{t('admin.members.addModal.successTitle')}</Text>
              <Text style={styles.modalSubtext}>
                {t('admin.members.addModal.successSubtext', { name: createdResult.name })}
              </Text>

              <View style={styles.credentialBox}>
                <Text style={styles.credentialLabel}>{t('admin.members.addModal.credentialEmail')}</Text>
                <Text style={styles.credentialValue}>{createdResult.email}</Text>
                <Text style={[styles.credentialLabel, { marginTop: 10 }]}>{t('admin.members.addModal.credentialPassword')}</Text>
                <Text style={styles.credentialValue}>{createdResult.tempPassword}</Text>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleClose} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>{t('admin.members.addModal.done')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* ── Form state ─────────────────────────────────────────────── */}
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>{t('admin.members.addModal.title')}</Text>
                <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
                  <X size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtext}>
                {t('admin.members.addModal.subtext')}
              </Text>

              {formError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{formError}</Text>
                </View>
              ) : null}

              <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
                <Text style={styles.fieldLabel}>{t('admin.members.addModal.fieldName')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('admin.members.addModal.placeholderName')}
                  placeholderTextColor={COLORS.textMuted}
                  value={form.name}
                  onChangeText={setField('name')}
                />

                <Text style={styles.fieldLabel}>{t('admin.members.addModal.fieldEmail')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('admin.members.addModal.placeholderEmail')}
                  placeholderTextColor={COLORS.textMuted}
                  value={form.email}
                  onChangeText={setField('email')}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Text style={styles.fieldLabel}>{t('admin.members.addModal.fieldHousehold')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('admin.members.addModal.placeholderHousehold')}
                  placeholderTextColor={COLORS.textMuted}
                  value={form.household}
                  onChangeText={setField('household')}
                />

                <Text style={styles.fieldLabel}>{t('admin.members.addModal.fieldMobile')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('admin.members.addModal.placeholderMobile')}
                  placeholderTextColor={COLORS.textMuted}
                  value={form.mobile}
                  onChangeText={setField('mobile')}
                  keyboardType="phone-pad"
                />

                <Text style={styles.fieldLabel}>{t('admin.members.addModal.fieldCapacity')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('admin.members.addModal.placeholderCapacity')}
                  placeholderTextColor={COLORS.textMuted}
                  value={form.capacity}
                  onChangeText={setField('capacity')}
                  keyboardType="decimal-pad"
                />
              </ScrollView>

              <TouchableOpacity
                style={[styles.primaryBtn, isCreating && styles.primaryBtnDisabled]}
                onPress={handleSubmit}
                disabled={isCreating}
                activeOpacity={0.85}
              >
                {isCreating
                  ? <ActivityIndicator size="small" color="#000000" />
                  : <Text style={styles.primaryBtnText}>{t('admin.members.addModal.create')}</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function MemberMonitoringScreen() {
  const { t } = useTranslation();
  const {
    setSelectedMember,
    setAdminBottomTab,
    members,
    membersLoading,
    membersError,
    loadMembers,
    createMember,
  } = useAdmin();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  };

  const filtered = members.filter(m => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.household.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || m.status === filter;
    return matchSearch && matchFilter;
  });

  const handleMemberPress = (member) => {
    setSelectedMember(member);
    setAdminBottomTab('memberDetail');
  };

  const activeCnt   = members.filter(m => m.status === 'Active').length;
  const pendingCnt  = members.filter(m => m.status === 'Pending').length;
  const inactiveCnt = members.filter(m => m.status === 'Inactive').length;
  const suspendCnt  = members.filter(m => m.status === 'Suspended').length;

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (membersLoading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Users size={18} color={COLORS.amberLight} />
          <Text style={styles.screenTitle}>{t('admin.members.title')}</Text>
        </View>
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.memberCard, styles.skeletonCard]}>
            <View style={[styles.skeletonBar, { width: '60%', marginBottom: 8 }]} />
            <View style={[styles.skeletonBar, { width: '40%', marginBottom: 6 }]} />
            <View style={[styles.skeletonBar, { width: '80%' }]} />
          </View>
        ))}
      </ScrollView>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (membersError) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Users size={18} color={COLORS.amberLight} />
          <Text style={styles.screenTitle}>{t('admin.members.title')}</Text>
        </View>
        <View style={[GLASS.card, styles.errorCard]}>
          <AlertCircle size={28} color={COLORS.red} />
          <Text style={styles.errorTitle}>{t('admin.members.errorTitle')}</Text>
          <Text style={styles.errorMessage}>{membersError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadMembers} activeOpacity={0.8}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.amberLight} />
      }
    >

      {/* Title */}
      <View style={styles.titleRow}>
        <Users size={18} color={COLORS.amberLight} />
        <Text style={styles.screenTitle}>{t('admin.members.title')}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <UserPlus size={14} color={COLORS.amberLight} />
          <Text style={styles.addBtnText}>{t('admin.members.addMember')}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search size={15} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('admin.members.searchPlaceholder')}
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTER_OPTS.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.filterChip, filter === opt && styles.filterChipActive]}
            onPress={() => setFilter(opt)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filter === opt && styles.filterChipTextActive]}>{t(STATUS_LABEL_KEY[opt])}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary Strip */}
      <View style={styles.summaryStrip}>
        <View style={[styles.summaryPill, { backgroundColor: 'rgba(45,212,191,0.12)' }]}>
          <Text style={[styles.summaryNum, { color: COLORS.tealLight }]}>{activeCnt}</Text>
          <Text style={[styles.summaryLabel, { color: COLORS.tealLight }]}>{t('common.status.active')}</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
          <Text style={[styles.summaryNum, { color: COLORS.blueLight }]}>{pendingCnt}</Text>
          <Text style={[styles.summaryLabel, { color: COLORS.blueLight }]}>{t('common.status.pending')}</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: 'rgba(251,191,36,0.12)' }]}>
          <Text style={[styles.summaryNum, { color: COLORS.amberLight }]}>{inactiveCnt}</Text>
          <Text style={[styles.summaryLabel, { color: COLORS.amberLight }]}>{t('common.status.inactive')}</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
          <Text style={[styles.summaryNum, { color: COLORS.red }]}>{suspendCnt}</Text>
          <Text style={[styles.summaryLabel, { color: COLORS.red }]}>{t('common.status.suspended')}</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: 'rgba(255,255,255,0.07)' }]}>
          <Text style={[styles.summaryNum, { color: COLORS.textPrimary }]}>{filtered.length}</Text>
          <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>{t('admin.members.shown')}</Text>
        </View>
      </View>

      {/* Member Cards */}
      {filtered.length === 0 ? (
        <View style={[GLASS.card, styles.emptyCard]}>
          <Text style={styles.emptyText}>{t('admin.members.noMatch')}</Text>
        </View>
      ) : (
        filtered.map(m => (
          <MemberCard key={m.id} member={m} onPress={handleMemberPress} t={t} />
        ))
      )}

      <View style={{ height: 24 }} />

      <AddMemberModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreate={createMember}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 12 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  screenTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textBright, flex: 1 },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
  },
  addBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.amberLight },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },

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
  filterChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  filterChipTextActive: { color: COLORS.amberLight, fontWeight: '700' },

  summaryStrip: { flexDirection: 'row', gap: 8 },
  summaryPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    gap: 2,
  },
  summaryNum: { fontSize: 18, fontWeight: '800' },
  summaryLabel: { fontSize: 10, fontWeight: '600' },

  // Member Card
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 14,
    overflow: 'hidden',
  },
  accentBar: {
    width: 3,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginLeft: 6,
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: COLORS.amberLight },
  cardBody: { flex: 1, gap: 5 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  memberName: { fontSize: 14, fontWeight: '700', color: COLORS.textBright, flex: 1, marginRight: 8 },
  statusBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '700' },
  householdText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },

  miniStatsRow: { flexDirection: 'row', gap: 12, marginTop: 2 },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniStatText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },

  // Sparkline
  sparklineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 22,
    marginTop: 4,
  },
  sparkBar: {
    flex: 1,
    borderRadius: 2,
  },

  skeletonCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 18,
    minHeight: 80,
    justifyContent: 'center',
  },
  skeletonBar: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
  },

  errorCard: {
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textBright,
  },
  errorMessage: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 6,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    borderRadius: 14,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.red,
  },

  emptyCard: { padding: 24, alignItems: 'center' },
  emptyText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },

  // ── Add Member Modal ────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5,8,22,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#141B2E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    maxHeight: '85%',
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textBright, textAlign: 'center' },
  modalSubtext: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 12, marginTop: 4 },

  formScroll: { maxHeight: 360 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },

  errorBanner: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    marginBottom: 10,
  },
  errorBannerText: { color: COLORS.red, fontSize: 12, fontWeight: '600', textAlign: 'center' },

  primaryBtn: {
    marginTop: 14,
    backgroundColor: COLORS.teal,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#000000', fontSize: 14, fontWeight: '800' },

  successIconWrap: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(45,212,191,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  credentialBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  credentialLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5 },
  credentialValue: { fontSize: 14, fontWeight: '700', color: COLORS.textBright, marginTop: 3 },
});
