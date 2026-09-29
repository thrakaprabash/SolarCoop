import React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TECH } from '../theme';
import { useTechnician } from '../context/TechnicianContext';
import JobStatusTabs from '../components/JobStatusTabs';
import JobCard from '../components/JobCard';

// Urgent first, then medium, then low — the order a technician should work in.
const URGENCY_RANK = { urgent: 0, medium: 1, low: 2 };
const byUrgency = (a, b) => (URGENCY_RANK[a.urgency] ?? 3) - (URGENCY_RANK[b.urgency] ?? 3);

function Section({ label, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Empty({ text }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

/**
 * SOL-193 — Technician dashboard.
 *
 * The "Active" view is the technician's home: their accepted ticket on top,
 * with the pending queue underneath so the next job is always one glance
 * away (as in the Figma frame). "Pending" and "Completed" are plain lists.
 */
export default function TechnicianDashboardScreen() {
  const { t } = useTranslation();
  const {
    jobs, jobCounts, jobFilter, setJobFilter,
    jobsLoading, jobsError, loadJobs,
  } = useTechnician();
  const firstLoad = jobsLoading && jobs.length === 0;

  const active    = jobs.filter(j => j.status === 'active').sort(byUrgency);
  const pending   = jobs.filter(j => j.status === 'pending').sort(byUrgency);
  const completed = jobs.filter(j => j.status === 'completed');

  const pendingSection = (
    <Section label={t('technician.dashboard.pendingJobs')}>
      {pending.length === 0
        ? <Empty text={t('technician.dashboard.noPending')} />
        : pending.map(job => <JobCard key={job.id} job={job} />)}
    </Section>
  );

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={jobsLoading && jobs.length > 0}
          onRefresh={loadJobs}
          tintColor={TECH.orange}
          colors={[TECH.orange]}
        />
      }
    >
      <JobStatusTabs value={jobFilter} onChange={setJobFilter} counts={jobCounts} />

      {jobsError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{jobsError}</Text>
          <Pressable style={styles.retryBtn} onPress={loadJobs}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : null}

      {firstLoad ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={TECH.orange} />
          <Text style={styles.loadingText}>{t('technician.dashboard.loading')}</Text>
        </View>
      ) : null}

      {!firstLoad && jobFilter === 'active' && (
        <>
          <Section label={t('technician.dashboard.activeTicket')}>
            {active.length === 0
              ? <Empty text={t('technician.dashboard.noActive')} />
              : active.map(job => <JobCard key={job.id} job={job} featured />)}
          </Section>
          {pendingSection}
        </>
      )}

      {!firstLoad && jobFilter === 'pending' && pendingSection}

      {!firstLoad && jobFilter === 'completed' && (
        <Section label={t('technician.dashboard.completedJobs')}>
          {completed.length === 0
            ? <Empty text={t('technician.dashboard.noCompleted')} />
            : completed.map(job => <JobCard key={job.id} job={job} />)}
        </Section>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32, gap: 18 },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: TECH.textSecondary,
  },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: TECH.borderStrong,
    borderRadius: 12,
    paddingVertical: 22,
    alignItems: 'center',
  },
  emptyText: { fontSize: 12, color: TECH.textMuted },
  loading: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { fontSize: 12, fontWeight: '600', color: TECH.textSecondary },
  errorCard: {
    backgroundColor: TECH.redSoft,
    borderWidth: 1,
    borderColor: TECH.redBorder,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  errorText: { fontSize: 12, lineHeight: 17, color: TECH.text },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: TECH.red,
  },
  retryText: { fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' },
});
