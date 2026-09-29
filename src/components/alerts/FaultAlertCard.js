import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CheckCircle, UserCheck } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';

const GREEN = '#22C55E';

/**
 * SOL-199 — the household's side of a fault: calm, plain language, no error
 * codes. Matches the "Consumer view" half of the Figma dual-channel alert.
 * The technician sees the same job as a critical alert with the raw code.
 */
export function FaultAlertCard({ alert }) {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <View style={styles.iconRing}>
        <CheckCircle size={30} color={GREEN} strokeWidth={2.2} />
      </View>

      <Text style={styles.title}>{t('faultAlert.title')}</Text>
      <Text style={styles.message}>{alert.message || t('faultAlert.defaultMessage')}</Text>

      {/* SOL-200 — who is coming, once a technician has accepted the job */}
      <View style={[styles.techPill, !alert.technicianName && styles.techPillWaiting]}>
        {alert.technicianName ? <UserCheck size={13} color={GREEN} /> : null}
        <Text style={[styles.techText, !alert.technicianName && styles.techTextWaiting]}>
          {alert.technicianName
            ? t('faultAlert.assignedTech', { name: alert.technicianName })
            : t('faultAlert.awaitingTech')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  iconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.5)',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.textBright, textAlign: 'center' },
  message: { fontSize: 12.5, lineHeight: 18, color: COLORS.textSecondary, textAlign: 'center' },
  techPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.45)',
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
  },
  techPillWaiting: {
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  techText: { fontSize: 12, fontWeight: '700', color: GREEN },
  techTextWaiting: { color: COLORS.textSecondary, fontWeight: '600' },
});
