import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, SHADOWS } from '../../theme/colors';
import { Sun, Moon, Zap, ShieldCheck, Activity, Users } from 'lucide-react-native';

export const Header = () => {
  const { isDarkMode, setIsDarkMode, metrics, simulationPreset, setSimulationPreset, viewScope, setViewScope } = useEnergy();

  const themeColors = isDarkMode
    ? { bg: COLORS.cardDark, border: COLORS.cardBorderDark, text: COLORS.textPrimaryDark, textSub: COLORS.textSecondaryDark }
    : { bg: COLORS.cardLight, border: COLORS.cardBorderLight, text: COLORS.textPrimaryLight, textSub: COLORS.textSecondaryLight };

  return (
    <View style={[styles.headerContainer, { backgroundColor: themeColors.bg, borderColor: themeColors.border }]}>
      {/* Top row: Brand & Actions */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Zap size={22} color="#FFFFFF" />
          </View>
          <View>
            <View style={styles.coopTitleRow}>
              <Text style={[styles.appName, { color: themeColors.text }]}>SolarCoop</Text>
            </View>
            <Text style={[styles.subTitle, { color: themeColors.textSub }]}>
              Community Energy Sharing • Sustainable Solar
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {/* Theme toggle */}
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
            onPress={() => setIsDarkMode(!isDarkMode)}
            activeOpacity={0.7}
          >
            {isDarkMode ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#3B82F6" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Middle row: Live Status Pill & Household/Community Scope Selector */}
      <View style={styles.middleRow}>
        <View style={styles.scopeContainer}>
          <TouchableOpacity
            style={[
              styles.scopeTab,
              viewScope === 'household' && styles.scopeTabActive,
            ]}
            onPress={() => setViewScope('household')}
          >
            <Zap size={14} color={viewScope === 'household' ? '#FFFFFF' : themeColors.textSub} />
            <Text style={[styles.scopeTabText, viewScope === 'household' && styles.scopeTabTextActive]}>
              My Household
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.scopeTab,
              viewScope === 'community' && styles.scopeTabActive,
            ]}
            onPress={() => setViewScope('community')}
          >
            <Users size={14} color={viewScope === 'community' ? '#FFFFFF' : themeColors.textSub} />
            <Text style={[styles.scopeTabText, viewScope === 'community' && styles.scopeTabTextActive]}>
              Co-op Pool ({metrics.coopMembersOnline})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live Grid State Badge */}
        <View style={[styles.liveStatusPill, { backgroundColor: metrics.instantProduction > metrics.instantConsumption ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
          <View style={[styles.liveDot, { backgroundColor: metrics.instantProduction > metrics.instantConsumption ? '#10B981' : '#EF4444' }]} />
          <Text style={[styles.liveStatusText, { color: metrics.instantProduction > metrics.instantConsumption ? '#10B981' : '#EF4444' }]}>
            {metrics.instantProduction > metrics.instantConsumption ? 'Surplus Exporting' : 'Grid Drawing'}
          </Text>
        </View>
      </View>

      {/* Interactive Simulation Bar */}
      <View style={styles.simulationBar}>
        <Text style={[styles.simLabel, { color: themeColors.textSub }]}>Simulate Conditions:</Text>
        <View style={styles.simPillsContainer}>
          {[
            { id: 'sunny', label: '☀️ Sunny Peak' },
            { id: 'cloudy', label: '⛅ Cloudy Day' },
            { id: 'evening', label: '🌙 Evening Load' },
            { id: 'deficit', label: '⚠️ Grid Deficit' },
          ].map(item => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.simPill,
                simulationPreset === item.id && styles.simPillActive,
                { backgroundColor: simulationPreset === item.id ? COLORS.primary : (isDarkMode ? '#334155' : '#E2E8F0') }
              ]}
              onPress={() => setSimulationPreset(item.id)}
            >
              <Text style={[styles.simPillText, simulationPreset === item.id && { color: '#FFFFFF', fontWeight: '700' }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    ...SHADOWS.small,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glowGreen,
  },
  coopTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  groupTag: {
    backgroundColor: '#06B6D4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  groupTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  subTitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'flex-end',
  },
  memberBadgeCode: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
  },
  memberBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '600',
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  scopeContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 3,
  },
  scopeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },
  scopeTabActive: {
    backgroundColor: COLORS.primary,
  },
  scopeTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  scopeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  liveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  simulationBar: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  simLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  simPillsContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  simPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  simPillText: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
