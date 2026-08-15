import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Leaf, Lightbulb, Sun, Users } from 'lucide-react-native';

import { colors, weight } from '../theme';
import { SDGS } from '../data/energy';
import { useEnergy } from '../context/EnergyContext';
import { useNavigation } from '../context/NavigationContext';
import { buildInsights, selfSufficiency } from '../utils/insights';
import { greeting, kwh, sum } from '../utils/format';
import { ImpactStatCard, InsightCard, SdgCard } from '../components';
import { Chip, ScreenTitle, SectionLabel } from '../components/ui';

export default function EnergyInsightsScreen() {
  const { energy, impact } = useEnergy();
  const { navigate } = useNavigation();
  const [tab, setTab] = useState('insights');
  const onImpact = tab === 'impact';

  const insights = useMemo(() => (onImpact ? [] : buildInsights(energy)), [energy, onImpact]);
  const sufficiency = useMemo(() => selfSufficiency(impact), [impact]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.tabs}>
        <Chip label="Insights" icon={Lightbulb} active={!onImpact} onPress={() => setTab('insights')} />
        <Chip label="Impact" icon={Leaf} active={onImpact} onPress={() => setTab('impact')} />
      </View>

      {onImpact ? (
        <>
          <ScreenTitle
            title="Your Clean Energy Impact"
            subtitle="See how your solar activity contributes to a more sustainable community."
          />

          <ImpactStatCard
            icon={Sun}
            iconColor={colors.amberLight}
            tint={colors.amberTint}
            value={kwh(sum(impact.production))}
            unit="kWh"
            label="Solar Energy Generated"
          />

          <ImpactStatCard
            icon={Users}
            value={kwh(sum(impact.sharedTransactions))}
            unit="kWh"
            label="Energy Shared With Community"
          />

          <ImpactStatCard
            icon={Leaf}
            value={sufficiency + '%'}
            label="Solar Self-Sufficiency"
            progress={sufficiency}
          />

          <SectionLabel style={styles.sdgLabel}>Supporting Sustainable Development</SectionLabel>
          <SdgCard goals={SDGS} />
        </>
      ) : (
        <>
          <ScreenTitle title={greeting(energy.user)} subtitle="Smart Energy Insights" />
          <SectionLabel>Your energy today</SectionLabel>
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} onCta={() => navigate('list')} />
          ))}
        </>
      )}

      <Text style={styles.footNote}>
        {onImpact
          ? 'Totals from your energy records and completed transactions'
          : 'Based on your recent energy activity'}
      </Text>
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
