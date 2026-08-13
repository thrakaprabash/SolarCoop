import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, SHADOWS } from '../../theme/colors';
import Svg, { Circle, Line, Path, Text as SvgText, Rect } from 'react-native-svg';
import { 
  Sun, 
  Zap, 
  Battery, 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react-native';

export const HomeDashboard = () => {
  const { isDarkMode, metrics, setActiveTab, viewScope, executeShareEnergy, executeBorrowEnergy } = useEnergy();

  const themeColors = isDarkMode
    ? { bg: '#0F172A', card: '#1E293B', border: '#334155', text: '#F8FAFC', textSub: '#94A3B8' }
    : { bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', textSub: '#64748B' };

  const netPower = parseFloat((metrics.instantProduction - metrics.instantConsumption).toFixed(1));
  const isSurplus = netPower >= 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.bg }]} contentContainerStyle={styles.content}>
      {/* Title Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={[styles.storyBadgeTitle, { color: themeColors.text }]}>Home & Co-op Energy Dashboard</Text>
      </View>

      {/* Hero Overview Energy Flow Card */}
      <View style={[styles.heroCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.heroCardHeader}>
          <View>
            <Text style={[styles.heroSubtitle, { color: themeColors.textSub }]}>Live Grid Status</Text>
            <Text style={[styles.heroTitle, { color: themeColors.text }]}>
              {isSurplus ? '⚡ Surplus Energy Generating' : '⚠️ Drawing Deficit Energy'}
            </Text>
          </View>
          <View style={[styles.netBadge, { backgroundColor: isSurplus ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
            <Text style={[styles.netBadgeText, { color: isSurplus ? '#10B981' : '#EF4444' }]}>
              {isSurplus ? `+${netPower} kW Net` : `${netPower} kW Net`}
            </Text>
          </View>
        </View>

        {/* SVG Energy Flow Diagram */}
        <View style={styles.svgFlowContainer}>
          <Svg height="160" width="100%" viewBox="0 0 340 160">
            {/* Flow Connecting Lines */}
            <Line x1="70" y1="50" x2="170" y2="50" stroke={COLORS.secondary} strokeWidth="3" strokeDasharray="4 4" />
            <Line x1="170" y1="50" x2="270" y2="50" stroke={COLORS.primary} strokeWidth="3" strokeDasharray="4 4" />
            <Line x1="170" y1="50" x2="170" y2="120" stroke={COLORS.accent} strokeWidth="3" strokeDasharray="4 4" />

            {/* Node 1: Solar Gen */}
            <Circle cx="70" cy="50" r="30" fill="#F59E0B" fillOpacity="0.2" stroke="#F59E0B" strokeWidth="2" />
            <SvgText x="70" y="46" fill="#F59E0B" fontSize="11" fontWeight="bold" textAnchor="middle">SOLAR</SvgText>
            <SvgText x="70" y="60" fill="#F59E0B" fontSize="10" textAnchor="middle">{metrics.instantProduction} kW</SvgText>

            {/* Node 2: Home Load Hub */}
            <Circle cx="170" cy="50" r="32" fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="3" />
            <SvgText x="170" y="46" fill="#10B981" fontSize="12" fontWeight="bold" textAnchor="middle">HOME</SvgText>
            <SvgText x="170" y="60" fill="#10B981" fontSize="10" textAnchor="middle">{metrics.instantConsumption} kW</SvgText>

            {/* Node 3: Battery Storage */}
            <Circle cx="270" cy="50" r="30" fill="#06B6D4" fillOpacity="0.2" stroke="#06B6D4" strokeWidth="2" />
            <SvgText x="270" y="46" fill="#06B6D4" fontSize="11" fontWeight="bold" textAnchor="middle">BATTERY</SvgText>
            <SvgText x="270" y="60" fill="#06B6D4" fontSize="10" textAnchor="middle">{metrics.batteryLevel}%</SvgText>

            {/* Node 4: Co-op Pool Grid */}
            <Rect x="120" y="110" width="100" height="34" rx="17" fill="#8B5CF6" fillOpacity="0.2" stroke="#8B5CF6" strokeWidth="2" />
            <SvgText x="170" y="126" fill="#8B5CF6" fontSize="10" fontWeight="bold" textAnchor="middle">CO-OP POOL</SvgText>
            <SvgText x="170" y="138" fill="#8B5CF6" fontSize="9" textAnchor="middle">14 Active Members</SvgText>
          </Svg>
        </View>

        {/* Quick Summary Grid inside Hero Card */}
        <View style={styles.heroMetricsRow}>
          <View style={styles.heroMetricCol}>
            <Text style={[styles.heroMetricLabel, { color: themeColors.textSub }]}>Self-Sufficiency</Text>
            <Text style={[styles.heroMetricValue, { color: COLORS.primary }]}>{metrics.gridIndependence}%</Text>
          </View>

          <View style={styles.heroMetricDivider} />

          <View style={styles.heroMetricCol}>
            <Text style={[styles.heroMetricLabel, { color: themeColors.textSub }]}>Co-op Shared Today</Text>
            <Text style={[styles.heroMetricValue, { color: COLORS.accent }]}>{metrics.coopPoolSharedToday} kWh</Text>
          </View>

          <View style={styles.heroMetricDivider} />

          <View style={styles.heroMetricCol}>
            <Text style={[styles.heroMetricLabel, { color: themeColors.textSub }]}>Credits Earned</Text>
            <Text style={[styles.heroMetricValue, { color: COLORS.secondary }]}>{metrics.coopTokensEarned} pts</Text>
          </View>
        </View>
      </View>

      {/* Quick Stat Cards Grid */}
      <View style={styles.statsGrid}>
        {/* Card 1: Production */}
        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
          onPress={() => setActiveTab('production')}
          activeOpacity={0.7}
        >
          <View style={styles.statHeader}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Sun size={20} color="#F59E0B" />
            </View>
          </View>
          <Text style={[styles.statVal, { color: themeColors.text }]}>{metrics.instantProduction} <Text style={styles.unit}>kW</Text></Text>
          <Text style={[styles.statTitle, { color: themeColors.textSub }]}>Solar Production</Text>
          <Text style={styles.statSubText}>Daily Total: {metrics.dailyProduction} kWh</Text>
        </TouchableOpacity>

        {/* Card 2: Consumption */}
        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
          onPress={() => setActiveTab('consumption')}
          activeOpacity={0.7}
        >
          <View style={styles.statHeader}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Zap size={20} color="#10B981" />
            </View>
          </View>
          <Text style={[styles.statVal, { color: themeColors.text }]}>{metrics.instantConsumption} <Text style={styles.unit}>kW</Text></Text>
          <Text style={[styles.statTitle, { color: themeColors.textSub }]}>Home Load</Text>
          <Text style={styles.statSubText}>Daily Total: {metrics.dailyConsumption} kWh</Text>
        </TouchableOpacity>

        {/* Card 3: Surplus */}
        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
          onPress={() => setActiveTab('surplus')}
          activeOpacity={0.7}
        >
          <View style={styles.statHeader}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <Battery size={20} color="#06B6D4" />
            </View>
          </View>
          <Text style={[styles.statVal, { color: themeColors.text }]}>{metrics.surplusAvailable} <Text style={styles.unit}>kW</Text></Text>
          <Text style={[styles.statTitle, { color: themeColors.textSub }]}>Surplus Available</Text>
          <Text style={styles.statSubText}>Battery: {metrics.batteryLevel}% Charged</Text>
        </TouchableOpacity>

        {/* Card 4: Deficit */}
        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
          onPress={() => setActiveTab('deficit')}
          activeOpacity={0.7}
        >
          <View style={styles.statHeader}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <ArrowDownLeft size={20} color="#EF4444" />
            </View>
          </View>
          <Text style={[styles.statVal, { color: themeColors.text }]}>0.0 <Text style={styles.unit}>kW</Text></Text>
          <Text style={[styles.statTitle, { color: themeColors.textSub }]}>Grid Import Deficit</Text>
          <Text style={styles.statSubText}>Co-op Backup Ready</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Action Shortcuts Banner */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Quick Energy Actions</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionBtnPrimary}
            onPress={() => executeShareEnergy(2.5, 'House #04')}
          >
            <ArrowUpRight size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Share 2.5 kWh to Co-op</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtnSecondary}
            onPress={() => executeBorrowEnergy(1.5)}
          >
            <ArrowDownLeft size={18} color="#06B6D4" />
            <Text style={[styles.actionBtnSecText, { color: COLORS.accent }]}>Request 1.5 kWh Draw</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Shortcut Banner to Analytics */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Energy Analytics & Tools</Text>
        
        <View style={styles.storyShortcutsList}>
          {[
            { id: 'charts', title: 'Interactive Energy Charts', sub: 'Gen vs Load curves & surplus bars' },
            { id: 'history', title: 'Energy History & Export', sub: 'Filterable logs & PDF statement generator' },
            { id: 'summary', title: 'Energy Summary & Impact', sub: 'CO2 offset, trees saved, billing savings' },
          ].map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.shortcutRow, { borderBottomColor: themeColors.border }]}
              onPress={() => setActiveTab(item.id)}
            >
              <View style={styles.shortcutInfo}>
                <View>
                  <Text style={[styles.shortcutTitle, { color: themeColors.text }]}>{item.title}</Text>
                  <Text style={[styles.shortcutSub, { color: themeColors.textSub }]}>{item.sub}</Text>
                </View>
              </View>
              <ArrowUpRight size={18} color={COLORS.primary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  storyBadgeHeader: {
    gap: 2,
  },
  storyBadgeTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    ...SHADOWS.medium,
  },
  heroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  netBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  netBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  svgFlowContainer: {
    marginVertical: 8,
    alignItems: 'center',
  },
  heroMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  heroMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  heroMetricLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  heroMetricValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  heroMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    ...SHADOWS.small,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: {
    fontSize: 22,
    fontWeight: '800',
  },
  unit: {
    fontSize: 13,
    fontWeight: '600',
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  statSubText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'column',
    gap: 10,
  },
  actionBtnPrimary: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    ...SHADOWS.glowGreen,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnSecText: {
    fontSize: 14,
    fontWeight: '700',
  },
  storyShortcutsList: {
    gap: 10,
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  shortcutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shortcutTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  shortcutSub: {
    fontSize: 11,
  },
});
