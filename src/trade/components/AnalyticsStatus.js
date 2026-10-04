import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme';
import { analyticsText } from '../utils/analyticsText';

export default function AnalyticsStatus({ analytics }) {
  const { t, i18n } = useTranslation();
  const copy = (key, values) => analyticsText(i18n.resolvedLanguage || i18n.language, key, values);
  const { signedIn, energyLoading, energyError, reading, refresh, loading } = analytics;
  let message = copy('signIn');
  if (signedIn) {
    if (energyLoading) message = copy('loading');
    else if (energyError) message = copy('energyError');
    else if (!reading) message = copy('noRecords');
    else {
      const date = new Date(Date.parse(reading.recorded_at) + 330 * 60 * 1000).toISOString().slice(0, 10);
      message = copy('latest', { date });
      if (date < analytics.period.day) message += ` ${copy('stale')}`;
      if (date > analytics.period.day) message += ` ${copy('future')}`;
    }
  }
  return <View style={styles.container}>
    {loading ? <ActivityIndicator color={colors.tealLight} /> : null}
    <Text style={styles.text}>{message}</Text>
    {analytics.dailyError ? <Text style={styles.text}>{copy('dailyError')}</Text> : null}
    {analytics.ledgerError ? <Text style={styles.text}>{copy('ledgerError')}</Text> : null}
    {signedIn ? <Pressable accessibilityRole="button" disabled={loading} onPress={refresh}>
      <Text style={styles.action}>{t(energyError || analytics.dailyError || analytics.ledgerError ? 'trade.tryAgain' : 'member.telemetry.sync')}</Text>
    </Pressable> : null}
  </View>;
}
const styles = StyleSheet.create({
  container: { gap: 8 }, text: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  action: { color: colors.tealLight, paddingVertical: 8, fontWeight: '600' },
});
