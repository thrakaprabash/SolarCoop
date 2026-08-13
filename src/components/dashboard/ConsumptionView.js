import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import { Zap, Wind, Repeat, Droplet, Box, Tv, AlertTriangle, Sparkles, Clock } from 'lucide-react-native';

export const ConsumptionView = () => {
  const { metrics, appliances, toggleAppliance } = useEnergy();

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'wind': return <Wind size={20} color="#06B6D4" />;
      case 'zap': return <Zap size={20} color={COLORS.amber} />;
      case 'repeat': return <Repeat size={20} color={COLORS.teal} />;
      case 'droplet': return <Droplet size={20} color="#3B82F6" />;
      case 'box': return <Box size={20} color="#8B5CF6" />;
      case 'tv': return <Tv size={20} color="#EC4899" />;
      default: return <Zap size={20} color={COLORS.amber} />;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={styles.storyBadgeTitle}>Household Energy Load</Text>
      </View>

      {/* Main Load Card */}
      <View style={styles.mainCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.iconCircle}>
            <Zap size={28} color={COLORS.amber} />
          </View>
          <View>
            <Text style={styles.loadLabel}>Active Load Demand</Text>
            <Text style={styles.loadValue}>
              {metrics.instantConsumption} <Text style={styles.unit}>kW</Text>
            </Text>
          </View>
        </View>

        <View style={styles.loadFooter}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Daily Consumption</Text>
            <Text style={styles.statVal}>{metrics.dailyConsumption} kWh</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Peak Usage Hour</Text>
            <Text style={[styles.statVal, { color: COLORS.amberLight }]}>18:30 (6.2 kW)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Solar Coverage</Text>
            <Text style={[styles.statVal, { color: COLORS.tealLight }]}>100% Free</Text>
          </View>
        </View>
      </View>

      {/* Smart Appliance Scheduler AI Recommendation Banner */}
      <View style={styles.recommendCard}>
        <View style={styles.recommendHeader}>
          <Sparkles size={20} color={COLORS.tealLight} />
          <Text style={styles.recommendTitle}>Smart Solar Load Schedule Recommendation</Text>
        </View>
        <Text style={styles.recommendText}>
          High solar output predicted between 12:00 PM - 3:00 PM. Turn on Washer / Dryer & Water Heater during this window to utilize 100% clean solar power.
        </Text>
      </View>

      {/* Interactive Appliance Control List */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Connected Home Appliances</Text>

        <View style={styles.appliancesList}>
          {appliances.map(app => (
            <View key={app.id} style={styles.appRow}>
              <View style={styles.appLeft}>
                <View style={styles.appIconBadge}>
                  {getIcon(app.icon)}
                </View>
                <View>
                  <Text style={styles.appName}>{app.name}</Text>
                  <Text style={styles.appCategory}>{app.category} • Power Draw: {app.power}</Text>
                </View>
              </View>

              <Switch
                value={app.active}
                onValueChange={() => toggleAppliance(app.id)}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: COLORS.amber }}
                thumbColor="#FFFFFF"
              />
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
  storyBadgeTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: COLORS.textBright },
  mainCard: { ...GLASS.card, padding: 18, ...SHADOWS.glass },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.amberGlow, alignItems: 'center', justifyContent: 'center' },
  loadLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', color: COLORS.textSecondary },
  loadValue: { fontSize: 32, fontWeight: '800', color: COLORS.amber },
  unit: { fontSize: 18, fontWeight: '600' },
  loadFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, marginTop: 14, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  statCol: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
  statVal: { fontSize: 13, fontWeight: '800', marginTop: 2, color: COLORS.textPrimary },
  divider: { width: 1, height: 24, backgroundColor: COLORS.glassBorder },
  recommendCard: { ...GLASS.card, borderRadius: 16, padding: 14, gap: 8, backgroundColor: COLORS.tealGlow, borderColor: 'rgba(20, 184, 166, 0.4)' },
  recommendHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recommendTitle: { color: COLORS.tealLight, fontSize: 13, fontWeight: '800' },
  recommendText: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  sectionCard: { ...GLASS.card, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, color: COLORS.textBright },
  appliancesList: { gap: 8 },
  appRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  appLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appIconBadge: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.glassBgLight, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  appCategory: { fontSize: 11, marginTop: 2, color: COLORS.textMuted },
});
