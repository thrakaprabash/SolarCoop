import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import { AlertTriangle, ArrowDownLeft, ShieldAlert } from 'lucide-react-native';

// SOL-100: Deflict (Deficit) View Component
export const DeficitView = () => {
  const { t } = useTranslation();
  const { metrics, hasMetrics, setMainBottomTab } = useEnergy();
  
  if (!hasMetrics) return <View style={styles.sectionCard}><Text style={styles.sectionTitle}>{t('member.dashboard.waitingTitle')}</Text><Text style={styles.formSub}>{t('member.dashboard.waitingBody')}</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={styles.storyBadgeTitle}>{t('member.deficit.header')}</Text>
      </View>

      {/* Main Deficit Status Card */}
      <View style={styles.mainAlertCard}>
        <View style={styles.topRow}>
          <View style={styles.iconCircle}>
            <AlertTriangle size={28} color={COLORS.red} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertLabel}>{t('member.deficit.currentDeficit')}</Text>
            <Text style={styles.alertVal}>
              {Math.max(0, metrics.instantConsumption - metrics.instantProduction + metrics.batteryPowerFlow).toFixed(2)} <Text style={styles.unit}>kW</Text>
            </Text>
          </View>
        </View>

        <View style={styles.alertBanner}>
          <ShieldAlert size={18} color={COLORS.teal} />
          <Text style={styles.alertBannerText}>
            {t('member.dashboard.gridEstimate')}
          </Text>
        </View>
      </View>

      {/* Smart Co-op Emergency Borrow Request */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <ArrowDownLeft size={20} color={COLORS.amber} />
          <Text style={styles.sectionTitle}>{t('member.deficit.requestDraw')}</Text>
        </View>

        <TouchableOpacity
          style={styles.borrowSubmitBtn}
          onPress={() => setMainBottomTab('trade')}
          activeOpacity={0.7}
        >
          <ArrowDownLeft size={18} color="#FFFFFF" />
          <Text style={styles.borrowSubmitText}>{t('member.nav.trade')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 16 },
  storyBadgeHeader: { gap: 2 },
  storyBadgeTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: COLORS.textBright },
  mainAlertCard: {
    ...GLASS.card,
    padding: 18,
    ...SHADOWS.glass,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', color: COLORS.textSecondary },
  alertVal: { fontSize: 28, fontWeight: '800', color: COLORS.red },
  unit: { fontSize: 16, fontWeight: '600' },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    padding: 12,
    borderRadius: 16,
    marginTop: 16,
  },
  alertBannerText: { color: COLORS.teal, fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 18 },
  sectionCard: {
    ...GLASS.card,
    padding: 16,
    gap: 12,
    ...SHADOWS.glass,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textBright },
  compareRow: { flexDirection: 'row', gap: 12 },
  compareCard: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1, gap: 4 },
  compareTag: { fontSize: 9, fontWeight: '900' },
  compareTitle: { fontSize: 14, fontWeight: '800' },
  comparePrice: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  priceUnit: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  compareSub: { fontSize: 10, color: COLORS.textMuted },
  formSub: { fontSize: 12, lineHeight: 18, color: COLORS.textSecondary },
  formGroup: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  input: {
    ...GLASS.input,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    padding: 10,
    borderRadius: 16,
  },
  successText: { color: COLORS.teal, fontSize: 12, fontWeight: '700' },
  borrowSubmitBtn: {
    backgroundColor: COLORS.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    ...SHADOWS.glow,
  },
  borrowSubmitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
