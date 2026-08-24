import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Leaf, Lightbulb, Sun, Users } from 'lucide-react-native';

import { colors, weight } from '../theme';
import { SDGS } from '../data/energy';
import { useTrade } from '../context/TradeContext';
import { useNavigation } from '../context/NavigationContext';
import { selfSufficiency } from '../utils/insights';
import { kwh, sum } from '../utils/format';
import { ImpactStatCard, SdgCard } from '../components';
import { Chip, ScreenTitle, SectionLabel } from '../components/ui';

export default function SustainabilityImpactScreen() {
  const { impact } = useTrade();
  const { navigate } = useNavigation();

  const sufficiency = useMemo(() => selfSufficiency(impact), [impact]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.tabs}>
        <Chip label="Insights" icon={Lightbulb} active={false} onPress={() => navigate('insights')} />
        <Chip label="Impact" icon={Leaf} active onPress={() => navigate('impact')} />
      </View>

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

      <Text style={styles.footNote}>Totals from your energy records and completed transactions</Text>
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
