import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { 
  Sun, 
  Zap, 
  Battery, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Info,
  Leaf,
  Globe,
  Activity,
  Maximize2,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Users,
  Coins,
  CheckCircle2,
} from 'lucide-react-native';

// ─── Sub-component: SVG Arc Progress Ring (Issue #2) ───
const ProgressRing = ({ progress, size = 64, strokeWidth = 4, color, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const offset = circumference * (1 - clampedProgress / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Background track */}
        <SvgCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress arc */}
        <SvgCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
};

// ─── Main Dashboard Component ───
export const HomeDashboard = () => {
  const { metrics, setActiveTab, executeShareEnergy, executeBorrowEnergy } = useEnergy();
  const [powerEnergyToggle, setPowerEnergyToggle] = useState('power');
  const [actionSuccess, setActionSuccess] = useState(null); // null | 'share' | 'borrow'

  // ── Issue #1: Pulsing live indicator animation ──
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  // ── Issue #5: Derived net output (replaces hardcoded 2.92) ──
  const netOutput = metrics.instantProduction - metrics.instantConsumption;
  const isSurplus = netOutput > 0;

  // ── Issue #3: Quick action handlers with inline success feedback ──
  const handleShare = () => {
    executeShareEnergy(2.5, 'House #04');
    setActionSuccess('share');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleBorrow = () => {
    executeBorrowEnergy(1.5);
    setActionSuccess('borrow');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // ── Issue #4: Toggle-aware metric values ──
  const sitePowerValue = powerEnergyToggle === 'power'
    ? metrics.instantConsumption
    : metrics.dailyConsumption;
  const sitePowerUnit = powerEnergyToggle === 'power' ? 'kW' : 'kWh';
  const solarLegendVal = powerEnergyToggle === 'power'
    ? metrics.instantProduction.toFixed(2)
    : metrics.dailyProduction.toFixed(1);
  const coopLegendVal = powerEnergyToggle === 'power'
    ? (metrics.instantConsumption * 0.5).toFixed(2)
    : (metrics.dailyConsumption * 0.5).toFixed(1);

  // ── Issue #2: Environmental gauge progress percentages ──
  const co2DailyTarget = 50; // daily kg CO₂ goal
  const co2Progress = Math.min(100, (metrics.co2SavedKg / co2DailyTarget) * 100);
  const sunshineProgress = 98;
  const gridFreeProgress = metrics.gridIndependence;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* ═══ Title Header with Live Pulse (Issue #1) ═══ */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.titleRow}>
            <Animated.View style={[styles.livePulseDot, { opacity: pulseAnim }]} />
            <Text style={styles.title}>Current Power</Text>
          </View>
          <Text style={styles.lastUpdate}>Live • Updated just now</Text>
        </View>
        <TouchableOpacity style={styles.iconExpand}>
          <Maximize2 size={14} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ═══ 2×2 Power Grid with Navigation Chevrons (Issues #5, #7) ═══ */}
      <View style={[GLASS.card, styles.powerGridCard]}>
        <View style={styles.gridRow}>
          {/* Solar — tappable, navigates to Production */}
          <TouchableOpacity 
            style={styles.gridCell}
            onPress={() => setActiveTab('production')}
            activeOpacity={0.7}
          >
            <View style={styles.cellIconRow}>
              <Sun size={16} color={COLORS.amberLight} />
              <Text style={styles.cellLabel}>Solar</Text>
              <View style={{ flex: 1 }} />
              <ChevronRight size={12} color={COLORS.textMuted} />
            </View>
            <Text style={styles.cellValue}>
              {metrics.instantProduction} <Text style={styles.cellUnit}>kW</Text>
            </Text>
            <View style={styles.cellTrend}>
              <TrendingUp size={10} color={COLORS.tealLight} />
              <Text style={[styles.cellTrendText, { color: COLORS.tealLight }]}>+12%</Text>
            </View>
          </TouchableOpacity>

          {/* Grid — tappable, navigates to Deficit */}
          <TouchableOpacity 
            style={styles.gridCell}
            onPress={() => setActiveTab('deficit')}
            activeOpacity={0.7}
          >
            <View style={styles.cellIconRow}>
              <Globe size={16} color={COLORS.textSecondary} />
              <Text style={styles.cellLabel}>Grid</Text>
              <View style={{ flex: 1 }} />
              <ChevronRight size={12} color={COLORS.textMuted} />
            </View>
            <Text style={styles.cellValue}>
              0.00 <Text style={styles.cellUnit}>kW</Text>
            </Text>
            <View style={styles.cellTrend}>
              <Activity size={10} color={COLORS.textMuted} />
              <Text style={styles.cellTrendText}>Offline</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          {/* Output — highlighted, NOT tappable (no chevron) — dynamic surplus/deficit */}
          <View style={[
            styles.gridCell,
            isSurplus ? styles.gridCellHighlightSurplus : styles.gridCellHighlightDeficit,
          ]}>
            <View style={styles.cellIconRow}>
              <Zap size={16} color={isSurplus ? COLORS.amber : COLORS.red} />
              <Text style={[styles.cellLabel, { color: isSurplus ? COLORS.amberLight : COLORS.red }]}>
                {isSurplus ? 'Net Output' : 'Net Draw'}
              </Text>
            </View>
            <Text style={[styles.cellValue, { color: COLORS.textBright }]}>
              {Math.abs(netOutput).toFixed(2)}{' '}
              <Text style={[styles.cellUnit, { color: isSurplus ? COLORS.amberLight : COLORS.red }]}>kW</Text>
            </Text>
            <View style={styles.cellTrend}>
              {isSurplus
                ? <TrendingUp size={10} color={COLORS.tealLight} />
                : <TrendingDown size={10} color={COLORS.red} />
              }
              <Text style={[styles.cellTrendText, { color: isSurplus ? COLORS.tealLight : COLORS.red }]}>
                {isSurplus ? 'Exporting' : 'Importing'}
              </Text>
            </View>
          </View>

          {/* Battery — tappable, navigates to Surplus */}
          <TouchableOpacity 
            style={styles.gridCell}
            onPress={() => setActiveTab('surplus')}
            activeOpacity={0.7}
          >
            <View style={styles.cellIconRow}>
              <Battery size={16} color={COLORS.tealLight} />
              <Text style={styles.cellLabel}>Battery</Text>
              <View style={{ flex: 1 }} />
              <ChevronRight size={12} color={COLORS.textMuted} />
            </View>
            <Text style={styles.cellValue}>
              {(metrics.instantConsumption * 0.1).toFixed(2)} <Text style={styles.cellUnit}>kW</Text>
            </Text>
            <View style={styles.cellTrend}>
              <TrendingUp size={10} color={COLORS.tealLight} />
              <Text style={[styles.cellTrendText, { color: COLORS.tealLight }]}>{metrics.batteryLevel}%</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ═══ Environmental Benefits with SVG Progress Rings (Issue #2) ═══ */}
      <View style={[GLASS.card, styles.sectionCard]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Environmental Benefits</Text>
          <Info size={14} color={COLORS.textMuted} />
        </View>

        <View style={styles.benefitsRow}>
          {/* CO₂ Saved */}
          <View style={styles.benefitCol}>
            <ProgressRing progress={co2Progress} size={64} strokeWidth={4} color={COLORS.tealLight}>
              <Leaf size={11} color={COLORS.tealLight} style={{ position: 'absolute', top: 8 }} />
              <Text style={styles.gaugeNum}>{metrics.co2SavedKg.toFixed(0)}</Text>
            </ProgressRing>
            <Text style={styles.benefitLabel}>CO₂ Saved</Text>
            <Text style={styles.benefitUnit}>kg</Text>
            <View style={styles.benefitDelta}>
              <TrendingUp size={8} color={COLORS.tealLight} />
              <Text style={styles.benefitDeltaText}>+12% vs avg</Text>
            </View>
          </View>

          {/* Sunshine % */}
          <View style={styles.benefitCol}>
            <ProgressRing progress={sunshineProgress} size={64} strokeWidth={4} color={COLORS.amber}>
              <Sun size={11} color={COLORS.amber} style={{ position: 'absolute', top: 8 }} />
              <Text style={styles.gaugeNum}>98</Text>
            </ProgressRing>
            <Text style={styles.benefitLabel}>Sunshine</Text>
            <Text style={styles.benefitUnit}>%</Text>
            <View style={styles.benefitDelta}>
              <TrendingUp size={8} color={COLORS.amberLight} />
              <Text style={[styles.benefitDeltaText, { color: COLORS.amberLight }]}>Peak day</Text>
            </View>
          </View>

          {/* Grid Independence */}
          <View style={styles.benefitCol}>
            <ProgressRing progress={gridFreeProgress} size={64} strokeWidth={4} color={COLORS.amberLight}>
              <Globe size={11} color={COLORS.amberLight} style={{ position: 'absolute', top: 8 }} />
              <Text style={styles.gaugeNum}>{metrics.gridIndependence}</Text>
            </ProgressRing>
            <Text style={styles.benefitLabel}>Grid Free</Text>
            <Text style={styles.benefitUnit}>%</Text>
            <View style={styles.benefitDelta}>
              <TrendingUp size={8} color={COLORS.tealLight} />
              <Text style={styles.benefitDeltaText}>+3% this week</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ═══ Site Power & Consumption with Functional Toggle (Issues #1, #4) ═══ */}
      <View style={[GLASS.card, styles.sectionCard]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {powerEnergyToggle === 'power' ? 'Site Power' : 'Site Energy'}
          </Text>
          <View style={styles.togglePillContainer}>
            <TouchableOpacity
              style={[styles.togglePillBtn, powerEnergyToggle === 'power' && styles.togglePillBtnActive]}
              onPress={() => setPowerEnergyToggle('power')}
            >
              <Text style={[styles.togglePillText, powerEnergyToggle === 'power' && styles.togglePillTextActive]}>
                Power
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.togglePillBtn, powerEnergyToggle === 'energy' && styles.togglePillBtnActive]}
              onPress={() => setPowerEnergyToggle('energy')}
            >
              <Text style={[styles.togglePillText, powerEnergyToggle === 'energy' && styles.togglePillTextActive]}>
                Energy
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.consumptionMetricRow}>
          <Text style={styles.consValue}>
            {sitePowerValue} <Text style={styles.consUnit}>{sitePowerUnit}</Text>
          </Text>
          <View style={styles.consDotsRow}>
            <View style={styles.dotLegend}>
              <View style={[styles.dot, { backgroundColor: COLORS.amber }]} />
              <Text style={styles.dotText}>Solar {solarLegendVal}</Text>
            </View>
            <View style={styles.dotLegend}>
              <View style={[styles.dot, { backgroundColor: COLORS.tealLight }]} />
              <Text style={styles.dotText}>Co-op {coopLegendVal}</Text>
            </View>
          </View>
        </View>

        {/* Energy Flow Diagram — replaces random bubbles (Issue #1) */}
        <View style={styles.energyFlowContainer}>
          {/* Solar Source */}
          <View style={styles.flowNode}>
            <View style={[styles.flowNodeIcon, { backgroundColor: COLORS.amberGlow }]}>
              <Sun size={13} color={COLORS.amber} />
            </View>
            <Text style={styles.flowNodeLabel}>Solar</Text>
          </View>

          {/* Arrow: Solar → Home */}
          <View style={styles.flowArrowContainer}>
            <View style={[styles.flowLine, { backgroundColor: COLORS.amber }]} />
            <View style={[styles.flowArrowHead, { borderLeftColor: COLORS.amber }]} />
          </View>

          {/* Home Load */}
          <View style={styles.flowNode}>
            <View style={[styles.flowNodeIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Zap size={13} color={COLORS.amberLight} />
            </View>
            <Text style={styles.flowNodeLabel}>Home</Text>
          </View>

          {/* Arrow: Home → Battery (color changes based on surplus/deficit) */}
          <View style={styles.flowArrowContainer}>
            <View style={[styles.flowLine, { backgroundColor: isSurplus ? COLORS.tealLight : COLORS.red }]} />
            <View style={[styles.flowArrowHead, { borderLeftColor: isSurplus ? COLORS.tealLight : COLORS.red }]} />
          </View>

          {/* Battery Storage */}
          <View style={styles.flowNode}>
            <View style={[styles.flowNodeIcon, { backgroundColor: COLORS.tealGlow }]}>
              <Battery size={13} color={COLORS.tealLight} />
            </View>
            <Text style={styles.flowNodeLabel}>Battery</Text>
          </View>
        </View>
      </View>

      {/* ═══ Co-op Community Activity Strip (Issue #6) ═══ */}
      <View style={[GLASS.card, styles.coopStrip]}>
        <View style={styles.coopStripItem}>
          <Users size={14} color={COLORS.tealLight} />
          <Text style={styles.coopStripValue}>{metrics.coopMembersOnline}</Text>
          <Text style={styles.coopStripLabel}>Online</Text>
        </View>
        <View style={styles.coopDivider} />
        <View style={styles.coopStripItem}>
          <Zap size={14} color={COLORS.amber} />
          <Text style={styles.coopStripValue}>{metrics.coopTotalCapacity}</Text>
          <Text style={styles.coopStripLabel}>kW Pool</Text>
        </View>
        <View style={styles.coopDivider} />
        <View style={styles.coopStripItem}>
          <Coins size={14} color={COLORS.amberLight} />
          <Text style={styles.coopStripValue}>{metrics.coopTokensEarned}</Text>
          <Text style={styles.coopStripLabel}>Tokens</Text>
        </View>
      </View>

      {/* ═══ Inline Success Toast (Issue #3) ═══ */}
      {actionSuccess && (
        <View style={styles.successToast}>
          <CheckCircle2 size={16} color={COLORS.tealLight} />
          <Text style={styles.successToastText}>
            {actionSuccess === 'share'
              ? 'Successfully shared 2.5 kWh with House #04!'
              : 'Successfully borrowed 1.5 kWh from Co-op Pool!'}
          </Text>
        </View>
      )}

      {/* ═══ Quick Actions — Visual Hierarchy (Issue #3) ═══ */}
      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={styles.actionBtnPrimary}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <ArrowUpRight size={16} color="#FFFFFF" />
          <Text style={styles.actionBtnPrimaryText}>Share Surplus</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtnSecondary}
          onPress={handleBorrow}
          activeOpacity={0.8}
        >
          <ArrowDownLeft size={16} color={COLORS.textPrimary} />
          <Text style={styles.actionBtnSecondaryText}>Request Draw</Text>
        </TouchableOpacity>
      </View>

      {/* Spacer */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

// ─── Styles ───
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 14 },

  // ── Header ──
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.tealLight,
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textBright, letterSpacing: -0.3 },
  lastUpdate: { fontSize: 11, marginTop: 2, color: COLORS.textMuted, marginLeft: 16 },
  iconExpand: { 
    width: 32, height: 32, borderRadius: 16, 
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // ── Power Grid ──
  powerGridCard: { padding: 10, gap: 8 },
  gridRow: { flexDirection: 'row', gap: 8 },
  gridCell: { 
    flex: 1, 
    borderRadius: 18, 
    padding: 14, 
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  gridCellHighlightSurplus: { 
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  gridCellHighlightDeficit: { 
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  cellIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cellLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  cellValue: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  cellUnit: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  cellTrend: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  cellTrendText: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted },

  // ── Section Cards ──
  sectionCard: { padding: 16, gap: 14 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textBright },

  // ── Environmental Benefits (Issue #2) ──
  benefitsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 4 },
  benefitCol: { alignItems: 'center', gap: 4 },
  gaugeNum: { fontSize: 16, fontWeight: '800', color: COLORS.textBright, marginTop: 4 },
  benefitLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },
  benefitUnit: { fontSize: 9, fontWeight: '500', color: COLORS.textMuted },
  benefitDelta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  benefitDeltaText: { fontSize: 8, fontWeight: '700', color: COLORS.tealLight },

  // ── Toggle Pill ──
  togglePillContainer: { 
    flexDirection: 'row', borderRadius: 18, padding: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  togglePillBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14 },
  togglePillBtnActive: { backgroundColor: 'rgba(245, 158, 11, 0.3)' },
  togglePillText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  togglePillTextActive: { color: COLORS.amberLight, fontWeight: '700' },

  // ── Consumption Metrics ──
  consumptionMetricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  consValue: { fontSize: 24, fontWeight: '800', color: COLORS.textBright },
  consUnit: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  consDotsRow: { gap: 4 },
  dotLegend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotText: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary },

  // ── Energy Flow Diagram (Issue #1 — replaces random bubbles) ──
  energyFlowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  flowNode: {
    alignItems: 'center',
    gap: 4,
  },
  flowNodeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowNodeLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  flowArrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,   // vertically centers on the 34px node circles
    marginHorizontal: 6,
  },
  flowLine: {
    width: 26,
    height: 2,
    borderRadius: 1,
  },
  flowArrowHead: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    // borderLeftColor is set dynamically via inline style
  },

  // ── Co-op Community Strip (Issue #6) ──
  coopStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  coopStripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coopStripValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textBright,
  },
  coopStripLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  coopDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.glassBorder,
  },

  // ── Success Toast (Issue #3) ──
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
    padding: 12,
    borderRadius: 16,
  },
  successToastText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.tealLight,
  },

  // ── Quick Actions (Issue #3 — visual hierarchy) ──
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtnPrimary: { 
    flex: 1, 
    backgroundColor: COLORS.amber,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 8, paddingVertical: 14, borderRadius: 18,
    ...SHADOWS.glow,
  },
  actionBtnPrimaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  actionBtnSecondary: { 
    flex: 1, 
    ...GLASS.card,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 8, paddingVertical: 14,
  },
  actionBtnSecondaryText: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
});
