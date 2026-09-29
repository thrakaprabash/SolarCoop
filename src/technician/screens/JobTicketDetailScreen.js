import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Cpu, History, TriangleAlert, User } from 'lucide-react-native';
import { TECH, urgencyColor } from '../theme';
import { useTechnician } from '../context/TechnicianContext';
import { fetchHouseholdHistory } from '../services/jobService';

const isoDate = (iso) => (iso ? String(iso).slice(0, 10) : '—');

function DossierCard({ icon: Icon, title, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Icon size={15} color={TECH.orange} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function InfoLine({ label, value }) {
  return (
    <Text style={styles.infoLine}>
      {label ? `${label}: ` : ''}<Text style={styles.infoValue}>{value || '—'}</Text>
    </Text>
  );
}

/**
 * SOL-195 — Diagnostic Dossier for one job ticket: who the client is, what
 * the equipment is reporting, and what has been done at this site before.
 */
export default function JobTicketDetailScreen() {
  const { t } = useTranslation();
  const { selectedJob: job, closeJob } = useTechnician();

  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError]     = useState(null);

  // Android back returns to the dashboard instead of leaving the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeJob();
      return true;
    });
    return () => sub.remove();
  }, [closeJob]);

  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError(null);
    fetchHouseholdHistory(job.householdUserId, job.id)
      .then((rows) => { if (!cancelled) setHistory(rows); })
      .catch((err) => { if (!cancelled) setHistoryError(err.message); })
      .finally(() => { if (!cancelled) setHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [job.householdUserId, job.id]);

  const faultColor = job.errorCode ? TECH.red : TECH.amber;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable style={styles.back} onPress={closeJob} hitSlop={10}>
        <ArrowLeft size={13} color={TECH.orange} />
        <Text style={styles.backText}>{t('technician.detail.back')}</Text>
      </Pressable>

      <View style={styles.titleBlock}>
        <View style={styles.titleTop}>
          <Text style={styles.ticketLabel}>
            {t('technician.detail.jobTicket', { code: job.ticketCode })}
          </Text>
          <View style={[styles.urgencyDot, { backgroundColor: urgencyColor(job.urgency) }]} />
        </View>
        <Text style={styles.title}>{job.title}</Text>
      </View>

      {/* ── Client info ── */}
      <DossierCard icon={User} title={t('technician.detail.clientInfo')}>
        <InfoLine label={t('technician.detail.name')} value={job.clientName} />
        <InfoLine label={t('technician.detail.contact')} value={job.clientPhone} />
        <InfoLine value={job.siteAddress || t('technician.detail.noAddress')} />
      </DossierCard>

      {/* ── System telemetry ── */}
      <DossierCard icon={Cpu} title={t('technician.detail.telemetry')}>
        <InfoLine label={t('technician.detail.inverter')} value={job.device} />
        {job.faultLocation ? (
          <InfoLine label={t('technician.detail.location')} value={job.faultLocation} />
        ) : null}
        <View style={[styles.faultBox, { borderColor: `${faultColor}88`, backgroundColor: `${faultColor}1A` }]}>
          <TriangleAlert size={14} color={faultColor} />
          <Text style={[styles.faultText, { color: faultColor }]}>
            {job.errorCode
              ? t('technician.detail.errorLine', { code: job.errorCode, message: job.errorMessage ?? '' })
              : job.errorMessage || t('technician.detail.noErrorCode')}
          </Text>
        </View>
      </DossierCard>

      {/* ── Maintenance history ── */}
      <DossierCard icon={History} title={t('technician.detail.history')}>
        {historyLoading ? (
          <ActivityIndicator size="small" color={TECH.orange} style={styles.historyLoading} />
        ) : historyError ? (
          <Text style={styles.muted}>{t('technician.detail.historyError')}</Text>
        ) : history.length === 0 ? (
          <Text style={styles.muted}>{t('technician.detail.noHistory')}</Text>
        ) : (
          <View style={styles.timeline}>
            {history.map((entry, i) => (
              <View key={entry.id} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View style={styles.timelineDot} />
                  {i < history.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineBody}>
                  <Text style={styles.timelineTitle}>
                    {isoDate(entry.completedAt)}: {entry.title}
                  </Text>
                  <Text style={styles.muted}>
                    {t('technician.detail.by', { name: entry.technicianName || t('technician.detail.unknownTech') })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </DossierCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 14 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: TECH.orange, textTransform: 'uppercase' },
  titleBlock: { gap: 4, marginTop: 4 },
  titleTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: TECH.textSecondary, textTransform: 'uppercase' },
  urgencyDot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: 18, fontWeight: '800', color: TECH.text, letterSpacing: -0.3 },
  card: {
    backgroundColor: TECH.card,
    borderWidth: 1,
    borderColor: TECH.border,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.7, color: TECH.text, textTransform: 'uppercase' },
  infoLine: { fontSize: 12.5, color: TECH.textSecondary, lineHeight: 19 },
  infoValue: { color: TECH.text },
  faultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginTop: 6,
  },
  faultText: { flex: 1, fontSize: 12, fontWeight: '700' },
  historyLoading: { alignSelf: 'flex-start', marginVertical: 6 },
  muted: { fontSize: 11.5, color: TECH.textMuted },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', gap: 10 },
  timelineRail: { width: 10, alignItems: 'center' },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: TECH.blue, marginTop: 5 },
  timelineLine: { flex: 1, width: 1, backgroundColor: TECH.borderStrong, marginVertical: 3 },
  timelineBody: { flex: 1, paddingBottom: 12 },
  timelineTitle: { fontSize: 12.5, fontWeight: '700', color: TECH.text },
});
