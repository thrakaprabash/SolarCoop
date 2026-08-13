import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import Svg, { Path, Circle, Line, Rect, Text as SvgText, G } from 'react-native-svg';
import { Activity } from 'lucide-react-native';

export const ChartsView = () => {
  const { chartData } = useEnergy();
  const [timeRange, setTimeRange] = useState('24h'); // '24h' | '7d' | '30d' | '1y'
  const [selectedIndex, setSelectedIndex] = useState(3); // Default point selected (12:00)

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={styles.storyBadgeTitle}>Interactive Energy Charts</Text>
      </View>

      {/* Time range selector bar */}
      <View style={styles.timeRangeContainer}>
        {['24h', '7d', '30d', '1y'].map(range => (
          <TouchableOpacity
            key={range}
            style={[
              styles.rangeTab,
              timeRange === range ? styles.rangeTabActive : styles.rangeTabInactive,
            ]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[
              styles.rangeTabText,
              timeRange === range && styles.rangeTabTextActive,
            ]}>
              {range.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Dual Line Chart: Solar Production vs Household Consumption */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeaderRow}>
          <View>
            <Text style={styles.chartTitle}>Generation vs. Consumption</Text>
            <Text style={styles.chartSub}>Tap points on chart to inspect hourly power balance</Text>
          </View>
          <Activity size={20} color={COLORS.amber} />
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.amber }]} />
            <Text style={styles.legendText}>Solar Production (kW)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.teal }]} />
            <Text style={styles.legendText}>Household Consumption (kW)</Text>
          </View>
        </View>

        {/* Interactive SVG Chart */}
        <View style={styles.svgContainer}>
          <Svg height={height} width="100%" viewBox={`0 0 ${width} ${height}`}>
            {/* Horizontal Grid lines */}
            {[0, 2.5, 5.0, 7.5, 10.0].map((v, idx) => (
              <React.Fragment key={idx}>
                <Line x1={padding} y1={getY(v)} x2={width - padding} y2={getY(v)} stroke={COLORS.glassBorder} strokeDasharray="3 3" />
                <SvgText x={padding - 6} y={getY(v) + 3} fill={COLORS.textMuted} fontSize="8" textAnchor="end">{v}</SvgText>
              </React.Fragment>
            ))}

            {/* Solar Production Line */}
            <Path d={prodPath} fill="none" stroke={COLORS.amber} strokeWidth="3" />
            {/* Household Load Line */}
            <Path d={consPath} fill="none" stroke={COLORS.teal} strokeWidth="3" />

            {/* Interactive Points */}
            {chartData.hours.map((h, i) => (
              <G key={i}>
                <Circle 
                  cx={getX(i)} 
                  cy={getY(chartData.production[i])} 
                  r={selectedIndex === i ? 6 : 4} 
                  fill={COLORS.amber} 
                  stroke={COLORS.textBright} 
                  strokeWidth={1.5}
                  onPress={() => setSelectedIndex(i)}
                />
                <Circle 
                  cx={getX(i)} 
                  cy={getY(chartData.consumption[i])} 
                  r={selectedIndex === i ? 6 : 4} 
                  fill={COLORS.teal} 
                  stroke={COLORS.textBright} 
                  strokeWidth={1.5}
                  onPress={() => setSelectedIndex(i)}
                />
                <SvgText 
                  x={getX(i)} 
                  y={height - 6} 
                  fill={COLORS.textMuted} 
                  fontSize={8} 
                  textAnchor="middle"
                  onPress={() => setSelectedIndex(i)}
                >
                  {h}
                </SvgText>
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
              <Text style={[styles.inspectionVal, { color: COLORS.amber }]}>{selectedProd} kW</Text>
            </View>
            <View style={styles.inspectionCol}>
              <Text style={styles.inspectionLabel}>Consumption</Text>
              <Text style={[styles.inspectionVal, { color: COLORS.teal }]}>{selectedCons} kW</Text>
            </View>
            <View style={styles.inspectionCol}>
              <Text style={styles.inspectionLabel}>Net Delta</Text>
              <Text style={[styles.inspectionVal, { color: selectedProd >= selectedCons ? COLORS.tealLight : COLORS.red }]}>
                {(selectedProd - selectedCons).toFixed(1)} kW
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Chart 2: Hourly Surplus vs Deficit Delta Bar Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Hourly Net Energy Delta (Surplus / Deficit)</Text>
        
        <Svg height="130" width="100%" viewBox="0 0 300 130">
          <Line x1="0" y1="65" x2="300" y2="65" stroke={COLORS.glassBorderLight} strokeWidth="1" />
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
                  fill={isPos ? COLORS.teal : COLORS.red}
                />
                <SvgText x={24 + i * 36} y="125" fill={COLORS.textMuted} fontSize="8" textAnchor="middle">{h}</SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 16 },
  storyBadgeHeader: { gap: 2 },
  storyBadgeTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: COLORS.textBright },
  timeRangeContainer: { flexDirection: 'row', gap: 8 },
  rangeTab: { flex: 1, paddingVertical: 8, borderRadius: 50, alignItems: 'center' },
  rangeTabInactive: { ...GLASS.pill },
  rangeTabActive: { backgroundColor: COLORS.amber, borderWidth: 1, borderColor: COLORS.amberDark, borderRadius: 50 },
  rangeTabText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  rangeTabTextActive: { color: COLORS.textBright, fontWeight: '800' },
  chartCard: { ...GLASS.card, padding: 16, ...SHADOWS.glass, gap: 12 },
  chartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textBright },
  chartSub: { fontSize: 11, color: COLORS.textMuted },
  legendRow: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textSecondary },
  svgContainer: { marginVertical: 4 },
  inspectionBanner: { backgroundColor: COLORS.glassBg, padding: 12, borderRadius: 16, gap: 8, borderWidth: 1, borderColor: COLORS.glassBorder },
  inspectionTime: { fontSize: 12, fontWeight: '800', color: COLORS.amberLight },
  inspectionGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  inspectionCol: { alignItems: 'center' },
  inspectionLabel: { fontSize: 10, color: COLORS.textMuted },
  inspectionVal: { fontSize: 14, fontWeight: '800', marginTop: 2 },
});
