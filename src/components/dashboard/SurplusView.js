import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import { BatteryCharging, ArrowUpRight, Share2 } from 'lucide-react-native';

// SOL-99: Surplus View Component
export const SurplusView = () => {
  const { t } = useTranslation();
  const { metrics, hasMetrics, setMainBottomTab } = useEnergy();

  if (!hasMetrics) return <View style={styles.sectionCard}><Text style={styles.sectionTitle}>{t('member.dashboard.waitingTitle')}</Text><Text style={styles.formSubtitle}>{t('member.dashboard.waitingBody')}</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={styles.storyBadgeTitle}>{t('member.surplus.header')}</Text>
      </View>

      {/* Main Surplus Meter Card */}
      <View style={[styles.heroCard, GLASS.card, SHADOWS.glass]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.iconCircle}>
            <BatteryCharging size={28} color={COLORS.tealLight} />
          </View>
          <View>
            <Text style={styles.label}>{t('member.surplus.currentRate')}</Text>
            <Text style={styles.val}>
              {metrics.surplusAvailable} <Text style={styles.unit}>kWh</Text>
            </Text>
          </View>
        </View>

        <View style={styles.batteryProgressContainer}>
          <View style={styles.batteryHeader}>
            <Text style={styles.batteryLabel}>{t('member.surplus.batteryState')}</Text>
            <Text style={styles.batteryVal}>{metrics.batteryLevel}% ({((metrics.batteryLevel / 100) * metrics.batteryCapacity).toFixed(2)} / {metrics.batteryCapacity} kWh)</Text>
          </View>

          {/* Custom battery bar */}
          <View style={styles.batteryTrack}>
            <View style={[styles.batteryFill, { width: `${metrics.batteryLevel}%` }]} />
          </View>
        </View>

        <View style={styles.statsFooter}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>{t('member.surplus.coopSharedToday')}</Text>
            <Text style={styles.statValText}>{metrics.coopPoolSharedToday} kWh</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>{t('member.surplus.tokensEarned')}</Text>
            <Text style={[styles.statValText, { color: COLORS.amber }]}>+{metrics.coopTokensEarned} pts</Text>
          </View>
        </View>
      </View>

      {/* Interactive Peer-to-Peer Energy Transfer Form */}
      <View style={[styles.sectionCard, GLASS.card, SHADOWS.glass]}>
        <View style={styles.sectionHeaderRow}>
          <Share2 size={20} color={COLORS.tealLight} />
          <Text style={styles.sectionTitle}>{t('member.surplus.transferTitle')}</Text>
        </View>

        <TouchableOpacity
          style={styles.shareSubmitBtn}
          onPress={() => setMainBottomTab('trade')}
          activeOpacity={0.7}
        >
          <ArrowUpRight size={18} color="#FFFFFF" />
          <Text style={styles.shareSubmitText}>{t('member.nav.trade')}</Text>
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
  heroCard: { padding: 18 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.tealGlow, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', color: COLORS.textSecondary },
  val: { fontSize: 32, fontWeight: '800', color: COLORS.tealLight },
  unit: { fontSize: 18, fontWeight: '600' },
  batteryProgressContainer: { marginTop: 16, gap: 6 },
  batteryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  batteryLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  batteryVal: { fontSize: 12, fontWeight: '800', color: COLORS.teal },
  batteryTrack: { height: 10, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 5, overflow: 'hidden' },
  batteryFill: { height: '100%', borderRadius: 5, backgroundColor: COLORS.teal },
  statsFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, marginTop: 14, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  statCol: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
  statValText: { fontSize: 14, fontWeight: '800', marginTop: 2, color: COLORS.textPrimary },
  divider: { width: 1, height: 24, backgroundColor: COLORS.glassBorder },
  sectionCard: { padding: 16, gap: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textBright },
  formSubtitle: { fontSize: 12, lineHeight: 18, color: COLORS.textSecondary },
  formGroup: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  input: { paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.tealGlow, padding: 10, borderRadius: 16 },
  successText: { color: COLORS.tealLight, fontSize: 12, fontWeight: '700' },
  shareSubmitBtn: { backgroundColor: COLORS.teal, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 16 },
  shareSubmitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  settingTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textBright },
  settingSub: { fontSize: 11, marginTop: 2, color: COLORS.textMuted },
});
