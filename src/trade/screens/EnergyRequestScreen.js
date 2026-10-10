import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowUpRight, Home, Minus, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, radius, weight } from '../theme';
import { useTrade } from '../context/TradeContext';
import { useNavigation } from '../context/NavigationContext';
import { tradeKwh as kwh, decimalAmount, addTradeAmounts, money, rate as fmtRate } from '../utils/format';
import { Card, Divider, IconBadge, Metric, Notice, PrimaryButton, ScreenTitle } from '../components/ui';

const STEP = 0.5;

export default function EnergyRequestScreen() {
  const { t } = useTranslation();
  const { getHousehold, refreshProviders, submitRequest, showToast } = useTrade();
  const { params } = useNavigation();
  const provider = getHousehold(params.providerId);

  const [amount, setAmount] = useState('2.5');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const submitInFlight = useRef(false);
  const submitted = useRef(false);

  useEffect(() => {
    refreshProviders();
  }, [refreshProviders]);

  const cleanAmount = amount.trim();
  const value = Number(cleanAmount.replace(',', '.'));
  const error = useMemo(() => {
    if (!/^\d+(?:[.,]\d+)?$/.test(cleanAmount) || !Number.isFinite(value) || value <= 0)
      return t('trade.request.errorAmount');
    if (provider && value > provider.kwh)
      return t('trade.request.errorTooMuch', { amount: kwh(provider.kwh), name: provider.name });
    return '';
  }, [cleanAmount, value, provider, t]);

  const step = (delta) => {
    if (submitInFlight.current) return;
    const max = provider ? provider.kwh : 10;
    const current = Number.isFinite(value) ? value : 0;
    setAmount(decimalAmount(Math.min(max, Math.max(STEP, addTradeAmounts(current, delta)))));
    submitted.current = false;
    setConfirmation('');
    setSubmitError('');
  };

  const onSubmit = async () => {
    if (error || !provider || submitInFlight.current || submitted.current) return;
    submitInFlight.current = true;
    setSubmitting(true);
    setSubmitError('');
    try {
      const { error: requestError } = await submitRequest(provider.id, value);
      if (requestError) throw requestError;
      submitted.current = true;
      setConfirmation(t('trade.request.confirmationSent', { amount: kwh(value), name: provider.name }));
      showToast(t('trade.request.toastSent', { name: provider.name }));
    } catch (requestError) {
      setSubmitError(requestError?.message || t('trade.request.sendFailed'));
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  };

  if (!provider) {
    return (
      <View style={styles.screen}>
        <Text style={styles.missing}>{t('trade.request.noProviderSelected')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenTitle title={t('trade.nav.energyRequest')} />

      <Card padding={18} style={styles.providerCard}>
        <View style={styles.block}>
          <Text style={styles.blockLabel}>{t('trade.request.provider')}</Text>
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
          <Metric label={t('trade.request.availableEnergy')} value={kwh(provider.kwh)} unit="kWh" />
          <View style={styles.rateBlock}>
            <Text style={styles.rateLabel}>{t('trade.household.rate')}</Text>
            <Text style={styles.rateValue}>
              {'$' + fmtRate(provider.rate)}
              <Text style={styles.rateUnit}> / kWh</Text>
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.formCard}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t('trade.request.amountRequired')}</Text>
          <View style={styles.stepperRow}>
            <Stepper icon={Minus} disabled={submitting} label={`${t('trade.request.amountRequired')}: −0.5 kWh`} onPress={() => step(-STEP)} />
            <View style={styles.input}>
              <TextInput
                value={amount}
                editable={!submitting}
                accessibilityLabel={t('trade.request.amountRequired')}
                onChangeText={(text) => {
                  if (submitInFlight.current) return;
                  setAmount(text);
                  submitted.current = false;
                  setConfirmation('');
                  setSubmitError('');
                }}
                keyboardType="decimal-pad"
                style={styles.inputText}
                selectionColor={colors.tealLight}
              />
              <Text style={styles.inputUnit}>kWh</Text>
            </View>
            <Stepper icon={Plus} disabled={submitting} label={`${t('trade.request.amountRequired')}: +0.5 kWh`} onPress={() => step(STEP)} />
          </View>
        </View>

        <View style={styles.costRow}>
          <Text style={styles.costLabel}>{t('trade.request.estimatedCost')}</Text>
          <Text style={styles.costValue}>{error ? '—' : money(value * provider.rate)}</Text>
        </View>

        <Notice message={error || submitError} tone="error" />
        <Notice message={confirmation} tone="success" />

        <PrimaryButton
          label={t('trade.request.submitRequest')}
          icon={ArrowUpRight}
          onPress={onSubmit}
          disabled={!!error || submitting || !!confirmation}
          background={error || confirmation ? colors.tealTintStrong : colors.teal}
          style={styles.submit}
        />
      </Card>
    </ScrollView>
  );
}

function Stepper({ icon: Icon, onPress, disabled, label }) {
  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
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
