import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import { AlertTriangle, ArrowDownLeft, ShieldAlert, DollarSign, Zap, CheckCircle2, TrendingDown } from 'lucide-react-native';

export const DeficitView = () => {
  const { metrics, executeBorrowEnergy } = useEnergy();
  
  const [borrowAmount, setBorrowAmount] = useState('2.0');
  const [borrowSuccess, setBorrowSuccess] = useState(false);

  const handleBorrow = () => {
    const val = parseFloat(borrowAmount);
    if (!isNaN(val) && val > 0) {
      executeBorrowEnergy(val);
      setBorrowSuccess(true);
      setTimeout(() => setBorrowSuccess(false), 3000);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={styles.storyBadgeTitle}>Energy Shortfall & Grid Backup</Text>
      </View>

      {/* Main Deficit Status Card */}
      <View style={styles.mainAlertCard}>
        <View style={styles.topRow}>
          <View style={styles.iconCircle}>
            <AlertTriangle size={28} color={COLORS.red} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertLabel}>Current Grid Import Deficit</Text>
            <Text style={styles.alertVal}>
              0.0 <Text style={styles.unit}>kW (Zero Deficit)</Text>
            </Text>
          </View>
        </View>

        <View style={styles.alertBanner}>
          <ShieldAlert size={18} color={COLORS.teal} />
          <Text style={styles.alertBannerText}>
            Solar generation + home battery capacity are fully covering household load. No grid buy required.
          </Text>
        </View>
      </View>

      {/* Rate Comparison Card: Co-op Peer Rate vs Main Utility Grid */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Energy Rate Cost Comparison</Text>

        <View style={styles.compareRow}>
          {/* Co-op Rate */}
          <View style={[styles.compareCard, { backgroundColor: 'rgba(45, 212, 191, 0.08)', borderColor: 'rgba(45, 212, 191, 0.25)' }]}>
            <Text style={[styles.compareTag, { color: COLORS.teal }]}>RECOMMENDED</Text>
            <Text style={[styles.compareTitle, { color: COLORS.tealLight }]}>Co-op Peer Rate</Text>
            <Text style={styles.comparePrice}>$0.20 <Text style={styles.priceUnit}>/ kWh</Text></Text>
            <Text style={styles.compareSub}>Clean solar power from neighbors</Text>
          </View>

          {/* Utility Grid Rate */}
          <View style={[styles.compareCard, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
            <Text style={[styles.compareTag, { color: COLORS.red }]}>HIGH PEAK</Text>
            <Text style={[styles.compareTitle, { color: COLORS.red }]}>Utility Main Grid</Text>
            <Text style={styles.comparePrice}>$0.45 <Text style={styles.priceUnit}>/ kWh</Text></Text>
            <Text style={styles.compareSub}>Fossil grid peak demand price</Text>
          </View>
        </View>
      </View>

      {/* Smart Co-op Emergency Borrow Request */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <ArrowDownLeft size={20} color={COLORS.amber} />
          <Text style={styles.sectionTitle}>Request Emergency Co-op Draw</Text>
        </View>

        <Text style={styles.formSub}>
          Borrow clean energy from community battery reserves at discounted co-op rates during low solar output.
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Amount to Borrow (kWh):</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={borrowAmount}
            onChangeText={setBorrowAmount}
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {borrowSuccess && (
          <View style={styles.successBanner}>
            <CheckCircle2 size={18} color={COLORS.teal} />
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
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 16 },
  storyBadgeHeader: { gap: 2 },
  storyBadgeTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: COLORS.textBright },
  mainAlertCard: {
    ...GLASS.card,
    padding: 18,
    ...SHADOWS.glass,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', color: COLORS.textSecondary },
  alertVal: { fontSize: 28, fontWeight: '800', color: COLORS.red },
  unit: { fontSize: 16, fontWeight: '600' },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    padding: 12,
    borderRadius: 16,
    marginTop: 16,
  },
  alertBannerText: { color: COLORS.teal, fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 18 },
  sectionCard: {
    ...GLASS.card,
    padding: 16,
    gap: 12,
    ...SHADOWS.glass,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textBright },
  compareRow: { flexDirection: 'row', gap: 12 },
  compareCard: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1, gap: 4 },
  compareTag: { fontSize: 9, fontWeight: '900' },
  compareTitle: { fontSize: 14, fontWeight: '800' },
  comparePrice: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  priceUnit: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  compareSub: { fontSize: 10, color: COLORS.textMuted },
  formSub: { fontSize: 12, lineHeight: 18, color: COLORS.textSecondary },
  formGroup: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  input: {
    ...GLASS.input,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    padding: 10,
    borderRadius: 16,
  },
  successText: { color: COLORS.teal, fontSize: 12, fontWeight: '700' },
  borrowSubmitBtn: {
    backgroundColor: COLORS.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    ...SHADOWS.glow,
  },
  borrowSubmitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
