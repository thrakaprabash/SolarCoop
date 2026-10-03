import React, { useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Leaf, Lightbulb } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, weight } from '../theme';
import { useTrade } from '../context/TradeContext';
import { useNavigation } from '../context/NavigationContext';
import { useEnergyAnalytics } from '../context/useEnergyAnalytics';
import AnalyticsStatus from '../components/AnalyticsStatus';
import { analyticsText } from '../utils/analyticsText';
import { dayPart } from '../utils/format';
import { kwh } from '../utils/format';
import { Card, Chip, ScreenTitle, SectionLabel } from '../components/ui';

const GREETING_KEY = {
  morning: 'trade.greeting.morning',
  afternoon: 'trade.greeting.afternoon',
  evening: 'trade.greeting.evening',
};

export default function SmartEnergyInsightsScreen() {
  const { t, i18n } = useTranslation();
  const copy = (key, values) => analyticsText(i18n.resolvedLanguage || i18n.language, key, values);
  const analytics = useEnergyAnalytics();
  const { surplus, providersLoading, providersError, refreshProviders } = useTrade();
  const { navigate } = useNavigation();
  useEffect(() => { refreshProviders(); }, [refreshProviders]);

  const refresh = () => { analytics.refresh(); refreshProviders(); };
  const daily = analytics.daily;
  const comparison = daily?.comparison;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={analytics.loading} onRefresh={refresh} />}>
      <View style={styles.tabs}>
        <Chip label={t('trade.insightsScreen.insightsTab')} icon={Lightbulb} active onPress={() => navigate('insights')} />
        <Chip label={t('trade.insightsScreen.impactTab')} icon={Leaf} active={false} onPress={() => navigate('impact')} />
      </View>

      <ScreenTitle
        title={analytics.name ? t(GREETING_KEY[dayPart()], { name: analytics.name }) : t('trade.nav.smartEnergyInsights')}
        subtitle={t('trade.nav.smartEnergyInsights')}
      />
      <SectionLabel>{t('trade.insightsScreen.sectionLabel')}</SectionLabel>
      <AnalyticsStatus analytics={{ ...analytics, refresh }} />
      {daily ? <Card style={{ gap: 10 }}>
        <Text style={styles.metric}>{copy('todayConsumption', { amount: daily.current == null ? '—' : kwh(daily.current) })}</Text>
        <Text style={styles.metric}>{copy('averageConsumption', { amount: daily.average == null ? '—' : kwh(daily.average) })}</Text>
        <Text style={styles.notice}>{copy('baselineCoverage', { days: daily.baselineDays })}</Text>
        {comparison ? <Text style={styles.notice}>{copy(comparison.kind === 'inLine' && comparison.percent == null
          ? 'comparison_zeroBoth' : `comparison_${comparison.kind}`, {
          percent: comparison.percent == null ? '—' : Math.abs(comparison.percent).toFixed(1),
          amount: kwh(comparison.absolute),
        })}</Text> : <Text style={styles.notice}>{copy('comparisonUnavailable')}</Text>}
        {daily.trend ? <Text style={styles.notice}>{copy(`trend_${daily.trend.kind}`)}</Text> : null}
      </Card> : null}
      {analytics.signedIn && !providersLoading && !providersError && surplus > 0 ?
        <Text style={styles.notice}>{copy('available', { amount: surplus.toFixed(1) })}</Text> : null}
      <Text style={styles.footNote}>{copy('snapshotNote')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20, gap: 14 },
  tabs: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notice: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  metric: { color: colors.textStrong, fontSize: 16, fontWeight: weight.bold, lineHeight: 24 },
  footNote: {
    fontSize: 11,
    fontWeight: weight.medium,
    color: colors.textFaint,
    textAlign: 'center',
    paddingTop: 2,
  },
});
