import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, SHADOWS } from '../../theme/colors';
import { Zap, Wind, Repeat, Droplet, Box, Tv, AlertTriangle, Sparkles, Clock } from 'lucide-react-native';

export const ConsumptionView = () => {
  const { isDarkMode, metrics, appliances, toggleAppliance } = useEnergy();

  const themeColors = isDarkMode
    ? { bg: '#0F172A', card: '#1E293B', border: '#334155', text: '#F8FAFC', textSub: '#94A3B8' }
    : { bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', textSub: '#64748B' };

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'wind': return <Wind size={20} color="#06B6D4" />;
      case 'zap': return <Zap size={20} color="#F59E0B" />;
      case 'repeat': return <Repeat size={20} color="#10B981" />;
      case 'droplet': return <Droplet size={20} color="#3B82F6" />;
      case 'box': return <Box size={20} color="#8B5CF6" />;
      case 'tv': return <Tv size={20} color="#EC4899" />;
      default: return <Zap size={20} color={COLORS.primary} />;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.bg }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={[styles.storyBadgeTitle, { color: themeColors.text }]}>Household Energy Load</Text>
      </View>

      {/* Main Load Card */}
      <View style={[styles.mainCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.cardTopRow}>
          <View style={styles.iconCircle}>
            <Zap size={28} color="#10B981" />
          </View>
          <View>
            <Text style={[styles.loadLabel, { color: themeColors.textSub }]}>Active Load Demand</Text>
            <Text style={[styles.loadValue, { color: COLORS.primary }]}>
              {metrics.instantConsumption} <Text style={styles.unit}>kW</Text>
            </Text>
          </View>
        </View>

        <View style={styles.loadFooter}>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: themeColors.textSub }]}>Daily Consumption</Text>
            <Text style={[styles.statVal, { color: themeColors.text }]}>{metrics.dailyConsumption} kWh</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: themeColors.textSub }]}>Peak Usage Hour</Text>
            <Text style={[styles.statVal, { color: COLORS.warning }]}>18:30 (6.2 kW)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: themeColors.textSub }]}>Solar Coverage</Text>
            <Text style={[styles.statVal, { color: COLORS.primary }]}>100% Free</Text>
          </View>
        </View>
      </View>

      {/* Smart Appliance Scheduler AI Recommendation Banner */}
      <View style={[styles.recommendCard, { backgroundColor: 'rgba(6, 182, 212, 0.12)', borderColor: 'rgba(6, 182, 212, 0.3)' }]}>
        <View style={styles.recommendHeader}>
          <Sparkles size={20} color="#06B6D4" />
          <Text style={styles.recommendTitle}>Smart Solar Load Schedule Recommendation</Text>
        </View>
        <Text style={styles.recommendText}>
          High solar output predicted between 12:00 PM - 3:00 PM. Turn on Washer / Dryer & Water Heater during this window to utilize 100% clean solar power.
        </Text>
      </View>

      {/* Interactive Appliance Control List */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Connected Home Appliances</Text>

        <View style={styles.appliancesList}>
          {appliances.map(app => (
            <View key={app.id} style={[styles.appRow, { borderBottomColor: themeColors.border }]}>
              <View style={styles.appLeft}>
                <View style={styles.appIconBadge}>
                  {getIcon(app.icon)}
                </View>
                <View>
                  <Text style={[styles.appName, { color: themeColors.text }]}>{app.name}</Text>
                  <Text style={[styles.appCategory, { color: themeColors.textSub }]}>{app.category} • Power Draw: {app.power}</Text>
                </View>
              </View>

              <Switch
                value={app.active}
                onValueChange={() => toggleAppliance(app.id)}
                trackColor={{ false: '#334155', true: COLORS.primary }}
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
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  storyBadgeHeader: { gap: 2 },
  storyBadgeTag: { fontSize: 10, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
  storyBadgeTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  mainCard: { borderRadius: 20, padding: 18, borderWidth: 1, ...SHADOWS.medium },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(16, 185, 129, 0.15)', alignItems: 'center', justifyContent: 'center' },
  loadLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  loadValue: { fontSize: 32, fontWeight: '800' },
  unit: { fontSize: 18, fontWeight: '600' },
  loadFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, marginTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(148, 163, 184, 0.15)' },
  statCol: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '600' },
  statVal: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  divider: { width: 1, height: 24, backgroundColor: 'rgba(148, 163, 184, 0.2)' },
  recommendCard: { borderRadius: 16, padding: 14, borderWidth: 1, gap: 8 },
  recommendHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recommendTitle: { color: '#06B6D4', fontSize: 13, fontWeight: '800' },
  recommendText: { color: '#94A3B8', fontSize: 12, lineHeight: 18 },
  sectionCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  appliancesList: { gap: 8 },
  appRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  appLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appIconBadge: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(148, 163, 184, 0.12)', alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 14, fontWeight: '700' },
  appCategory: { fontSize: 11, marginTop: 2 },
});
