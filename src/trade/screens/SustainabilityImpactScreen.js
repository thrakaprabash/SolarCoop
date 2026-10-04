import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Leaf, Lightbulb, Sun, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, weight } from '../theme';
import { SDGS } from '../data/energy';
import { useEnergyAnalytics } from '../context/useEnergyAnalytics';
import AnalyticsStatus from '../components/AnalyticsStatus';
import { analyticsText } from '../utils/analyticsText';
import { useNavigation } from '../context/NavigationContext';
import { kwh } from '../utils/format';
import { ImpactStatCard, SdgCard } from '../components';
import { Chip, ScreenTitle, SectionLabel } from '../components/ui';

export default function SustainabilityImpactScreen() {
  const { t, i18n } = useTranslation();
  const copy = (key, values) => analyticsText(i18n.resolvedLanguage || i18n.language, key, values);
  const analytics = useEnergyAnalytics({ includeLedger: true });
  const { navigate } = useNavigation();
  const daily = analytics.daily;
  const generation = daily?.generation;
  const coverage = daily?.estimatedSolarCoverage;

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
      <Text style={styles.notice}>{copy('period', { start: `${analytics.period.month}-01`, end: analytics.period.day })}</Text>
      <AnalyticsStatus analytics={analytics} />

      <ImpactStatCard
        icon={Sun}
        iconColor={colors.amberLight}
        tint={colors.amberTint}
        value={generation == null ? '—' : kwh(generation)}
        unit={generation == null ? null : 'kWh'}
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
        value={coverage == null ? '—' : coverage.toFixed(1)}
        unit={coverage == null ? null : '%'}
        progress={coverage == null ? null : coverage}
        label={copy('coverage')}
      />
      {daily ? <Text style={styles.notice}>{copy('impactCoverage', {
        generationDays: daily.generationDays, matchedDays: daily.matchedDays,
        days: Number(analytics.period.day.slice(-2)),
      })}</Text> : null}
      {daily && (generation == null || coverage == null) ? <Text style={styles.notice}>{copy('solarMissing')}</Text> : null}
      <Text style={styles.notice}>{copy('snapshotNote')}</Text>
      <Text style={styles.notice}>{copy('coverageEstimateNote')}</Text>

      <SectionLabel style={styles.sdgLabel}>{t('trade.impact.sdgSectionLabel')}</SectionLabel>
      <SdgCard goals={SDGS} />

      <Text style={styles.footNote}>{copy('sharingNote')}</Text>
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
