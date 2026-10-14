import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, MapPin, Radio, UserRound } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTechnicianTheme, useTechStyles } from '../TechnicianTheme';

export default function JobCard({ job, featured = false, onPress }) {
  const { t } = useTranslation();
  const { TECH, urgencyColor } = useTechnicianTheme();
  const styles = useTechStyles(createStyles);
  const accent = job.status === 'completed' ? TECH.green : urgencyColor(job.urgency);
  const location = job.distanceKm != null
    ? t('technician.job.distanceValue', { km: Number(job.distanceKm).toFixed(1), area: job.siteArea ?? '—' })
    : job.siteArea;
  return <Pressable onPress={onPress} disabled={!onPress} accessibilityRole="button"
    style={({ pressed }) => [styles.card, featured && { borderColor: TECH.orangeBorder }, pressed && { backgroundColor: TECH.cardRaised }]}>
    <View style={styles.top}>
      <Text style={styles.ticket}>{job.ticketCode || job.errorCode}</Text>
      <View style={[styles.priority, { backgroundColor: `${accent}16` }]}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={[styles.priorityText, { color: accent }]}>{job.status === 'completed' ? t('technician.tabs.completed') : t(`technician.urgency.${job.urgency}`, { defaultValue: job.urgency })}</Text>
      </View>
    </View>
    <Text style={styles.title}>{job.title}</Text>
    <View style={styles.meta}><UserRound size={14} color={TECH.textMuted}/><Text style={styles.metaText}>{job.clientName || '—'}</Text></View>
    {location ? <View style={styles.meta}><MapPin size={14} color={TECH.textMuted}/><Text style={styles.metaText}>{location}</Text></View> : null}
    <View style={styles.footer}>
      <View style={styles.origin}>{job.source === 'telemetry' ? <Radio size={13} color={TECH.textMuted}/> : null}<Text style={styles.originText}>{job.errorCode ? `${job.errorCode} · ` : ''}{job.source === 'telemetry' ? t('technician.design.inverterAlert') : t('technician.design.serviceRequest')}</Text></View>
      <View style={styles.action}><Text style={styles.actionText}>{t('technician.job.viewJob')}</Text><ChevronRight size={16} color={TECH.orange}/></View>
    </View>
  </Pressable>;
}
const createStyles = TECH => StyleSheet.create({
  card: { backgroundColor: TECH.card, borderWidth: 1, borderColor: TECH.border, borderRadius: 16, padding: 17, gap: 9 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  ticket: { flexShrink: 1, fontSize: 11, color: TECH.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  priority: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  priorityText: { fontSize: 11, fontWeight: '600' },
  title: { fontSize: 17, lineHeight: 23, color: TECH.text, fontWeight: '600', letterSpacing: -0.2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaText: { flex: 1, fontSize: 13, lineHeight: 19, color: TECH.textSecondary },
  footer: { borderTopWidth: 1, borderColor: TECH.border, paddingTop: 12, marginTop: 3, flexDirection: 'row', alignItems: 'center', gap: 8 },
  origin: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  originText: { flexShrink: 1, fontSize: 11, lineHeight: 16, color: TECH.textMuted },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionText: { fontSize: 12, fontWeight: '600', color: TECH.orange },
});
