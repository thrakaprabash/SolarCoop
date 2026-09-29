import React from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react-native';
import { TECH } from '../theme';
import { useTechnician } from '../context/TechnicianContext';
import CriticalAlertCard from '../components/CriticalAlertCard';

const notify = (title, message) => {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
};

/**
 * SOL-198 — Diagnostics tab: every open fault as a technician-facing alert,
 * with the raw error code and a diagnostic checklist the assigned technician
 * works through on site.
 */
export default function DiagnosticsScreen() {
  const { t } = useTranslation();
  const {
    openAlerts, technicianId, toggleChecklistItem, openJob, jobsLoading, loadJobs,
  } = useTechnician();

  const handleToggle = async (jobId, index) => {
    try {
      await toggleChecklistItem(jobId, index);
    } catch (err) {
      notify(t('technician.alert.saveErrorTitle'), err?.message || t('technician.alert.saveErrorBody'));
    }
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={jobsLoading} onRefresh={loadJobs} tintColor={TECH.orange} colors={[TECH.orange]} />
      }
    >
      <Text style={styles.sectionLabel}>{t('technician.alert.sectionTitle')}</Text>

      {openAlerts.length === 0 ? (
        <View style={styles.empty}>
          <ShieldCheck size={26} color={TECH.green} />
          <Text style={styles.emptyTitle}>{t('technician.alert.noneTitle')}</Text>
          <Text style={styles.emptyText}>{t('technician.alert.noneBody')}</Text>
        </View>
      ) : (
        openAlerts.map(job => (
          <CriticalAlertCard
            key={job.id}
            job={job}
            canEditChecklist={job.status === 'active' && job.technicianId === technicianId}
            onToggleItem={(i) => handleToggle(job.id, i)}
            onViewJob={() => openJob(job.id)}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32, gap: 14 },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: TECH.textSecondary,
  },
  empty: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 36,
    borderWidth: 1,
    borderColor: TECH.border,
    borderRadius: 14,
    backgroundColor: TECH.card,
  },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: TECH.text },
  emptyText: { fontSize: 12, color: TECH.textMuted },
});
