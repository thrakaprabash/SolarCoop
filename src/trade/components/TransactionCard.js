import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowDown, ArrowUp, ChevronRight } from 'lucide-react-native';

import { colors, weight } from '../theme';
import { clock, kwh, shortDate } from '../utils/format';
import { Card, Pill } from './ui';

export default function TransactionCard({ transaction, onPress }) {
  const sent = transaction.dir === 'sent';
  const color = sent ? colors.tealLight : colors.amberLight;
  const Arrow = sent ? ArrowUp : ArrowDown;
  const when = new Date(transaction.ts);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
      <Card style={styles.card}>
        <View style={styles.body}>
          <View style={styles.dirRow}>
            <Arrow size={12} color={color} strokeWidth={2.6} />
            <Text style={[styles.dirLabel, { color }]}>{sent ? 'SENT' : 'RECEIVED'}</Text>
          </View>

          <Text style={styles.kwh}>
            {kwh(transaction.kwh)}
            <Text style={styles.unit}>{' kWh'}</Text>
          </Text>
          <Text style={styles.party}>{(sent ? 'To ' : 'From ') + transaction.party}</Text>

          <View style={styles.footRow}>
            <Text style={styles.when}>{shortDate(when) + ' • ' + clock(when)}</Text>
            <Pill
              label="COMPLETED"
              color={colors.tealLight}
              background={colors.tealTintSoft}
              style={styles.completed}
            />
          </View>
        </View>

        <ChevronRight size={16} color={colors.textFaint} strokeWidth={2.4} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { flex: 1, minWidth: 0, gap: 4 },
  dirRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dirLabel: { fontSize: 10, fontWeight: weight.black, letterSpacing: 0.6 },
  kwh: { fontSize: 26, fontWeight: weight.heavy, color: colors.text, lineHeight: 30 },
  unit: { fontSize: 14, fontWeight: weight.medium, color: colors.textMuted },
  party: { fontSize: 12, fontWeight: weight.medium, color: colors.textMuted },
  footRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 },
  when: { fontSize: 11, fontWeight: weight.medium, color: colors.textFaint },
  completed: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderColor: 'rgba(20,184,166,0.35)',
    backgroundColor: colors.tealTintSoft,
  },
});
