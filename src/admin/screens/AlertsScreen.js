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
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, GLASS } from '../../theme/colors';
import { useAdmin } from '../context/AdminContext';
import { timeAgo } from '../data/mockAdminData';
import { ALERT_TYPES, ALERT_CATEGORIES, SEVERITIES } from '../services/adminAlertService';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
  CheckCircle,
  Clock,
  Plus,
  X,
  Trash2,
  User,
  Pencil,
  RotateCcw,
  ScanSearch,
} from 'lucide-react-native';

const STATUS_FILTERS = ['All', 'Open', 'Resolved'];

const SEVERITY_STYLE = {
  Critical: { color: COLORS.red,         bg: 'rgba(239,68,68,0.12)',  Icon: AlertTriangle },
  High:     { color: COLORS.orangeLight, bg: 'rgba(249,115,22,0.12)', Icon: AlertTriangle },
  Medium:   { color: COLORS.amberLight,  bg: 'rgba(251,191,36,0.12)', Icon: AlertCircle },
  Low:      { color: COLORS.tealLight,   bg: 'rgba(45,212,191,0.12)', Icon: Info },
};

const STATUS_STYLE = {
  Open:      { color: COLORS.red,       bg: 'rgba(239,68,68,0.12)',   Icon: Clock },
  Resolved:  { color: COLORS.tealLight, bg: 'rgba(45,212,191,0.12)',  Icon: CheckCircle },
  Dismissed: { color: COLORS.textMuted, bg: 'rgba(255,255,255,0.08)', Icon: X },
};

const DEFAULT_TYPE = 'admin_notice';

// Every alert_type / category value stays exactly as ALERT_TYPES / ALERT_CATEGORIES
// define it (filtering, dedupe and the registry lookup all key off these) —
// only the label shown for each is translated.
const ALERT_TYPE_LABEL_KEY = {
  zero_production:       'admin.alerts.type.zeroProduction',
  low_production:        'admin.alerts.type.lowProduction',
  consumption_spike:     'admin.alerts.type.consumptionSpike',
  community_surplus_low: 'admin.alerts.type.communitySurplusLow',
  community_deficit:     'admin.alerts.type.communityDeficit',
  transaction_reversed:  'admin.alerts.type.transactionReversed',
  large_transaction:     'admin.alerts.type.largeTransaction',
  request_pending:       'admin.alerts.type.requestPending',
  signup_pending:        'admin.alerts.type.signupPending',
  member_silent:         'admin.alerts.type.memberSilent',
  complaint_new:         'admin.alerts.type.complaintNew',
  complaint_aging:       'admin.alerts.type.complaintAging',
  stale_data:            'admin.alerts.type.staleData',
  system_error:          'admin.alerts.type.systemError',
  admin_notice:          'admin.alerts.type.adminNotice',
};

const ALERT_CATEGORY_LABEL_KEY = {
  Energy:       'admin.alerts.category.energy',
  Transactions: 'admin.alerts.category.transactions',
  Members:      'admin.alerts.category.members',
  Complaints:   'admin.alerts.category.complaints',
  System:       'admin.alerts.category.system',
  Notice:       'admin.alerts.category.notice',
  Other:        'admin.alerts.category.other',
};

// A type/category the registry doesn't recognise still renders (falls back to
// whatever adminAlertService.js already computed) rather than breaking the inbox.
const typeLabelFor = (type, fallback, t) =>
  ALERT_TYPE_LABEL_KEY[type] ? t(ALERT_TYPE_LABEL_KEY[type]) : fallback;
const categoryLabelFor = (category, t) =>
  category === 'All' ? t('common.status.all') : (ALERT_CATEGORY_LABEL_KEY[category] ? t(ALERT_CATEGORY_LABEL_KEY[category]) : category);

// ─── Small helpers ────────────────────────────────────────────────────────────
const notify = (title, message) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const confirmAction = (title, message, confirmLabel, cancelLabel, onConfirm) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm ? window.confirm(message) : true) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
};

const recipientLabel = (alert, t) => {
  if (!alert.userId) return t('admin.alerts.communityWide');
  return alert.household ? `${alert.member} · ${alert.household}` : alert.member;
};

// One line summing up the last automatic scan, e.g.
// "Last scan 12s ago — 2 new alerts · 1 check couldn't run (pending_requests)".
const describeScan = (scan, t) => {
  if (scan.error) return t('admin.alerts.scan.failed', { error: scan.error });

  const parts = [
    scan.raised === 0
      ? t('admin.alerts.scan.nothingNew')
      : t('admin.alerts.scan.newAlerts', { count: scan.raised }),
  ];
  if (scan.failedChecks.length > 0) {
    const names = scan.failedChecks.map(f => f.check).join(', ');
    parts.push(t('admin.alerts.scan.checksFailed', { count: scan.failedChecks.length, names }));
  }
  return t('admin.alerts.scan.summary', { time: timeAgo(scan.at), parts: parts.join(' · ') });
};

function Chip({ label, active, onPress, color }) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active && (color
          ? { backgroundColor: `${color}22`, borderColor: `${color}66` }
          : styles.chipActive),
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && { color: color ?? COLORS.amberLight, fontWeight: '700' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────
function AlertCard({ alert, onResolve, onReopen, onDelete, onEdit, onViewMember, t }) {
  const [busy, setBusy] = useState(null); // 'resolve' | 'reopen' | 'delete' | null
  const { color, bg, Icon } = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.Medium;
  const status = STATUS_STYLE[alert.status] ?? STATUS_STYLE.Open;
  const StatusIcon = status.Icon;
  const isOpen = alert.status === 'Open';

  const changeStatus = async (kind, action) => {
    if (busy) return;
    setBusy(kind);
    try {
      await action(alert.id);
    } catch (err) {
      notify(
        t('admin.alerts.actionFailedTitle', { kind: t(`admin.alerts.kind.${kind}`) }),
        err?.message || t('admin.alerts.pleaseTryAgain')
      );
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = () => {
    if (busy) return;
    confirmAction(
      t('admin.alerts.deleteConfirmTitle'),
      t('admin.alerts.deleteConfirmMessage'),
      t('admin.alerts.action.delete'),
      t('common.cancel'),
      async () => {
        setBusy('delete');
        try {
          await onDelete(alert.id);
        } catch (err) {
          notify(t('admin.alerts.deleteFailedTitle'), err?.message || t('admin.alerts.pleaseTryAgain'));
          setBusy(null);
        }
      }
    );
  };

  return (
    <View style={[styles.alertCard, { borderColor: `${color}25` }, !isOpen && styles.alertCardMuted]}>
      <View style={[styles.alertAccent, { backgroundColor: color }]} />

      <View style={styles.alertBody}>
        <View style={[styles.alertIconBadge, { backgroundColor: bg }]}>
          <Icon size={18} color={color} />
        </View>

        <View style={styles.alertContent}>
          <View style={styles.alertTopRow}>
            <Text style={styles.alertType}>{typeLabelFor(alert.type, alert.typeLabel, t)}</Text>
            <View style={[styles.severityPill, { backgroundColor: bg, borderColor: `${color}30` }]}>
              <Text style={[styles.severityText, { color }]}>{t(`common.severity.${alert.severity.toLowerCase()}`)}</Text>
            </View>
          </View>

          <Text style={styles.alertMessage}>{alert.message}</Text>

          <View style={styles.alertFooter}>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>
                {alert.household ? `${alert.member} · ${alert.household}` : alert.member}
              </Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>{categoryLabelFor(alert.category, t)}</Text>
            </View>
            {alert.source === 'system' && (
              <View style={[styles.metaPill, styles.systemPill]}>
                <Text style={[styles.metaPillText, { color: COLORS.blueLight }]}>{t('admin.alerts.systemDetected')}</Text>
              </View>
            )}
            <Text style={styles.alertTime}>{timeAgo(alert.timestamp)}</Text>
            <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
              <StatusIcon size={9} color={status.color} />
              <Text style={[styles.statusPillText, { color: status.color }]}>{t(`common.status.${alert.status.toLowerCase()}`)}</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            {onViewMember && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.viewBtn]}
                onPress={() => onViewMember(alert)}
                activeOpacity={0.8}
              >
                <User size={13} color={COLORS.amberLight} />
                <Text style={[styles.actionBtnText, { color: COLORS.amberLight }]}>{t('admin.alerts.action.viewMember')}</Text>
              </TouchableOpacity>
            )}

            {alert.canEdit && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.editBtn, busy && styles.actionBtnDisabled]}
                onPress={() => onEdit(alert)}
                disabled={!!busy}
                activeOpacity={0.8}
              >
                <Pencil size={13} color={COLORS.textPrimary} />
                <Text style={[styles.actionBtnText, { color: COLORS.textPrimary }]}>{t('admin.alerts.action.edit')}</Text>
              </TouchableOpacity>
            )}

            {isOpen ? (
              <TouchableOpacity
                style={[styles.actionBtn, styles.resolveBtn, busy && styles.actionBtnDisabled]}
                onPress={() => changeStatus('resolve', onResolve)}
                disabled={!!busy}
                activeOpacity={0.8}
              >
                {busy === 'resolve'
                  ? <ActivityIndicator size="small" color={COLORS.tealLight} />
                  : <CheckCircle size={13} color={COLORS.tealLight} />
                }
                <Text style={[styles.actionBtnText, { color: COLORS.tealLight }]}>{t('admin.alerts.action.resolve')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtn, styles.reopenBtn, busy && styles.actionBtnDisabled]}
                onPress={() => changeStatus('reopen', onReopen)}
                disabled={!!busy}
                activeOpacity={0.8}
              >
                {busy === 'reopen'
                  ? <ActivityIndicator size="small" color={COLORS.blueLight} />
                  : <RotateCcw size={13} color={COLORS.blueLight} />
                }
                <Text style={[styles.actionBtnText, { color: COLORS.blueLight }]}>{t('admin.alerts.action.reopen')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn, busy && styles.actionBtnDisabled]}
              onPress={handleDelete}
              disabled={!!busy}
              activeOpacity={0.8}
            >
              {busy === 'delete'
                ? <ActivityIndicator size="small" color={COLORS.red} />
                : <Trash2 size={13} color={COLORS.red} />
              }
              <Text style={[styles.actionBtnText, { color: COLORS.red }]}>{t('admin.alerts.action.delete')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Create / Edit Alert Modal ────────────────────────────────────────────────
// One form, two modes. When `editing` is set, only severity and message are
// changeable — type and recipient are shown read-only. The parent remounts
// this via `key` whenever the alert being edited changes, so the initial
// state below is always seeded fresh from `editing`.
function AlertFormModal({ visible, editing, onClose, onSubmit, members }) {
  const { t } = useTranslation();
  const isEditing = !!editing;

  const [category, setCategory] = useState(ALERT_TYPES[DEFAULT_TYPE].category);
  const [type, setType] = useState(DEFAULT_TYPE);
  const [severity, setSeverity] = useState(
    editing ? editing.severity : ALERT_TYPES[DEFAULT_TYPE].severity
  );
  const [target, setTarget] = useState('community'); // 'community' | 'member'
  const [memberQuery, setMemberQuery] = useState('');
  const [pickedMember, setPickedMember] = useState(null);
  const [message, setMessage] = useState(editing ? editing.message : '');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const typesInCategory = Object.entries(ALERT_TYPES).filter(([, meta]) => meta.category === category);

  const q = memberQuery.trim().toLowerCase();
  const memberMatches = (q
    ? members.filter(m => m.name.toLowerCase().includes(q) || m.household.toLowerCase().includes(q))
    : members
  ).slice(0, 5);

  const handleClose = () => {
    setCategory(ALERT_TYPES[DEFAULT_TYPE].category);
    setType(DEFAULT_TYPE);
    setSeverity(ALERT_TYPES[DEFAULT_TYPE].severity);
    setTarget('community');
    setMemberQuery('');
    setPickedMember(null);
    setMessage('');
    setError(null);
    onClose();
  };

  // Picking a category or type resets severity to that type's sensible default;
  // the admin can still override it afterwards.
  const pickCategory = (cat) => {
    const [firstKey, firstMeta] = Object.entries(ALERT_TYPES).find(([, meta]) => meta.category === cat);
    setCategory(cat);
    setType(firstKey);
    setSeverity(firstMeta.severity);
  };

  const pickType = (key) => {
    setType(key);
    setSeverity(ALERT_TYPES[key].severity);
  };

  const handleSubmit = async () => {
    if (message.trim().length < 5) {
      setError(t('admin.alerts.form.errorMessageTooShort'));
      return;
    }
    if (!isEditing && target === 'member' && !pickedMember) {
      setError(t('admin.alerts.form.errorPickMember'));
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSubmit(
        isEditing
          ? { severity, message }
          : { type, severity, message, userId: target === 'member' ? pickedMember.id : null }
      );
      handleClose();
    } catch (err) {
      setError(err?.message || t(isEditing ? 'admin.alerts.form.errorSaveGeneric' : 'admin.alerts.form.errorCreateGeneric'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>{isEditing ? t('admin.alerts.form.editTitle') : t('admin.alerts.form.newTitle')}</Text>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
            {isEditing ? (
              <View style={styles.readOnlyBox}>
                <Text style={styles.readOnlyLabel}>{t('admin.alerts.form.typeLabel')}</Text>
                <Text style={styles.readOnlyValue}>{typeLabelFor(editing.type, editing.typeLabel, t)} · {categoryLabelFor(editing.category, t)}</Text>
                <Text style={[styles.readOnlyLabel, { marginTop: 10 }]}>{t('admin.alerts.form.sentToLabel')}</Text>
                <Text style={styles.readOnlyValue}>{recipientLabel(editing, t)}</Text>
                <Text style={styles.readOnlyNote}>
                  {t('admin.alerts.form.readOnlyNote')}
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.fieldLabel}>{t('admin.alerts.form.fieldCategory')}</Text>
                <View style={styles.chipWrap}>
                  {ALERT_CATEGORIES.map(cat => (
                    <Chip key={cat} label={categoryLabelFor(cat, t)} active={category === cat} onPress={() => pickCategory(cat)} />
                  ))}
                </View>

                <Text style={styles.fieldLabel}>{t('admin.alerts.form.fieldType')}</Text>
                <View style={styles.chipWrap}>
                  {typesInCategory.map(([key, meta]) => (
                    <Chip key={key} label={typeLabelFor(key, meta.label, t)} active={type === key} onPress={() => pickType(key)} />
                  ))}
                </View>
              </>
            )}

            <Text style={styles.fieldLabel}>{t('admin.alerts.form.fieldSeverity')}</Text>
            <View style={styles.chipWrap}>
              {SEVERITIES.map(sev => (
                <Chip
                  key={sev}
                  label={t(`common.severity.${sev.toLowerCase()}`)}
                  active={severity === sev}
                  color={SEVERITY_STYLE[sev].color}
                  onPress={() => setSeverity(sev)}
                />
              ))}
            </View>

            {!isEditing && (
              <>
                <Text style={styles.fieldLabel}>{t('admin.alerts.form.fieldSendTo')}</Text>
                <View style={styles.chipWrap}>
                  <Chip label={t('admin.alerts.communityWide')} active={target === 'community'} onPress={() => setTarget('community')} />
                  <Chip label={t('admin.alerts.form.specificMember')} active={target === 'member'} onPress={() => setTarget('member')} />
                </View>

                {target === 'member' && (
                  <View style={styles.memberPicker}>
                    {pickedMember ? (
                      <View style={styles.pickedRow}>
                        <Text style={styles.pickedText} numberOfLines={1}>
                          {pickedMember.name} · {pickedMember.household}
                        </Text>
                        <TouchableOpacity onPress={() => setPickedMember(null)} activeOpacity={0.7}>
                          <X size={16} color={COLORS.textMuted} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <TextInput
                          style={styles.input}
                          placeholder={t('admin.members.searchPlaceholder')}
                          placeholderTextColor={COLORS.textMuted}
                          value={memberQuery}
                          onChangeText={setMemberQuery}
                        />
                        {memberMatches.length === 0 ? (
                          <Text style={styles.pickerEmpty}>
                            {members.length === 0 ? t('admin.alerts.form.noMembersLoaded') : t('admin.alerts.form.noMembersMatch')}
                          </Text>
                        ) : (
                          memberMatches.map(m => (
                            <TouchableOpacity
                              key={m.id}
                              style={styles.pickerRow}
                              onPress={() => setPickedMember(m)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.pickerName} numberOfLines={1}>{m.name}</Text>
                              <Text style={styles.pickerHousehold}>{m.household}</Text>
                            </TouchableOpacity>
                          ))
                        )}
                      </>
                    )}
                  </View>
                )}
              </>
            )}

            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>{t('admin.alerts.form.fieldMessage')}</Text>
              <Text style={styles.charCount}>{t('admin.alerts.form.charCount', { count: message.length })}</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('admin.alerts.form.messagePlaceholder')}
              placeholderTextColor={COLORS.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={300}
              textAlignVertical="top"
            />
          </ScrollView>

          <TouchableOpacity
            style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator size="small" color="#000000" />
              : <Text style={styles.primaryBtnText}>{isEditing ? t('admin.settings.saveChanges') : t('admin.alerts.form.createAlert')}</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AlertsScreen() {
  const { t } = useTranslation();
  const {
    alerts,
    alertsLoading,
    alertsError,
    loadAlerts,
    createAlert,
    updateAlert,
    resolveAlert,
    reopenAlert,
    deleteAlert,
    scanAlerts,
    scanning,
    lastScan,
    members,
    setSelectedMember,
    setAdminBottomTab,
  } = useAdmin();

  const [statusFilter, setStatusFilter] = useState('Open');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({ open: false, editing: null });

  // Pulling to refresh re-runs the scan (which reloads alerts when it finishes).
  const onRefresh = async () => {
    setRefreshing(true);
    await scanAlerts();
    setRefreshing(false);
  };

  const filtered = alerts.filter(a =>
    (statusFilter === 'All' || a.status === statusFilter) &&
    (categoryFilter === 'All' || a.category === categoryFilter) &&
    (!severityFilter || a.severity === severityFilter)
  );

  const openBySeverity = Object.fromEntries(
    SEVERITIES.map(sev => [sev, alerts.filter(a => a.status === 'Open' && a.severity === sev).length])
  );

  // Only offer category filters that actually have alerts, so the row never
  // shows dead chips.
  const presentCategories = [...ALERT_CATEGORIES, 'Other'].filter(cat =>
    alerts.some(a => a.category === cat)
  );

  const memberIds = new Set(members.map(m => m.id));

  const handleViewMember = (alert) => {
    const member = members.find(m => m.id === alert.userId);
    if (!member) return;
    setSelectedMember(member);
    setAdminBottomTab('memberDetail');
  };

  const handleFormSubmit = async (payload) => {
    if (form.editing) {
      await updateAlert(form.editing.id, payload);
      return;
    }
    await createAlert(payload);
    // A new alert is Open, so reset filters that would otherwise hide it and
    // make a successful create look like it silently failed.
    setStatusFilter('Open');
    setCategoryFilter('All');
    setSeverityFilter(null);
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (alertsLoading && alerts.length === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Bell size={18} color={COLORS.amberLight} />
          <Text style={styles.screenTitle}>{t('admin.alerts.title')}</Text>
        </View>
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.alertCard, styles.skeletonCard]}>
            <View style={[styles.skeletonBar, { width: '55%', marginBottom: 8 }]} />
            <View style={[styles.skeletonBar, { width: '85%', marginBottom: 6 }]} />
            <View style={[styles.skeletonBar, { width: '35%' }]} />
          </View>
        ))}
      </ScrollView>
    );
  }

  // ── Error state (nothing to show) ───────────────────────────────────────────
  if (alertsError && alerts.length === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Bell size={18} color={COLORS.amberLight} />
          <Text style={styles.screenTitle}>{t('admin.alerts.title')}</Text>
        </View>
        <View style={[GLASS.card, styles.errorCard]}>
          <AlertCircle size={28} color={COLORS.red} />
          <Text style={styles.errorTitle}>{t('admin.alerts.errorTitle')}</Text>
          <Text style={styles.errorMessage}>{alertsError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadAlerts} activeOpacity={0.8}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <>
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
          <Bell size={18} color={COLORS.amberLight} />
          <Text style={styles.screenTitle}>{t('admin.alerts.title')}</Text>
          <TouchableOpacity
            style={[styles.scanBtn, scanning && styles.scanBtnDisabled]}
            onPress={() => scanAlerts()}
            disabled={scanning}
            activeOpacity={0.8}
          >
            {scanning
              ? <ActivityIndicator size="small" color={COLORS.tealLight} />
              : <ScanSearch size={14} color={COLORS.tealLight} />
            }
            <Text style={styles.scanBtnText}>{scanning ? t('admin.alerts.scanning') : t('admin.alerts.scanBtn')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => setForm({ open: true, editing: null })}
            activeOpacity={0.8}
          >
            <Plus size={14} color={COLORS.amberLight} />
            <Text style={styles.newBtnText}>{t('admin.alerts.newAlert')}</Text>
          </TouchableOpacity>
        </View>

        {/* Refresh failed but we still have older data to show */}
        {alertsError ? (
          <View style={styles.staleBanner}>
            <Text style={styles.staleBannerText}>{t('admin.alerts.staleBanner')}</Text>
            <TouchableOpacity onPress={loadAlerts} activeOpacity={0.7}>
              <Text style={styles.staleBannerRetry}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* What the last automatic scan found (or why it couldn't run) */}
        {lastScan ? (
          <Text
            style={[
              styles.scanNote,
              (lastScan.error || lastScan.failedChecks.length > 0) && { color: COLORS.amberLight },
            ]}
          >
            {describeScan(lastScan, t)}
          </Text>
        ) : null}

        {/* Open-alert count per severity — tap one to filter by it */}
        <View style={styles.severitySummaryRow}>
          {SEVERITIES.map(sev => {
            const { color, Icon } = SEVERITY_STYLE[sev];
            const active = severityFilter === sev;
            return (
              <TouchableOpacity
                key={sev}
                style={[
                  styles.severityCard,
                  { backgroundColor: `${color}1A`, borderColor: active ? color : `${color}33` },
                ]}
                onPress={() => setSeverityFilter(cur => (cur === sev ? null : sev))}
                activeOpacity={0.8}
              >
                <Icon size={15} color={color} />
                <Text style={[styles.severityCount, { color }]}>{openBySeverity[sev]}</Text>
                <Text style={styles.severityLabel}>{t(`common.severity.${sev.toLowerCase()}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.hintText}>
          {severityFilter
            ? t('admin.alerts.hintFiltered', { severity: t(`common.severity.${severityFilter.toLowerCase()}`) })
            : t('admin.alerts.hintDefault')}
        </Text>

        {/* Status filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {STATUS_FILTERS.map(f => (
            <Chip key={f} label={t(`common.status.${f.toLowerCase()}`)} active={statusFilter === f} onPress={() => setStatusFilter(f)} />
          ))}
        </ScrollView>

        {/* Category filter */}
        {presentCategories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {['All', ...presentCategories].map(cat => (
              <Chip key={cat} label={categoryLabelFor(cat, t)} active={categoryFilter === cat} onPress={() => setCategoryFilter(cat)} />
            ))}
          </ScrollView>
        )}

        <Text style={styles.listLabel}>
          {t('admin.alerts.listLabel', { count: filtered.length })}
        </Text>

        {/* Alert Cards */}
        {filtered.length === 0 ? (
          <View style={[GLASS.card, styles.emptyCard]}>
            <CheckCircle size={28} color={COLORS.tealLight} />
            <Text style={styles.emptyTitle}>{t('admin.alerts.emptyTitle')}</Text>
            <Text style={styles.emptyText}>
              {alerts.length === 0 ? t('admin.alerts.emptyNoneRaised') : t('admin.alerts.emptyNoMatch')}
            </Text>
          </View>
        ) : (
          filtered.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onResolve={resolveAlert}
              onReopen={reopenAlert}
              onDelete={deleteAlert}
              onEdit={(a) => setForm({ open: true, editing: a })}
              onViewMember={alert.userId && memberIds.has(alert.userId) ? handleViewMember : null}
              t={t}
            />
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <AlertFormModal
        key={form.editing?.id ?? 'new'}
        visible={form.open}
        editing={form.editing}
        onClose={() => setForm({ open: false, editing: null })}
        onSubmit={handleFormSubmit}
        members={members}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 12 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  screenTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textBright, flex: 1 },

  newBtn: {
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
  newBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.amberLight },

  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(45,212,191,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.3)',
  },
  scanBtnDisabled: { opacity: 0.6 },
  scanBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.tealLight },
  scanNote: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500', marginTop: -4 },

  staleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
  },
  staleBannerText: { flex: 1, fontSize: 12, color: COLORS.amberLight, fontWeight: '600' },
  staleBannerRetry: { fontSize: 12, color: COLORS.amberLight, fontWeight: '800' },

  severitySummaryRow: { flexDirection: 'row', gap: 8 },
  severityCard: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  severityCount: { fontSize: 22, fontWeight: '800' },
  severityLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
  hintText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500', marginTop: -6 },

  filterRow: { gap: 6 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderColor: 'rgba(245,158,11,0.35)',
  },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },

  listLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 2 },

  // Alert Card
  alertCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  alertCardMuted: { opacity: 0.7 },
  alertAccent: { height: 3, width: '100%' },
  alertBody: { flexDirection: 'row', gap: 12, padding: 14 },
  alertIconBadge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  alertContent: { flex: 1, gap: 8 },
  alertTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alertType: { fontSize: 14, fontWeight: '800', color: COLORS.textBright, flex: 1, marginRight: 8 },
  severityPill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  severityText: { fontSize: 10, fontWeight: '700' },
  alertMessage: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, fontWeight: '500' },
  alertFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metaPill: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  metaPillText: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
  systemPill: { backgroundColor: 'rgba(59,130,246,0.12)' },
  alertTime: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  statusPillText: { fontSize: 10, fontWeight: '700' },

  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  actionBtnDisabled: { opacity: 0.5 },
  viewBtn: { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)' },
  editBtn: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)' },
  resolveBtn: { backgroundColor: 'rgba(45,212,191,0.12)', borderColor: 'rgba(45,212,191,0.25)' },
  reopenBtn: { backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.3)' },
  deleteBtn: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)' },

  emptyCard: { padding: 32, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textBright },
  emptyText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500', textAlign: 'center' },

  // Skeleton / error states
  skeletonCard: { padding: 18, minHeight: 90, justifyContent: 'center' },
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

  // ── Create / Edit Alert Modal ───────────────────────────────────────────────
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
    maxHeight: '90%',
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textBright },

  formScroll: { flexGrow: 0 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  charCount: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, marginTop: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  readOnlyBox: {
    marginTop: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  readOnlyLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5 },
  readOnlyValue: { fontSize: 13, fontWeight: '700', color: COLORS.textBright, marginTop: 3 },
  readOnlyNote: { fontSize: 11, color: COLORS.textMuted, lineHeight: 16, marginTop: 10, fontWeight: '500' },

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
  textArea: { minHeight: 90, paddingTop: 11 },

  memberPicker: { marginTop: 10, gap: 6 },
  pickedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  pickedText: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.amberLight },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  pickerName: { flex: 1, fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  pickerHousehold: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  pickerEmpty: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500', paddingVertical: 4 },

  errorBanner: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    marginBottom: 4,
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
});
