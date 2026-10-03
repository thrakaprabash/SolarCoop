import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import { TECH, urgencyColor } from '../theme';

/**
 * SOL-198 — the technician's side of a fault: the raw error code, where it
 * is, and what to check. Matches the "Technician view" half of the Figma
 * dual-channel alert. The household sees the same job as a calm
 * "maintenance scheduled" card with none of this detail.
 *
 * The checklist is only tickable by the technician who owns the job; on a
 * pending job it is shown read-only as a preview of the work.
 */
export default function CriticalAlertCard({ job, canEditChecklist, onToggleItem, onViewJob }) {
  const { t } = useTranslation();
  const accent = urgencyColor(job.urgency);
  const critical = job.urgency === 'urgent';

  return (
    <View style={[styles.card, { borderColor: `${accent}88`, backgroundColor: `${accent}12` }]}>
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
      {job.errorMessage ? <Text style={styles.message}>{job.errorMessage}</Text> : null}
      <Text style={styles.meta}>{job.device || '—'}</Text>
      <Text style={styles.meta}>
        {t('technician.alert.location', { location: job.faultLocation || job.siteArea || '—' })}
      </Text>

      <Text style={styles.checklistLabel}>{t('technician.alert.checklist')}</Text>
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
            accessibilityState={{ checked: item.done, disabled: !canEditChecklist }}
          >
            <View style={[
              styles.box,
              item.done && { backgroundColor: accent, borderColor: accent },
              !canEditChecklist && styles.boxLocked,
            ]}>
              {item.done ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : null}
            </View>
            <Text style={[styles.checkText, item.done && styles.checkTextDone]}>{item.label}</Text>
          </Pressable>
        ))
      )}
      {!canEditChecklist && job.status === 'pending' ? (
        <Text style={styles.hint}>{t('technician.alert.acceptToStart')}</Text>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.viewBtn, { backgroundColor: accent }, pressed && styles.pressed]}
        onPress={onViewJob}
      >
        <Text style={styles.viewBtnText}>{t('technician.alert.viewFullTicket')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 4 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  kicker: { flex: 1, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  ticket: { fontSize: 10, fontWeight: '700', color: TECH.textMuted },
  code: { fontSize: 20, fontWeight: '800', color: TECH.text, letterSpacing: -0.3 },
  message: { fontSize: 12.5, fontWeight: '600', color: TECH.text, marginBottom: 2 },
  meta: { fontSize: 11.5, color: TECH.textSecondary },
  checklistLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: TECH.textSecondary,
    marginTop: 12,
    marginBottom: 4,
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
  checkText: { flex: 1, fontSize: 12.5, color: TECH.text },
  checkTextDone: { color: TECH.textSecondary, textDecorationLine: 'line-through' },
  hint: { fontSize: 11, fontStyle: 'italic', color: TECH.textMuted, marginTop: 2 },
  viewBtn: { alignItems: 'center', borderRadius: 10, paddingVertical: 12, marginTop: 12 },
  viewBtnText: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, color: '#FFFFFF', textTransform: 'uppercase' },
  pressed: { opacity: 0.85 },
});
