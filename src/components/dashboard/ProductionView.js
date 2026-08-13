import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, SHADOWS } from '../../theme/colors';
import Svg, { Rect, Path, Line, Text as SvgText, Circle } from 'react-native-svg';
import { Sun, ShieldAlert, Cpu, Gauge, Compass, Thermometer, Sparkles } from 'lucide-react-native';

export const ProductionView = () => {
  const { isDarkMode, metrics } = useEnergy();

  const themeColors = isDarkMode
    ? { bg: '#0F172A', card: '#1E293B', border: '#334155', text: '#F8FAFC', textSub: '#94A3B8' }
    : { bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', textSub: '#64748B' };

  const arraysData = [
    { name: 'Roof North Array (12 Panels)', capacity: '4.8 kW', current: `${(metrics.instantProduction * 0.52).toFixed(1)} kW`, eff: '98%', status: 'Optimal' },
    { name: 'Roof South Array (10 Panels)', capacity: '4.0 kW', current: `${(metrics.instantProduction * 0.41).toFixed(1)} kW`, eff: '96%', status: 'Optimal' },
    { name: 'Carport Solar Canopy (4 Panels)', capacity: '1.2 kW', current: `${(metrics.instantProduction * 0.07).toFixed(1)} kW`, eff: '85%', status: 'Partial Shade' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.bg }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={[styles.storyBadgeTitle, { color: themeColors.text }]}>Solar Power Generation</Text>
      </View>

      {/* Main Gauge Banner */}
      <View style={[styles.heroGaugeCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.heroGaugeHeader}>
          <View style={styles.iconCircle}>
            <Sun size={28} color="#F59E0B" />
          </View>
          <View>
            <Text style={[styles.gaugeLabel, { color: themeColors.textSub }]}>Live Instant Generation</Text>
            <Text style={[styles.gaugeValue, { color: COLORS.secondary }]}>
              {metrics.instantProduction} <Text style={styles.gaugeUnit}>kW</Text>
            </Text>
          </View>
        </View>

        {/* Hourly Solar Generation Bar Curve SVG */}
        <View style={styles.chartBox}>
          <Text style={[styles.chartBoxTitle, { color: themeColors.textSub }]}>Today's Generation Curve (06:00 - 18:00)</Text>
          <Svg height="120" width="100%" viewBox="0 0 300 120">
            {/* Grid lines */}
            <Line x1="0" y1="30" x2="300" y2="30" stroke="rgba(148, 163, 184, 0.15)" strokeDasharray="3 3" />
            <Line x1="0" y1="70" x2="300" y2="70" stroke="rgba(148, 163, 184, 0.15)" strokeDasharray="3 3" />

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
                  fill={i === 3 ? '#F59E0B' : 'rgba(245, 158, 11, 0.5)'}
                />
                <SvgText x={25 + i * 40} y="115" fill="#94A3B8" fontSize="9" textAnchor="middle">{bar.time}</SvgText>
              </React.Fragment>
            ))}
          </Svg>
        </View>

        <View style={styles.gaugeFooter}>
          <View style={styles.gaugeStat}>
            <Text style={[styles.gaugeStatSub, { color: themeColors.textSub }]}>Daily Total</Text>
            <Text style={[styles.gaugeStatVal, { color: themeColors.text }]}>{metrics.dailyProduction} kWh</Text>
          </View>
          <View style={styles.gaugeDivider} />
          <View style={styles.gaugeStat}>
            <Text style={[styles.gaugeStatSub, { color: themeColors.textSub }]}>Peak Today</Text>
            <Text style={[styles.gaugeStatVal, { color: COLORS.secondary }]}>8.8 kW</Text>
          </View>
          <View style={styles.gaugeDivider} />
          <View style={styles.gaugeStat}>
            <Text style={[styles.gaugeStatSub, { color: themeColors.textSub }]}>Capacity Used</Text>
            <Text style={[styles.gaugeStatVal, { color: COLORS.primary }]}>84%</Text>
          </View>
        </View>
      </View>

      {/* Solar Telemetry Widgets */}
      <View style={styles.telemetryRow}>
        <View style={[styles.telemetryCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Compass size={18} color="#06B6D4" />
          <Text style={[styles.telemetryVal, { color: themeColors.text }]}>980 W/m²</Text>
          <Text style={[styles.telemetryLabel, { color: themeColors.textSub }]}>Solar Irradiance</Text>
        </View>

        <View style={[styles.telemetryCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Thermometer size={18} color="#F97316" />
          <Text style={[styles.telemetryVal, { color: themeColors.text }]}>34 °C</Text>
          <Text style={[styles.telemetryLabel, { color: themeColors.textSub }]}>Panel Temp</Text>
        </View>

        <View style={[styles.telemetryCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Cpu size={18} color="#10B981" />
          <Text style={[styles.telemetryVal, { color: themeColors.text }]}>97.8%</Text>
          <Text style={[styles.telemetryLabel, { color: themeColors.textSub }]}>Inverter Efficiency</Text>
        </View>
      </View>

      {/* Solar Panel Group Breakdown List */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Solar Array Breakdown</Text>
        
        <View style={styles.arraysList}>
          {arraysData.map((arr, index) => (
            <View key={index} style={[styles.arrayRow, { borderBottomColor: themeColors.border }]}>
              <View style={styles.arrayInfo}>
                <Text style={[styles.arrayName, { color: themeColors.text }]}>{arr.name}</Text>
                <Text style={[styles.arraySub, { color: themeColors.textSub }]}>Rated Cap: {arr.capacity} • Efficiency: {arr.eff}</Text>
              </View>
              <View style={styles.arrayOutputCol}>
                <Text style={[styles.arrayOutput, { color: COLORS.secondary }]}>{arr.current}</Text>
                <View style={[styles.statusTag, { backgroundColor: arr.status === 'Optimal' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)' }]}>
                  <Text style={[styles.statusTagText, { color: arr.status === 'Optimal' ? '#10B981' : '#F97316' }]}>{arr.status}</Text>
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
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  storyBadgeHeader: { gap: 2 },
  storyBadgeTag: { fontSize: 10, fontWeight: '800', color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  storyBadgeTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  heroGaugeCard: { borderRadius: 20, padding: 18, borderWidth: 1, ...SHADOWS.medium },
  heroGaugeHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(245, 158, 11, 0.15)', alignItems: 'center', justifyContent: 'center' },
  gaugeLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  gaugeValue: { fontSize: 32, fontWeight: '800' },
  gaugeUnit: { fontSize: 18, fontWeight: '600' },
  chartBox: { marginTop: 16, marginBottom: 12 },
  chartBoxTitle: { fontSize: 11, fontWeight: '600', marginBottom: 8 },
  gaugeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(148, 163, 184, 0.15)' },
  gaugeStat: { flex: 1, alignItems: 'center' },
  gaugeStatSub: { fontSize: 10, fontWeight: '600' },
  gaugeStatVal: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  gaugeDivider: { width: 1, height: 24, backgroundColor: 'rgba(148, 163, 184, 0.2)' },
  telemetryRow: { flexDirection: 'row', gap: 10 },
  telemetryCard: { flex: 1, borderRadius: 14, padding: 12, borderWidth: 1, alignItems: 'center', gap: 4 },
  telemetryVal: { fontSize: 14, fontWeight: '800' },
  telemetryLabel: { fontSize: 10, fontWeight: '600' },
  sectionCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  arraysList: { gap: 10 },
  arrayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  arrayInfo: { gap: 2 },
  arrayName: { fontSize: 13, fontWeight: '700' },
  arraySub: { fontSize: 11 },
  arrayOutputCol: { alignItems: 'flex-end', gap: 4 },
  arrayOutput: { fontSize: 15, fontWeight: '800' },
  statusTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusTagText: { fontSize: 9, fontWeight: '800' },
});
