import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import { Award, DollarSign, TreePine, CloudOff, Flame } from 'lucide-react-native';

// SOL-103: Energy Summary View Component
export const EnergySummaryView = () => {
  const { metrics } = useEnergy();

  const treesCount = Math.max(1, Math.round((metrics.co2SavedKg || 34.2) * 0.53));
  const monthlyCo2 = Math.round((metrics.co2SavedKg || 34.2) * 30);
  const coalAvoided = ((metrics.co2SavedKg || 34.2) * 0.72).toFixed(1);
  const billSavings = typeof metrics.monetarySaved === 'number' 
    ? metrics.monetarySaved.toFixed(2) 
    : metrics.monetarySaved;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={styles.storyBadgeTitle}>Energy Summary & Sustainability</Text>
      </View>

      {/* Grid Independence Scorecard */}
      <View style={[styles.scoreCard, GLASS.card, SHADOWS.glass]}>
        <View style={styles.scoreHeaderRow}>
          <View style={styles.awardCircle}>
            <Award size={28} color={COLORS.amber} />
          </View>
          <View style={styles.scoreHeaderTextCol}>
            <Text style={styles.scoreLabel}>Off-Grid Independence Rating</Text>
            <Text style={styles.scoreVal}>{metrics.gridIndependence}% Self-Sufficient</Text>
          </View>
        </View>

        {/* Visual Independence Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, metrics.gridIndependence))}%` }]} />
        </View>

        <Text style={styles.scoreSubText}>
          Your household is producing {metrics.gridIndependence}% of its energy locally through clean solar arrays and co-op sharing, avoiding grid fossil fuel power.
        </Text>
      </View>

      {/* Carbon Footprint & Sustainability Impact Grid */}
      <View style={styles.impactGrid}>
        {/* Metric 1: CO2 Avoided */}
        <View style={[styles.impactCard, GLASS.card, SHADOWS.glass]}>
          <View style={[styles.impactIconBadge, { backgroundColor: COLORS.tealGlow }]}>
            <CloudOff size={20} color={COLORS.teal} />
          </View>
          <Text style={styles.impactValue}>{metrics.co2SavedKg} kg</Text>
          <Text style={styles.impactLabel}>CO₂ Offset Today</Text>
          <Text style={styles.impactSub}>Equivalent to {monthlyCo2} kg / month</Text>
        </View>

        {/* Metric 2: Equivalent Trees Planted */}
        <View style={[styles.impactCard, GLASS.card, SHADOWS.glass]}>
          <View style={[styles.impactIconBadge, { backgroundColor: COLORS.tealGlow }]}>
            <TreePine size={20} color={COLORS.tealLight} />
          </View>
          <Text style={styles.impactValue}>{treesCount} Trees</Text>
          <Text style={styles.impactLabel}>Trees Saved Equivalent</Text>
          <Text style={styles.impactSub}>Forest carbon absorption equal</Text>
        </View>

        {/* Metric 3: Financial Savings */}
        <View style={[styles.impactCard, GLASS.card, SHADOWS.glass]}>
          <View style={[styles.impactIconBadge, { backgroundColor: COLORS.amberGlow }]}>
            <DollarSign size={20} color={COLORS.amber} />
          </View>
          <Text style={styles.impactValue}>${billSavings}</Text>
          <Text style={styles.impactLabel}>Direct Bill Savings</Text>
          <Text style={styles.impactSub}>Calculated vs grid tariff</Text>
        </View>

        {/* Metric 4: Coal Avoided */}
        <View style={[styles.impactCard, GLASS.card, SHADOWS.glass]}>
          <View style={[styles.impactIconBadge, { backgroundColor: COLORS.redGlow }]}>
            <Flame size={20} color={COLORS.red} />
          </View>
          <Text style={styles.impactValue}>{coalAvoided} kg</Text>
          <Text style={styles.impactLabel}>Coal Fuel Avoided</Text>
          <Text style={styles.impactSub}>Thermal plant savings</Text>
        </View>
      </View>

      {/* Bottom Spacer */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 16, paddingBottom: 24 },
  storyBadgeHeader: { gap: 2 },
  storyBadgeTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: COLORS.textBright },
  scoreCard: {
    padding: 18,
    borderRadius: 20,
    gap: 12,
  },
  scoreHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  awardCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.amberGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreHeaderTextCol: { flex: 1, gap: 2 },
  scoreLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: COLORS.textSecondary, letterSpacing: 0.5 },
  scoreVal: { fontSize: 22, fontWeight: '800', color: COLORS.amberLight },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.amber,
  },
  scoreSubText: { fontSize: 12, lineHeight: 18, color: COLORS.textSecondary },
  impactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  impactCard: {
    width: '48%',
    borderRadius: 18,
    padding: 16,
    gap: 6,
    flexGrow: 1,
  },
  impactIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  impactValue: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  impactLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  impactSub: { fontSize: 10.5, color: COLORS.textMuted, marginTop: 2, lineHeight: 14 },
});
