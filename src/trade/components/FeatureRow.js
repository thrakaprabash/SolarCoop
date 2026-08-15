import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Clock, Zap } from 'lucide-react-native';

import { colors, weight } from '../theme';

export default function FeatureRow({ feature, onPress, last }) {
  const enabled = !!feature.screen;
  return (
    <Pressable
      onPress={enabled ? onPress : undefined}
      style={({ pressed }) => [styles.row, !last && styles.divided, { opacity: pressed && enabled ? 0.7 : 1 }]}
    >
      <View style={styles.titleRow}>
        <Zap size={14} color={colors.tealLight} strokeWidth={2} />
        <Text style={styles.title}>{feature.title}</Text>
      </View>
      <Text style={styles.desc}>{feature.desc}</Text>
      <View style={styles.statusRow}>
        <Clock size={10} color={colors.amber} strokeWidth={2.4} />
        <Text style={styles.status}>{enabled ? 'Open Module' : 'Ready for Integration'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: 4 },
  divided: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 14, fontWeight: weight.bold, color: colors.textStrong },
  desc: { fontSize: 12, lineHeight: 18, color: colors.textMuted },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  status: { fontSize: 10, fontWeight: weight.bold, color: colors.amber },
});
