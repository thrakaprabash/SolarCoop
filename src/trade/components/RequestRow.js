import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, weight } from '../theme';
import { STATUS_STYLE } from '../data/requests';
import { kwh, money } from '../utils/format';

export default function RequestRow({ request, last }) {
  const tone = STATUS_STYLE[request.status] || STATUS_STYLE.Pending;

  return (
    <View style={[styles.row, !last && styles.divided]}>
      <View style={styles.left}>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: tone.color }]} />
          <Text style={[styles.status, { color: tone.color }]}>{request.status.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{request.name}</Text>
        <Text style={styles.detail}>{'Requested: ' + kwh(request.kwh) + ' kWh'}</Text>
        <Text style={styles.date}>{request.date}</Text>
      </View>

      <View style={[styles.cost, { backgroundColor: tone.pillBg }]}>
        <Text style={[styles.costText, { color: tone.color }]}>{money(request.kwh * request.rate)}</Text>
      </View>
    </View>
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
