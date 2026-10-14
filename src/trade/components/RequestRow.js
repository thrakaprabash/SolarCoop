import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, radius, weight } from '../theme';
import { STATUS_STYLE, STATUS_LABEL_KEY } from '../data/requests';
import { tradeKwh as kwh, money, longDate } from '../utils/format';

export default function RequestRow({ request, last, onPress }) {
  const { t, i18n } = useTranslation();
  const tone = STATUS_STYLE[request.status] || STATUS_STYLE.Pending;
  const displayName = request.name || t('trade.household.fallback');

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? t('trade.request.viewTransactionFor', { name: displayName }) : undefined}
      style={({ pressed }) => [styles.row, !last && styles.divided, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.left}>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: tone.color }]} />
          <Text style={[styles.status, { color: tone.color }]}>{t(STATUS_LABEL_KEY[request.status] || STATUS_LABEL_KEY.Pending).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.detail}>{t('trade.request.requestedColon', { amount: kwh(request.kwh) })}</Text>
        <Text style={styles.date}>{request.ts ? longDate(new Date(request.ts), i18n.resolvedLanguage || i18n.language) : t('trade.dateUnavailable')}</Text>
      </View>

      {request.rate != null ? (
        <View style={[styles.cost, { backgroundColor: tone.pillBg }]}>
          <Text style={[styles.costText, { color: tone.color }]}>{money(request.kwh * request.rate)}</Text>
        </View>
      ) : null}
      {onPress ? <ChevronRight size={15} color={colors.textFaint} strokeWidth={2.4} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  divided: { paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  left: { gap: 3 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  status: { fontSize: 10, fontWeight: weight.black, letterSpacing: 0.6 },
  name: { fontSize: 15, fontWeight: weight.heavy, color: colors.text },
  detail: { fontSize: 12, fontWeight: weight.medium, color: colors.textMuted },
  date: { fontSize: 11, fontWeight: weight.medium, color: colors.textFaint },
  cost: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  costText: { fontSize: 11, fontWeight: weight.bold },
});
