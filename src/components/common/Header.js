import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS } from '../../theme/colors';
import { Sun, Zap, Users } from 'lucide-react-native';

export const Header = () => {
  const { metrics, simulationPreset, setSimulationPreset, viewScope, setViewScope } = useEnergy();

  return (
    <View style={styles.headerContainer}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Zap size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.appName}>SolarCoop</Text>
            <Text style={styles.subTitle}>Community Energy Sharing</Text>
          </View>
        </View>

        {/* Live Status */}
        <View style={[styles.liveStatusPill, { backgroundColor: metrics.instantProduction > metrics.instantConsumption ? 'rgba(20, 184, 166, 0.2)' : 'rgba(239, 68, 68, 0.2)' }]}>
          <View style={[styles.liveDot, { backgroundColor: metrics.instantProduction > metrics.instantConsumption ? '#14B8A6' : '#EF4444' }]} />
          <Text style={[styles.liveStatusText, { color: metrics.instantProduction > metrics.instantConsumption ? '#2DD4BF' : '#EF4444' }]}>
            {metrics.instantProduction > metrics.instantConsumption ? 'Surplus' : 'Deficit'}
          </Text>
        </View>
      </View>

      {/* Scope + Sim Row */}
      <View style={styles.bottomRow}>
        <View style={styles.scopeContainer}>
          <TouchableOpacity
            style={[styles.scopeTab, viewScope === 'household' && styles.scopeTabActive]}
            onPress={() => setViewScope('household')}
          >
            <Text style={[styles.scopeText, viewScope === 'household' && styles.scopeTextActive]}>Household</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.scopeTab, viewScope === 'community' && styles.scopeTabActive]}
            onPress={() => setViewScope('community')}
          >
            <Text style={[styles.scopeText, viewScope === 'community' && styles.scopeTextActive]}>Co-op</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.simRow}>
          {[
            { id: 'sunny', label: '☀️' },
            { id: 'cloudy', label: '⛅' },
            { id: 'evening', label: '🌙' },
            { id: 'deficit', label: '⚠️' },
          ].map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.simDot, simulationPreset === item.id && styles.simDotActive]}
              onPress={() => setSimulationPreset(item.id)}
            >
              <Text style={styles.simEmoji}>{item.label}</Text>
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
    paddingTop: 8,
    paddingBottom: 10,
    gap: 10,
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
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textBright,
    letterSpacing: -0.3,
  },
  subTitle: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  liveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scopeContainer: {
    flexDirection: 'row',
    ...GLASS.pill,
    padding: 3,
  },
  scopeTab: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  scopeTabActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
  },
  scopeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  scopeTextActive: {
    color: COLORS.amberLight,
    fontWeight: '700',
  },
  simRow: {
    flexDirection: 'row',
    gap: 4,
  },
  simDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  simDotActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  simEmoji: {
    fontSize: 13,
  },
});
