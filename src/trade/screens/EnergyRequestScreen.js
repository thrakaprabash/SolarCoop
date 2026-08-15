import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowUpRight, Home, Minus, Plus } from 'lucide-react-native';

import { colors, radius, weight } from '../theme';
import { useEnergy } from '../context/EnergyContext';
import { useNavigation } from '../context/NavigationContext';
import { kwh, money, rate as fmtRate } from '../utils/format';
import { Card, Divider, IconBadge, Metric, Notice, PrimaryButton, ScreenTitle } from '../components/ui';

const STEP = 0.5;

export default function EnergyRequestScreen() {
  const { getHousehold, submitRequest, showToast } = useEnergy();
  const { params } = useNavigation();
  const provider = getHousehold(params.providerId);

  const [amount, setAmount] = useState('2.5');
  const [confirmation, setConfirmation] = useState('');

  const value = parseFloat(amount);
  const error = useMemo(() => {
    if (amount.trim() === '' || isNaN(value) || value <= 0) return 'Enter an amount greater than 0.';
    if (provider && value > provider.kwh)
      return 'Only ' + kwh(provider.kwh) + ' kWh available from ' + provider.name + '.';
    return '';
  }, [amount, value, provider]);

  const step = (delta) => {
    const max = provider ? provider.kwh : 10;
    const current = isNaN(value) ? 0 : value;
    setAmount(Math.min(max, Math.max(STEP, current + delta)).toFixed(1));
    setConfirmation('');
  };

  const onSubmit = () => {
    if (error || !provider) return;
    submitRequest(provider, value);
    setConfirmation('Request for ' + kwh(value) + ' kWh sent to ' + provider.name);
    showToast('Request sent to ' + provider.name);
  };

  if (!provider) {
    return (
      <View style={styles.screen}>
        <Text style={styles.missing}>No provider selected.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenTitle title="Energy Request" />

      <Card padding={18} style={styles.providerCard}>
        <View style={styles.block}>
          <Text style={styles.blockLabel}>Provider</Text>
          <View style={styles.providerRow}>
            <IconBadge size={38}>
              <Home size={18} color={colors.tealLight} strokeWidth={2} />
            </IconBadge>
            <View>
              <Text style={styles.providerName}>{provider.name}</Text>
              <Text style={styles.providerMeta}>{provider.house + ' · ' + provider.dist}</Text>
            </View>
          </View>
        </View>

        <Divider />

        <View style={styles.figures}>
          <Metric label="Available Energy" value={kwh(provider.kwh)} unit="kWh" />
          <View style={styles.rateBlock}>
            <Text style={styles.rateLabel}>Rate</Text>
            <Text style={styles.rateValue}>
              {'$' + fmtRate(provider.rate)}
              <Text style={styles.rateUnit}> / kWh</Text>
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.formCard}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Amount Required (kWh):</Text>
          <View style={styles.stepperRow}>
            <Stepper icon={Minus} onPress={() => step(-STEP)} />
            <View style={styles.input}>
              <TextInput
                value={amount}
                onChangeText={(text) => {
                  setAmount(text);
                  setConfirmation('');
                }}
                keyboardType="decimal-pad"
                style={styles.inputText}
                selectionColor={colors.tealLight}
              />
              <Text style={styles.inputUnit}>kWh</Text>
            </View>
            <Stepper icon={Plus} onPress={() => step(STEP)} />
          </View>
        </View>

        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Estimated cost</Text>
          <Text style={styles.costValue}>{error ? '—' : money(value * provider.rate)}</Text>
        </View>

        <Notice message={error} tone="error" />
        <Notice message={confirmation} tone="success" />

        <PrimaryButton
          label="Submit Request"
          icon={ArrowUpRight}
          onPress={onSubmit}
          disabled={!!error}
          background={error || confirmation ? colors.tealTintStrong : colors.teal}
          style={styles.submit}
        />
      </Card>
    </ScrollView>
  );
}

function Stepper({ icon: Icon, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.stepper, pressed && { backgroundColor: 'rgba(255,255,255,0.12)' }]}
    >
      <Icon size={16} color={colors.textStrong} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20, gap: 16 },
  missing: { color: colors.textMuted, padding: 16 },
  providerCard: { gap: 16 },
  block: { gap: 4 },
  blockLabel: {
    fontSize: 12,
    fontWeight: weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: colors.textMuted,
  },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  providerName: { fontSize: 17, fontWeight: weight.heavy, color: colors.text },
  providerMeta: { fontSize: 11, fontWeight: weight.medium, color: colors.textFaint },
  figures: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  rateBlock: { alignItems: 'flex-end' },
  rateLabel: {
    fontSize: 10,
    fontWeight: weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: colors.textFaint,
  },
  rateValue: { fontSize: 15, fontWeight: weight.heavy, color: colors.amber },
  rateUnit: { fontSize: 11, fontWeight: weight.medium, color: colors.textMuted },
  formCard: { gap: 12 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: weight.medium, color: colors.textMuted },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepper: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputText: { flex: 1, padding: 0, fontSize: 18, fontWeight: weight.heavy, color: colors.textStrong },
  inputUnit: { fontSize: 13, fontWeight: weight.bold, color: colors.textFaint },
  costRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  costLabel: { fontSize: 11, fontWeight: weight.medium, color: colors.textFaint },
  costValue: { fontSize: 13, fontWeight: weight.heavy, color: colors.amber },
  submit: { padding: 12, borderRadius: radius.lg },
});
