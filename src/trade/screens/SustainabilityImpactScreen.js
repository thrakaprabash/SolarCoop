import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Leaf, Lightbulb, Sun, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, weight } from '../theme';
import { SDGS } from '../data/energy';
import { useEnergyAnalytics } from '../context/useEnergyAnalytics';
import AnalyticsStatus from '../components/AnalyticsStatus';
import { useNavigation } from '../context/NavigationContext';
import { kwh } from '../utils/format';
import { ImpactStatCard, SdgCard } from '../components';
import { Chip, ScreenTitle, SectionLabel } from '../components/ui';

export default function SustainabilityImpactScreen() {
  const { t } = useTranslation();
  const analytics = useEnergyAnalytics({ includeLedger: true });
  const { navigate } = useNavigation();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={analytics.loading} onRefresh={analytics.refresh} />}>
      <View style={styles.tabs}>
        <Chip label={t('trade.insightsScreen.insightsTab')} icon={Lightbulb} active={false} onPress={() => navigate('insights')} />
        <Chip label={t('trade.insightsScreen.impactTab')} icon={Leaf} active onPress={() => navigate('impact')} />
      </View>

      <ScreenTitle
        title={t('trade.impact.title')}
        subtitle={t('trade.impact.subtitle')}
      />
      <Text style={styles.notice}>Month to date: {analytics.period.month}-01 to {analytics.period.day} (Asia/Colombo)</Text>
      <AnalyticsStatus analytics={analytics} />

      <ImpactStatCard
        icon={Sun}
        iconColor={colors.amberLight}
        tint={colors.amberTint}
        value="—"
        label={t('trade.impact.solarGenerated')}
      />

      <ImpactStatCard
        icon={Users}
        value={analytics.shared == null ? '—' : kwh(analytics.shared)}
        unit={analytics.shared == null ? null : 'kWh'}
        label={t('trade.impact.sharedWithCommunity')}
      />

      <ImpactStatCard
        icon={Leaf}
        value="—"
        label="Estimated solar coverage"
      />
      <Text style={styles.notice}>Solar generation and estimated solar coverage are unavailable until daily energy totals can be verified.</Text>

      <SectionLabel style={styles.sdgLabel}>{t('trade.impact.sdgSectionLabel')}</SectionLabel>
      <SdgCard goals={SDGS} />

      <Text style={styles.footNote}>Shared energy includes only your completed outgoing trades during this period.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20, gap: 14 },
  tabs: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notice: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  sdgLabel: { marginTop: 2 },
  footNote: {
    fontSize: 11,
    fontWeight: weight.medium,
    color: colors.textFaint,
    textAlign: 'center',
    paddingTop: 2,
  },
});
