import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import { BatteryCharging, ArrowUpRight, Share2, Coins, CheckCircle2, ShieldCheck, Zap } from 'lucide-react-native';

export const SurplusView = () => {
  const { 
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

  const handleShare = () => {
    const val = parseFloat(shareAmount);
    if (!isNaN(val) && val > 0) {
      executeShareEnergy(val, recipientHousehold);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={styles.storyBadgeTitle}>Surplus Energy & Co-op Sharing</Text>
      </View>

      {/* Main Surplus Meter Card */}
      <View style={[styles.heroCard, GLASS.card, SHADOWS.glass]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.iconCircle}>
            <BatteryCharging size={28} color={COLORS.tealLight} />
          </View>
          <View>
            <Text style={styles.label}>Current Solar Surplus Rate</Text>
            <Text style={styles.val}>
              {metrics.surplusAvailable} <Text style={styles.unit}>kW</Text>
            </Text>
          </View>
        </View>

        <View style={styles.batteryProgressContainer}>
          <View style={styles.batteryHeader}>
            <Text style={styles.batteryLabel}>Tesla Powerwall Battery State (SoC)</Text>
            <Text style={styles.batteryVal}>{metrics.batteryLevel}% (11.8 kWh)</Text>
          </View>

          {/* Custom battery bar */}
          <View style={styles.batteryTrack}>
            <View style={[styles.batteryFill, { width: `${metrics.batteryLevel}%` }]} />
          </View>
        </View>

        <View style={styles.statsFooter}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Co-op Shared Today</Text>
            <Text style={styles.statValText}>{metrics.coopPoolSharedToday} kWh</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Tokens Earned</Text>
            <Text style={[styles.statValText, { color: COLORS.amber }]}>+{metrics.coopTokensEarned} pts</Text>
          </View>
        </View>
      </View>

      {/* Interactive Peer-to-Peer Energy Transfer Form */}
      <View style={[styles.sectionCard, GLASS.card, SHADOWS.glass]}>
        <View style={styles.sectionHeaderRow}>
          <Share2 size={20} color={COLORS.tealLight} />
          <Text style={styles.sectionTitle}>Direct Peer-to-Peer Energy Transfer</Text>
        </View>

        <Text style={styles.formSubtitle}>
          Transfer excess solar power directly to co-op neighbors or into the shared community pool.
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Amount to Transfer (kWh):</Text>
          <TextInput
            style={[styles.input, GLASS.input]}
            keyboardType="numeric"
            value={shareAmount}
            onChangeText={setShareAmount}
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Recipient Destination:</Text>
          <TextInput
            style={[styles.input, GLASS.input]}
            value={recipientHousehold}
            onChangeText={setRecipientHousehold}
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {shareSuccess && (
          <View style={styles.successBanner}>
            <CheckCircle2 size={18} color={COLORS.tealLight} />
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
      <View style={[styles.sectionCard, GLASS.card, SHADOWS.glass]}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <ShieldCheck size={20} color={COLORS.tealLight} />
            <View>
              <Text style={styles.settingTitle}>Automated Co-op Pool Sharing</Text>
              <Text style={styles.settingSub}>Automatically export surplus when battery &gt; 75%</Text>
            </View>
          </View>
          <Switch
            value={autoShareEnabled}
            onValueChange={setAutoShareEnabled}
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: COLORS.teal }}
            thumbColor="#FFFFFF"
          />
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
  heroCard: { padding: 18 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.tealGlow, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', color: COLORS.textSecondary },
  val: { fontSize: 32, fontWeight: '800', color: COLORS.tealLight },
  unit: { fontSize: 18, fontWeight: '600' },
  batteryProgressContainer: { marginTop: 16, gap: 6 },
  batteryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  batteryLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  batteryVal: { fontSize: 12, fontWeight: '800', color: COLORS.teal },
  batteryTrack: { height: 10, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 5, overflow: 'hidden' },
  batteryFill: { height: '100%', borderRadius: 5, backgroundColor: COLORS.teal },
  statsFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, marginTop: 14, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  statCol: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
  statValText: { fontSize: 14, fontWeight: '800', marginTop: 2, color: COLORS.textPrimary },
  divider: { width: 1, height: 24, backgroundColor: COLORS.glassBorder },
  sectionCard: { padding: 16, gap: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textBright },
  formSubtitle: { fontSize: 12, lineHeight: 18, color: COLORS.textSecondary },
  formGroup: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  input: { paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.tealGlow, padding: 10, borderRadius: 16 },
  successText: { color: COLORS.tealLight, fontSize: 12, fontWeight: '700' },
  shareSubmitBtn: { backgroundColor: COLORS.teal, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 16 },
  shareSubmitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  settingTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textBright },
  settingSub: { fontSize: 11, marginTop: 2, color: COLORS.textMuted },
});
