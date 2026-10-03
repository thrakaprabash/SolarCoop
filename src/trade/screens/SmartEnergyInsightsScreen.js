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
import { Chip, ScreenTitle, SectionLabel } from '../components/ui';

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
      <Text style={styles.notice}>{copy('dailyUnavailable')}</Text>
      {analytics.signedIn && !providersLoading && !providersError && surplus > 0 ?
        <Text style={styles.notice}>{copy('available', { amount: surplus.toFixed(1) })}</Text> : null}
      <Text style={styles.footNote}>{copy('insightsNote')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20, gap: 14 },
  tabs: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notice: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  footNote: {
    fontSize: 11,
    fontWeight: weight.medium,
    color: colors.textFaint,
    textAlign: 'center',
    paddingTop: 2,
  },
});
