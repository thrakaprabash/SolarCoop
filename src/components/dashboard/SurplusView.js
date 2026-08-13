import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, SHADOWS } from '../../theme/colors';
import { BatteryCharging, ArrowUpRight, Share2, Coins, CheckCircle2, ShieldCheck, Zap } from 'lucide-react-native';

export const SurplusView = () => {
  const { 
    isDarkMode, 
    metrics, 
    autoShareEnabled, 
    setAutoShareEnabled, 
    autoShareThreshold, 
    setAutoShareThreshold,
    executeShareEnergy 
  } = useEnergy();

  const [shareAmount, setShareAmount] = useState('3.5');
  const [recipientHousehold, setRecipientHousehold] = useState('House #04 (Shared Pool)');
  const [shareSuccess, setShareSuccess] = useState(false);

  const themeColors = isDarkMode
    ? { bg: '#0F172A', card: '#1E293B', border: '#334155', text: '#F8FAFC', textSub: '#94A3B8' }
    : { bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', textSub: '#64748B' };

  const handleShare = () => {
    const val = parseFloat(shareAmount);
    if (!isNaN(val) && val > 0) {
      executeShareEnergy(val, recipientHousehold);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.bg }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={[styles.storyBadgeTitle, { color: themeColors.text }]}>Surplus Energy & Co-op Sharing</Text>
      </View>

      {/* Main Surplus Meter Card */}
      <View style={[styles.heroCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.iconCircle}>
            <BatteryCharging size={28} color="#06B6D4" />
          </View>
          <View>
            <Text style={[styles.label, { color: themeColors.textSub }]}>Current Solar Surplus Rate</Text>
            <Text style={[styles.val, { color: COLORS.accent }]}>
              {metrics.surplusAvailable} <Text style={styles.unit}>kW</Text>
            </Text>
          </View>
        </View>

        <View style={styles.batteryProgressContainer}>
          <View style={styles.batteryHeader}>
            <Text style={[styles.batteryLabel, { color: themeColors.textSub }]}>Tesla Powerwall Battery State (SoC)</Text>
            <Text style={[styles.batteryVal, { color: COLORS.primary }]}>{metrics.batteryLevel}% (11.8 kWh)</Text>
          </View>

          {/* Custom battery bar */}
          <View style={styles.batteryTrack}>
            <View style={[styles.batteryFill, { width: `${metrics.batteryLevel}%`, backgroundColor: COLORS.primary }]} />
          </View>
        </View>

        <View style={styles.statsFooter}>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: themeColors.textSub }]}>Co-op Shared Today</Text>
            <Text style={[styles.statValText, { color: themeColors.text }]}>{metrics.coopPoolSharedToday} kWh</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: themeColors.textSub }]}>Tokens Earned</Text>
            <Text style={[styles.statValText, { color: COLORS.secondary }]}>+{metrics.coopTokensEarned} pts</Text>
          </View>
        </View>
      </View>

      {/* Interactive Peer-to-Peer Energy Transfer Form */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <Share2 size={20} color={COLORS.primary} />
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Direct Peer-to-Peer Energy Transfer</Text>
        </View>

        <Text style={[styles.formSubtitle, { color: themeColors.textSub }]}>
          Transfer excess solar power directly to co-op neighbors or into the shared community pool.
        </Text>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: themeColors.textSub }]}>Amount to Transfer (kWh):</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9', color: themeColors.text, borderColor: themeColors.border }]}
            keyboardType="numeric"
            value={shareAmount}
            onChangeText={setShareAmount}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: themeColors.textSub }]}>Recipient Destination:</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9', color: themeColors.text, borderColor: themeColors.border }]}
            value={recipientHousehold}
            onChangeText={setRecipientHousehold}
          />
        </View>

        {shareSuccess && (
          <View style={styles.successBanner}>
            <CheckCircle2 size={18} color="#10B981" />
            <Text style={styles.successText}>Success! Shared {shareAmount} kWh to {recipientHousehold}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.shareSubmitBtn}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <ArrowUpRight size={18} color="#FFFFFF" />
          <Text style={styles.shareSubmitText}>Confirm & Transfer Surplus Energy</Text>
        </TouchableOpacity>
      </View>

      {/* Auto-Sharing Settings Card */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <ShieldCheck size={20} color={COLORS.accent} />
            <View>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>Automated Co-op Pool Sharing</Text>
              <Text style={[styles.settingSub, { color: themeColors.textSub }]}>Automatically export surplus when battery &gt; 75%</Text>
            </View>
          </View>
          <Switch
            value={autoShareEnabled}
            onValueChange={setAutoShareEnabled}
            trackColor={{ false: '#334155', true: COLORS.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  storyBadgeHeader: { gap: 2 },
  storyBadgeTag: { fontSize: 10, fontWeight: '800', color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 0.8 },
  storyBadgeTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  heroCard: { borderRadius: 20, padding: 18, borderWidth: 1, ...SHADOWS.medium },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(6, 182, 212, 0.15)', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  val: { fontSize: 32, fontWeight: '800' },
  unit: { fontSize: 18, fontWeight: '600' },
  batteryProgressContainer: { marginTop: 16, gap: 6 },
  batteryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  batteryLabel: { fontSize: 11, fontWeight: '600' },
  batteryVal: { fontSize: 12, fontWeight: '800' },
  batteryTrack: { height: 10, backgroundColor: 'rgba(148, 163, 184, 0.2)', borderRadius: 5, overflow: 'hidden' },
  batteryFill: { height: '100%', borderRadius: 5 },
  statsFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, marginTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(148, 163, 184, 0.15)' },
  statCol: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '600' },
  statValText: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  divider: { width: 1, height: 24, backgroundColor: 'rgba(148, 163, 184, 0.2)' },
  sectionCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  formSubtitle: { fontSize: 12, lineHeight: 18 },
  formGroup: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, fontWeight: '600' },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: 10, borderRadius: 10 },
  successText: { color: '#10B981', fontSize: 12, fontWeight: '700' },
  shareSubmitBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, ...SHADOWS.glowGreen },
  shareSubmitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  settingTitle: { fontSize: 13, fontWeight: '700' },
  settingSub: { fontSize: 11, marginTop: 2 },
});
