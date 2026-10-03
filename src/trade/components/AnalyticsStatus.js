import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme';

export default function AnalyticsStatus({ analytics }) {
  const { t } = useTranslation();
  const { signedIn, energyLoading, energyError, reading, refresh, loading } = analytics;
  let message = 'Sign in to view your energy activity.';
  if (signedIn) {
    if (energyLoading) message = 'Loading your energy readings…';
    else if (energyError) message = energyError;
    else if (!reading) message = 'No energy readings are available for your account.';
    else {
      const date = new Date(Date.parse(reading.recorded_at) + 330 * 60 * 1000).toISOString().slice(0, 10);
      message = `Latest reading: ${date} (Asia/Colombo).`;
      if (date < analytics.period.day) message += ' No reading for today.';
      if (date > analytics.period.day) message += ' Reading date is in the future.';
    }
  }
  return <View style={styles.container}>
    {loading ? <ActivityIndicator color={colors.tealLight} /> : null}
    <Text style={styles.text}>{message}</Text>
    {analytics.ledgerError ? <Text style={styles.text}>{analytics.ledgerError}</Text> : null}
    {signedIn ? <Pressable accessibilityRole="button" disabled={loading} onPress={refresh}>
      <Text style={styles.action}>{t(energyError || analytics.ledgerError ? 'trade.tryAgain' : 'member.telemetry.sync')}</Text>
    </Pressable> : null}
  </View>;
}
const styles = StyleSheet.create({
  container: { gap: 8 }, text: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  action: { color: colors.tealLight, paddingVertical: 8, fontWeight: '600' },
});
