import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import { Leaf, Award, DollarSign, ShieldCheck, TreePine, CloudOff, Flame, Zap, CheckCircle2 } from 'lucide-react-native';

export const EnergySummaryView = () => {
  const { metrics } = useEnergy();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={styles.storyBadgeTitle}>Energy Summary & Sustainability Impact</Text>
      </View>

      {/* Grid Independence Scorecard */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeaderRow}>
          <Award size={32} color={COLORS.amber} />
          <View>
            <Text style={styles.scoreLabel}>Off-Grid Independence Rating</Text>
            <Text style={styles.scoreVal}>{metrics.gridIndependence}% Self-Sufficient</Text>
          </View>
        </View>

        <Text style={styles.scoreSubText}>
          Your household is producing 94% of its energy locally through clean solar arrays and co-op sharing, avoiding grid fossil fuel power.
        </Text>
      </View>

      {/* SDG Alignment & Carbon Footprint Badges Grid */}
      <View style={styles.sdgGrid}>
        {/* Metric 1: CO2 Avoided */}
        <View style={styles.impactCard}>
          <View style={[styles.impactIconBadge, { backgroundColor: COLORS.tealGlow }]}>
            <CloudOff size={22} color={COLORS.teal} />
          </View>
          <Text style={styles.impactValue}>{metrics.co2SavedKg} kg</Text>
          <Text style={styles.impactLabel}>CO₂ Offset Today</Text>
          <Text style={styles.impactSub}>Equivalent to 1,240 kg / month</Text>
        </View>

        {/* Metric 2: Equivalent Trees Planted */}
        <View style={styles.impactCard}>
          <View style={[styles.impactIconBadge, { backgroundColor: COLORS.tealGlow }]}>
            <TreePine size={22} color={COLORS.tealLight} />
          </View>
          <Text style={styles.impactValue}>18 Trees</Text>
          <Text style={styles.impactLabel}>Trees Saved Equivalent</Text>
          <Text style={styles.impactSub}>Forest carbon absorption equal</Text>
        </View>

        {/* Metric 3: Financial Savings */}
        <View style={styles.impactCard}>
          <View style={[styles.impactIconBadge, { backgroundColor: COLORS.amberGlow }]}>
            <DollarSign size={22} color={COLORS.amber} />
          </View>
          <Text style={styles.impactValue}>${metrics.monetarySaved}</Text>
          <Text style={styles.impactLabel}>Direct Bill Savings</Text>
          <Text style={styles.impactSub}>Calculated vs grid tariff</Text>
        </View>

        {/* Metric 4: Coal Avoided */}
        <View style={styles.impactCard}>
          <View style={[styles.impactIconBadge, { backgroundColor: COLORS.redGlow }]}>
            <Flame size={22} color={COLORS.red} />
          </View>
          <Text style={styles.impactValue}>24.5 kg</Text>
          <Text style={styles.impactLabel}>Coal Fuel Avoided</Text>
          <Text style={styles.impactSub}>Thermal plant savings</Text>
        </View>
      </View>

      {/* Sustainable Development Goals Alignment Section */}
      <View style={styles.sdgBanner}>
        <Text style={styles.sdgBannerTitle}>UN Sustainable Development Goals (SDG) Alignment</Text>

        <View style={styles.sdgItemsRow}>
          <View style={styles.sdgPill}>
            <CheckCircle2 size={16} color={COLORS.teal} />
            <Text style={styles.sdgPillText}>SDG 7: Affordable & Clean Energy</Text>
          </View>

          <View style={styles.sdgPill}>
            <CheckCircle2 size={16} color={COLORS.tealLight} />
            <Text style={styles.sdgPillText}>SDG 11: Sustainable Cities & Communities</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 16 },
  storyBadgeHeader: { gap: 2 },
  storyBadgeTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: COLORS.textBright },
  scoreCard: {
    ...GLASS.card,
    padding: 18,
    ...SHADOWS.glass,
    gap: 10,
  },
  scoreHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  scoreLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', color: COLORS.textSecondary },
  scoreVal: { fontSize: 24, fontWeight: '800', color: COLORS.amber },
  scoreSubText: { fontSize: 12, lineHeight: 18, color: COLORS.textSecondary },
  sdgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  impactCard: {
    width: '48%',
    ...GLASS.card,
    borderRadius: 16,
    padding: 14,
    ...SHADOWS.glass,
    gap: 4,
  },
  impactIconBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  impactValue: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  impactLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  impactSub: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  sdgBanner: {
    ...GLASS.card,
    borderRadius: 16,
    borderColor: COLORS.tealGlow,
    padding: 16,
    gap: 12,
  },
  sdgBannerTitle: { fontSize: 14, fontWeight: '800', color: COLORS.teal },
  sdgItemsRow: { gap: 8 },
  sdgPill: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sdgPillText: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
});
