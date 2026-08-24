import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Leaf, Lightbulb } from 'lucide-react-native';

import { colors, weight } from '../theme';
import { useTrade } from '../context/TradeContext';
import { useNavigation } from '../context/NavigationContext';
import { buildInsights } from '../utils/insights';
import { greeting } from '../utils/format';
import { InsightCard } from '../components';
import { Chip, ScreenTitle, SectionLabel } from '../components/ui';

export default function SmartEnergyInsightsScreen() {
  const { energy } = useTrade();
  const { navigate } = useNavigation();

  const insights = useMemo(() => buildInsights(energy), [energy]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.tabs}>
        <Chip label="Insights" icon={Lightbulb} active onPress={() => navigate('insights')} />
        <Chip label="Impact" icon={Leaf} active={false} onPress={() => navigate('impact')} />
      </View>

      <ScreenTitle title={greeting(energy.user)} subtitle="Smart Energy Insights" />
      <SectionLabel>Your energy today</SectionLabel>
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} onCta={() => navigate('list')} />
      ))}

      <Text style={styles.footNote}>Based on your recent energy activity</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20, gap: 14 },
  tabs: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footNote: {
    fontSize: 11,
    fontWeight: weight.medium,
    color: colors.textFaint,
    textAlign: 'center',
    paddingTop: 2,
  },
});
