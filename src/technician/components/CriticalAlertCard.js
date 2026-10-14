import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react-native';
import { useTechnicianTheme, useTechStyles } from '../TechnicianTheme';

/**
 * SOL-198 — the technician's side of a fault: the raw error code, where it
 * is, and what to check. Matches the "Technician view" half of the Figma
 * dual-channel alert. The household sees the same job as a calm
 * "maintenance scheduled" card with none of this detail.
 *
 * The checklist is only tickable by the technician who owns the job; on a
 * pending job it is shown read-only as a preview of the work.
 */
export default function CriticalAlertCard({ job, expanded = false, onToggleExpanded, canEditChecklist, onToggleItem, onViewJob }) {
  const { TECH, urgencyColor } = useTechnicianTheme();
  const styles = useTechStyles(createStyles);
  const { t } = useTranslation();
  const accent = urgencyColor(job.urgency);
  const critical = job.urgency === 'urgent';

  return (
    <View testID={`diagnostic-alert-${job.id}`} style={[styles.card, { borderColor: `${accent}88`, backgroundColor: `${accent}12` }]}>
      <View style={styles.kickerRow}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={[styles.kicker, { color: accent }]}>
          {critical ? t('technician.alert.critical') : t('technician.alert.fault')}
        </Text>
        <Text style={styles.ticket}>{job.ticketCode}</Text>
      </View>

      <Text style={styles.code}>
        {job.errorCode
          ? t('technician.alert.errorCode', { code: job.errorCode })
          : job.title}
      </Text>
      {job.errorMessage ? <Text style={styles.message} numberOfLines={expanded ? undefined : 1}>{job.errorMessage}</Text> : null}
      <Text style={styles.meta} numberOfLines={expanded ? undefined : 1}>
        {t('technician.alert.location', { location: job.faultLocation || job.siteArea || '—' })}
      </Text>

      <View style={styles.actions}>
        <Pressable onPress={onToggleExpanded} accessibilityRole="button" aria-expanded={expanded} accessibilityState={{expanded}}
          accessibilityLabel={t(expanded ? 'technician.alert.collapseFor' : 'technician.alert.expandFor', {ticket:job.ticketCode || job.errorCode || job.title})}
          style={({pressed})=>[styles.expandBtn,pressed&&styles.pressed]}>
          <Text style={styles.expandText}>{t(expanded ? 'technician.alert.hideDetails' : 'technician.alert.showDetails')}</Text>
          {expanded ? <ChevronUp size={16} color={TECH.textSecondary}/> : <ChevronDown size={16} color={TECH.textSecondary}/>}
        </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('technician.alert.viewFullTicket')}
        style={({ pressed }) => [styles.viewBtn, pressed && styles.pressed]}
        onPress={onViewJob}
      >
        <Text style={styles.viewBtnText}>{t('technician.job.viewJob')}</Text><ChevronRight size={16} color={TECH.orange}/>
      </Pressable>
      </View>

      {expanded ? <View style={styles.details} testID={`diagnostic-details-${job.id}`}>
      <Text style={styles.meta}>{job.device || '—'}</Text>
      <View style={styles.checklistHeader}>
        <Text style={styles.checklistLabel}>{t('technician.alert.checklist')}</Text>
        <Text style={styles.progress}>{t('technician.closure.checkedCount', {done:job.checklist.filter(item=>item.done).length,total:job.checklist.length})}</Text>
      </View>
      {job.checklist.length === 0 ? (
        <Text style={styles.meta}>{t('technician.alert.noChecklist')}</Text>
      ) : (
        job.checklist.map((item, i) => (
          <Pressable
            key={`${item.label}-${i}`}
            style={styles.checkRow}
            onPress={() => onToggleItem(i)}
            disabled={!canEditChecklist}
            accessibilityRole="checkbox"
              aria-checked={item.done}
            accessibilityState={{ checked: item.done, disabled: !canEditChecklist }}
          >
            <View style={[
              styles.box,
              item.done && { backgroundColor: accent, borderColor: accent },
              !canEditChecklist && styles.boxLocked,
            ]}>
              {item.done ? <Check size={16} color={TECH.onAccent} strokeWidth={3} /> : null}
            </View>
            <Text style={[styles.checkText, item.done && styles.checkTextDone]}>{item.label}</Text>
          </Pressable>
        ))
      )}
      {!canEditChecklist && job.status === 'pending' ? (
        <Text style={styles.hint}>{t('technician.alert.acceptToStart')}</Text>
      ) : null}
      </View> : null}

    </View>
  );
}

const createStyles = TECH => StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 4 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  kicker: { flex: 1, fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  ticket: { flexShrink: 1, fontSize: 10, fontWeight: '700', color: TECH.textMuted },
  code: { fontSize: 17, fontWeight: '600', color: TECH.text, letterSpacing: -0.3 },
  message: { fontSize: 13, lineHeight: 19, color: TECH.textSecondary, marginBottom: 2 },
  meta: { fontSize: 13, color: TECH.textSecondary },
  details: { gap: 4, paddingTop: 10, marginTop: 6, borderTopWidth: 1, borderColor: TECH.border },
  checklistHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 4 },
  progress: { fontSize: 11, color: TECH.textMuted },
  checklistLabel: {
    flexGrow: 1,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: TECH.textSecondary,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, minHeight: 48 },
  box: {
    width: 26,
    height: 26,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: TECH.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxLocked: { opacity: 0.5 },
  checkText: { flex: 1, fontSize: 14, color: TECH.text },
  checkTextDone: { color: TECH.textSecondary, textDecorationLine: 'line-through' },
  hint: { fontSize: 11, fontStyle: 'italic', color: TECH.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  expandBtn: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, paddingRight: 8 },
  expandText: { fontSize: 12, fontWeight: '600', color: TECH.textSecondary },
  viewBtn: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 10, paddingHorizontal: 12, backgroundColor: TECH.orangeSoft },
  viewBtnText: { fontSize: 12, fontWeight: '600', color: TECH.orange },
  pressed: { opacity: 0.85 },
});
