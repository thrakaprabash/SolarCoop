import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import Svg, { Rect, Path, Line, Text as SvgText, Circle } from 'react-native-svg';
import { Sun, ShieldAlert, Cpu, Gauge, Compass, Thermometer, Sparkles } from 'lucide-react-native';

const STATUS_LABEL_KEY = {
  optimal: 'member.production.status.optimal',
  partialShade: 'member.production.status.partialShade',
};

// SOL-97: Production View Component
export const ProductionView = () => {
  const { t } = useTranslation();
  const { metrics } = useEnergy();

  const arraysData = [
    { name: t('member.production.array.roofNorth'), capacity: '4.8 kW', current: `${(metrics.instantProduction * 0.52).toFixed(1)} kW`, eff: '98%', status: 'optimal' },
    { name: t('member.production.array.roofSouth'), capacity: '4.0 kW', current: `${(metrics.instantProduction * 0.41).toFixed(1)} kW`, eff: '96%', status: 'optimal' },
    { name: t('member.production.array.carport'), capacity: '1.2 kW', current: `${(metrics.instantProduction * 0.07).toFixed(1)} kW`, eff: '85%', status: 'partialShade' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={styles.storyBadgeTitle}>{t('member.production.header')}</Text>
      </View>

      {/* Main Gauge Banner */}
      <View style={styles.heroGaugeCard}>
        <View style={styles.heroGaugeHeader}>
          <View style={styles.iconCircle}>
            <Sun size={28} color={COLORS.amber} />
          </View>
          <View>
            <Text style={styles.gaugeLabel}>{t('member.production.liveGeneration')}</Text>
            <Text style={styles.gaugeValue}>
              {metrics.instantProduction} <Text style={styles.gaugeUnit}>kW</Text>
            </Text>
          </View>
        </View>

        {/* Hourly Solar Generation Bar Curve SVG */}
        <View style={styles.chartBox}>
          <Text style={styles.chartBoxTitle}>{t('member.production.generationCurve')}</Text>
          <Svg height="120" width="100%" viewBox="0 0 300 120">
            {/* Grid lines */}
            <Line x1="0" y1="30" x2="300" y2="30" stroke={COLORS.textMuted} strokeDasharray="3 3" />
            <Line x1="0" y1="70" x2="300" y2="70" stroke={COLORS.textMuted} strokeDasharray="3 3" />

            {/* Hourly Bars */}
            {[
              { time: '06:00', h: 10 },
              { time: '08:00', h: 35 },
              { time: '10:00', h: 75 },
              { time: '12:00', h: 98 },
              { time: '14:00', h: 90 },
              { time: '16:00', h: 55 },
              { time: '18:00', h: 15 },
            ].map((bar, i) => (
              <React.Fragment key={i}>
                <Rect
                  x={15 + i * 40}
                  y={100 - bar.h}
                  width="20"
                  height={bar.h}
                  rx="4"
                  fill={i === 3 ? COLORS.amber : COLORS.amberGlow}
                />
                <SvgText x={25 + i * 40} y="115" fill={COLORS.textSecondary} fontSize="9" textAnchor="middle">{bar.time}</SvgText>
              </React.Fragment>
            ))}
          </Svg>
        </View>

        <View style={styles.gaugeFooter}>
          <View style={styles.gaugeStat}>
            <Text style={styles.gaugeStatSub}>{t('member.production.dailyTotal')}</Text>
            <Text style={styles.gaugeStatVal}>{metrics.dailyProduction} kWh</Text>
          </View>
          <View style={styles.gaugeDivider} />
          <View style={styles.gaugeStat}>
            <Text style={styles.gaugeStatSub}>{t('member.production.peakToday')}</Text>
            <Text style={[styles.gaugeStatVal, { color: COLORS.amberLight }]}>8.8 kW</Text>
          </View>
          <View style={styles.gaugeDivider} />
          <View style={styles.gaugeStat}>
            <Text style={styles.gaugeStatSub}>{t('member.production.capacityUsed')}</Text>
            <Text style={[styles.gaugeStatVal, { color: COLORS.teal }]}>84%</Text>
          </View>
        </View>
      </View>

      {/* Solar Telemetry Widgets */}
      <View style={styles.telemetryRow}>
        <View style={styles.telemetryCard}>
          <Compass size={18} color={COLORS.tealLight} />
          <Text style={styles.telemetryVal}>980 W/m²</Text>
          <Text style={styles.telemetryLabel}>{t('member.production.solarIrradiance')}</Text>
        </View>

        <View style={styles.telemetryCard}>
          <Thermometer size={18} color={COLORS.amber} />
          <Text style={styles.telemetryVal}>34 °C</Text>
          <Text style={styles.telemetryLabel}>{t('member.production.panelTemp')}</Text>
        </View>

        <View style={styles.telemetryCard}>
          <Cpu size={18} color={COLORS.teal} />
          <Text style={styles.telemetryVal}>97.8%</Text>
          <Text style={styles.telemetryLabel}>{t('member.production.inverterEfficiency')}</Text>
        </View>
      </View>

      {/* Solar Panel Group Breakdown List */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t('member.production.arrayBreakdown')}</Text>

        <View style={styles.arraysList}>
          {arraysData.map((arr, index) => (
            <View key={index} style={styles.arrayRow}>
              <View style={styles.arrayInfo}>
                <Text style={styles.arrayName}>{arr.name}</Text>
                <Text style={styles.arraySub}>{t('member.production.array.ratedCapEfficiency', { capacity: arr.capacity, eff: arr.eff })}</Text>
              </View>
              <View style={styles.arrayOutputCol}>
                <Text style={styles.arrayOutput}>{arr.current}</Text>
                <View style={[styles.statusTag, { backgroundColor: arr.status === 'optimal' ? COLORS.tealGlow : COLORS.amberGlow }]}>
                  <Text style={[styles.statusTagText, { color: arr.status === 'optimal' ? COLORS.tealLight : COLORS.amberLight }]}>{t(STATUS_LABEL_KEY[arr.status])}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 16 },
  storyBadgeHeader: { gap: 2 },
  storyBadgeTag: { fontSize: 10, fontWeight: '800', color: COLORS.amber, textTransform: 'uppercase', letterSpacing: 0.8 },
  storyBadgeTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: COLORS.textBright },
  heroGaugeCard: { ...GLASS.card, padding: 18, ...SHADOWS.glass },
  heroGaugeHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.amberGlow, alignItems: 'center', justifyContent: 'center' },
  gaugeLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', color: COLORS.textSecondary },
  gaugeValue: { fontSize: 32, fontWeight: '800', color: COLORS.amberLight },
  gaugeUnit: { fontSize: 18, fontWeight: '600' },
  chartBox: { marginTop: 16, marginBottom: 12 },
  chartBoxTitle: { fontSize: 11, fontWeight: '600', marginBottom: 8, color: COLORS.textSecondary },
  gaugeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  gaugeStat: { flex: 1, alignItems: 'center' },
  gaugeStatSub: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
  gaugeStatVal: { fontSize: 15, fontWeight: '800', marginTop: 2, color: COLORS.textPrimary },
  gaugeDivider: { width: 1, height: 24, backgroundColor: COLORS.glassBorder },
  telemetryRow: { flexDirection: 'row', gap: 10 },
  telemetryCard: { flex: 1, ...GLASS.card, borderRadius: 16, padding: 12, alignItems: 'center', gap: 4, ...SHADOWS.glass },
  telemetryVal: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  telemetryLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
  sectionCard: { ...GLASS.card, padding: 16, ...SHADOWS.glass },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, color: COLORS.textBright },
  arraysList: { gap: 10 },
  arrayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  arrayInfo: { flex: 1, gap: 2 },
  arrayName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  arraySub: { fontSize: 11, color: COLORS.textSecondary },
  arrayOutputCol: { alignItems: 'flex-end', gap: 4 },
  arrayOutput: { fontSize: 15, fontWeight: '800', color: COLORS.amberLight },
  statusTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusTagText: { fontSize: 9, fontWeight: '800' },
});
