import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, SHADOWS } from '../../theme/colors';
import Svg, { Path, Circle, Line, Rect, Text as SvgText, G } from 'react-native-svg';
import { BarChart3, TrendingUp, Sun, Zap, PieChart, Activity } from 'lucide-react-native';

export const ChartsView = () => {
  const { isDarkMode, chartData } = useEnergy();
  const [timeRange, setTimeRange] = useState('24h'); // '24h' | '7d' | '30d' | '1y'
  const [selectedIndex, setSelectedIndex] = useState(3); // Default point selected (12:00)

  const themeColors = isDarkMode
    ? { bg: '#0F172A', card: '#1E293B', border: '#334155', text: '#F8FAFC', textSub: '#94A3B8' }
    : { bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', textSub: '#64748B' };

  // Calculate SVG line path points for Production & Consumption
  const width = 320;
  const height = 160;
  const padding = 25;

  const getX = (i) => padding + (i * (width - 2 * padding)) / (chartData.hours.length - 1);
  const getY = (val) => height - padding - (val * (height - 2 * padding)) / 10;

  const buildPath = (data) => {
    return data.reduce((acc, val, i) => {
      const x = getX(i);
      const y = getY(val);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  const prodPath = buildPath(chartData.production);
  const consPath = buildPath(chartData.consumption);

  const selectedHour = chartData.hours[selectedIndex];
  const selectedProd = chartData.production[selectedIndex];
  const selectedCons = chartData.consumption[selectedIndex];

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.bg }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={[styles.storyBadgeTitle, { color: themeColors.text }]}>Interactive Energy Charts</Text>
      </View>

      {/* Time range selector bar */}
      <View style={styles.timeRangeContainer}>
        {['24h', '7d', '30d', '1y'].map(range => (
          <TouchableOpacity
            key={range}
            style={[
              styles.rangeTab,
              timeRange === range && styles.rangeTabActive,
              { backgroundColor: timeRange === range ? COLORS.primary : themeColors.card, borderColor: themeColors.border }
            ]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[styles.rangeTabText, timeRange === range && { color: '#FFFFFF', fontWeight: '800' }]}>
              {range.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Dual Line Chart: Solar Production vs Household Consumption */}
      <View style={[styles.chartCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.chartHeaderRow}>
          <View>
            <Text style={[styles.chartTitle, { color: themeColors.text }]}>Generation vs. Consumption</Text>
            <Text style={[styles.chartSub, { color: themeColors.textSub }]}>Tap points on chart to inspect hourly power balance</Text>
          </View>
          <Activity size={20} color={COLORS.primary} />
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.legendText, { color: themeColors.textSub }]}>Solar Production (kW)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.legendText, { color: themeColors.textSub }]}>Household Consumption (kW)</Text>
          </View>
        </View>

        {/* Interactive SVG Chart */}
        <View style={styles.svgContainer}>
          <Svg height={height} width="100%" viewBox={`0 0 ${width} ${height}`}>
            {/* Horizontal Grid lines */}
            {[0, 2.5, 5.0, 7.5, 10.0].map((v, idx) => (
              <React.Fragment key={idx}>
                <Line x1={padding} y1={getY(v)} x2={width - padding} y2={getY(v)} stroke="rgba(148, 163, 184, 0.15)" strokeDasharray="3 3" />
                <SvgText x={padding - 6} y={getY(v) + 3} fill="#94A3B8" fontSize="8" textAnchor="end">{v}</SvgText>
              </React.Fragment>
            ))}

            {/* Solar Production Line */}
            <Path d={prodPath} fill="none" stroke="#F59E0B" strokeWidth="3" />
            {/* Household Load Line */}
            <Path d={consPath} fill="none" stroke="#10B981" strokeWidth="3" />

            {/* Interactive Points */}
            {chartData.hours.map((h, i) => (
              <G key={i} onPress={() => setSelectedIndex(i)}>
                <Circle cx={getX(i)} cy={getY(chartData.production[i])} r={selectedIndex === i ? "6" : "4"} fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
                <Circle cx={getX(i)} cy={getY(chartData.consumption[i])} r={selectedIndex === i ? "6" : "4"} fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                <SvgText x={getX(i)} y={height - 6} fill="#94A3B8" fontSize="8" textAnchor="middle">{h}</SvgText>
              </G>
            ))}
          </Svg>
        </View>

        {/* Point Inspection Details Banner */}
        <View style={styles.inspectionBanner}>
          <Text style={styles.inspectionTime}>Inspection Window: {selectedHour}</Text>
          <View style={styles.inspectionGrid}>
            <View style={styles.inspectionCol}>
              <Text style={styles.inspectionLabel}>Production</Text>
              <Text style={[styles.inspectionVal, { color: '#F59E0B' }]}>{selectedProd} kW</Text>
            </View>
            <View style={styles.inspectionCol}>
              <Text style={styles.inspectionLabel}>Consumption</Text>
              <Text style={[styles.inspectionVal, { color: '#10B981' }]}>{selectedCons} kW</Text>
            </View>
            <View style={styles.inspectionCol}>
              <Text style={styles.inspectionLabel}>Net Delta</Text>
              <Text style={[styles.inspectionVal, { color: selectedProd >= selectedCons ? '#06B6D4' : '#EF4444' }]}>
                {(selectedProd - selectedCons).toFixed(1)} kW
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Chart 2: Hourly Surplus vs Deficit Delta Bar Chart */}
      <View style={[styles.chartCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.chartTitle, { color: themeColors.text }]}>Hourly Net Energy Delta (Surplus / Deficit)</Text>
        
        <Svg height="130" width="100%" viewBox="0 0 300 130">
          <Line x1="0" y1="65" x2="300" y2="65" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="1" />
          {chartData.hours.map((h, i) => {
            const delta = chartData.production[i] - chartData.consumption[i];
            const barH = Math.abs(delta) * 10;
            const isPos = delta >= 0;
            return (
              <React.Fragment key={i}>
                <Rect
                  x={15 + i * 36}
                  y={isPos ? 65 - barH : 65}
                  width="18"
                  height={barH || 2}
                  rx="3"
                  fill={isPos ? '#06B6D4' : '#EF4444'}
                />
                <SvgText x={24 + i * 36} y="125" fill="#94A3B8" fontSize="8" textAnchor="middle">{h}</SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
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
  timeRangeContainer: { flexDirection: 'row', gap: 8 },
  rangeTab: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  rangeTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primaryDark },
  rangeTabText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  chartCard: { borderRadius: 20, padding: 16, borderWidth: 1, ...SHADOWS.medium, gap: 12 },
  chartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartTitle: { fontSize: 16, fontWeight: '800' },
  chartSub: { fontSize: 11 },
  legendRow: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11 },
  svgContainer: { marginVertical: 4 },
  inspectionBanner: { backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 12, borderRadius: 12, gap: 8 },
  inspectionTime: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  inspectionGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  inspectionCol: { alignItems: 'center' },
  inspectionLabel: { fontSize: 10, color: '#94A3B8' },
  inspectionVal: { fontSize: 14, fontWeight: '800', marginTop: 2 },
});
