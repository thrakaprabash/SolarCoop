import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, SHADOWS } from '../../theme/colors';
import { Leaf, Award, DollarSign, ShieldCheck, TreePine, CloudOff, Flame, Zap, CheckCircle2 } from 'lucide-react-native';

export const EnergySummaryView = () => {
  const { isDarkMode, metrics } = useEnergy();

  const themeColors = isDarkMode
    ? { bg: '#0F172A', card: '#1E293B', border: '#334155', text: '#F8FAFC', textSub: '#94A3B8' }
    : { bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', textSub: '#64748B' };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.bg }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={[styles.storyBadgeTitle, { color: themeColors.text }]}>Energy Summary & Sustainability Impact</Text>
      </View>

      {/* Grid Independence Scorecard */}
      <View style={[styles.scoreCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.scoreHeaderRow}>
          <Award size={32} color={COLORS.primary} />
          <View>
            <Text style={[styles.scoreLabel, { color: themeColors.textSub }]}>Off-Grid Independence Rating</Text>
            <Text style={[styles.scoreVal, { color: COLORS.primary }]}>{metrics.gridIndependence}% Self-Sufficient</Text>
          </View>
        </View>

        <Text style={[styles.scoreSubText, { color: themeColors.textSub }]}>
          Your household is producing 94% of its energy locally through clean solar arrays and co-op sharing, avoiding grid fossil fuel power.
        </Text>
      </View>

      {/* SDG Alignment & Carbon Footprint Badges Grid */}
      <View style={styles.sdgGrid}>
        {/* Metric 1: CO2 Avoided */}
        <View style={[styles.impactCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={[styles.impactIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <CloudOff size={22} color="#10B981" />
          </View>
          <Text style={[styles.impactValue, { color: themeColors.text }]}>{metrics.co2SavedKg} kg</Text>
          <Text style={[styles.impactLabel, { color: themeColors.textSub }]}>CO₂ Offset Today</Text>
          <Text style={styles.impactSub}>Equivalent to 1,240 kg / month</Text>
        </View>

        {/* Metric 2: Equivalent Trees Planted */}
        <View style={[styles.impactCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={[styles.impactIconBadge, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
            <TreePine size={22} color="#06B6D4" />
          </View>
          <Text style={[styles.impactValue, { color: themeColors.text }]}>18 Trees</Text>
          <Text style={[styles.impactLabel, { color: themeColors.textSub }]}>Trees Saved Equivalent</Text>
          <Text style={styles.impactSub}>Forest carbon absorption equal</Text>
        </View>

        {/* Metric 3: Financial Savings */}
        <View style={[styles.impactCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={[styles.impactIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <DollarSign size={22} color="#F59E0B" />
          </View>
          <Text style={[styles.impactValue, { color: themeColors.text }]}>${metrics.monetarySaved}</Text>
          <Text style={[styles.impactLabel, { color: themeColors.textSub }]}>Direct Bill Savings</Text>
          <Text style={styles.impactSub}>Calculated vs grid tariff</Text>
        </View>

        {/* Metric 4: Coal Avoided */}
        <View style={[styles.impactCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={[styles.impactIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <Flame size={22} color="#EF4444" />
          </View>
          <Text style={[styles.impactValue, { color: themeColors.text }]}>24.5 kg</Text>
          <Text style={[styles.impactLabel, { color: themeColors.textSub }]}>Coal Fuel Avoided</Text>
          <Text style={styles.impactSub}>Thermal plant savings</Text>
        </View>
      </View>

      {/* Sustainable Development Goals Alignment Section */}
      <View style={[styles.sdgBanner, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
        <Text style={styles.sdgBannerTitle}>UN Sustainable Development Goals (SDG) Alignment</Text>

        <View style={styles.sdgItemsRow}>
          <View style={styles.sdgPill}>
            <CheckCircle2 size={16} color="#10B981" />
            <Text style={styles.sdgPillText}>SDG 7: Affordable & Clean Energy</Text>
          </View>

          <View style={styles.sdgPill}>
            <CheckCircle2 size={16} color="#06B6D4" />
            <Text style={styles.sdgPillText}>SDG 11: Sustainable Cities & Communities</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  storyBadgeHeader: { gap: 2 },
  storyBadgeTag: { fontSize: 10, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
  storyBadgeTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  scoreCard: { borderRadius: 20, padding: 18, borderWidth: 1, ...SHADOWS.medium, gap: 10 },
  scoreHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  scoreLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  scoreVal: { fontSize: 24, fontWeight: '800' },
  scoreSubText: { fontSize: 12, lineHeight: 18 },
  sdgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  impactCard: { width: '48%', borderRadius: 16, padding: 14, borderWidth: 1, ...SHADOWS.small, gap: 4 },
  impactIconBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  impactValue: { fontSize: 22, fontWeight: '800' },
  impactLabel: { fontSize: 12, fontWeight: '700' },
  impactSub: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  sdgBanner: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  sdgBannerTitle: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  sdgItemsRow: { gap: 8 },
  sdgPill: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sdgPillText: { fontSize: 12, fontWeight: '700', color: '#F8FAFC' },
});
