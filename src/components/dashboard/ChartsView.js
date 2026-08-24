import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import Svg, { Path, Circle, Line, Rect, Text as SvgText, G } from 'react-native-svg';
import { Activity } from 'lucide-react-native';

// Range config: maps display label → DB range key
const RANGES = [
  { label: 'Day',   key: 'day'   },
  { label: 'Week',  key: 'week'  },
  { label: 'Month', key: 'month' },
];

// SOL-102: Charts View Component
export const ChartsView = () => {
  const { chartData, loadChartData } = useEnergy();
  const [activeRange, setActiveRange] = useState('day');
  const [selectedIndex, setSelectedIndex] = useState(3); // Default point selected

  const handleRangeChange = (key) => {
    setActiveRange(key);
    setSelectedIndex(0);
    loadChartData(key);
  };

  // Safe data extraction
  const hours = chartData?.hours || [];
  const prod = chartData?.production || [];
  const cons = chartData?.consumption || [];

  // Dimensions
  const width = 320;
  const height = 160;
  const padding = 25;

  // Dynamic max value for Y-axis scaling (defaults to minimum 10)
  const maxVal = Math.max(
    10,
    ...prod.map(v => Number(v) || 0),
    ...cons.map(v => Number(v) || 0)
  );

  const getX = (i) => {
    if (hours.length <= 1) return width / 2;
    return padding + (i * (width - 2 * padding)) / (hours.length - 1);
  };

  const getY = (val) => {
    const num = Math.max(0, Number(val) || 0);
    return height - padding - (num * (height - 2 * padding)) / maxVal;
  };

  const buildPath = (data = []) => {
    if (!data || data.length === 0) return '';
    return data.reduce((acc, val, i) => {
      const x = getX(i);
      const y = getY(val);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  const prodPath = buildPath(prod);
  const consPath = buildPath(cons);

  // Guard: clamp selectedIndex to valid range after data changes
  const safeIndex = hours.length > 0 ? Math.min(Math.max(0, selectedIndex), hours.length - 1) : 0;
  const selectedHour = hours[safeIndex] || '—';
  const selectedProd = Number(prod[safeIndex] || 0);
  const selectedCons = Number(cons[safeIndex] || 0);

  // Grid steps (0%, 25%, 50%, 75%, 100% of maxVal)
  const gridSteps = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

  // Delta chart calculations
  const deltas = hours.map((_, i) => (Number(prod[i]) || 0) - (Number(cons[i]) || 0));
  const maxDelta = Math.max(1, ...deltas.map(Math.abs));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={styles.storyBadgeTitle}>Interactive Energy Charts</Text>
      </View>

      {/* Time range selector bar */}
      <View style={styles.timeRangeContainer}>
        {RANGES.map(({ label, key }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.rangeTab,
              activeRange === key ? styles.rangeTabActive : styles.rangeTabInactive,
            ]}
            onPress={() => handleRangeChange(key)}
          >
            <Text style={[
              styles.rangeTabText,
              activeRange === key && styles.rangeTabTextActive,
            ]}>
              {label.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Dual Line Chart: Solar Production vs Household Consumption */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeaderRow}>
          <View>
            <Text style={styles.chartTitle}>Generation vs. Consumption</Text>
            <Text style={styles.chartSub}>Tap points on chart to inspect power balance</Text>
          </View>
          <Activity size={20} color={COLORS.amber} />
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.amber }]} />
            <Text style={styles.legendText}>Solar Production</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.teal }]} />
            <Text style={styles.legendText}>Household Consumption</Text>
          </View>
        </View>

        {/* Interactive SVG Chart */}
        <View style={styles.svgContainer}>
          <Svg height={height} width="100%" viewBox={`0 0 ${width} ${height}`}>
            {/* Horizontal Grid lines */}
            {gridSteps.map((v, idx) => {
              const yPos = getY(v);
              return (
                <React.Fragment key={idx}>
                  <Line x1={padding} y1={yPos} x2={width - padding} y2={yPos} stroke={COLORS.glassBorder} strokeDasharray="3 3" />
                  <SvgText x={padding - 6} y={yPos + 3} fill={COLORS.textMuted} fontSize="8" textAnchor="end">
                    {v >= 100 ? v.toFixed(0) : v.toFixed(v % 1 === 0 ? 0 : 1)}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {/* Solar Production Line */}
            {prodPath ? <Path d={prodPath} fill="none" stroke={COLORS.amber} strokeWidth="3" /> : null}
            {/* Household Load Line */}
            {consPath ? <Path d={consPath} fill="none" stroke={COLORS.teal} strokeWidth="3" /> : null}

            {/* Interactive Points */}
            {hours.map((h, i) => {
              const cx = getX(i);
              const cyProd = getY(prod[i]);
              const cyCons = getY(cons[i]);
              const isSelected = safeIndex === i;

              return (
                <G key={i}>
                  <Circle 
                    cx={cx} 
                    cy={cyProd} 
                    r={isSelected ? 6 : 4} 
                    fill={COLORS.amber} 
                    stroke={COLORS.textBright} 
                    strokeWidth={1.5}
                    onPress={() => setSelectedIndex(i)}
                  />
                  <Circle 
                    cx={cx} 
                    cy={cyCons} 
                    r={isSelected ? 6 : 4} 
                    fill={COLORS.teal} 
                    stroke={COLORS.textBright} 
                    strokeWidth={1.5}
                    onPress={() => setSelectedIndex(i)}
                  />
                  <SvgText 
                    x={cx} 
                    y={height - 6} 
                    fill={isSelected ? COLORS.amberLight : COLORS.textMuted} 
                    fontSize={8} 
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    textAnchor="middle"
                    onPress={() => setSelectedIndex(i)}
                  >
                    {h}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </View>

        {/* Point Inspection Details Banner */}
        <View style={styles.inspectionBanner}>
          <Text style={styles.inspectionTime}>Inspection Window: {selectedHour}</Text>
          <View style={styles.inspectionGrid}>
            <View style={styles.inspectionCol}>
              <Text style={styles.inspectionLabel}>Production</Text>
              <Text style={[styles.inspectionVal, { color: COLORS.amber }]}>
                {selectedProd.toFixed(1)} {activeRange === 'day' ? 'kW' : 'kWh'}
              </Text>
            </View>
            <View style={styles.inspectionCol}>
              <Text style={styles.inspectionLabel}>Consumption</Text>
              <Text style={[styles.inspectionVal, { color: COLORS.teal }]}>
                {selectedCons.toFixed(1)} {activeRange === 'day' ? 'kW' : 'kWh'}
              </Text>
            </View>
            <View style={styles.inspectionCol}>
              <Text style={styles.inspectionLabel}>Net Delta</Text>
              <Text style={[styles.inspectionVal, { color: selectedProd >= selectedCons ? COLORS.tealLight : COLORS.red }]}>
                {(selectedProd - selectedCons >= 0 ? '+' : '') + (selectedProd - selectedCons).toFixed(1)} {activeRange === 'day' ? 'kW' : 'kWh'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Chart 2: Net Energy Delta (Surplus / Deficit) */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Net Energy Delta (Surplus / Deficit)</Text>
        
        <Svg height="130" width="100%" viewBox="0 0 300 130">
          <Line x1="10" y1="65" x2="290" y2="65" stroke={COLORS.glassBorderLight} strokeWidth="1" />
          {hours.map((h, i) => {
            const delta = deltas[i] || 0;
            const barH = Math.max(2, (Math.abs(delta) / maxDelta) * 45);
            const isPos = delta >= 0;
            const barWidth = Math.max(12, Math.min(22, (240 / Math.max(1, hours.length)) - 6));
            const barX = hours.length <= 1 ? 150 - barWidth / 2 : 25 + (i * (250 - barWidth)) / (hours.length - 1);

            return (
              <React.Fragment key={i}>
                <Rect
                  x={barX}
                  y={isPos ? 65 - barH : 65}
                  width={barWidth}
                  height={barH}
                  rx="3"
                  fill={isPos ? COLORS.teal : COLORS.red}
                />
                <SvgText x={barX + barWidth / 2} y="125" fill={COLORS.textMuted} fontSize="8" textAnchor="middle">{h}</SvgText>
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
