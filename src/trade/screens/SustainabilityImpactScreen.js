import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Leaf, Lightbulb, Sun, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, weight } from '../theme';
import { SDGS } from '../data/energy';
import { useTrade } from '../context/TradeContext';
import { useNavigation } from '../context/NavigationContext';
import { selfSufficiency } from '../utils/insights';
import { kwh, sum } from '../utils/format';
import { ImpactStatCard, SdgCard } from '../components';
import { Chip, ScreenTitle, SectionLabel } from '../components/ui';

export default function SustainabilityImpactScreen() {
  const { t } = useTranslation();
  const { impact } = useTrade();
  const { navigate } = useNavigation();

  const sufficiency = useMemo(() => selfSufficiency(impact), [impact]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.tabs}>
        <Chip label={t('trade.insightsScreen.insightsTab')} icon={Lightbulb} active={false} onPress={() => navigate('insights')} />
        <Chip label={t('trade.insightsScreen.impactTab')} icon={Leaf} active onPress={() => navigate('impact')} />
      </View>

      <ScreenTitle
        title={t('trade.impact.title')}
        subtitle={t('trade.impact.subtitle')}
      />

      <ImpactStatCard
        icon={Sun}
        iconColor={colors.amberLight}
        tint={colors.amberTint}
        value={kwh(sum(impact.production))}
        unit="kWh"
        label={t('trade.impact.solarGenerated')}
      />

      <ImpactStatCard
        icon={Users}
        value={kwh(sum(impact.sharedTransactions))}
        unit="kWh"
        label={t('trade.impact.sharedWithCommunity')}
      />

      <ImpactStatCard
        icon={Leaf}
        value={sufficiency + '%'}
        label={t('trade.impact.selfSufficiency')}
        progress={sufficiency}
      />

      <SectionLabel style={styles.sdgLabel}>{t('trade.impact.sdgSectionLabel')}</SectionLabel>
      <SdgCard goals={SDGS} />

      <Text style={styles.footNote}>{t('trade.impact.footNote')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20, gap: 14 },
  tabs: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sdgLabel: { marginTop: 2 },
  footNote: {
    fontSize: 11,
    fontWeight: weight.medium,
    color: colors.textFaint,
    textAlign: 'center',
    paddingTop: 2,
  },
});
