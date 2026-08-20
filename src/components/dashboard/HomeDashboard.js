import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
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
  ShieldCheck,
} from 'lucide-react-native';

export const HomeDashboard = ({ onOpenAdmin }) => {
  const { metrics, setActiveTab, executeShareEnergy, executeBorrowEnergy } = useEnergy();
  const [powerEnergyToggle, setPowerEnergyToggle] = useState('power');

  const isSurplus = metrics.instantProduction > metrics.instantConsumption;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Title Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Current Power</Text>
          <Text style={styles.lastUpdate}>Last updated 2 mins ago</Text>
        </View>
        <TouchableOpacity style={styles.iconExpand}>
          <Maximize2 size={14} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* 2x2 Power Grid — Glass Cards */}
      <View style={[GLASS.card, styles.powerGridCard]}>
        <View style={styles.gridRow}>
          {/* Solar */}
          <TouchableOpacity 
            style={styles.gridCell}
            onPress={() => setActiveTab('production')}
            activeOpacity={0.7}
          >
            <View style={styles.cellIconRow}>
              <Sun size={16} color={COLORS.amberLight} />
              <Text style={styles.cellLabel}>Solar</Text>
            </View>
            <Text style={styles.cellValue}>
              {metrics.instantProduction} <Text style={styles.cellUnit}>kW</Text>
            </Text>
            <View style={styles.cellTrend}>
              <TrendingUp size={10} color={COLORS.tealLight} />
              <Text style={[styles.cellTrendText, { color: COLORS.tealLight }]}>+12%</Text>
            </View>
          </TouchableOpacity>

          {/* Grid */}
          <TouchableOpacity 
            style={styles.gridCell}
            onPress={() => setActiveTab('deficit')}
            activeOpacity={0.7}
          >
            <View style={styles.cellIconRow}>
              <Globe size={16} color={COLORS.textSecondary} />
              <Text style={styles.cellLabel}>Grid</Text>
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
          {/* Output — Highlighted Amber Cell */}
          <View style={[styles.gridCell, styles.gridCellHighlight]}>
            <View style={styles.cellIconRow}>
              <Zap size={16} color={COLORS.amber} />
              <Text style={[styles.cellLabel, { color: COLORS.amberLight }]}>Output</Text>
            </View>
            <Text style={[styles.cellValue, { color: COLORS.textBright }]}>
              {(metrics.instantProduction - 2.92).toFixed(2)} <Text style={[styles.cellUnit, { color: COLORS.amberLight }]}>kW</Text>
            </Text>
          </View>

          {/* Battery */}
          <TouchableOpacity 
            style={styles.gridCell}
            onPress={() => setActiveTab('surplus')}
            activeOpacity={0.7}
          >
            <View style={styles.cellIconRow}>
              <Battery size={16} color={COLORS.tealLight} />
              <Text style={styles.cellLabel}>Battery</Text>
            </View>
            <Text style={styles.cellValue}>
              {(metrics.instantConsumption * 0.1).toFixed(2)} <Text style={styles.cellUnit}>kW</Text>
            </Text>
            <View style={styles.cellTrend}>
              <TrendingUp size={10} color={COLORS.tealLight} />
              <Text style={[styles.cellTrendText, { color: COLORS.tealLight }]}>84%</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Environmental Benefits — Glass Card */}
      <View style={[GLASS.card, styles.sectionCard]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Environmental Benefits</Text>
          <Info size={14} color={COLORS.textMuted} />
        </View>

        <View style={styles.benefitsRow}>
          {/* CO2 */}
          <View style={styles.benefitCol}>
            <View style={[styles.gaugeCircle, { borderColor: COLORS.tealLight }]}>
              <Leaf size={12} color={COLORS.tealLight} style={{ position: 'absolute', top: 6 }} />
              <Text style={styles.gaugeNum}>{metrics.co2SavedKg.toFixed(0)}</Text>
            </View>
            <Text style={styles.benefitLabel}>CO₂ Saved</Text>
            <Text style={styles.benefitUnit}>kg</Text>
          </View>

          {/* Solar % */}
          <View style={styles.benefitCol}>
            <View style={[styles.gaugeCircle, { borderColor: COLORS.amber }]}>
              <Sun size={12} color={COLORS.amber} style={{ position: 'absolute', top: 6 }} />
              <Text style={styles.gaugeNum}>98</Text>
            </View>
            <Text style={styles.benefitLabel}>Sunshine</Text>
            <Text style={styles.benefitUnit}>%</Text>
          </View>

          {/* Grid Independence */}
          <View style={styles.benefitCol}>
            <View style={[styles.gaugeCircle, { borderColor: COLORS.amberLight }]}>
              <Globe size={12} color={COLORS.amberLight} style={{ position: 'absolute', top: 6 }} />
              <Text style={styles.gaugeNum}>{metrics.gridIndependence}</Text>
            </View>
            <Text style={styles.benefitLabel}>Grid Free</Text>
            <Text style={styles.benefitUnit}>%</Text>
          </View>
        </View>
      </View>

      {/* Site Power & Consumption — Glass Card */}
      <View style={[GLASS.card, styles.sectionCard]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Site Power</Text>
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
            {metrics.dailyConsumption} <Text style={styles.consUnit}>kWh</Text>
          </Text>
          <View style={styles.consDotsRow}>
            <View style={styles.dotLegend}>
              <View style={[styles.dot, { backgroundColor: COLORS.amber }]} />
              <Text style={styles.dotText}>Solar 28.25</Text>
            </View>
            <View style={styles.dotLegend}>
              <View style={[styles.dot, { backgroundColor: COLORS.tealLight }]} />
              <Text style={styles.dotText}>Co-op 28.21</Text>
            </View>
          </View>
        </View>

        {/* Energy Flow Visualization */}
        <View style={styles.energyFlowRow}>
          {[
            { size: 20, color: COLORS.amber, opacity: 0.6 },
            { size: 32, color: COLORS.amberLight, opacity: 0.5 },
            { size: 16, color: COLORS.amber, opacity: 0.4 },
            { size: 40, color: COLORS.tealLight, opacity: 0.45 },
            { size: 26, color: COLORS.amber, opacity: 0.55 },
            { size: 18, color: COLORS.tealLight, opacity: 0.35 },
            { size: 24, color: COLORS.amberLight, opacity: 0.5 },
          ].map((b, idx) => (
            <View
              key={idx}
              style={{
                width: b.size,
                height: b.size,
                borderRadius: b.size / 2,
                backgroundColor: b.color,
                opacity: b.opacity,
              }}
            />
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={styles.actionBtnPrimary}
          onPress={() => executeShareEnergy(2.5, 'House #04')}
          activeOpacity={0.8}
        >
          <ArrowUpRight size={16} color="#FFFFFF" />
          <Text style={styles.actionBtnPrimaryText}>Share Surplus</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtnSecondary}
          onPress={() => executeBorrowEnergy(1.5)}
          activeOpacity={0.8}
        >
          <ArrowDownLeft size={16} color={COLORS.textPrimary} />
          <Text style={styles.actionBtnSecondaryText}>Request Draw</Text>
        </TouchableOpacity>
      </View>

      {/* Admin Panel Entry */}
      <TouchableOpacity
        style={styles.adminEntryBtn}
        onPress={onOpenAdmin}
        activeOpacity={0.8}
      >
        <ShieldCheck size={15} color={'#A78BFA'} />
        <Text style={styles.adminEntryText}>Admin Panel</Text>
        <Text style={styles.adminEntryArrow}>›</Text>
      </TouchableOpacity>

      {/* Spacer */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 14 },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textBright, letterSpacing: -0.3 },
  lastUpdate: { fontSize: 11, marginTop: 2, color: COLORS.textMuted },
  iconExpand: { 
    width: 32, height: 32, borderRadius: 16, 
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Power Grid
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
  gridCellHighlight: { 
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  cellIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cellLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  cellValue: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  cellUnit: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  cellTrend: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  cellTrendText: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted },

  // Section Cards
  sectionCard: { padding: 16, gap: 14 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textBright },

  // Environmental Benefits
  benefitsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 4 },
  benefitCol: { alignItems: 'center', gap: 4 },
  gaugeCircle: { 
    width: 60, height: 60, borderRadius: 30, borderWidth: 3, 
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  gaugeNum: { fontSize: 18, fontWeight: '800', color: COLORS.textBright, marginTop: 6 },
  benefitLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },
  benefitUnit: { fontSize: 9, fontWeight: '500', color: COLORS.textMuted },

  // Toggle Pill
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

  // Consumption
  consumptionMetricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  consValue: { fontSize: 24, fontWeight: '800', color: COLORS.textBright },
  consUnit: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  consDotsRow: { gap: 4 },
  dotLegend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotText: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary },

  // Energy Flow
  energyFlowRow: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', 
    paddingVertical: 8, height: 56,
  },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtnPrimary: { 
    flex: 1, 
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
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

  // Admin Entry Button
  adminEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.28)',
  },
  adminEntryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A78BFA',
  },
  adminEntryArrow: {
    fontSize: 16,
    color: '#A78BFA',
    fontWeight: '800',
    lineHeight: 18,
  },
});
