import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, SHADOWS } from '../../theme/colors';
import { AlertTriangle, ArrowDownLeft, ShieldAlert, DollarSign, Zap, CheckCircle2, TrendingDown } from 'lucide-react-native';

export const DeficitView = () => {
  const { isDarkMode, metrics, executeBorrowEnergy } = useEnergy();
  
  const [borrowAmount, setBorrowAmount] = useState('2.0');
  const [borrowSuccess, setBorrowSuccess] = useState(false);

  const themeColors = isDarkMode
    ? { bg: '#0F172A', card: '#1E293B', border: '#334155', text: '#F8FAFC', textSub: '#94A3B8' }
    : { bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', textSub: '#64748B' };

  const handleBorrow = () => {
    const val = parseFloat(borrowAmount);
    if (!isNaN(val) && val > 0) {
      executeBorrowEnergy(val);
      setBorrowSuccess(true);
      setTimeout(() => setBorrowSuccess(false), 3000);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.bg }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={[styles.storyBadgeTitle, { color: themeColors.text }]}>Energy Shortfall & Grid Backup</Text>
      </View>

      {/* Main Deficit Status Card */}
      <View style={[styles.mainAlertCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.topRow}>
          <View style={styles.iconCircle}>
            <AlertTriangle size={28} color="#EF4444" />
          </View>
          <View>
            <Text style={[styles.alertLabel, { color: themeColors.textSub }]}>Current Grid Import Deficit</Text>
            <Text style={[styles.alertVal, { color: COLORS.alert }]}>
              0.0 <Text style={styles.unit}>kW (Zero Deficit)</Text>
            </Text>
          </View>
        </View>

        <View style={styles.alertBanner}>
          <ShieldAlert size={18} color="#10B981" />
          <Text style={styles.alertBannerText}>
            Solar generation + home battery capacity are fully covering household load. No grid buy required.
          </Text>
        </View>
      </View>

      {/* Rate Comparison Card: Co-op Peer Rate vs Main Utility Grid */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Energy Rate Cost Comparison</Text>

        <View style={styles.compareRow}>
          {/* Co-op Rate */}
          <View style={[styles.compareCard, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.4)' }]}>
            <Text style={styles.compareTag}>RECOMMENDED</Text>
            <Text style={[styles.compareTitle, { color: COLORS.primary }]}>Co-op Peer Rate</Text>
            <Text style={[styles.comparePrice, { color: themeColors.text }]}>$0.20 <Text style={styles.priceUnit}>/ kWh</Text></Text>
            <Text style={styles.compareSub}>Clean solar power from neighbors</Text>
          </View>

          {/* Utility Grid Rate */}
          <View style={[styles.compareCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.4)' }]}>
            <Text style={[styles.compareTag, { color: '#EF4444' }]}>HIGH PEAK</Text>
            <Text style={[styles.compareTitle, { color: COLORS.alert }]}>Utility Main Grid</Text>
            <Text style={[styles.comparePrice, { color: themeColors.text }]}>$0.45 <Text style={styles.priceUnit}>/ kWh</Text></Text>
            <Text style={styles.compareSub}>Fossil grid peak demand price</Text>
          </View>
        </View>
      </View>

      {/* Smart Co-op Emergency Borrow Request */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <ArrowDownLeft size={20} color={COLORS.accent} />
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Request Emergency Co-op Draw</Text>
        </View>

        <Text style={[styles.formSub, { color: themeColors.textSub }]}>
          Borrow clean energy from community battery reserves at discounted co-op rates during low solar output.
        </Text>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: themeColors.textSub }]}>Amount to Borrow (kWh):</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9', color: themeColors.text, borderColor: themeColors.border }]}
            keyboardType="numeric"
            value={borrowAmount}
            onChangeText={setBorrowAmount}
          />
        </View>

        {borrowSuccess && (
          <View style={styles.successBanner}>
            <CheckCircle2 size={18} color="#10B981" />
            <Text style={styles.successText}>Success! Borrowed {borrowAmount} kWh from Co-op Pool</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.borrowSubmitBtn}
          onPress={handleBorrow}
          activeOpacity={0.7}
        >
          <ArrowDownLeft size={18} color="#FFFFFF" />
          <Text style={styles.borrowSubmitText}>Execute Co-op Energy Borrow</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  storyBadgeHeader: { gap: 2 },
  storyBadgeTag: { fontSize: 10, fontWeight: '800', color: COLORS.alert, textTransform: 'uppercase', letterSpacing: 0.8 },
  storyBadgeTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  mainAlertCard: { borderRadius: 20, padding: 18, borderWidth: 1, ...SHADOWS.medium },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(239, 68, 68, 0.15)', alignItems: 'center', justifyContent: 'center' },
  alertLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  alertVal: { fontSize: 28, fontWeight: '800' },
  unit: { fontSize: 16, fontWeight: '600' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: 12, borderRadius: 12, marginTop: 16 },
  alertBannerText: { color: '#10B981', fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 18 },
  sectionCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  compareRow: { flexDirection: 'row', gap: 12 },
  compareCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, gap: 4 },
  compareTag: { fontSize: 9, fontWeight: '900', color: COLORS.primary },
  compareTitle: { fontSize: 14, fontWeight: '800' },
  comparePrice: { fontSize: 22, fontWeight: '800' },
  priceUnit: { fontSize: 12, fontWeight: '600' },
  compareSub: { fontSize: 10, color: '#94A3B8' },
  formSub: { fontSize: 12, lineHeight: 18 },
  formGroup: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, fontWeight: '600' },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: 10, borderRadius: 10 },
  successText: { color: '#10B981', fontSize: 12, fontWeight: '700' },
  borrowSubmitBtn: { backgroundColor: COLORS.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  borrowSubmitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
