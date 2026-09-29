import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TECH, urgencyColor } from '../theme';

/**
 * One job ticket in a dashboard list.
 *
 *   featured — the technician's active ticket: shows the live system status
 *              line and a "View Job" button, per the Figma dashboard frame.
 *   default  — a compact queue card (pending / completed); the whole card is
 *              the tap target.
 */
export default function JobCard({ job, featured = false, onPress }) {
  const { t } = useTranslation();
  const accent = job.status === 'completed' ? TECH.green : urgencyColor(job.urgency);

  const distance = job.distanceKm != null
    ? t('technician.job.distanceValue', { km: Number(job.distanceKm).toFixed(1), area: job.siteArea ?? '—' })
    : job.siteArea ?? '—';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        featured && styles.cardFeatured,
        { borderLeftColor: accent },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={2}>{job.title}</Text>
        <View style={styles.urgency}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text style={[styles.urgencyText, { color: accent }]}>
            {job.status === 'completed'
              ? t('technician.tabs.completed')
              : t(`technician.urgency.${job.urgency}`, { defaultValue: job.urgency })}
          </Text>
        </View>
      </View>

      <Text style={styles.meta}>
        {t('technician.job.household')}: <Text style={styles.metaStrong}>{job.clientName ?? '—'}</Text>
      </Text>
      <Text style={styles.metaMuted}>
        {t('technician.job.distance')}: {distance}
      </Text>

      {featured ? (
        <View style={styles.footer}>
          <View style={styles.statusLine}>
            <View style={[styles.dot, { backgroundColor: TECH.red }]} />
            <Text style={styles.statusText} numberOfLines={1}>
              {job.errorCode
                ? t('technician.job.statusInactive', { code: job.errorCode })
                : t('technician.job.statusDegraded')}
            </Text>
          </View>
          <Pressable style={styles.viewBtn} onPress={onPress} disabled={!onPress}>
            <Text style={styles.viewBtnText}>{t('technician.job.viewJob')}</Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: TECH.card,
    borderWidth: 1,
    borderColor: TECH.border,
    borderLeftWidth: 3,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  cardFeatured: { backgroundColor: TECH.cardRaised, paddingVertical: 16 },
  pressed: { opacity: 0.85 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 4 },
  title: { flex: 1, fontSize: 14, fontWeight: '800', color: TECH.text },
  urgency: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  urgencyText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  meta: { fontSize: 12, color: TECH.textSecondary },
  metaStrong: { color: TECH.text, fontWeight: '600' },
  metaMuted: { fontSize: 11.5, color: TECH.textMuted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 8 },
  statusLine: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { flex: 1, fontSize: 11.5, fontWeight: '600', color: TECH.red },
  viewBtn: {
    backgroundColor: TECH.orange,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewBtnText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.4 },
});
