import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import {
  Award,
  DollarSign,
  TreePine,
  CloudOff,
  Flame,
  Share2,
  Sparkles,
} from 'lucide-react-native';
import { ShareImpactModal } from './ShareImpactModal';

// SOL-103 & SOL-188: Energy Summary View & Impact Scorecard Export Component
export const EnergySummaryView = () => {
  const { metrics } = useEnergy();
  const [shareModalVisible, setShareModalVisible] = useState(false);

  const treesCount = Math.max(1, Math.round((metrics.co2SavedKg || 34.2) * 0.53));
  const monthlyCo2 = Math.round((metrics.co2SavedKg || 34.2) * 30);
  const coalAvoided = ((metrics.co2SavedKg || 34.2) * 0.72).toFixed(1);
  const billSavings = typeof metrics.monetarySaved === 'number' 
    ? metrics.monetarySaved.toFixed(2) 
    : metrics.monetarySaved;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header with Title & SOL-188 Share Button */}
      <View style={styles.headerRow}>
        <View style={styles.storyBadgeHeader}>
          <Text style={styles.storyBadgeTitle}>Energy Summary</Text>
          <Text style={styles.storyBadgeSub}>Household sustainability & grid independence</Text>
        </View>
        <TouchableOpacity
          style={[styles.headerShareBtn, GLASS.card, SHADOWS.amberGlow]}
          onPress={() => setShareModalVisible(true)}
          activeOpacity={0.7}
        >
          <Share2 size={15} color={COLORS.amberLight} />
          <Text style={styles.headerShareBtnText}>Share Impact</Text>
        </TouchableOpacity>
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

      {/* SOL-188: Share & Export Card Banner */}
      <View style={[styles.shareBannerCard, GLASS.card, SHADOWS.glass]}>
        <View style={styles.shareBannerLeft}>
          <View style={styles.shareBannerIcon}>
            <Sparkles size={20} color={COLORS.amberLight} />
          </View>
          <View style={styles.shareBannerTextCol}>
            <Text style={styles.shareBannerTitle}>Celebrate Your Clean Energy</Text>
            <Text style={styles.shareBannerDesc}>
              Generate a verified impact scorecard to share across social media or download as an image.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.shareBannerBtn}
          onPress={() => setShareModalVisible(true)}
          activeOpacity={0.8}
        >
          <Share2 size={16} color="#121212" strokeWidth={2.5} />
          <Text style={styles.shareBannerBtnText}>Export Card</Text>
        </TouchableOpacity>
      </View>

      {/* SOL-188: Modal */}
      <ShareImpactModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        metrics={metrics}
      />

      {/* Bottom Spacer */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 16, paddingBottom: 24 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  storyBadgeHeader: { gap: 2, flex: 1 },
  storyBadgeTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: COLORS.textBright },
  storyBadgeSub: { fontSize: 12, color: COLORS.textSecondary },
  headerShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  headerShareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.amberLight,
  },
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
  shareBannerCard: {
    padding: 16,
    borderRadius: 18,
    gap: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  shareBannerLeft: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  shareBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.amberGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBannerTextCol: {
    flex: 1,
    gap: 2,
  },
  shareBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textBright,
  },
  shareBannerDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textSecondary,
  },
  shareBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.amber,
    ...SHADOWS.amberGlow,
  },
  shareBannerBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#121212',
  },
});
